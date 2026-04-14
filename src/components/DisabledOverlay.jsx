import React from 'react';

export default function DisabledOverlay({ title, message }) {
  return (
    <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center border border-white/5 rounded-2xl md:rounded-3xl animate-fade-in m-2">
      <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30 mb-6 relative group overflow-hidden">
         <div className="absolute inset-0 bg-red-500/20 blur-xl"></div>
         <svg className="w-10 h-10 text-red-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
      </div>
      <h2 className="font-rajdhani text-3xl md:text-4xl text-white font-extrabold tracking-widest uppercase mb-2">
        {title || 'VUE DÉSACTIVÉE'}
      </h2>
      <p className="font-poppins text-gray-400 max-w-md text-sm leading-relaxed mb-8">
        {message || "Cette section est actuellement en maintenance ou son accès a été suspendu temporairement par le Commandement GOWRAX."}
      </p>
      
      <div className="flex flex-col gap-2 opacity-60">
        <span className="font-techMono text-[10px] text-gray-500 uppercase tracking-widest">
           Raison: OVERRIDE_BY_STAFF
        </span>
        <span className="font-techMono text-[10px] text-red-500/70 uppercase tracking-widest">
           Statut: ACCÈS REFUSÉ
        </span>
      </div>
    </div>
  );
}
