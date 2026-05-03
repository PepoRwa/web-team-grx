import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import { usePermissions } from './hooks/usePermissions'

// Components
import Calendar from './components/Calendar'
import Dossiers from './components/Dossiers' 
import Availability from './components/Availability' 
import Stratbook from './components/Stratbook' 
import Vods from './components/Vods' 
import CoachingHub from './components/CoachingHub' 
import DevPanel from './components/DevPanel' 
import Download from './components/Download' 
import ShootingStars from './components/ShootingStars' 
import ScrollProgress from './components/ScrollProgress' 
import RevealOnScroll from './components/RevealOnScroll' 
import SmartParticles from './components/SmartParticles' 
import Profil from './components/Profil';
import DisabledOverlay from './components/DisabledOverlay';
import Evolution from './components/Evolution';
import Lineups from './components/Lineups';

function Dashboard({ session, signOut }) {
  const { roles, loading: rolesLoading, isStaff, isCoach } = usePermissions(session);
  const [activeTab, setActiveTab] = useState('calendar'); 
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [myStats, setMyStats] = useState({ absent: 0 });
  const [myGoalsStats, setMyGoalsStats] = useState({ inProgress: 0, completed: 0 });
  const [onlineUsers, setOnlineUsers] = useState({});
  const [disabledPages, setDisabledPages] = useState([]);
  
  // Footer Data
  const [appConfig, setAppConfig] = useState({ version: '1.0.0', build_code: 'DEV' });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('app_version').select('*').eq('id', 1).single();
      if (data) {
         setDisabledPages(data.disabled_pages || []);
         setAppConfig({ version: data.version || '1.0.0', build_code: data.build_code || 'N/A' });
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!session) return;
    
    const room = supabase.channel('radar_global', {
      config: { presence: { key: session.user.id } }
    });

    room.on('presence', { event: 'sync' }, () => {
      setOnlineUsers(room.presenceState());
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const d_id = session.user.identities?.find(i => i.provider === 'discord')?.id;
        await room.track({
          discord_id: d_id,
          username: session.user.user_metadata?.full_name || session.user.email,
          tab: activeTab,
          updated_at: new Date().toISOString()
        });
        
        await supabase.from('profiles').update({
           last_seen: new Date().toISOString(),
           last_page: activeTab,
           discord_id: d_id 
        }).eq('id', session.user.id);
      }
    });

    const updatePosition = async () => {
      if (room.state === 'joined') {
         const d_id = session.user.identities?.find(i => i.provider === 'discord')?.id;
         await room.track({
            discord_id: d_id,
            username: session.user.user_metadata?.full_name || session.user.email,
            tab: activeTab,
            updated_at: new Date().toISOString()
         });
         
         await supabase.from('profiles').update({
            last_seen: new Date().toISOString(),
            last_page: activeTab,
            discord_id: d_id
         }).eq('id', session.user.id);
      }
    }
    updatePosition();

    return () => { supabase.removeChannel(room); }
  }, [activeTab, session]);

  useEffect(() => {
    const loadMyStats = async () => {
      const { data } = await supabase
        .from('checkins') // Note: corrigé de check_ins à checkins
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
    let globalFilters = [`target_roster.eq.Tous`];
    if (isStaff || isCoach) {
      globalFilters = []; 
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
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    } else {
      const readGlobals = JSON.parse(localStorage.getItem('read_global_notifs') || '[]');
      if (!readGlobals.includes(id)) {
        readGlobals.push(id);
        localStorage.setItem('read_global_notifs', JSON.stringify(readGlobals));
      }
    }
    
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (rolesLoading) {
     return (
        <div className="flex-1 flex flex-col min-h-screen bg-[#0D0E15] items-center justify-center p-6 text-center z-[100] selection:bg-[#F7CAD0] selection:text-[#1A1C2E]">
            <div className="w-24 h-24 border-t-4 border-b-4 border-[#B185DB] rounded-full animate-spin"></div>
            <h1 className="font-rajdhani text-2xl text-[#A2D2FF] font-bold tracking-widest mt-8 animate-pulse shadow-[0_0_50px_rgba(162,210,255,0.2)]">VÉRIFICATION DES ACCRÉDITATIONS TACTIQUES...</h1>
        </div>
     );
  }

  // Écran Opérateur bloqué
  if (!rolesLoading && roles.length === 0 && !isStaff && !isCoach) {
     return (
        <div className="flex-1 flex flex-col min-h-screen bg-[#0D0E15] relative items-center justify-center p-6 text-center z-[100] selection:bg-[#F7CAD0] selection:text-[#1A1C2E] overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay"></div>
            <div className="fixed top-0 left-1/4 w-[30rem] h-[30rem] bg-red-900/10 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen"></div>
            
            <div className="absolute top-8 left-8 flex items-center gap-3 bg-white/[0.02] p-2 pr-6 rounded-full border border-white/5 backdrop-blur-md">
              <div className="w-8 h-8 bg-red-500/20 border border-red-500/30 rounded-full flex justify-center items-center font-bold text-red-400 text-[10px]">GRX</div>
              <span className="font-rajdhani text-sm font-bold tracking-widest text-gray-400">AUTHORIZATION REQUISE</span>
            </div>

            <div className="bg-[#1A1C2E]/60 backdrop-blur-2xl border border-red-500/20 p-10 md:p-16 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-2xl w-full flex flex-col items-center relative">
              <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30 mb-8 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                  <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <h1 className="font-rajdhani text-3xl md:text-5xl text-white font-black tracking-wider uppercase mb-4 drop-shadow-md">ACCÈS REFUSÉ</h1>
              <p className="font-poppins text-gray-400 mb-10 text-sm md:text-base leading-relaxed text-center">
                  Vos accréditations temporaires <strong className="text-white">"Opérateur"</strong> sont insuffisantes pour explorer le Hub Tactique. Vous devez recevoir une assignation de Roster en validant votre rôle sur le serveur Discord officiel.
              </p>
              <button
                  onClick={signOut}
                  className="px-10 py-4 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.1)] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] font-rajdhani font-bold text-lg tracking-widest"
              >
                  QUITTER L'INTERFACE
              </button>
            </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-[#0D0E15] text-[#F0F2F5] flex md:flex-row flex-col relative overflow-hidden font-poppins selection:bg-[#B185DB] selection:text-white">
        
        {/* LUEURS D'ARRIÈRE-PLAN */}
        <div className="fixed top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-[#6F2DBD]/10 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen animate-pulse-slow"></div>
        <div className="fixed bottom-[-10%] right-[-5%] w-[50rem] h-[50rem] bg-[#F7CAD0]/5 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen animate-float"></div>

        {/* =========================================
            SIDEBAR DESKTOP (PC) 
            ========================================= */}
        <aside className="hidden md:flex flex-col w-72 bg-[#1A1C2E]/40 shadow-[4px_0_30px_rgba(0,0,0,0.3)] backdrop-blur-3xl border-r border-white/5 p-6 z-50 h-screen sticky top-0 justify-between overflow-y-auto custom-scrollbar">
            <div>
                {/* Logo & Marque */}
                <div className="flex items-center gap-4 mb-10 px-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#B185DB] to-black border border-[#B185DB]/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(177,133,219,0.3)] shrink-0">
                    <span className="font-techMono font-bold text-sm text-[#F7CAD0]">GRX</span>
                  </div>
                  <span className="font-rajdhani font-bold text-3xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">GOWRAX.</span>
                </div>

                {/* Profil Utilisateur */}
                <div className="flex items-center gap-4 mb-8 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 shadow-inner">
                    {session.user.user_metadata.avatar_url ? (
                      <img src={session.user.user_metadata.avatar_url} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-[#B185DB]/40 object-cover shadow-sm shrink-0"/>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#B185DB]/20 flex items-center justify-center border border-[#B185DB]/40 shrink-0"><span className="text-sm font-bold text-white">GRX</span></div>
                    )}
                    <div className="overflow-hidden">
                      <h2 className="font-rajdhani text-lg font-bold text-white truncate">
                          {session.user.user_metadata.full_name || session.user.email}
                      </h2>
                      <div className="text-[10px] font-techMono text-[#A2D2FF] uppercase truncate">
                          {roles.length > 0 ? roles[0] : 'Opérateur'}
                      </div>
                    </div>
                </div>

                {/* Menu Navigation PC */}
                <nav className="flex flex-col gap-2">
                    <p className="font-techMono text-[10px] text-gray-500 uppercase tracking-[0.3em] mb-1 px-3">Applications</p>
                    
                    <button onClick={() => setActiveTab('calendar')} className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 w-full text-left font-rajdhani font-bold text-lg ${activeTab === 'calendar' ? 'bg-[#A2D2FF]/10 text-[#A2D2FF] shadow-[inset_0_0_20px_rgba(162,210,255,0.1)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                        <svg className={`w-5 h-5 ${activeTab === 'calendar' ? 'text-[#A2D2FF]' : 'opacity-60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        Calendrier
                    </button>

                    <button onClick={() => setActiveTab('availability')} className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 w-full text-left font-rajdhani font-bold text-lg ${activeTab === 'availability' ? 'bg-[#B185DB]/10 text-[#B185DB] shadow-[inset_0_0_20px_rgba(177,133,219,0.1)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                        <svg className={`w-5 h-5 ${activeTab === 'availability' ? 'text-[#B185DB]' : 'opacity-60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Disponibilités
                    </button>

                    <button onClick={() => setActiveTab('stratbook')} className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 w-full text-left font-rajdhani font-bold text-lg ${activeTab === 'stratbook' ? 'bg-[#F7CAD0]/10 text-[#F7CAD0] shadow-[inset_0_0_20px_rgba(247,202,208,0.1)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                        <svg className={`w-5 h-5 ${activeTab === 'stratbook' ? 'text-[#F7CAD0]' : 'opacity-60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                        Strat-Book
                    </button>

                    {/* NOUVEAU MODULE: LINEUPS */}
                    <button onClick={() => setActiveTab('lineups')} className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 w-full text-left font-rajdhani font-bold text-lg ${activeTab === 'lineups' ? 'bg-teal-500/10 text-teal-400 shadow-[inset_0_0_20px_rgba(20,184,166,0.1)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                        <svg className={`w-5 h-5 ${activeTab === 'lineups' ? 'text-teal-400' : 'opacity-60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg>
                        Lineups
                    </button>

                    <button onClick={() => setActiveTab('vods')} className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 w-full text-left font-rajdhani font-bold text-lg ${activeTab === 'vods' ? 'bg-indigo-500/10 text-indigo-400 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                        <svg className={`w-5 h-5 ${activeTab === 'vods' ? 'text-indigo-400' : 'opacity-60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        VODs & Replays
                    </button>

                    <button onClick={() => setActiveTab('coaching')} className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 w-full text-left font-rajdhani font-bold text-lg ${activeTab === 'coaching' ? 'bg-orange-500/10 text-orange-400 shadow-[inset_0_0_20px_rgba(249,115,22,0.1)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                        <svg className={`w-5 h-5 ${activeTab === 'coaching' ? 'text-orange-400' : 'opacity-60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                        Mentorat
                    </button>

                    <button onClick={() => setActiveTab('profil')} className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 w-full text-left font-rajdhani font-bold text-lg ${activeTab === 'profil' ? 'bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                        <svg className={`w-5 h-5 ${activeTab === 'profil' ? 'text-emerald-400' : 'opacity-60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        Mon Profil
                    </button>

                    {/* BOUTON SLOW BLOOM */}
                    <button onClick={() => setActiveTab('evolution')} className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-500 w-full text-left font-rajdhani font-bold text-lg mt-1 group relative overflow-hidden ${activeTab === 'evolution' ? 'bg-gradient-to-r from-[#B185DB]/20 to-[#F7CAD0]/10 border border-[#F7CAD0]/30 text-white shadow-[0_0_30px_rgba(247,202,208,0.2)]' : 'bg-white/[0.02] border border-white/5 text-gray-400 hover:border-[#F7CAD0]/20 hover:text-white'}`}>
                        {activeTab === 'evolution' && <div className="absolute inset-0 bg-gradient-to-r from-[#B185DB]/10 to-[#F7CAD0]/10 pointer-events-none animate-pulse-slow"></div>}
                        <div className="flex items-center gap-3 relative z-10">
                            <svg className={`w-5 h-5 transition-transform duration-500 group-hover:rotate-12 ${activeTab === 'evolution' ? 'text-[#F7CAD0]' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            <span className={`tracking-wide ${activeTab === 'evolution' ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#F0F2F5] to-[#F7CAD0]' : ''}`}>Slow Bloom</span>
                        </div>
                        <div className="relative flex items-center justify-center scale-90">
                            <div className="absolute inset-0 bg-[#B185DB]/30 blur-[10px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/40 border border-[#F7CAD0]/30 backdrop-blur-md overflow-hidden">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#F7CAD0] shadow-[0_0_8px_#F7CAD0] animate-pulse"></div>
                                <span className="text-[10px] font-techMono font-black tracking-[0.1em] text-[#F7CAD0]">AI</span>
                            </div>
                        </div>          
                    </button>

                    {(isStaff || isCoach) &&  (
                        <button onClick={() => setActiveTab('dossiers')} className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 w-full text-left font-rajdhani font-bold text-lg mt-3 ${activeTab === 'dossiers' ? 'bg-blue-600/20 text-blue-300 shadow-[inset_0_0_20px_rgba(37,99,235,0.1)]' : 'text-blue-400/50 hover:bg-white/5 hover:text-blue-300'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            Dossiers Staff
                        </button>
                    )}

                    {(isStaff) && (
                        <button onClick={() => setActiveTab('dev')} className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 w-full text-left font-rajdhani font-bold text-lg mt-1 ${activeTab === 'dev' ? 'bg-[#00FF41]/10 text-[#00FF41] shadow-[inset_0_0_20px_rgba(0,255,65,0.1)]' : 'text-gray-600 hover:bg-white/5 hover:text-[#00FF41]/60'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                            Paramètres
                        </button>
                    )}
                </nav>
            </div>

            <div className="mt-8 pb-4">
                <button onClick={signOut} className="flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 w-full text-left font-rajdhani font-bold text-lg text-red-500/60 hover:bg-red-500/10 hover:text-red-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                  Déconnexion
                </button>
            </div>
        </aside>

        {/* =========================================
            CORPS PRINCIPAL (HEADER + MAIN + FOOTER) 
            ========================================= */}
        <div className="flex-1 flex flex-col h-screen overflow-y-auto relative pb-20 md:pb-0 scroll-smooth">
          
            {/* HEADER HAUT (Mobile + Bouton Notifications Desktop) */}
            <header className="sticky top-0 z-40 w-full flex items-center justify-between bg-[#1A1C2E]/60 md:bg-transparent backdrop-blur-2xl md:backdrop-blur-none p-4 md:p-8 md:justify-end border-b border-white/5 md:border-none">
                <div className="md:hidden flex items-center gap-3">
                  {session.user.user_metadata.avatar_url ? (
                    <img src={session.user.user_metadata.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full border border-[#B185DB]/50 object-cover shrink-0"/>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#B185DB]/20 flex items-center justify-center border border-[#B185DB]/50 text-xs font-bold text-white shrink-0">GRX</div>
                  )}
                  <div className="min-w-0">
                    <h1 className="font-rajdhani text-lg font-bold truncate w-[140px] sm:w-[200px]">{session.user.user_metadata.full_name || session.user.email}</h1>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 w-16 sm:w-20 bg-white/5 h-1.5 rounded-full overflow-hidden shrink-0">
                        <div className={`h-full ${myStats.absent > 2 ? 'bg-red-500' : myStats.absent > 0 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min((myStats.absent) * 33.33, 100)}%` }}></div>
                      </div>
                      <span className={`text-[9px] font-techMono ${myStats.absent > 2 ? 'text-red-500' : myStats.absent > 0 ? 'text-yellow-500' : 'text-green-500'}`}>{myStats.absent}/3</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex gap-2 text-[10px] font-techMono font-bold tracking-widest mr-4">
                        {rolesLoading ? (
                            <span className="text-gray-500 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 animate-pulse">SCANNING...</span>
                        ) : roles.length > 0 ? (
                            roles.map((role) => (
                                <span key={role} className="px-4 py-1.5 bg-white/[0.03] text-gray-300 rounded-full border border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.3)] backdrop-blur-md">{role}</span>
                            ))
                        ) : (
                            <span className="text-gray-400 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">OPÉRATEUR</span>
                        )}
                    </div>

                    <div className="relative">
                        <button onClick={() => setShowNotifs(!showNotifs)} className="relative flex items-center justify-center p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#F7CAD0]/50 transition-colors shadow-inner">
                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                            {unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse">{unreadCount}</span>}
                        </button>

                        {showNotifs && (
                            <div className="absolute right-0 mt-4 w-80 md:w-96 max-h-[70vh] overflow-y-auto bg-[#1A1C2E]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 p-2 custom-scrollbar">
                                <div className="p-4 border-b border-white/5 flex justify-between items-center mb-2 sticky top-0 bg-[#1A1C2E]/90 backdrop-blur-md z-10">
                                  <span className="font-rajdhani text-sm font-bold text-[#A2D2FF] uppercase tracking-widest">ALERTS SYSTEM</span>
                                  {unreadCount > 0 && <span className="text-[10px] text-[#F7CAD0] font-techMono bg-[#F7CAD0]/10 px-2 py-0.5 rounded border border-[#F7CAD0]/30">{unreadCount} NEW</span>}
                                </div>
                                {notifications.length === 0 ? (
                                    <p className="text-gray-500 text-xs text-center py-8 font-poppins italic">Système nominal. Aucune alerte.</p>
                                ) : (
                                    <div className="flex flex-col gap-2 p-1">
                                        {notifications.map(n => (
                                            <div key={n.id} onClick={() => markAsRead(n.id)} className={`p-4 rounded-xl text-left text-sm transition-colors cursor-pointer border ${n.is_read ? 'bg-white/[0.02] border-transparent opacity-60' : 'bg-gradient-to-br from-[#B185DB]/10 to-transparent border-[#B185DB]/30 hover:border-[#B185DB]/50'}`}>
                                                <h4 className={`font-rajdhani font-bold text-base flex items-center justify-between mb-1 ${n.is_read ? 'text-gray-400' : 'text-white'}`}>
                                                  {n.title}
                                                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#F7CAD0] shadow-[0_0_8px_rgba(247,202,208,0.8)] animate-pulse"></span>}
                                                </h4>
                                                <p className="text-xs text-gray-400 font-poppins leading-relaxed">{n.message}</p>
                                                <div className="text-[9px] text-[#A2D2FF]/50 mt-3 font-techMono uppercase">{new Date(n.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="p-4 md:p-8 flex-1 w-full max-w-[1400px] mx-auto flex flex-col gap-8 md:pt-0">
                <div className="flex items-center gap-4 mb-2 opacity-80 pl-2">
                    <h2 className="font-rajdhani text-3xl md:text-5xl font-extrabold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                        {activeTab === 'calendar' ? 'CALENDRIER' : activeTab === 'availability' ? 'DISPONIBILITÉS' : activeTab === 'stratbook' ? 'STRATÉGIES' : activeTab === 'lineups' ? 'LINEUPS' : activeTab === 'vods' ? 'ARCHIVES VOD' : activeTab === 'profil' ? 'EFFECTIFS GOWRAX' : activeTab === 'coaching' ? 'MENTORAT OFFICIEL' : activeTab === 'evolution' ? 'SLOW BLOOM' : 'DOSSIERS STAFF'}
                    </h2>
                    <div className="h-px bg-white/10 flex-1 ml-4 hidden md:block"></div>
                </div>

                {disabledPages.includes(activeTab) && !isStaff && !isCoach ? (
                    <div className="flex-1 relative min-h-[50vh]"><DisabledOverlay /></div>
                ) : (
                    <>
                        {activeTab === 'calendar' && (
                            <>
                                <Calendar session={session} />
                                {(isStaff || isCoach) && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                                      <div className="bg-[#1A1C2E]/60 backdrop-blur-md border border-[#F7CAD0]/20 p-8 rounded-3xl flex flex-col items-center text-center hover:border-[#F7CAD0]/50 transition-colors shadow-lg">
                                          <h3 className="font-rajdhani text-2xl text-[#F7CAD0] font-bold mb-2 tracking-wide">STAFF OVERSIGHT</h3>
                                          <p className="font-poppins text-gray-400 text-sm mb-6">Gérer les accès globaux et lire les rapports d'équipe classifiés.</p>
                                          <button onClick={() => setActiveTab('dossiers')} className="px-6 py-3.5 bg-[#F7CAD0]/10 font-rajdhani text-[#F7CAD0] font-bold border border-[#F7CAD0]/40 rounded-xl hover:bg-[#F7CAD0] hover:text-[#1A1C2E] transition-all uppercase w-full tracking-widest">Accéder aux Dossiers</button>
                                      </div>
                                      <div className="bg-[#1A1C2E]/60 backdrop-blur-md border border-[#A2D2FF]/20 p-8 rounded-3xl flex flex-col items-center text-center hover:border-[#A2D2FF]/50 transition-colors shadow-lg">
                                          <h3 className="font-rajdhani text-2xl text-[#A2D2FF] font-bold mb-2 tracking-wide">TACTICAL DASHBOARD</h3>
                                          <p className="font-poppins text-gray-400 text-sm mb-6">Analyse des présences (Heatmaps) et disponibilités globales.</p>
                                          <button onClick={() => setActiveTab('availability')} className="px-6 py-3.5 bg-[#A2D2FF]/10 font-rajdhani text-[#A2D2FF] font-bold border border-[#A2D2FF]/40 rounded-xl hover:bg-[#A2D2FF] hover:text-[#1A1C2E] transition-all uppercase w-full tracking-widest">Voir les Heatmaps</button>
                                      </div>
                                      <div className="bg-[#1A1C2E]/60 backdrop-blur-md border border-[#B185DB]/20 p-8 rounded-3xl flex flex-col items-center text-center hover:border-[#B185DB]/50 transition-colors shadow-lg md:col-span-2">
                                          <h3 className="font-rajdhani text-2xl text-[#B185DB] font-bold mb-2 tracking-wide">COACHING HUB</h3>
                                          <p className="font-poppins text-gray-400 text-sm mb-6 max-w-xl">Assigner des objectifs personnalisés ou examiner les VODs des recrues en profondeur.</p>
                                          <button onClick={() => setActiveTab('coaching')} className="px-6 py-3.5 bg-[#B185DB]/10 font-rajdhani text-[#B185DB] font-bold border border-[#B185DB]/40 rounded-xl hover:bg-[#B185DB] hover:text-white transition-all uppercase w-full max-w-sm tracking-widest">Ouvrir le Mentorat</button>
                                      </div>
                                  </div>
                                )}
                                {(!isStaff && !isCoach) && (
                                    <div className="grid grid-cols-1 mt-6">
                                        <div onClick={() => setActiveTab('coaching')} className="bg-[#1A1C2E]/60 backdrop-blur-xl border border-orange-400/20 p-6 md:p-8 rounded-[2rem] flex flex-col md:flex-row justify-between items-center hover:bg-[#1A1C2E]/80 hover:border-orange-400/50 transition-all cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.5)] group">
                                            <div className="flex items-center gap-5 text-left">
                                                <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                                </div>
                                                <div>
                                                    <h3 className="font-rajdhani text-2xl text-orange-400 font-bold uppercase tracking-wider">Mes Objectifs Tactiques</h3>
                                                    <p className="font-poppins text-gray-400 text-sm mt-1">Accédez à votre suivi personnalisé mis en place par le staff.</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-6 mt-6 md:mt-0 text-center bg-black/20 p-4 rounded-2xl border border-white/5">
                                                <div className="flex flex-col"><span className="font-techMono text-3xl text-white font-bold">{myGoalsStats.inProgress}</span><span className="text-[10px] font-techMono text-gray-500 uppercase tracking-widest mt-1">En cours</span></div>
                                                <div className="w-px h-10 bg-white/10 hidden md:block mt-1"></div>
                                                <div className="flex flex-col"><span className="font-techMono text-3xl text-green-400 font-bold">{myGoalsStats.completed}</span><span className="text-[10px] font-techMono text-gray-500 uppercase tracking-widest mt-1">Validés</span></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        
                        {/* MODULE LINEUPS (Placeholder) */}
                        {activeTab === 'lineups' && <Lineups session={session} isStaff={isStaff} isCoach={isCoach} />}
                        {activeTab === 'availability' && <Availability session={session} isStaff={isStaff} isCoach={isCoach} />}
                        {activeTab === 'stratbook' && <Stratbook isStaff={isStaff} isCoach={isCoach} />}
                        {activeTab === 'vods' && <Vods session={session} isStaff={isStaff} isCoach={isCoach} />}
                        {activeTab === 'coaching' && <CoachingHub session={session} isStaff={isStaff} isCoach={isCoach} />}
                        {activeTab === 'profil' && <Profil session={session} setActiveTab={setActiveTab} isStaff={isStaff} isCoach={isCoach} />}
                        {activeTab === 'dossiers' && (isStaff || isCoach) && <Dossiers isStaff={isStaff} isCoach={isCoach} />}
                        {activeTab === 'dev' && (isStaff) && <DevPanel session={session} />}
                        {activeTab === 'evolution' && <Evolution session={session} isStaff={isStaff} isCoach={isCoach} />}
                    </>
                )}
                
                {/* =========================================
                    FOOTER PREMIUM GOWRAX
                    ========================================= */}
                <footer className="mt-auto border-t border-white/5 pt-8 pb-4 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60 hover:opacity-100 transition-opacity animate-fade-in w-full">
                    <div className="flex flex-col text-center md:text-left gap-1">
                        <span className="font-rajdhani font-bold text-white text-lg tracking-widest uppercase">Gowrax Tactical Interface</span>
                        <span className="font-techMono text-[10px] text-gray-500 uppercase tracking-widest">© {new Date().getFullYear()} Gowrax eSport. Tous droits réservés.</span>
                    </div>
                    
                    <div className="flex flex-col items-center md:items-end text-center md:text-right gap-1.5">
                        <span className="font-techMono text-[10px] text-[#A2D2FF] uppercase tracking-widest bg-[#A2D2FF]/10 px-2.5 py-1 rounded border border-[#A2D2FF]/20">
                            Agent actif depuis le {new Date(session.user.created_at).toLocaleDateString('fr-FR')}
                        </span>
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                            <span className="font-techMono text-[9px] text-gray-500 uppercase tracking-wider">Version {appConfig.version} (Build {appConfig.build_code})</span>
                            <span className="text-gray-700 hidden sm:inline">|</span>
                            <a href="#" className="font-techMono text-[9px] text-gray-500 hover:text-white uppercase tracking-wider transition-colors">Politique de Confidentialité</a>
                        </div>
                    </div>
                </footer>

            </main>
        </div>

        {/* =========================================
            BOTTOM NAV MOBILE (FULL SCROLL HORIZONTAL)
            ========================================= */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full h-[80px] bg-[#1A1C2E]/90 backdrop-blur-3xl border-t border-white/10 z-50 flex items-center px-2 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.6)] overflow-x-auto custom-scrollbar flex-nowrap">
            
            {/* BOUTONS DE NAVIGATION MOBILE */}
            <MobileNavButton tab="calendar" active={activeTab} onClick={() => setActiveTab('calendar')} label="Events" colorClass="text-[#A2D2FF]" bgClass="bg-[#A2D2FF]/20 shadow-[0_0_10px_rgba(162,210,255,0.2)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'calendar' ? '2.5' : '2'} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </MobileNavButton>

            <MobileNavButton tab="availability" active={activeTab} onClick={() => setActiveTab('availability')} label="Dispos" colorClass="text-[#B185DB]" bgClass="bg-[#B185DB]/20 shadow-[0_0_10px_rgba(177,133,219,0.2)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'availability' ? '2.5' : '2'} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </MobileNavButton>

            <MobileNavButton tab="stratbook" active={activeTab} onClick={() => setActiveTab('stratbook')} label="Strats" colorClass="text-[#F7CAD0]" bgClass="bg-[#F7CAD0]/20 shadow-[0_0_10px_rgba(247,202,208,0.2)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'stratbook' ? '2.5' : '2'} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
            </MobileNavButton>

            <MobileNavButton tab="lineups" active={activeTab} onClick={() => setActiveTab('lineups')} label="Lineups" colorClass="text-teal-400" bgClass="bg-teal-500/20 shadow-[0_0_10px_rgba(20,184,166,0.2)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'lineups' ? '2.5' : '2'} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg>
            </MobileNavButton>

            <MobileNavButton tab="vods" active={activeTab} onClick={() => setActiveTab('vods')} label="VODs" colorClass="text-indigo-400" bgClass="bg-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'vods' ? '2.5' : '2'} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </MobileNavButton>

            <MobileNavButton tab="coaching" active={activeTab} onClick={() => setActiveTab('coaching')} label="Mentorat" colorClass="text-orange-400" bgClass="bg-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.2)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'coaching' ? '2.5' : '2'} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </MobileNavButton>

            <MobileNavButton tab="profil" active={activeTab} onClick={() => setActiveTab('profil')} label="Profil" colorClass="text-emerald-400" bgClass="bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'profil' ? '2.5' : '2'} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </MobileNavButton>

            {/* BOUTON SLOW BLOOM (MOBILE) */}
            <button 
                onClick={() => setActiveTab('evolution')}
                className={`flex flex-col items-center justify-center h-full min-w-[72px] transition-colors shrink-0 ${activeTab === 'evolution' ? 'text-[#F0F2F5]' : 'text-gray-500'}`}
            >
                <div className={`p-1.5 rounded-full ${activeTab === 'evolution' ? 'bg-gradient-to-r from-[#B185DB]/40 to-[#F7CAD0]/40 shadow-[0_0_15px_rgba(247,202,208,0.3)]' : ''}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <span className="text-[9px] font-techMono uppercase mt-1">Evo_AI</span>
            </button>

            {(isStaff || isCoach) && (
                <MobileNavButton tab="dossiers" active={activeTab} onClick={() => setActiveTab('dossiers')} label="Staff" colorClass="text-blue-400" bgClass="bg-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'dossiers' ? '2.5' : '2'} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </MobileNavButton>
            )}

            {(isStaff) && (
                <MobileNavButton tab="dev" active={activeTab} onClick={() => setActiveTab('dev')} label="Dev" colorClass="text-[#00FF41]" bgClass="bg-[#00FF41]/20 shadow-[0_0_10px_rgba(0,255,65,0.2)]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'dev' ? '2.5' : '2'} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                </MobileNavButton>
            )}

            <button 
                onClick={signOut}
                className="flex flex-col items-center justify-center h-full min-w-[72px] transition-colors text-gray-500 hover:text-red-400 shrink-0"
            >
                <div className="p-1.5 rounded-full">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                </div>
                <span className="text-[9px] font-techMono uppercase mt-1">Quitter</span>
            </button>
        </nav>
    </div>
  )
}

// Petit composant helper pour cleaner le code de la navbar mobile
function MobileNavButton({ tab, active, onClick, label, colorClass, bgClass, children }) {
  const isActive = active === tab;
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center h-full min-w-[72px] transition-colors shrink-0 ${isActive ? colorClass : 'text-gray-500 hover:text-gray-300'}`}>
        <div className={`p-1.5 rounded-full ${isActive ? bgClass : ''}`}>
          {children}
        </div>
        <span className="text-[9px] font-techMono uppercase mt-1">{label}</span>
    </button>
  );
}

function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

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

  if (currentPath.includes('/download') || window.location.search.includes('view=download')) {
    return (
      <>
        <Download />
      </>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0D0E15]">
        <div className="w-16 h-16 border-t-2 border-[#B185DB] rounded-full animate-spin"></div>
      </div>
    )
  }

  if (session) {
    return (
      <>
        <ScrollProgress />
        <SmartParticles />
        <Dashboard session={session} signOut={signOut} />
        
        {deferredPrompt && (
          <div className="fixed bottom-24 md:bottom-10 right-4 left-4 md:left-auto md:w-80 bg-[#1A1C2E]/90 backdrop-blur-2xl border border-[#B185DB]/30 p-5 rounded-3xl z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col gap-4 animate-bounce-short">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#B185DB]/20 to-transparent rounded-2xl flex items-center justify-center text-[#F7CAD0] font-bold shrink-0 border border-[#B185DB]/40 shadow-inner">GRX</div>
                <div>
                  <h3 className="font-rajdhani font-bold text-white text-lg leading-tight">Installer l'Application</h3>
                  <p className="text-[10px] text-gray-400 font-poppins mt-1 leading-relaxed">Ajoute GOWRAX Hub à ton écran d'accueil pour un accès ultra-rapide.</p>
                </div>
            </div>
            <div className="flex gap-3 w-full mt-1">
              <button onClick={() => setDeferredPrompt(null)} className="flex-1 py-2.5 text-xs font-techMono text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white rounded-xl transition-colors border border-white/10">Plus tard</button>
              <button onClick={handleInstallPWA} className="flex-1 py-2.5 text-xs font-techMono font-bold text-[#1A1C2E] bg-gradient-to-r from-[#B185DB] to-[#F7CAD0] hover:scale-105 rounded-xl transition-transform shadow-[0_0_15px_rgba(247,202,208,0.4)]">Installer</button>
            </div>
          </div>
        )}
      </>
    );
  }

  // ÉCRAN DE CONNEXION (Refonte Premium Vitrine)
  return (
    <div className="min-h-screen bg-[#0D0E15] text-white flex flex-col relative overflow-y-auto font-poppins selection:bg-[#B185DB] selection:text-white">
      <ScrollProgress />
      <ShootingStars />
      
      {/* Background Glowing Effects */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#6F2DBD]/10 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#F7CAD0]/5 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen animate-pulse-slow"></div>

      {/* Decorative Top Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#B185DB] to-transparent animate-pulse opacity-50"></div>

      {/* Navbar Minimaliste */}
      <nav className="w-full p-6 flex justify-between items-center max-w-7xl mx-auto z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#B185DB]/30 to-black border border-[#B185DB]/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(177,133,219,0.3)]">
            <span className="font-techMono font-bold text-sm text-[#F7CAD0]">GRX</span>
          </div>
          <span className="font-rajdhani font-bold text-2xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">GOWRAX</span>
        </div>
        <div className="font-techMono text-[10px] text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#B185DB] animate-pulse"></span>
          Restricted Access
        </div>
      </nav>

      {/* Main Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 mt-10 md:mt-16 z-10 max-w-5xl mx-auto text-center">
        <RevealOnScroll delay={100}>
          <div className="inline-block px-5 py-2 mb-6 rounded-full bg-[#B185DB]/10 border border-[#B185DB]/30 backdrop-blur-md shadow-[0_0_15px_rgba(177,133,219,0.2)]">
            <span className="font-techMono text-xs text-[#A2D2FF] uppercase tracking-widest">Opérations & Stratégie</span>
          </div>
        </RevealOnScroll>
        
        <RevealOnScroll delay={200}>
          <h1 className="font-rajdhani text-5xl md:text-8xl font-black tracking-tight mb-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            TACTICAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B185DB] to-[#F7CAD0]">INTERFACE</span>
          </h1>
        </RevealOnScroll>
        
        <RevealOnScroll delay={300}>
          <p className="font-poppins text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-16 leading-relaxed">
            Bienvenue sur le portail sécurisé de GOWRAX. Ce hub centralise les plannings, les présences, et les outils stratégiques exclusifs aux membres de la structure.
          </p>
        </RevealOnScroll>

        {/* Login Card */}
        <RevealOnScroll delay={400}>
          <div className="w-full max-w-md mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#B185DB] to-[#F7CAD0] rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-700"></div>
            <div className="backdrop-blur-3xl bg-[#1A1C2E]/80 border border-white/10 p-10 rounded-[2rem] w-full relative overflow-hidden flex flex-col justify-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-0 bg-gradient-to-b from-[#B185DB]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>            
              <p className="font-techMono text-xs text-gray-400 uppercase tracking-widest mb-8 text-center">
                // Authentification Requise
              </p>

              <button 
                onClick={signInWithDiscord}
                className="relative w-full flex items-center justify-center gap-4 px-6 py-5 bg-[#5865F2]/10 hover:bg-[#5865F2] border border-[#5865F2]/40 hover:border-[#5865F2] text-[#5865F2] hover:text-white font-bold font-rajdhani text-xl rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(88,101,242,0.2)] hover:shadow-[0_0_40px_rgba(88,101,242,0.6)] overflow-hidden"
              >
                <svg className="w-7 h-7 relative z-10" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                </svg>
                <span className="tracking-widest relative z-10">CONNEXION DISCORD</span>
              </button>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 relative z-10">
                <button
                  onClick={() => {
                    window.history.pushState({}, '', '/download');
                    setCurrentPath('/download');
                  }}
                  className="text-xs font-bold text-[#A2D2FF] hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  Guide d'Installation (App)
                </button>
                <p className="text-[10px] text-gray-500 mt-2 font-poppins text-center max-w-[250px]">
                  Accès strictement réservé aux membres validés sur le serveur Discord GOWRAX.
                </p>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>

      {/* Features Overview (Vitrine) */}
      <div className="w-full max-w-6xl mx-auto z-10 px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] hover:border-[#B185DB]/50 transition-all duration-500 group shadow-lg">
            <div className="w-14 h-14 bg-[#B185DB]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-[#B185DB]/20 shadow-[0_0_15px_rgba(177,133,219,0.2)]">
              <svg className="w-7 h-7 text-[#B185DB]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <h3 className="font-rajdhani text-2xl font-bold text-white mb-3">Calendrier Actif</h3>
            <p className="font-poppins text-sm text-gray-400 leading-relaxed">
              Consultez tous les praccs, matchs officiels et tournois à venir. Maintenez-vous à jour avec le planning de votre escouade.
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] hover:border-[#F7CAD0]/50 transition-all duration-500 group shadow-lg">
            <div className="w-14 h-14 bg-[#F7CAD0]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-[#F7CAD0]/20 shadow-[0_0_15px_rgba(247,202,208,0.2)]">
              <svg className="w-7 h-7 text-[#F7CAD0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 className="font-rajdhani text-2xl font-bold text-white mb-3">Heatmap & Absences</h3>
            <p className="font-poppins text-sm text-gray-400 leading-relaxed">
              Grille de disponibilité hyper-précise (intervalles de 30 mins) complétée par un workflow complet pour justifier vos absences.
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] hover:border-[#A2D2FF]/50 transition-all duration-500 group shadow-lg">
            <div className="w-14 h-14 bg-[#A2D2FF]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-[#A2D2FF]/20 shadow-[0_0_15px_rgba(162,210,255,0.2)]">
              <svg className="w-7 h-7 text-[#A2D2FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
            </div>
            <h3 className="font-rajdhani text-2xl font-bold text-white mb-3">Gowrax Strat-Book</h3>
            <p className="font-poppins text-sm text-gray-400 leading-relaxed">
              L'armoirie tactique de l'équipe : upload et lecture de Setups et retakes avec filtrage par Map et Side.
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer Minimal pour le login */}
      <footer className="w-full text-center p-8 border-t border-white/5 bg-[#0D0E15]/80 z-10 backdrop-blur-xl mt-auto">
        <p className="font-techMono text-xs text-gray-600 tracking-widest uppercase">
          © {new Date().getFullYear()} GOWRAX ESPORT. ALL SYSTEMS NOMINAL.
        </p>
      </footer>
    </div>
  )
}

export default App