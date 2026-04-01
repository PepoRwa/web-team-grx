import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import { usePermissions } from './hooks/usePermissions'
import Calendar from './components/Calendar'
import Dossiers from './components/Dossiers' // NOUVEAU IMPORT
import Availability from './components/Availability' // PHASE 4

function Dashboard({ session, signOut }) {
  const { roles, loading: rolesLoading, isStaff, isCoach } = usePermissions(session);
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar', 'dossiers' ou 'availability'

  // NOUVEAU: Système de Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    fetchNotifications();

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
        setNotifications(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${session.user.id},user_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setNotifications(data);
  };

  const markAsRead = async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gowrax-abyss text-white flex flex-col p-4 md:p-8 relative overflow-y-auto font-poppins selection:bg-gowrax-neon selection:text-white">
        {/* LUEURS D'ARRIÈRE-PLAN DYNAMIQUES (GLASSMORPHISM) */}
        <div className="fixed top-0 left-1/4 w-[30rem] h-[30rem] bg-gowrax-purple/20 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen"></div>
        <div className="fixed bottom-0 right-1/4 w-[40rem] h-[40rem] bg-gowrax-neon/10 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen"></div>
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.03] to-transparent pointer-events-none -z-10"></div>
        
        {/* HEADER FLOTTANT GLASSMORPHISM */}
        <header className="sticky top-4 z-50 w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between bg-white/[0.03] border border-white/10 p-5 rounded-2xl backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] mb-8 transition-all hover:bg-white/[0.05]">
            <div className="flex items-center gap-5 mb-4 md:mb-0">
                {session.user.user_metadata.avatar_url ? (
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-gowrax-purple to-gowrax-neon rounded-full blur opacity-70 group-hover:opacity-100 transition duration-500"></div>
                    <img 
                      src={session.user.user_metadata.avatar_url} 
                      alt="Avatar" 
                      className="relative w-16 h-16 rounded-full border-2 border-transparent object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gowrax-void to-black border-2 border-gowrax-purple flex items-center justify-center shadow-[0_0_15px_rgba(111,45,189,0.5)]">
                      <span className="font-rajdhani text-gowrax-purple font-bold text-xl drop-shadow-md">GRX</span>
                  </div>
                )}
                <div>
                  <h1 className="font-rajdhani text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-wider">
                      {session.user.user_metadata.full_name || session.user.email}
                  </h1>
                  <div className="flex items-center gap-2 font-techMono text-[10px] text-gray-400 uppercase mt-1 bg-black/40 px-2 py-1 rounded-full w-fit border border-white/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,1)]"></span>
                      Réseau Gowrax Sécurisé
                  </div>
                </div>
            </div>

            <div className="flex flex-col items-center md:items-end gap-3">
                <div className="flex items-center justify-end gap-3 w-full">
                    {/* CLOCHE DE NOTIFICATIONS */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowNotifs(!showNotifs)}
                            className="relative flex items-center justify-center p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
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
                            <div className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto bg-black/90 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 p-2">
                                <div className="p-2 border-b border-white/5 flex justify-between items-center mb-2">
                                  <span className="font-rajdhani text-sm font-bold text-gray-300 uppercase tracking-widest">ALERTS</span>
                                  {unreadCount > 0 && <span className="text-[10px] text-gowrax-neon font-techMono">{unreadCount} NEW</span>}
                                </div>
                                {notifications.length === 0 ? (
                                    <p className="text-gray-500 text-xs text-center py-4 font-poppins italic">Aucune alerte récente.</p>
                                ) : (
                                    <div className="flex flex-col gap-1.5">
                                        {notifications.map(n => (
                                            <div 
                                              key={n.id} 
                                              onClick={() => markAsRead(n.id)}
                                              className={`p-3 rounded-lg text-left text-sm transition-colors cursor-pointer border ${n.is_read ? 'bg-white/5 border-transparent opacity-60' : 'bg-gowrax-purple/10 border-gowrax-purple/30 hover:border-gowrax-purple'}`}
                                            >
                                                <h4 className={`font-rajdhani font-bold flex items-center justify-between ${n.is_read ? 'text-gray-400' : 'text-white'}`}>
                                                  {n.title}
                                                  {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-gowrax-neon"></span>}
                                                </h4>
                                                <p className="text-xs text-gray-400 mt-1 font-poppins">{n.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* RÔLES AVEC UN STYLE BADGE PREMIUM */}
                    <div className="flex flex-wrap gap-2 text-[10px] font-techMono font-bold tracking-widest">
                        {rolesLoading ? (
                            <span className="text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/10 animate-pulse">SCANNING...</span>
                        ) : roles.length > 0 ? (
                            roles.map((role) => (
                                <span key={role} className="px-3 py-1 bg-gradient-to-r from-gowrax-purple/20 to-gowrax-neon/20 text-white rounded-full border border-white/10 shadow-[0_2px_10px_rgba(111,45,189,0.3)] backdrop-blur-sm">
                                    {role}
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">OPÉRATEUR</span>
                        )}
                    </div>
                </div>
                
                <button 
                  onClick={signOut}
                  className="group flex gap-2 items-center px-4 py-1.5 text-[10px] text-red-400 hover:text-red-300 rounded-full font-techMono uppercase tracking-widest transition-all bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40"
                >
                  <svg className="w-3 h-3 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                  Déconnexion
                </button>
            </div>
        </header>

        {/* NAVIGATION BAR TABS (STYLE PILLULES) */}
        <nav className="w-full max-w-fit mx-auto flex flex-wrap justify-center p-1.5 mb-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <button 
                onClick={() => setActiveTab('calendar')}
                className={`relative px-5 md:px-8 py-2.5 font-rajdhani text-sm md:text-lg font-bold rounded-full transition-all duration-300 ${activeTab === 'calendar' ? 'text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
                {activeTab === 'calendar' && <div className="absolute inset-0 bg-gradient-to-r from-gowrax-purple to-gowrax-neon rounded-full -z-10"></div>}
                CALENDRIER
            </button>

            <button 
                onClick={() => setActiveTab('availability')}
                className={`relative px-5 md:px-8 py-2.5 font-rajdhani text-sm md:text-lg font-bold rounded-full transition-all duration-300 ${activeTab === 'availability' ? 'text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
                {activeTab === 'availability' && <div className="absolute inset-0 bg-gradient-to-r from-gowrax-purple to-gowrax-neon rounded-full -z-10"></div>}
                DISPONIBILITÉS
            </button>

            {(isStaff || isCoach) && (
                <button 
                    onClick={() => setActiveTab('dossiers')}
                    className={`relative px-5 md:px-8 py-2.5 font-rajdhani text-sm md:text-lg font-bold rounded-full transition-all duration-300 ${activeTab === 'dossiers' ? 'text-white shadow-[0_0_15px_rgba(59,130,246,0.6)]' : 'text-gray-400 hover:text-blue-300 hover:bg-white/5'}`}
                >
                    {activeTab === 'dossiers' && <div className="absolute inset-0 bg-blue-600 rounded-full -z-10 opacity-80 border border-blue-400"></div>}
                    DOSSIERS
                </button>
            )}
        </nav>

        {/* MAIN CONTENT AREA */}
        <main className="w-full max-w-6xl mx-auto flex-1 flex flex-col gap-8 pb-10">
            {activeTab === 'calendar' && (
                <>
                    {/* Le Composant Calendrier connecté à la BDD */}
                     <Calendar session={session} />
                     
                    {/* PANNEAUX ADMINISTRATEUR / COACH SÉCURISÉS (Accès rapides) */}
                    {(isStaff || isCoach) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-red-900/10 border border-red-500/30 p-6 rounded-lg flex flex-col items-center text-center hover:border-red-500 transition-colors shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                              <h3 className="font-rajdhani text-2xl text-red-500 font-bold mb-2">STAFF OVERSIGHT</h3>
                              <p className="font-poppins text-gray-400 text-sm mb-4">Gérer les accès globaux et lire les rapports d'équipe classifiés.</p>
                              <button 
                                onClick={() => setActiveTab('dossiers')} 
                                className="px-6 py-2 bg-red-500/20 font-rajdhani text-red-400 font-bold border border-red-500 rounded hover:bg-red-500 hover:text-white transition-colors uppercase w-full"
                              >
                                Accéder aux Dossiers
                              </button>
                          </div>

                          <div className="bg-blue-900/10 border border-blue-500/30 p-6 rounded-lg flex flex-col items-center text-center hover:border-blue-500 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                              <h3 className="font-rajdhani text-2xl text-blue-500 font-bold mb-2">TACTICAL DASHBOARD</h3>
                              <p className="font-poppins text-gray-400 text-sm mb-4">Analyse des présences (Heatmaps) et stratégies globales.</p>
                              <button 
                                onClick={() => setActiveTab('availability')} 
                                className="px-6 py-2 bg-blue-500/20 font-rajdhani text-blue-400 font-bold border border-blue-500 rounded hover:bg-blue-500 hover:text-white transition-colors uppercase w-full"
                              >
                                Voir les Heatmaps
                              </button>
                          </div>
                      </div>
                    )}
                </>
            )}

            {activeTab === 'availability' && (
                <Availability session={session} isStaff={isStaff} isCoach={isCoach} />
            )}

            {activeTab === 'dossiers' && (isStaff || isCoach) && (
                <Dossiers isStaff={isStaff} isCoach={isCoach} />
            )}
        </main>
      </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

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

    return () => subscription.unsubscribe()
  }, [])

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
    return <Dashboard session={session} signOut={signOut} />
  }

  return (
    <div className="min-h-screen bg-gowrax-abyss text-white flex flex-col relative overflow-y-auto font-poppins selection:bg-gowrax-neon selection:text-white">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-2xl hover:bg-white/[0.04] hover:border-gowrax-purple/50 transition-all duration-500 group">
            <div className="w-12 h-12 bg-gowrax-purple/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-gowrax-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <h3 className="font-rajdhani text-2xl font-bold text-white mb-3">Calendrier Officiel</h3>
            <p className="font-poppins text-sm text-gray-400 leading-relaxed">
              Consultez les matchs, les entraînements et les tournois. Confirmez votre présence en un clic et restez synchronisé avec votre roster.
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-2xl hover:bg-white/[0.04] hover:border-gowrax-neon/50 transition-all duration-500 group relative overflow-hidden">
            <div className="w-12 h-12 bg-gowrax-neon/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-gowrax-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
            <h3 className="font-rajdhani text-2xl font-bold text-white mb-3">Heatmap des Dispos</h3>
            <p className="font-poppins text-sm text-gray-400 leading-relaxed">
              Renseignez vos jours de disponibilité. Le système génère automatiquement une carte de chaleur pour trouver les meilleurs créneaux communs.
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-2xl hover:bg-white/[0.04] hover:border-blue-500/50 transition-all duration-500 group">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <h3 className="font-rajdhani text-2xl font-bold text-white mb-3">Outils Staff</h3>
            <p className="font-poppins text-sm text-gray-400 leading-relaxed">
              (Coachs & Admin) Accédez aux statistiques de ponctualité, forcez les appels (Roll-Call), et lisez les dossiers confidentiels des joueurs.
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