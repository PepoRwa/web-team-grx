import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import { usePermissions } from './hooks/usePermissions'
import Calendar from './components/Calendar'
import Dossiers from './components/Dossiers' // NOUVEAU IMPORT
import Availability from './components/Availability' // PHASE 4
import Stratbook from './components/Stratbook' // PHASE 7
import Vods from './components/Vods' // NOUVEAU IMPORT VODS
import CoachingHub from './components/CoachingHub' // PHASE 9

function Dashboard({ session, signOut }) {
  const { roles, loading: rolesLoading, isStaff, isCoach } = usePermissions(session);
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar', 'dossiers', 'availability', 'stratbook', 'vods', 'coaching'

  // NOUVEAU: Système de Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  
  // NOUVEAU: Profil Utilisateur Local
  const [myStats, setMyStats] = useState({ absent: 0 });
  const [myGoalsStats, setMyGoalsStats] = useState({ inProgress: 0, completed: 0 });

  useEffect(() => {
    const loadMyStats = async () => {
      const { data } = await supabase
        .from('check_ins')
        .select('status')
        .eq('user_id', session.user.id)
        .eq('status', 'absent');
      if (data) setMyStats({ absent: data.length });
    };

    const loadGoalsStats = async () => {
      const { data } = await supabase
        .from('coaching_goals')
        .select('status')
        .eq('player_id', session.user.id);
      if (data) {
        setMyGoalsStats({
          inProgress: data.filter(g => g.status === 'in_progress').length,
          completed: data.filter(g => g.status === 'completed').length
        });
      }
    };

    loadMyStats();
    loadGoalsStats();
  }, [session.user.id]);

  useEffect(() => {
    if (!rolesLoading) {
      fetchNotifications();
    }

    // Souscription temps réel aux notifications
    const channel = supabase.channel('public:notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${session.user.id}` 
      }, payload => {
        setNotifications(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=is.null` 
      }, payload => {
        // Filtrage strict : si l'event a un target_roster précis, vérifier que l'user l'a ou est Staff
        const roster = payload.new.target_roster;
        if (!roster || roster === 'Tous' || isStaff || isCoach || roles.includes(roster)) {
            setNotifications(prev => [payload.new, ...prev]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rolesLoading, roles]);

  const fetchNotifications = async () => {
    // Si pas l'autorisation de tout voir
    let globalFilters = [`target_roster.eq.Tous`];
    if (isStaff || isCoach) {
      globalFilters = []; // Peuvent tout voir
    } else {
      const userRosters = roles.filter(r => ['High Roster', 'Academy', 'Chill', 'Tryhard'].includes(r));
      userRosters.forEach(r => globalFilters.push(`target_roster.eq."${r}"`));
    }

    let globalQuery = 'user_id.is.null';
    if (globalFilters.length > 0) {
      globalQuery = `and(user_id.is.null,or(${globalFilters.join(',')}))`;
    } 

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${session.user.id},${globalQuery}`)
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (data) {
      // Récupère les IDs des notifications globales déjà lues en local
      const readGlobals = JSON.parse(localStorage.getItem('read_global_notifs') || '[]');
      
      const mappedData = data.map(n => {
        if (!n.user_id && readGlobals.includes(n.id)) {
          return { ...n, is_read: true };
        }
        return n;
      });
      
      setNotifications(mappedData);
    }
  };

  const markAsRead = async (id) => {
    const notif = notifications.find(n => n.id === id);
    if (!notif) return;

    if (notif.user_id) {
      // Vraie mise à jour dans la base de données pour les notifications personnelles
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    } else {
      // Notification Globale (user_id === null) : impossible à modifier dans la DB car on n'en est pas le propriétaire unique.
      // On sauvegarde la lecture en local pour cet appareil !
      const readGlobals = JSON.parse(localStorage.getItem('read_global_notifs') || '[]');
      if (!readGlobals.includes(id)) {
        readGlobals.push(id);
        localStorage.setItem('read_global_notifs', JSON.stringify(readGlobals));
      }
    }
    
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gowrax-abyss text-white flex md:flex-row flex-col relative overflow-hidden font-poppins selection:bg-gowrax-neon selection:text-white">
        {/* LUEURS D'ARRIÈRE-PLAN DYNAMIQUES */}
        <div className="fixed top-0 left-1/4 w-[30rem] h-[30rem] bg-gowrax-purple/20 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen"></div>
        <div className="fixed bottom-0 right-1/4 w-[40rem] h-[40rem] bg-gowrax-neon/10 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen"></div>

        {/* =========================================
            SIDEBAR DESKTOP (PC) 
            ========================================= */}
        <aside className="hidden md:flex flex-col w-72 bg-black/60 shadow-[4px_0_24px_rgba(0,0,0,0.5)] backdrop-blur-2xl border-r border-white/5 p-6 z-50 h-screen sticky top-0 justify-between">
            <div>
                {/* Logo & Marque */}
                <div className="flex items-center gap-3 mb-12">
                  <div className="w-10 h-10 bg-gradient-to-br from-gowrax-purple/30 to-black border border-gowrax-purple rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(111,45,189,0.5)]">
                    <span className="font-techMono font-bold text-xs text-white">GRX</span>
                  </div>
                  <span className="font-rajdhani font-bold text-2xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">GOWRAX.</span>
                </div>

                {/* Profil Utilisateur (Sidebar) */}
                <div className="flex items-center gap-4 mb-8 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    {session.user.user_metadata.avatar_url ? (
                      <img src={session.user.user_metadata.avatar_url} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-gowrax-purple/50 object-cover"/>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gowrax-purple/20 flex items-center justify-center border border-gowrax-purple/50"><span className="text-sm font-bold">GRX</span></div>
                    )}
                    <div className="overflow-hidden">
                      <h2 className="font-rajdhani text-lg font-bold text-white truncate">
                          {session.user.user_metadata.full_name || session.user.email}
                      </h2>
                      <div className="text-[10px] font-techMono text-gowrax-neon uppercase truncate">
                          {roles.length > 0 ? roles[0] : 'Opérateur'}
                      </div>
                    </div>
                </div>

                {/* Menu Navigation PC */}
                <nav className="flex flex-col gap-2">
                    <p className="font-techMono text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-2 px-2">Applications</p>
                    
                    <button 
                        onClick={() => setActiveTab('calendar')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 w-full text-left font-rajdhani font-bold text-lg ${activeTab === 'calendar' ? 'bg-gradient-to-r from-gowrax-purple/40 to-transparent bg-gowrax-purple/10 border-l-4 border-gowrax-neon text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        Calendrier
                    </button>

                    <button 
                        onClick={() => setActiveTab('availability')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 w-full text-left font-rajdhani font-bold text-lg ${activeTab === 'availability' ? 'bg-gradient-to-r from-gowrax-purple/40 to-transparent bg-gowrax-purple/10 border-l-4 border-gowrax-neon text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Disponibilités
                    </button>

                    <button 
                        onClick={() => setActiveTab('stratbook')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 w-full text-left font-rajdhani font-bold text-lg ${activeTab === 'stratbook' ? 'bg-gradient-to-r from-gowrax-purple/40 to-transparent bg-gowrax-purple/10 border-l-4 border-gowrax-neon text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                        Strat-Book
                    </button>

                    <button 
                        onClick={() => setActiveTab('vods')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 w-full text-left font-rajdhani font-bold text-lg ${activeTab === 'vods' ? 'bg-gradient-to-r from-blue-600/40 to-transparent bg-blue-600/10 border-l-4 border-blue-400 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent'}`}                                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>                                                                                             VODs & Replays
                    </button>

                    <button 
                        onClick={() => setActiveTab('coaching')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 w-full text-left font-rajdhani font-bold text-lg mt-2 ${activeTab === 'coaching' ? 'bg-gradient-to-r from-orange-500/40 to-transparent bg-orange-500/10 border-l-4 border-orange-400 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                        Mentorat
                    </button>

                    {(isStaff || isCoach) && (
                        <button 
                            onClick={() => setActiveTab('dossiers')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 w-full text-left font-rajdhani font-bold text-lg mt-4 ${activeTab === 'dossiers' ? 'bg-blue-600/20 border-l-4 border-blue-500 text-blue-300' : 'text-blue-500/50 hover:bg-blue-600/10 hover:text-blue-400 border-l-4 border-transparent'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            Dossiers Staff
                        </button>
                    )}
                </nav>
            </div>

            {/* Bas de Sidebar */}
            <div>
                <button 
                  onClick={signOut}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 w-full text-left font-rajdhani font-bold text-lg text-red-500/70 hover:bg-red-500/10 hover:text-red-400"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                  Déconnexion
                </button>
            </div>
        </aside>

        {/* =========================================
            CORPS PRINCIPAL (HEADER + MAIN) 
            ========================================= */}
        <div className="flex-1 flex flex-col h-screen overflow-y-auto relative pb-20 md:pb-0 scroll-smooth">
          
            {/* HEADER HAUT (Mobile + Bouton Notifications Desktop) */}
            <header className="sticky top-0 z-40 w-full flex items-center justify-between bg-black/60 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none p-4 md:p-6 md:justify-end border-b border-white/5 md:border-none">
                
                {/* Mobile Only: Profil Simple à gauche */}
                <div className="md:hidden flex items-center gap-3">
                  {session.user.user_metadata.avatar_url ? (
                    <img src={session.user.user_metadata.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full border border-gowrax-purple/50 object-cover"/>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gowrax-purple/20 flex items-center justify-center border border-gowrax-purple/50 text-xs font-bold">GRX</div>
                  )}
                  <div>
                    <h1 className="font-rajdhani text-lg font-bold truncate w-32">{session.user.user_metadata.full_name || session.user.email}</h1>
                    
                    {/* Jauge de tolerance Mobile */}
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 w-20 bg-white/5 h-1 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${myStats.absent > 2 ? 'bg-red-500' : myStats.absent > 0 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min((myStats.absent) * 33.33, 100)}%` }}
                        ></div>
                      </div>
                      <span className={`text-[8px] font-techMono ${myStats.absent > 2 ? 'text-red-500' : myStats.absent > 0 ? 'text-yellow-500' : 'text-green-500'}`}>{myStats.absent}/3</span>
                    </div>
                    
                  </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* PC ONLY: Badges de Rôles */}
                    <div className="hidden md:flex gap-2 text-[10px] font-techMono font-bold tracking-widest mr-4">
                        {rolesLoading ? (
                            <span className="text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/10 animate-pulse">SCANNING...</span>
                        ) : roles.length > 0 ? (
                            roles.map((role) => (
                                <span key={role} className="px-3 py-1 bg-white/5 text-gray-300 rounded-full border border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.3)] backdrop-blur-sm">
                                    {role}
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">OPÉRATEUR</span>
                        )}
                    </div>

                    {/* CLOCHE DE NOTIFICATIONS (Mobile + PC) */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowNotifs(!showNotifs)}
                            className="relative flex items-center justify-center p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* MENU DÉROULANT DES NOTIFICATIONS */}
                        {showNotifs && (
                            <div className="absolute right-0 mt-3 w-80 max-h-[70vh] overflow-y-auto bg-black/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.9)] z-50 p-2">
                                <div className="p-3 border-b border-white/5 flex justify-between items-center mb-2 sticky top-0 bg-black/50 backdrop-blur-md">
                                  <span className="font-rajdhani text-sm font-bold text-gray-300 uppercase tracking-widest">ALERTS SYSTEM</span>
                                  {unreadCount > 0 && <span className="text-[10px] text-gowrax-neon font-techMono">{unreadCount} NEW</span>}
                                </div>
                                {notifications.length === 0 ? (
                                    <p className="text-gray-500 text-xs text-center py-6 font-poppins italic">Système nominal. Aucune alerte.</p>
                                ) : (
                                    <div className="flex flex-col gap-2 p-1">
                                        {notifications.map(n => (
                                            <div 
                                              key={n.id} 
                                              onClick={() => markAsRead(n.id)}
                                              className={`p-3.5 rounded-xl text-left text-sm transition-colors cursor-pointer border ${n.is_read ? 'bg-white/[0.02] border-transparent opacity-60' : 'bg-gradient-to-br from-gowrax-purple/10 to-transparent border-gowrax-purple/30 hover:border-gowrax-purple'}`}
                                            >
                                                <h4 className={`font-rajdhani font-bold text-base flex items-center justify-between mb-1 ${n.is_read ? 'text-gray-400' : 'text-white'}`}>
                                                  {n.title}
                                                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-gowrax-neon shadow-[0_0_8px_rgba(214,47,127,0.8)] animate-pulse"></span>}
                                                </h4>
                                                <p className="text-xs text-gray-400 font-poppins leading-relaxed">{n.message}</p>
                                                <div className="text-[9px] text-gray-600 mt-2 font-techMono uppercase">{new Date(n.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* CONTENU CENTRAL */}
            <main className="p-4 md:p-8 flex-1 w-full max-w-5xl mx-auto flex flex-col gap-8 md:pt-4">
                
                {/* HEADER TECHNIQUE : Affichage du Mode Actuel */}
                <div className="flex items-center gap-3 mb-2 opacity-80">
                    <h2 className="font-rajdhani text-3xl md:text-5xl font-extrabold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                        {activeTab === 'calendar' ? 'CALENDRIER' : activeTab === 'availability' ? 'DISPONIBILITÉS' : activeTab === 'stratbook' ? 'STRATÉGIES' : activeTab === 'vods' ? 'ARCHIVES VOD' : 'DOSSIERS STAFF'}
                    </h2>
                    <div className="h-px bg-white/20 flex-1 ml-4 hidden md:block"></div>
                </div>

                {activeTab === 'calendar' && (
                    <>
                        <Calendar session={session} />
                        
                        {(isStaff || isCoach) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div className="bg-red-900/10 border border-red-500/20 p-6 rounded-2xl flex flex-col items-center text-center hover:border-red-500/50 transition-colors shadow-lg">
                                  <h3 className="font-rajdhani text-2xl text-red-500 font-bold mb-2 tracking-wide">STAFF OVERSIGHT</h3>
                                  <p className="font-poppins text-gray-400 text-sm mb-4">Gérer les accès globaux et lire les rapports d'équipe classifiés.</p>
                                  <button onClick={() => setActiveTab('dossiers')} className="px-6 py-2.5 bg-red-500/10 font-rajdhani text-red-400 font-bold border border-red-500/50 rounded-xl hover:bg-red-500 hover:text-white transition-all uppercase w-full tracking-widest">
                                    Accéder aux Dossiers
                                  </button>
                              </div>

                                <div className="bg-blue-900/10 border border-blue-500/20 p-6 rounded-2xl flex flex-col items-center text-center hover:border-blue-500/50 transition-colors shadow-lg">
                                    <h3 className="font-rajdhani text-2xl text-blue-500 font-bold mb-2 tracking-wide">TACTICAL DASHBOARD</h3>
                                    <p className="font-poppins text-gray-400 text-sm mb-4">Analyse des présences (Heatmaps) et stratégies globales.</p>
                                    <button onClick={() => setActiveTab('availability')} className="px-6 py-2.5 bg-blue-500/10 font-rajdhani text-blue-400 font-bold border border-blue-500/50 rounded-xl hover:bg-blue-500 hover:text-white transition-all uppercase w-full tracking-widest">
                                      Voir les Heatmaps
                                    </button>
                                </div>

                                <div className="bg-orange-900/10 border border-orange-500/20 p-6 rounded-2xl flex flex-col items-center text-center hover:border-orange-500/50 transition-colors shadow-lg md:col-span-2">
                                    <h3 className="font-rajdhani text-2xl text-orange-500 font-bold mb-2 tracking-wide">COACHING HUB</h3>
                                    <p className="font-poppins text-gray-400 text-sm mb-4">Assigner des objectifs personnalisés ou examiner les VODs des recrues.</p>
                                    <button onClick={() => setActiveTab('coaching')} className="px-6 py-2.5 bg-orange-500/10 font-rajdhani text-orange-400 font-bold border border-orange-500/50 rounded-xl hover:bg-orange-500 hover:text-white transition-all uppercase w-full tracking-widest">
                                      Ouvrir le Mentorat
                                    </button>
                                </div>
                            </div>
                          )}                          {(!isStaff && !isCoach) && (
                            <div className="grid grid-cols-1 mt-4">
                                <div 
                                    onClick={() => setActiveTab('coaching')}
                                    className="bg-orange-900/10 border border-orange-500/20 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center hover:bg-orange-900/20 hover:border-orange-500/50 transition-all cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.1)] group"
                                >
                                    <div className="flex items-center gap-4 text-left">
                                        <div className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                        </div>
                                        <div>
                                            <h3 className="font-rajdhani text-xl text-orange-500 font-bold uppercase tracking-wider">Mes Objectifs Tactiques</h3>
                                            <p className="font-poppins text-gray-400 text-xs">Accédez à votre suivi personnalisé mis en place par le staff GOWRAX.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-4 mt-4 md:mt-0 text-center">
                                        <div className="flex flex-col">
                                            <span className="font-techMono text-2xl text-white font-bold">{myGoalsStats.inProgress}</span>
                                            <span className="text-[9px] font-techMono text-gray-500 uppercase tracking-widest">En cours</span>
                                        </div>
                                        <div className="w-px h-8 bg-white/10 hidden md:block mt-1"></div>
                                        <div className="flex flex-col">
                                            <span className="font-techMono text-2xl text-green-400 font-bold">{myGoalsStats.completed}</span>
                                            <span className="text-[9px] font-techMono text-gray-500 uppercase tracking-widest">Validés</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                          )}
                      </>
                  )}                {activeTab === 'availability' && <Availability session={session} isStaff={isStaff} isCoach={isCoach} />}
                {activeTab === 'stratbook' && <Stratbook isStaff={isStaff} isCoach={isCoach} />}
                {activeTab === 'vods' && <Vods session={session} isStaff={isStaff} isCoach={isCoach} />}
                {activeTab === 'coaching' && <CoachingHub session={session} isStaff={isStaff} isCoach={isCoach} />}
                {activeTab === 'dossiers' && (isStaff || isCoach) && <Dossiers isStaff={isStaff} isCoach={isCoach} />}
            </main>
        </div>

        {/* =========================================
            BOTTOM NAV MOBILE (INSTA STYLE)
            ========================================= */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full h-[72px] bg-black/90 backdrop-blur-2xl border-t border-white/10 z-50 flex items-center justify-between px-1 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.6)]">
            <button 
                onClick={() => setActiveTab('calendar')}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${activeTab === 'calendar' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <div className={`p-1 rounded-full ${activeTab === 'calendar' ? 'bg-gowrax-purple/20' : ''}`}>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'calendar' ? '2.5' : '2'} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <span className="text-[8px] sm:text-[9px] font-techMono uppercase mt-1">Events</span>
            </button>

            <button 
                onClick={() => setActiveTab('availability')}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${activeTab === 'availability' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <div className={`p-1 rounded-full ${activeTab === 'availability' ? 'bg-gowrax-purple/20' : ''}`}>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'availability' ? '2.5' : '2'} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <span className="text-[8px] sm:text-[9px] font-techMono uppercase mt-1">Dispos</span>
            </button>

            <button 
                onClick={() => setActiveTab('stratbook')}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${activeTab === 'stratbook' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <div className={`p-1 rounded-full ${activeTab === 'stratbook' ? 'bg-gowrax-purple/20' : ''}`}>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'stratbook' ? '2.5' : '2'} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                </div>
                <span className="text-[8px] sm:text-[9px] font-techMono uppercase mt-1">Strats</span>
            </button>

            <button 
                onClick={() => setActiveTab('vods')}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${activeTab === 'vods' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}                                                                                          >
                <div className={`p-1 rounded-full ${activeTab === 'vods' ? 'bg-blue-600/20' : ''}`}>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'vods' ? '2.5' : '2'} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>                                            </div>
                <span className="text-[8px] sm:text-[9px] font-techMono uppercase mt-1">VODs</span>
            </button>

            <button 
                onClick={() => setActiveTab('coaching')}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${activeTab === 'coaching' ? 'text-orange-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <div className={`p-1 rounded-full ${activeTab === 'coaching' ? 'bg-orange-500/20' : ''}`}>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'coaching' ? '2.5' : '2'} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                </div>
                <span className="text-[8px] sm:text-[9px] font-techMono uppercase mt-1">Coaching</span>
            </button>

            {(isStaff || isCoach) && (
                <button 
                    onClick={() => setActiveTab('dossiers')}
                    className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${activeTab === 'dossiers' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <div className={`p-1 rounded-full ${activeTab === 'dossiers' ? 'bg-blue-500/20' : ''}`}>
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'dossiers' ? '2.5' : '2'} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <span className="text-[8px] sm:text-[9px] font-techMono uppercase mt-1">Staff</span>
                </button>
            )}

            {/* Bouton Settings / Déco Mobile */}
            <button 
                onClick={signOut}
                className="flex flex-col items-center justify-center flex-1 h-full transition-colors text-gray-500 hover:text-red-400"
            >
                <div className="p-1 rounded-full">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                </div>
                <span className="text-[8px] sm:text-[9px] font-techMono uppercase mt-1">Quitter</span>
            </button>
        </nav>
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  // NOUVEAU : State pour gérer l'installation PWA
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    // 📱 DÉTECTION PWA
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Détection iOS (Safari) qui ne supporte pas l'event ci-dessus
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    if (isIosDevice && !isStandalone) {
      setIsIos(true);
    }

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }
  }, [])

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  async function signInWithDiscord() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: window.location.origin
      }
    })
    if (error) console.error("Error logging in:", error.message)
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) console.error("Error logging out:", error.message)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gowrax-abyss">
        <p className="font-techMono text-gowrax-neon animate-pulse">INIT SYSTEM...</p>
      </div>
    )
  }

  if (session) {
    // Si connecté, on renvoit le Dashboard contenant nos rôles !
    return (
      <>
        <Dashboard session={session} signOut={signOut} />
        
        {/* BANNIÈRE D'INSTALLATION ANDROID / DESKTOP (Si connecté) */}
        {deferredPrompt && (
          <div className="fixed bottom-24 md:bottom-10 right-4 left-4 md:left-auto md:w-80 bg-black/90 backdrop-blur-xl border border-gowrax-purple p-4 rounded-2xl z-[100] shadow-[0_0_30px_rgba(111,45,189,0.5)] flex flex-col gap-3 transition-all animate-bounce-short">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gowrax-purple/20 rounded-xl flex items-center justify-center text-gowrax-neon font-bold shrink-0 border border-gowrax-purple/50">GRX</div>
                <div>
                  <h3 className="font-rajdhani font-bold text-white text-lg leading-tight">Installer l'Application</h3>
                  <p className="text-[10px] text-white/70 font-poppins mt-1">Ajoute GOWRAX Hub à ton écran d'accueil pour un accès ultra-rapide.</p>
                </div>
            </div>
            <div className="flex gap-2 w-full mt-1">
              <button onClick={() => setDeferredPrompt(null)} className="flex-1 py-2 text-xs font-techMono text-white/50 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10">Plus tard</button>
              <button onClick={handleInstallPWA} className="flex-1 py-2 text-xs font-techMono font-bold text-white bg-gradient-to-r from-gowrax-purple to-gowrax-neon hover:to-pink-500 rounded-lg transition-colors shadow-[0_0_15px_rgba(214,47,127,0.4)]">Installer</button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gowrax-abyss text-white flex flex-col relative overflow-y-auto font-poppins selection:bg-gowrax-neon selection:text-white">
      {/* BANNIÈRES D'INSTALLATION PWA GLOBALES */}

      {/* BANNIÈRE ANDROID / DESKTOP (SUR PAGE DE CONNEXION) */}
      {deferredPrompt && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-black/80 backdrop-blur-xl border border-gowrax-neon p-4 rounded-2xl z-50 shadow-[0_0_40px_rgba(214,47,127,0.3)] flex flex-col gap-3">
          <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gowrax-neon/20 rounded-xl flex items-center justify-center text-gowrax-neon font-bold shrink-0 border border-gowrax-neon/50">APP</div>
              <div>
                <h3 className="font-rajdhani font-bold text-white text-lg leading-tight">Installer l'Application</h3>
                <p className="text-xs text-white/80 font-poppins mt-1">Ajoute GOWRAX Hub sur ton appareil !</p>
              </div>
          </div>
          <div className="flex gap-2 w-full mt-1">
            <button onClick={() => setDeferredPrompt(null)} className="flex-1 py-2 text-xs font-techMono text-white/60 bg-white/5 rounded-lg border border-white/10">Plus tard</button>
            <button onClick={handleInstallPWA} className="flex-1 py-2 text-xs font-techMono font-bold text-white bg-gowrax-neon hover:bg-pink-600 rounded-lg shadow-[0_0_15px_rgba(214,47,127,0.6)]">Installer Maintentant</button>
          </div>
        </div>
      )}

      {/* ASTUCE iOS (SAFARI NE SUPPORTE PAS LE BOUTON D'INSTALLATION DIRECTE) */}
      {isIos && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white text-black p-4 rounded-2xl z-50 shadow-2xl flex flex-col gap-2 border-b-4 border-blue-500 animate-pulse">
            <div>
              <h3 className="font-rajdhani font-bold text-lg leading-tight text-blue-600">Astuce iOS 📱</h3>
              <p className="text-xs font-poppins mt-1 text-gray-800">Pour installer l'application complète, appuie sur le bouton <b>Partager</b> <svg className="inline w-4 h-4 text-blue-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg> en bas de ton écran, puis sélectionne <b>"Sur l'écran d'accueil"</b>.</p>
            </div>
            <button onClick={() => setIsIos(false)} className="mt-2 py-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg w-full">J'ai compris</button>
        </div>
      )}

      {/* Background glowing effects */}
      <div className="fixed top-0 left-1/4 w-[40rem] h-[40rem] bg-gowrax-purple/20 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen"></div>
      <div className="fixed bottom-0 right-1/4 w-[50rem] h-[50rem] bg-gowrax-neon/10 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen"></div>
      
      {/* Decorative Top Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gowrax-neon to-transparent animate-pulse opacity-70"></div>

      {/* Navbar Minimaliste */}
      <nav className="w-full p-6 flex justify-between items-center max-w-7xl mx-auto z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gowrax-purple/30 to-black border border-gowrax-purple rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(111,45,189,0.5)]">
            <span className="font-techMono font-bold text-xs text-white">GRX</span>
          </div>
          <span className="font-rajdhani font-bold text-xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">GOWRAX</span>
        </div>
        <div className="font-techMono text-[10px] text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Restricted Access
        </div>
      </nav>

      {/* Main Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 mt-10 md:mt-20 z-10 max-w-5xl mx-auto text-center">
        <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-gowrax-purple/10 border border-gowrax-purple/30 backdrop-blur-md">
            <span className="font-techMono text-xs text-gowrax-neon uppercase tracking-widest">Opérations & Stratégie</span>
        </div>
        
        <h1 className="font-rajdhani text-5xl md:text-7xl font-extrabold tracking-tight mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
          TACTICAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-gowrax-purple to-gowrax-neon">INTERFACE</span>
        </h1>
        
        <p className="font-poppins text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
          Bienvenue sur le portail sécurisé de GOWRAX. Ce hub centralise les plannings, les présences, et les outils stratégiques exclusifs aux membres de la structure.
        </p>

        {/* Login Card */}
        <div className="backdrop-blur-xl bg-white/[0.02] border border-white/10 p-8 rounded-2xl w-full max-w-md mx-auto shadow-[0_15px_40px_rgba(0,0,0,0.6)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-gowrax-neon/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <p className="font-techMono text-xs text-gray-400 uppercase tracking-widest mb-6 text-center">
              // Authentification Requise
            </p>

            <button 
              onClick={signInWithDiscord}
              className="relative w-full flex items-center justify-center gap-4 px-6 py-4 bg-[#5865F2]/10 hover:bg-[#5865F2] border border-[#5865F2]/50 hover:border-[#5865F2] text-[#5865F2] hover:text-white font-bold font-rajdhani text-xl rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(88,101,242,0.2)] hover:shadow-[0_0_30px_rgba(88,101,242,0.6)] overflow-hidden"
            >
              <svg className="w-7 h-7 relative z-10" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
              </svg>
              <span className="tracking-widest relative z-10">CONNEXION DISCORD</span>
            </button>
            <p className="text-[10px] text-gray-500 mt-4 font-poppins text-center">
              Accès strictement réservé aux membres validés sur le serveur Discord GOWRAX.
            </p>
        </div>
      </div>

      {/* Features Overview (Vitrine) */}
      <div className="w-full max-w-6xl mx-auto z-10 px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:bg-white/[0.04] hover:border-gowrax-purple/50 transition-all duration-500 group">
            <div className="w-12 h-12 bg-gowrax-purple/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-gowrax-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <h3 className="font-rajdhani text-xl font-bold text-white mb-2">Calendrier Actif</h3>
            <p className="font-poppins text-xs text-gray-400 leading-relaxed">
              Consultez tous les praccs, matchs officiels et tournois à venir. Maintenez-vous à jour avec le planning de votre escouade.
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:bg-white/[0.04] hover:border-gowrax-neon/50 transition-all duration-500 group relative overflow-hidden">
            <div className="w-12 h-12 bg-gowrax-neon/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-gowrax-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 className="font-rajdhani text-xl font-bold text-white mb-2">Heatmap & Absences</h3>
            <p className="font-poppins text-xs text-gray-400 leading-relaxed">
              Grille de disponibilité hyper-précise (intervalles de 30 mins) complétée par un workflow complet style "Pronote" pour justifier vos absences.
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:bg-white/[0.04] hover:border-teal-500/50 transition-all duration-500 group relative overflow-hidden">
            <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
            </div>
            <h3 className="font-rajdhani text-xl font-bold text-white mb-2">Gowrax Strat-Book</h3>
            <p className="font-poppins text-xs text-gray-400 leading-relaxed">
              L'armoirie tactique de l'équipe : upload et lecture plein-écran de Setups et retakes avec filtrage par Map et Side (Défense/Attaque).
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:bg-white/[0.04] hover:border-blue-500/50 transition-all duration-500 group">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <h3 className="font-rajdhani text-xl font-bold text-white mb-2">Accréditation Staff</h3>
            <p className="font-poppins text-xs text-gray-400 leading-relaxed">
              Dossiers classifiés par membre. Suivi de l'autorité, historique d'implication, Heatmap pour fixer des rosters, validation/refus des congés.
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer Minimal */}
      <footer className="w-full text-center p-6 border-t border-white/5 bg-black/40 z-10 backdrop-blur-md">
        <p className="font-techMono text-[10px] text-gray-600 tracking-widest uppercase">
          © 2026 GOWRAX ESPORT. ALL SYSTEMS NOMINAL.
        </p>
      </footer>
    </div>
  )
}

export default App