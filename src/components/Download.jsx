import React from 'react';
import { FaApple, FaAndroid, FaWindows, FaDesktop, FaShieldAlt, FaUserLock, FaEyeSlash } from "react-icons/fa";
import ShootingStars from './ShootingStars';

export default function Download() {
  return (
    <div className="min-h-screen bg-gowrax-abyss text-white flex flex-col relative overflow-y-auto font-poppins selection:bg-gowrax-neon selection:text-white">
      <ShootingStars />
      
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
        <button 
            onClick={() => window.location.href = '/'}
            className="font-techMono text-xs text-gowrax-neon hover:text-white hover:bg-gowrax-neon/20 px-4 py-2 rounded-xl border border-gowrax-neon/50 transition-all uppercase tracking-widest flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Retour au Hub
        </button>
      </nav>

      <main className="flex-1 w-full max-w-5xl mx-auto p-6 flex flex-col gap-16 z-10 pb-20">
        
        {/* HEADER */}
        <section className="text-center mt-10">
            <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-blue-500/10 border border-blue-500/30 backdrop-blur-md">
                <span className="font-techMono text-xs text-blue-400 uppercase tracking-widest">Protocoles de Déploiement</span>
            </div>
            <h1 className="font-rajdhani text-5xl md:text-7xl font-extrabold tracking-tight mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              INSTALLATION DU <span className="text-transparent bg-clip-text bg-gradient-to-r from-gowrax-purple to-gowrax-neon">GOWRAX HUB</span>
            </h1>
            <p className="font-poppins text-gray-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              L'application GOWRAX est une Progressive Web App (PWA). Elle ne se télécharge pas sur l'App Store ou le Google Play Store, mais s'installe directement depuis votre navigateur pour une expérience native, rapide et sécurisée.
            </p>
        </section>

        {/* INSTALLATION GUIDES */}
        <section className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
                <h2 className="font-rajdhani text-3xl font-bold text-white uppercase tracking-widest">1. Guide d'Installation</h2>
                <div className="h-px bg-white/20 flex-1"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* iOS / iPhone */}
                <div className="bg-white/[0.02] border border-white/10 p-8 rounded-2xl flex flex-col gap-4 hover:bg-white/[0.04] transition-colors relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-500"></div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                            <FaApple className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="font-rajdhani text-2xl font-bold text-white">iPhone & iPad (iOS)</h3>
                            <p className="text-[10px] font-techMono text-blue-400 uppercase tracking-widest bg-blue-900/30 px-2 py-0.5 rounded inline-block mt-1">Obligatoire : Safari</p>
                        </div>
                    </div>
                    <div className="space-y-4 mt-2">
                        <div className="flex gap-3 items-start">
                            <div className="w-6 h-6 rounded bg-gowrax-purple/20 text-white font-techMono text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-gowrax-purple/50">1</div>
                            <p className="text-sm font-poppins text-gray-300">Ouvrez l'application depuis le navigateur <b className="text-white">Safari</b> uniquement.</p>
                        </div>
                        <div className="flex gap-3 items-start">
                            <div className="w-6 h-6 rounded bg-gowrax-purple/20 text-white font-techMono text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-gowrax-purple/50">2</div>
                            <p className="text-sm font-poppins text-gray-300">Appuyez sur le bouton <b className="text-blue-400">Partager</b> en bas de l'écran (carré avec flèche vers le haut).</p>
                        </div>
                        <div className="flex gap-3 items-start">
                            <div className="w-6 h-6 rounded bg-gowrax-purple/20 text-white font-techMono text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-gowrax-purple/50">3</div>
                            <p className="text-sm font-poppins text-gray-300">Faites défiler le menu et sélectionnez <span className="bg-white/10 text-white px-2 py-0.5 rounded font-bold">"Sur l'écran d'accueil"</span>.</p>
                        </div>
                        <div className="flex gap-3 items-start">
                            <div className="w-6 h-6 rounded bg-gowrax-purple/20 text-white font-techMono text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-gowrax-purple/50">4</div>
                            <p className="text-sm font-poppins text-gray-300">Appuyez sur <b className="text-green-400">"Ajouter"</b> en haut à droite.</p>
                        </div>
                    </div>
                </div>

                {/* Android / Chrome */}
                <div className="bg-white/[0.02] border border-white/10 p-8 rounded-2xl flex flex-col gap-4 hover:bg-white/[0.04] transition-colors relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-500"></div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-white/5 rounded-xl border border-green-500/30 flex items-center justify-center text-white shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                            <FaAndroid className="w-7 h-7 text-green-500" />
                        </div>
                        <div>
                            <h3 className="font-rajdhani text-2xl font-bold text-white">Appareils Android</h3>
                            <p className="text-[10px] font-techMono text-green-400 uppercase tracking-widest bg-green-900/30 px-2 py-0.5 rounded inline-block mt-1">Recommandé : Chrome</p>
                        </div>
                    </div>
                    <div className="space-y-4 mt-2">
                        <div className="flex gap-3 items-start">
                            <div className="w-6 h-6 rounded bg-gowrax-neon/20 text-white font-techMono text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-gowrax-neon/50">1</div>
                            <p className="text-sm font-poppins text-gray-300">Ouvrez l'application depuis <b className="text-white">Google Chrome</b> ou Brave.</p>
                        </div>
                        <div className="flex gap-3 items-start">
                            <div className="w-6 h-6 rounded bg-gowrax-neon/20 text-white font-techMono text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-gowrax-neon/50">2</div>
                            <p className="text-sm font-poppins text-gray-300">Une bannière automatique apparaîtra en bas. Appuyez sur <b className="text-gowrax-neon">"Installer l'Application"</b>.</p>
                        </div>
                        <div className="flex gap-3 items-start">
                            <div className="w-6 h-6 rounded bg-gowrax-neon/20 text-white font-techMono text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-gowrax-neon/50">3</div>
                            <p className="text-sm font-poppins text-gray-300"><i className="text-gray-500">Si la bannière est masquée :</i> Appuyez sur les <b className="text-white">3 petits points</b> (en haut à droite).</p>
                        </div>
                        <div className="flex gap-3 items-start">
                            <div className="w-6 h-6 rounded bg-gowrax-neon/20 text-white font-techMono text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-gowrax-neon/50">4</div>
                            <p className="text-sm font-poppins text-gray-300">Sélectionnez <span className="bg-white/10 text-white px-2 py-0.5 rounded font-bold">"Ajouter à l'écran d'accueil"</span>.</p>
                        </div>
                    </div>
                </div>                {/* PC / MacOS */}
                <div className="bg-white/[0.02] border border-white/10 p-8 rounded-2xl flex flex-col gap-4 hover:bg-white/[0.04] transition-colors relative overflow-hidden group md:col-span-2">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-500"></div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-white/5 rounded-xl border border-blue-500/30 flex items-center justify-center text-white gap-1 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                            <FaWindows className="w-5 h-5 text-blue-400" />
                            <FaApple className="w-5 h-5 text-gray-200" />
                        </div>
                        <div>
                            <h3 className="font-rajdhani text-2xl font-bold text-white">Ordinateur (Windows / macOS)</h3>
                            <p className="text-[10px] font-techMono text-blue-300 uppercase tracking-widest bg-blue-900/30 px-2 py-0.5 rounded inline-block mt-1">Recommandé : Edge / Chrome / Brave</p>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-6 mt-4">
                        <div className="flex-1 space-y-4 pt-2">
                            <div className="flex gap-3 items-start">
                                <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-300 font-techMono text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-500/50">1</div>
                                <p className="text-sm font-poppins text-gray-300">Ouvrez le lien de l'application via un navigateur basé sur Chromium.</p>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-300 font-techMono text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-500/50">2</div>
                                <p className="text-sm font-poppins text-gray-300">Regardez à l'extrémité droite de votre <b className="text-white">barre d'adresse (URL)</b>.</p>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-300 font-techMono text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-500/50">3</div>
                                <p className="text-sm font-poppins text-gray-300">Cliquez sur la petite <b>icône d'installation</b> (écran avec flèche ou "+").</p>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-300 font-techMono text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-500/50">4</div>
                                <p className="text-sm font-poppins text-gray-300">L'App va s'ouvrir dans sa propre fenêtre, <b>comme un vrai logiciel natif</b> !</p>
                            </div>
                        </div>
                        <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-4 flex items-center justify-center">
                            <div className="bg-white px-4 py-2 rounded-xl flex items-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.1)] w-full max-w-sm ml-2">
                                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                                <span className="text-gray-800 text-sm flex-1 font-techMono bg-gray-100 px-2 py-0.5 rounded">team.gowrax.me</span>
                                <div className="bg-blue-50 hover:bg-blue-100 border border-blue-200 cursor-pointer p-1.5 rounded transition-colors relative group">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    <div className="absolute top-10 right-0 bg-blue-600 text-white text-[9px] px-2 py-1 rounded w-32 hidden group-hover:block z-50 shadow-lg tracking-widest font-techMono uppercase">Installer l'App</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* FUNCTIONALITIES BY ROLES */}
        <section className="flex flex-col gap-8 pt-8 border-t border-white/10">
            
            <div className="flex items-center gap-4">
                <h2 className="font-rajdhani text-3xl font-bold text-white uppercase tracking-widest">2. Capacités du Système</h2>
                <div className="h-px bg-white/20 flex-1"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* RECRUE / JOUEUR */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="font-techMono text-xs px-3 py-1 bg-gowrax-purple/20 text-gowrax-neon border border-gowrax-purple/50 rounded-full tracking-widest">CLEARANCE: LEVEL 1</span>
                        <h3 className="font-rajdhani text-2xl font-bold">Membres & Joueurs</h3>
                    </div>
                    
                    <ul className="space-y-4">
                        <li className="bg-white/[0.02] p-4 rounded-xl border border-white/5 border-l-4 border-l-gowrax-neon">
                            <h4 className="font-rajdhani font-bold text-white text-lg flex items-center gap-2">
                                <svg className="w-4 h-4 text-gowrax-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                Calendrier Actif
                            </h4>
                            <p className="text-xs text-gray-400 font-poppins mt-1">Consultez tous les tournois, scrims et rassemblements officiels. Indiquez votre présence ou motivez une absence en un clic.</p>
                        </li>
                        <li className="bg-white/[0.02] p-4 rounded-xl border border-white/5 border-l-4 border-l-orange-400">
                            <h4 className="font-rajdhani font-bold text-white text-lg flex items-center gap-2">
                                <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                Mentorat & Objectifs (Coaching)
                            </h4>
                            <p className="text-xs text-gray-400 font-poppins mt-1">Suivez vos axes de progression. Les Coachs GOWRAX vont vous assigner des cibles de jeu (ex: "Crosshair placement") à valider en entraînement.</p>
                        </li>
                        <li className="bg-white/[0.02] p-4 rounded-xl border border-white/5 border-l-4 border-l-teal-400">
                            <h4 className="font-rajdhani font-bold text-white text-lg flex items-center gap-2">
                                <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                                Bibliothèque Tactique (Strat-book)
                            </h4>
                            <p className="text-xs text-gray-400 font-poppins mt-1">L'armoirie GOWRAX : accédez aux protocoles d'engagements par Carte/Agent élaborés par nos équipes d'analyse.</p>
                        </li>
                    </ul>
                </div>

                {/* STAFF / COACH */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="font-techMono text-xs px-3 py-1 bg-red-500/20 text-red-500 border border-red-500/50 rounded-full tracking-widest animate-pulse">CLEARANCE: OVERSIGHT</span>
                        <h3 className="font-rajdhani text-2xl font-bold text-white">Staff & Commandement</h3>
                    </div>
                    
                    <ul className="space-y-4">
                        <li className="bg-red-900/10 p-4 rounded-xl border border-red-500/20 border-l-4 border-l-red-500 hover:bg-red-900/20 transition-colors">
                            <h4 className="font-rajdhani font-bold text-red-100 text-lg flex items-center gap-2">
                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                Dossiers Classifiés
                            </h4>
                            <p className="text-xs text-red-200/60 font-poppins mt-1">Interface dédiée à la supervision. Enregistrez des rapports confidentiels sur les comportements/performances des membres. Historique détaillé par profil.</p>
                        </li>
                        <li className="bg-blue-900/10 p-4 rounded-xl border border-blue-500/20 border-l-4 border-l-blue-500 hover:bg-blue-900/20 transition-colors">
                            <h4 className="font-rajdhani font-bold text-blue-100 text-lg flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Dashboard Tactique (Heatmaps)
                            </h4>
                            <p className="text-xs text-blue-200/60 font-poppins mt-1">Moteur d'agrégation d'activité identifiant visuellement les "Points Chauds". Permet de monter des rosters d'entraînements par journée sur les meilleures affluences.</p>
                        </li>
                        <li className="bg-orange-900/10 p-4 rounded-xl border border-orange-500/20 border-l-4 border-l-orange-500 hover:bg-orange-900/20 transition-colors">
                            <h4 className="font-rajdhani font-bold text-orange-100 text-lg flex items-center gap-2">
                                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                Mode Mentorat (Push/Pull)
                            </h4>
                            <p className="text-xs text-orange-200/60 font-poppins mt-1">Sélectionnez un membre et "pushez" lui des objectifs à la carte. Sanctionnez (Réussi/Échoué) selon les performances en VOD ou sur le terrain.</p>
                        </li>
                    </ul>
                </div>

            </div>
        </section>

        {/* SECURITY GUARANTEE */}
        <section className="flex flex-col gap-8 pt-8 border-t border-white/10 mt-8">
            <div className="flex items-center gap-4">
                <h2 className="font-rajdhani text-3xl font-bold text-white uppercase tracking-widest">3. Garantie & Sécurité des Données</h2>
                <div className="h-px bg-white/20 flex-1"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Authorization & Discord */}
                <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex flex-col gap-3 relative overflow-hidden group hover:border-discord/30 transition-colors">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#5865F2]/10 rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-500"></div>
                    <FaUserLock className="w-8 h-8 text-[#5865F2] mb-2" />
                    <h3 className="font-rajdhani text-xl font-bold text-white">Authentification Discord</h3>
                    <p className="text-xs text-gray-400 font-poppins leading-relaxed">
                        L'application demande uniquement votre identifiant public (ID Discord), votre pseudo et votre avatar. 
                        <strong> Absolument aucune</strong> permission d'écriture ou d'accès à vos serveurs/amis n'est requise. Sécurité gérée de bout en bout par l'API officielle Supabase OAuth.
                    </p>
                </div>

                {/* Privacy & Tracking */}
                <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex flex-col gap-3 relative overflow-hidden group hover:border-gowrax-neon/30 transition-colors">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gowrax-neon/10 rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-500"></div>
                    <FaEyeSlash className="w-8 h-8 text-gowrax-neon mb-2" />
                    <h3 className="font-rajdhani text-xl font-bold text-white">Zéro Tracking</h3>
                    <p className="text-xs text-gray-400 font-poppins leading-relaxed">
                        Cette interface n'abrite <strong>aucun script de publicité</strong> (Zéro Google Analytics ou Meta Pixel). Les informations de votre navigateur (modèle, OS) ne sont ni stockées ni exploitées de manière externe. Votre profil reste strictement interne à GOWRAX.
                    </p>
                </div>

                {/* Local Storage & PWA */}
                <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex flex-col gap-3 relative overflow-hidden group hover:border-teal-500/30 transition-colors">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-500"></div>
                    <FaShieldAlt className="w-8 h-8 text-teal-400 mb-2" />
                    <h3 className="font-rajdhani text-xl font-bold text-white">Sanctuaire Local</h3>
                    <p className="text-xs text-gray-400 font-poppins leading-relaxed">
                        Une fois installée (via PWA), l'application met en cache ses ressources limitant les requêtes distantes. Les tokens de connexion sécurisés vivent dans le LocalStorage de votre appareil et s'autodétruisent en cas de déconnexion.
                    </p>
                </div>

            </div>
        </section>

      </main>

    </div>
  );
}
