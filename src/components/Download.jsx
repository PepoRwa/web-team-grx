import React from 'react';
import { FaApple, FaAndroid, FaWindows, FaDesktop, FaShieldAlt, FaUserLock, FaEyeSlash, FaSyncAlt } from "react-icons/fa";
import ShootingStars from './ShootingStars'; // Qui est maintenant notre douce poussière d'étoiles (FloatingDust)

export default function Download() {
  return (
    <div className="min-h-screen bg-[#0D0E15] text-[#F0F2F5] flex flex-col relative overflow-y-auto font-poppins selection:bg-[#B185DB] selection:text-white">
      <ShootingStars />
      
      {/* LUEURS D'ARRIÈRE-PLAN (Slow Bloom Premium) */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#6F2DBD]/10 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen animate-pulse-slow"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#A2D2FF]/5 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen"></div>
      
      {/* Decorative Top Line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#B185DB] to-transparent animate-pulse opacity-50"></div>

      {/* Navbar Minimaliste */}
      <nav className="w-full p-6 md:px-10 flex justify-between items-center max-w-[1400px] mx-auto z-10 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#B185DB]/30 to-[#1A1C2E] border border-[#B185DB]/40 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(177,133,219,0.2)]">
            <span className="font-techMono font-bold text-sm text-[#F7CAD0]">GRX</span>
          </div>
          <span className="font-rajdhani font-bold text-2xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 hidden sm:block">GOWRAX</span>
        </div>
        <button 
            onClick={() => window.location.href = '/'}
            className="font-techMono text-xs text-[#A2D2FF] hover:text-[#1A1C2E] hover:bg-[#A2D2FF] px-5 py-2.5 rounded-xl border border-[#A2D2FF]/40 transition-all duration-300 uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(162,210,255,0.1)] hover:shadow-[0_0_20px_rgba(162,210,255,0.4)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Retour au Hub
        </button>
      </nav>

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8 flex flex-col gap-24 z-10 pb-24 animate-fade-in">
        
        {/* ================= HEADER HERO ================= */}
        <section className="text-center mt-8 md:mt-12 relative">
            <div className="inline-block px-5 py-2 mb-8 rounded-full bg-[#A2D2FF]/10 border border-[#A2D2FF]/30 backdrop-blur-md shadow-[0_0_20px_rgba(162,210,255,0.15)]">
                <span className="font-techMono text-xs text-[#A2D2FF] uppercase tracking-[0.2em]">Protocoles de Déploiement</span>
            </div>
            
            <h1 className="font-rajdhani text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 drop-shadow-xl">
              INSTALLATION DU <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B185DB] to-[#F7CAD0]">HUB</span>
            </h1>
            
            <p className="font-poppins text-gray-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Le GOWRAX Hub est une application de nouvelle génération (PWA). Conçue pour contourner les stores traditionnels, elle s'installe silencieusement depuis votre navigateur pour offrir une expérience native, fluide et ultra-sécurisée.
            </p>
        </section>

        {/* ================= INSTALLATION GUIDES ================= */}
        <section className="flex flex-col gap-10">
            <div className="flex items-center gap-6">
                <div className="w-12 h-px bg-gradient-to-r from-transparent to-white/30 hidden md:block"></div>
                <h2 className="font-rajdhani text-3xl md:text-4xl font-bold text-white uppercase tracking-widest drop-shadow-md">
                  1. <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">Installation Native</span>
                </h2>
                <div className="h-px bg-gradient-to-r from-white/30 to-transparent flex-1"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* iOS / iPhone (Verre dépoli Premium) */}
                <div className="bg-[#1A1C2E]/60 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-[2rem] flex flex-col gap-6 hover:border-[#A2D2FF]/40 hover:shadow-[0_20px_50px_rgba(162,210,255,0.1)] transition-all duration-500 relative overflow-hidden group">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#A2D2FF]/10 rounded-full blur-[50px] group-hover:bg-[#A2D2FF]/20 transition-colors duration-700 pointer-events-none"></div>
                    
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#1A1C2E] to-black rounded-2xl border border-white/20 flex items-center justify-center text-white shadow-[0_0_20px_rgba(162,210,255,0.2)]">
                            <FaApple className="w-8 h-8 text-[#A2D2FF]" />
                        </div>
                        <div>
                            <h3 className="font-rajdhani text-2xl md:text-3xl font-bold text-white tracking-wide">iOS (iPhone/iPad)</h3>
                            <p className="text-[10px] font-techMono text-[#A2D2FF] uppercase tracking-[0.2em] bg-[#A2D2FF]/10 border border-[#A2D2FF]/20 px-3 py-1 rounded-md inline-block mt-2">Requis : Safari</p>
                        </div>
                    </div>
                    
                    <div className="space-y-5 mt-4 relative z-10">
                        {[
                          { step: 1, text: "Ouvrez ce portail depuis le navigateur natif Safari." },
                          { step: 2, text: "Appuyez sur l'icône Partager en bas (le carré avec une flèche)." },
                          { step: 3, text: "Faites défiler et sélectionnez \"Sur l'écran d'accueil\"." },
                          { step: 4, text: "Validez en appuyant sur \"Ajouter\" en haut à droite." }
                        ].map((item, i) => (
                          <div key={i} className="flex gap-4 items-start bg-white/[0.02] p-3 rounded-xl border border-white/5">
                              <div className="w-6 h-6 rounded-full bg-[#A2D2FF]/20 text-[#A2D2FF] font-techMono text-xs flex items-center justify-center flex-shrink-0 border border-[#A2D2FF]/40 shadow-inner">{item.step}</div>
                              <p className="text-sm font-poppins text-gray-300 leading-relaxed">{item.text}</p>
                          </div>
                        ))}
                    </div>
                </div>

                {/* Android / Chrome */}
                <div className="bg-[#1A1C2E]/60 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-[2rem] flex flex-col gap-6 hover:border-emerald-400/40 hover:shadow-[0_20px_50px_rgba(52,211,153,0.1)] transition-all duration-500 relative overflow-hidden group">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[50px] group-hover:bg-emerald-500/20 transition-colors duration-700 pointer-events-none"></div>
                    
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#1A1C2E] to-black rounded-2xl border border-white/20 flex items-center justify-center text-white shadow-[0_0_20px_rgba(52,211,153,0.2)]">
                            <FaAndroid className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="font-rajdhani text-2xl md:text-3xl font-bold text-white tracking-wide">Android</h3>
                            <p className="text-[10px] font-techMono text-emerald-400 uppercase tracking-[0.2em] bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-md inline-block mt-2">Requis : Chrome / Brave</p>
                        </div>
                    </div>
                    
                    <div className="space-y-5 mt-4 relative z-10">
                        {[
                          { step: 1, text: "Ouvrez le portail depuis Google Chrome." },
                          { step: 2, text: "Une bannière intelligente apparaîtra en bas de l'écran." },
                          { step: 3, text: "Appuyez simplement sur \"Installer l'Application\"." },
                          { step: 4, text: "Si masquée : Menu (3 points) > \"Ajouter à l'écran d'accueil\"." }
                        ].map((item, i) => (
                          <div key={i} className="flex gap-4 items-start bg-white/[0.02] p-3 rounded-xl border border-white/5">
                              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-techMono text-xs flex items-center justify-center flex-shrink-0 border border-emerald-500/40 shadow-inner">{item.step}</div>
                              <p className="text-sm font-poppins text-gray-300 leading-relaxed">{item.text}</p>
                          </div>
                        ))}
                    </div>
                </div>

                {/* PC / MacOS (Large Card) */}
                <div className="bg-[#1A1C2E]/60 backdrop-blur-2xl border border-white/10 p-8 md:p-12 rounded-[2rem] flex flex-col gap-6 hover:border-[#B185DB]/40 hover:shadow-[0_20px_50px_rgba(177,133,219,0.15)] transition-all duration-500 relative overflow-hidden group lg:col-span-2">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-[#B185DB]/5 to-transparent blur-[80px] pointer-events-none -z-10"></div>
                    
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#1A1C2E] to-black rounded-2xl border border-white/20 flex items-center justify-center text-white gap-2 shadow-[0_0_20px_rgba(177,133,219,0.2)]">
                                <FaWindows className="w-6 h-6 text-[#A2D2FF]" />
                                <FaApple className="w-6 h-6 text-gray-300" />
                            </div>
                            <div>
                                <h3 className="font-rajdhani text-2xl md:text-3xl font-bold text-white tracking-wide">Bureau (Windows / macOS)</h3>
                                <p className="text-[10px] font-techMono text-[#B185DB] uppercase tracking-[0.2em] bg-[#B185DB]/10 border border-[#B185DB]/20 px-3 py-1 rounded-md inline-block mt-2">Chromium Based</p>
                            </div>
                        </div>

                        {/* Visuel interactif pour Desktop */}
                        <div className="bg-black/60 border border-white/10 rounded-2xl p-4 flex items-center justify-center w-full md:w-auto shadow-inner">
                            <div className="bg-gray-100 px-4 py-2.5 rounded-xl flex items-center gap-4 w-full md:w-80 border border-gray-300 shadow-[0_5px_15px_rgba(0,0,0,0.3)]">
                                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                                <span className="text-gray-800 text-sm flex-1 font-techMono tracking-wide">team.gowrax.me</span>
                                <div className="bg-white hover:bg-gray-50 border border-gray-200 cursor-pointer p-1.5 rounded-lg transition-colors relative group/tooltip shadow-sm">
                                    <svg className="w-5 h-5 text-[#B185DB]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    <div className="absolute top-12 right-0 bg-[#1A1C2E] text-white border border-[#B185DB]/50 text-[10px] px-3 py-2 rounded-lg w-40 hidden group-hover/tooltip:block z-50 shadow-2xl tracking-widest font-techMono uppercase text-center">Cliquez ici pour installer</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 relative z-10">
                        {[
                            { step: 1, text: "Ouvrez le portail via Chrome, Edge ou Brave." },
                            { step: 2, text: "Regardez à l'extrémité droite de votre barre d'URL." },
                            { step: 3, text: "Cliquez sur l'icône d'installation (L'écran avec la flèche)." },
                            { step: 4, text: "Le hub s'ouvrira comme un logiciel natif indépendant." }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 items-start bg-white/[0.02] p-4 rounded-xl border border-white/5">
                                <div className="w-6 h-6 rounded-full bg-[#B185DB]/20 text-[#B185DB] font-techMono text-xs flex items-center justify-center flex-shrink-0 border border-[#B185DB]/40 shadow-inner">{item.step}</div>
                                <p className="text-sm font-poppins text-gray-300 leading-relaxed">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>

        {/* ================= CAPACITÉS DU SYSTÈME ================= */}
        <section className="flex flex-col gap-10 pt-10">
            <div className="flex items-center gap-6">
                <div className="w-12 h-px bg-gradient-to-r from-transparent to-white/30 hidden md:block"></div>
                <h2 className="font-rajdhani text-3xl md:text-4xl font-bold text-white uppercase tracking-widest drop-shadow-md">
                  2. <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">Capacités du Système</span>
                </h2>
                <div className="h-px bg-gradient-to-r from-white/30 to-transparent flex-1"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* RECRUE / JOUEUR */}
                <div className="bg-[#1A1C2E]/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-8 md:p-10 flex flex-col gap-6 shadow-xl">
                    <div className="flex items-center gap-4 mb-2">
                        <span className="font-techMono text-[10px] px-3 py-1 bg-[#A2D2FF]/10 text-[#A2D2FF] border border-[#A2D2FF]/30 rounded-md tracking-[0.2em] shadow-inner">LEVEL 1</span>
                        <h3 className="font-rajdhani text-3xl font-bold text-white tracking-wider">Agents Opérationnels</h3>
                    </div>
                    
                    <ul className="space-y-5">
                        <li className="bg-black/20 p-5 rounded-2xl border border-white/5 border-l-4 border-l-[#A2D2FF] hover:bg-white/[0.03] transition-colors shadow-inner">
                            <h4 className="font-rajdhani font-bold text-white text-xl flex items-center gap-3 mb-2">
                                <svg className="w-5 h-5 text-[#A2D2FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                Synchronisation Calendaire
                            </h4>
                            <p className="text-sm text-gray-400 font-poppins leading-relaxed">Consultez les tournois, praccs et VOD reviews. Signifiez votre présence ou justifiez une absence en un clic pour maintenir le radar à jour.</p>
                        </li>
                        <li className="bg-black/20 p-5 rounded-2xl border border-white/5 border-l-4 border-l-[#F7CAD0] hover:bg-white/[0.03] transition-colors shadow-inner">
                            <h4 className="font-rajdhani font-bold text-white text-xl flex items-center gap-3 mb-2">
                                <svg className="w-5 h-5 text-[#F7CAD0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                Mentorat Personnalisé
                            </h4>
                            <p className="text-sm text-gray-400 font-poppins leading-relaxed">Le Staff cible vos faiblesses. Recevez des objectifs tactiques précis (ex: Crosshair placement, Comms) à valider lors de vos déploiements.</p>
                        </li>
                        <li className="bg-black/20 p-5 rounded-2xl border border-white/5 border-l-4 border-l-[#B185DB] hover:bg-white/[0.03] transition-colors shadow-inner">
                            <h4 className="font-rajdhani font-bold text-white text-xl flex items-center gap-3 mb-2">
                                <svg className="w-5 h-5 text-[#B185DB]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                                L'Armoirie (Strat-book)
                            </h4>
                            <p className="text-sm text-gray-400 font-poppins leading-relaxed">Base de données visuelle du GOWRAX. Accédez aux setups défensifs et offensifs classifiés par carte et par agent.</p>
                        </li>
                    </ul>
                </div>

                {/* STAFF / COACH */}
                <div className="bg-[#1A1C2E]/40 backdrop-blur-md border border-[#F7CAD0]/10 rounded-[2rem] p-8 md:p-10 flex flex-col gap-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#F7CAD0]/5 rounded-bl-full pointer-events-none transition-colors group-hover:bg-[#F7CAD0]/10"></div>
                    
                    <div className="flex items-center gap-4 mb-2 relative z-10">
                        <span className="font-techMono text-[10px] px-3 py-1 bg-[#F7CAD0]/10 text-[#F7CAD0] border border-[#F7CAD0]/30 rounded-md tracking-[0.2em] shadow-[0_0_10px_rgba(247,202,208,0.2)] animate-pulse-slow">OVERSIGHT</span>
                        <h3 className="font-rajdhani text-3xl font-bold text-white tracking-wider">Commandement</h3>
                    </div>
                    
                    <ul className="space-y-5 relative z-10">
                        <li className="bg-red-500/5 p-5 rounded-2xl border border-red-500/20 border-l-4 border-l-red-400 hover:bg-red-500/10 transition-colors backdrop-blur-sm">
                            <h4 className="font-rajdhani font-bold text-red-100 text-xl flex items-center gap-3 mb-2">
                                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                Dossiers Classifiés
                            </h4>
                            <p className="text-sm text-red-200/60 font-poppins leading-relaxed">Supervision totale. Rédigez des rapports confidentiels sur les agents. Historique détaillé, gestion des rôles et validation des congés administratifs.</p>
                        </li>
                        <li className="bg-blue-500/5 p-5 rounded-2xl border border-blue-500/20 border-l-4 border-l-blue-400 hover:bg-blue-500/10 transition-colors backdrop-blur-sm">
                            <h4 className="font-rajdhani font-bold text-blue-100 text-xl flex items-center gap-3 mb-2">
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Cartographie Tactique (Heatmaps)
                            </h4>
                            <p className="text-sm text-blue-200/60 font-poppins leading-relaxed">Moteur d'agrégation calculant les pics de disponibilité (Points Chauds). Forgez des rosters optimaux en croisant les plannings de la semaine.</p>
                        </li>
                        <li className="bg-orange-500/5 p-5 rounded-2xl border border-orange-500/20 border-l-4 border-l-orange-400 hover:bg-orange-500/10 transition-colors backdrop-blur-sm">
                            <h4 className="font-rajdhani font-bold text-orange-100 text-xl flex items-center gap-3 mb-2">
                                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                Injection de Directives
                            </h4>
                            <p className="text-sm text-orange-200/60 font-poppins leading-relaxed">Ciblez un membre et "pushez" lui des objectifs à la volée. Approuvez ou refusez l'évolution selon l'analyse post-match ou les VODs.</p>
                        </li>
                    </ul>
                </div>
            </div>
        </section>

        {/* ================= SECURITY & PRIVACY ================= */}
        <section className="flex flex-col gap-10 pt-10">
            <div className="flex items-center gap-6">
                <div className="w-12 h-px bg-gradient-to-r from-transparent to-white/30 hidden md:block"></div>
                <h2 className="font-rajdhani text-3xl md:text-4xl font-bold text-white uppercase tracking-widest drop-shadow-md">
                  3. <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">Infrastructure Sécurisée</span>
                </h2>
                <div className="h-px bg-gradient-to-r from-white/30 to-transparent flex-1"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Authorization & Discord */}
                <div className="bg-[#1A1C2E]/60 backdrop-blur-2xl border border-white/10 p-8 rounded-[1.5rem] flex flex-col gap-4 relative overflow-hidden group hover:border-[#5865F2]/40 transition-colors shadow-lg">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#5865F2]/10 rounded-full blur-[40px] group-hover:bg-[#5865F2]/20 transition-colors duration-500"></div>
                    <div className="w-14 h-14 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/30 flex items-center justify-center shadow-inner mb-2">
                        <FaUserLock className="w-7 h-7 text-[#5865F2]" />
                    </div>
                    <h3 className="font-rajdhani text-2xl font-bold text-white tracking-wide">Protocole OAuth2 Discord</h3>
                    <p className="text-sm text-gray-400 font-poppins leading-relaxed">
                        L'application demande un accès en lecture seule à votre ID, pseudo et avatar. 
                        <strong className="text-gray-200"> Absolument aucune</strong> permission d'écriture n'est requise. Géré par l'infrastructure cloud sécurisée Supabase.
                    </p>
                </div>

                {/* Privacy & Tracking */}
                <div className="bg-[#1A1C2E]/60 backdrop-blur-2xl border border-white/10 p-8 rounded-[1.5rem] flex flex-col gap-4 relative overflow-hidden group hover:border-[#F7CAD0]/40 transition-colors shadow-lg">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#F7CAD0]/10 rounded-full blur-[40px] group-hover:bg-[#F7CAD0]/20 transition-colors duration-500"></div>
                    <div className="w-14 h-14 rounded-2xl bg-[#F7CAD0]/10 border border-[#F7CAD0]/30 flex items-center justify-center shadow-inner mb-2">
                        <FaEyeSlash className="w-7 h-7 text-[#F7CAD0]" />
                    </div>
                    <h3 className="font-rajdhani text-2xl font-bold text-white tracking-wide">Zéro Pistage</h3>
                    <p className="text-sm text-gray-400 font-poppins leading-relaxed">
                        Cette interface n'abrite <strong className="text-gray-200">aucun traceur publicitaire</strong> (zéro Analytics ou Pixels). Vos données de navigation restent invisibles et strictement confinées à l'écosystème GOWRAX.
                    </p>
                </div>

                {/* Local Storage & PWA */}
                <div className="bg-[#1A1C2E]/60 backdrop-blur-2xl border border-white/10 p-8 rounded-[1.5rem] flex flex-col gap-4 relative overflow-hidden group hover:border-[#B185DB]/40 transition-colors shadow-lg">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#B185DB]/10 rounded-full blur-[40px] group-hover:bg-[#B185DB]/20 transition-colors duration-500"></div>
                    <div className="flex justify-between items-start mb-2">
                        <div className="w-14 h-14 rounded-2xl bg-[#B185DB]/10 border border-[#B185DB]/30 flex items-center justify-center shadow-inner">
                            <FaShieldAlt className="w-7 h-7 text-[#B185DB]" />
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-1 rounded">
                            <FaSyncAlt className="w-3 h-3 text-gray-400 animate-spin-slow" />
                            <span className="text-[9px] font-techMono text-gray-400 uppercase tracking-widest">Auto-Update</span>
                        </div>
                    </div>
                    <h3 className="font-rajdhani text-2xl font-bold text-white tracking-wide">PWA & Sanctuaire Local</h3>
                    <p className="text-sm text-gray-400 font-poppins leading-relaxed">
                        L'application se met à jour silencieusement en arrière-plan. Vos tokens d'accès vivent cryptés dans le LocalStorage de l'appareil et s'autodétruisent à la déconnexion.
                    </p>
                </div>

            </div>
        </section>

      </main>
      
      <footer className="w-full text-center p-8 border-t border-white/5 bg-[#0D0E15]/80 z-10 backdrop-blur-xl mt-auto">
        <p className="font-techMono text-xs text-gray-600 tracking-widest uppercase">
          © 2026 GOWRAX ESPORT. PROTOCOLES DE DÉPLOIEMENT.
        </p>
      </footer>
    </div>
  );
}