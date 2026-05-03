import React from 'react';

export default function DisabledOverlay({ title, message }) {
  return (
    <div className="absolute inset-0 z-40 bg-[#0D0E15]/60 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center border border-white/5 rounded-[2rem] animate-fade-in shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] overflow-hidden">
      
      {/* Lueur d'alerte en arrière-plan */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/5 rounded-full blur-[80px] pointer-events-none animate-pulse-slow"></div>

      {/* Icône Premium (Losange de Verre) */}
      <div className="w-24 h-24 bg-white/[0.02] rounded-3xl flex items-center justify-center border border-red-500/20 mb-10 relative group overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.15)] rotate-45 backdrop-blur-md">
         <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-50"></div>
         {/* L'icône est tournée à -45° pour rester droite malgré le conteneur en losange */}
         <svg className="w-10 h-10 text-red-400 relative z-10 -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
         </svg>
      </div>
      
      <h2 className="font-rajdhani text-3xl md:text-5xl text-white font-black tracking-widest uppercase mb-4 drop-shadow-md relative z-10">
        {title || 'VUE DÉSACTIVÉE'}
      </h2>
      
      <p className="font-poppins text-gray-400 max-w-md text-sm md:text-base leading-relaxed mb-10 relative z-10">
        {message || "Cette section est actuellement en maintenance ou son accès a été suspendu par le Commandement GOWRAX."}
      </p>
      
      {/* Terminal de Statut */}
      <div className="flex flex-col gap-3 opacity-90 bg-black/40 px-8 py-5 rounded-2xl border border-white/5 relative z-10 shadow-inner inline-block">
        <span className="font-techMono text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-3 justify-start">
           <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span> 
           Raison : <span className="text-white">OVERRIDE_BY_STAFF</span>
        </span>
        <div className="w-full h-px bg-white/5"></div>
        <span className="font-techMono text-[10px] text-red-400 uppercase tracking-widest flex items-center gap-3 justify-start">
           <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span> 
           Statut : <span className="font-bold">ACCÈS REFUSÉ</span>
        </span>
      </div>
      
      {/* Effet "Scanline" subtil de haut en bas */}
      <div className="absolute left-0 w-full h-[1px] bg-red-500/20 blur-[1px] animate-[scan_4s_ease-in-out_infinite] pointer-events-none"></div>

      {/* Style local pour l'animation de scan */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.5; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
}