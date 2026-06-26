import React, { useEffect } from 'react';
import ShootingStars from './ShootingStars';

export default function Suspended() {
  useEffect(() => {
    if (window.location.pathname !== '/suspended') {
      window.history.replaceState({}, '', '/suspended');
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0D0E15] text-white flex flex-col relative overflow-hidden font-poppins selection:bg-[#B185DB] selection:text-white">
      <ShootingStars />

      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#6F2DBD]/10 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-red-500/5 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen animate-pulse-slow" />

      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/60 to-transparent animate-pulse opacity-70" />

      <nav className="w-full p-6 flex justify-between items-center max-w-7xl mx-auto z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-black border border-red-500/40 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <span className="font-techMono font-bold text-sm text-red-300">GRX</span>
          </div>
          <span className="font-rajdhani font-bold text-2xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            GOWRAX
          </span>
        </div>
        <div className="font-techMono text-[10px] text-red-400/80 uppercase tracking-[0.3em] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          Service suspendu
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6 z-10 max-w-3xl mx-auto text-center">
        <div className="w-24 h-24 bg-white/[0.02] rounded-3xl flex items-center justify-center border border-red-500/30 mb-10 relative overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.15)] rotate-45 backdrop-blur-md">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-50" />
          <svg className="w-10 h-10 text-red-400 relative z-10 -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="font-rajdhani text-4xl md:text-6xl font-black tracking-widest uppercase mb-6 text-white drop-shadow-md">
          Site <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">indisponible</span>
        </h1>

        <p className="font-poppins text-gray-400 text-base md:text-lg leading-relaxed mb-6 max-w-xl">
          Pour des raisons de <span className="text-white/90">sécurité</span>, d&apos;<span className="text-white/90">amélioration UX</span> et d&apos;<span className="text-white/90">optimisation</span>, le hub GOWRAX est temporairement inaccessible.
        </p>

        <p className="font-poppins text-gray-500 text-sm md:text-base leading-relaxed mb-12 max-w-lg">
          L&apos;intégralité des services reviendra en ligne le plus vite possible. Merci pour votre patience.
        </p>

        <div className="flex flex-col gap-3 bg-black/40 px-8 py-6 rounded-2xl border border-white/5 shadow-inner text-left w-full max-w-md">
          <span className="font-techMono text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            Raison : <span className="text-white">MAINTENANCE &amp; SÉCURITÉ</span>
          </span>
          <div className="w-full h-px bg-white/5" />
          <span className="font-techMono text-[10px] text-red-400 uppercase tracking-widest flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            Statut : <span className="font-bold">TOUS LES SERVICES SUSPENDUS</span>
          </span>
          <div className="w-full h-px bg-white/5" />
          <span className="font-techMono text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B185DB]/60" />
            Retour prévu : <span className="text-[#A2D2FF]">DÈS QUE POSSIBLE</span>
          </span>
        </div>
      </main>

      <footer className="w-full text-center p-8 border-t border-white/5 bg-[#0D0E15]/80 z-10 backdrop-blur-xl mt-auto">
        <p className="font-techMono text-xs text-gray-600 tracking-widest uppercase">
          © {new Date().getFullYear()} GOWRAX ESPORT — MAINTENANCE EN COURS
        </p>
      </footer>
    </div>
  );
}
