//[NOTE IA: Cette page n'est que le "crash test" lié à la démo de la page. Tout le code peut être remplacé. L'objectif est de présenter une maquette fonctionnelle du système d'évolution "Slow Bloom" pour les candidats. Le design est volontairement épuré et moderne, avec des animations subtiles pour renforcer l'aspect "conceptuel" et "en développement". Les éléments clés sont : une bannière de teaser, un header impactant, des cartes explicatives du système, et un faux bouton d'appel à l'action verrouillé. L'ensemble doit donner une impression de technologie avancée tout en restant accessible et humain.]
import React from 'react';
import RevealOnScroll from './RevealOnScroll';

export default function Evolution() {
  return (
    <div className="flex flex-col items-center justify-start min-h-screen pb-32 animate-fade-in relative overflow-hidden bg-[#0a0a0f]">
      
      {/* 🌸 BACKGROUND LOFI / OPALESCENT 🌸 */}
      {/* Orbes de lumière diffuses */}
      <div className="fixed top-[-20%] left-[-10%] w-[70rem] h-[70rem] bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/5 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen animate-pulse-slow"></div>
      <div className="fixed bottom-[-10%] right-[-20%] w-[60rem] h-[60rem] bg-gradient-to-tl from-cyan-400/10 to-blue-500/5 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen"></div>
      
      {/* Overlay "Bruit" / Texture Lofi (simulé par un gradient rayé ultra fin) */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-5]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), repeating-linear-gradient(45deg, #000 25%, #111 25%, #111 75%, #000 75%, #000)', backgroundPosition: '0 0, 2px 2px', backgroundSize: '4px 4px' }}></div>

      {/* ⚠️ BANNIÈRE TEASER */}
    <div className="w-full max-w-5xl mx-auto px-4 mt-4 md:mt-8">
    <div className="bg-white/[0.02] border border-white/5 backdrop-blur-[40px] rounded-3xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group text-center md:text-left">
        
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-5 relative z-10">
        {/* L'Oeil de l'IA (Cristal) */}
        <div className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 shrink-0">
            <div className="absolute inset-0 bg-indigo-300/20 blur-[10px] rounded-full animate-pulse"></div>
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-white/10 to-white/0 border border-white/20 backdrop-blur-xl flex items-center justify-center shadow-[inset_0_0_15px_rgba(255,255,255,0.1)]">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-cyan-200 shadow-[0_0_10px_#a5f3fc] animate-ping"></div>
            </div>
        </div>
        
        <div>
            <h3 className="font-rajdhani font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-cyan-200 text-lg md:text-xl tracking-widest uppercase">
            Phase de Bourgeonnement
            </h3>
            <p className="font-poppins text-[10px] md:text-xs text-indigo-100/60 mt-1 max-w-md leading-relaxed px-2 md:px-0">
            Slow Bloom est en incubation. Le hub d'évaluation s'ouvrira lors du patch de Mai 2026.
            </p>
        </div>
        </div>
        <div className="shrink-0 px-4 py-1.5 md:px-5 md:py-2 bg-indigo-950/30 border border-indigo-400/20 rounded-xl text-[9px] md:text-[10px] font-techMono text-indigo-300 shadow-[0_0_15px_rgba(129,140,248,0.2)]">
        STATUT: <span className="text-cyan-300 animate-pulse">INCUBATION_</span>
        </div>
    </div>
    </div>

      {/* HEADER SLOW BLOOM */}
      <div className="w-full max-w-4xl mx-auto text-center mt-24 px-4 z-10 relative">
        <RevealOnScroll delay={100}>
          <div className="inline-flex items-center justify-center gap-3 mb-8">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-cyan-400/50"></div>
            <span className="font-techMono text-[10px] text-cyan-200/80 uppercase tracking-[0.4em]">Gowrax Inner Circle</span>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-cyan-400/50"></div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={200}>
          {/* Correction d'invisibilité : on sépare le drop-shadow du bg-clip-text qui fait bugger WebKit (Safari/Chrome) */}
          <div className="relative inline-block drop-shadow-[0_0_40px_rgba(165,180,252,0.3)]">
            <h1 className="font-rajdhani text-7xl md:text-[9rem] font-extrabold tracking-tighter mb-2 text-transparent bg-clip-text bg-[linear-gradient(to_right,#ffffff,#fbcfe8,#c4b5fd,#a5f3fc,#fbcfe8,#ffffff)] animate-gradient pb-2">
              SLOW <span className="font-light italic bg-clip-text text-transparent">BLOOM</span>.
            </h1>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={300}>
          <p className="font-rockSalt text-lg md:text-2xl text-cyan-200/60 mt-4 mb-16 -rotate-2 drop-shadow-[0_2px_10px_rgba(34,211,238,0.2)]">
            "La progression ne se force pas, elle s'arrose."
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={400}>
          <p className="font-poppins text-indigo-100/70 text-sm md:text-lg max-w-2xl mx-auto leading-loose">
            Slow Bloom n'est pas un entretien. C'est un <span className="text-cyan-200 font-semibold">miroir d'évolution</span>. 
            Déposez-y vos aspirations et votre implication. Notre système analyse la synergie entre votre mentalité et la vision du Hub pour vous guider vers le roster parfait.
          </p>
        </RevealOnScroll>
      </div>

      {/* EXPLICATION DES OBJECTIFS (Cartes Flottantes) */}
      <div className="w-full max-w-6xl mx-auto mt-32 px-4 grid grid-cols-1 md:grid-cols-3 gap-8 z-10 relative">
        
        {/* Lignes de connexion décoratives (desktop) */}
        <div className="hidden md:block absolute top-1/2 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent -z-10"></div>

        {/* Objectif 1 : Introspection */}
        <RevealOnScroll delay={500}>
          <div className="bg-white/[0.01] border border-white/5 p-10 rounded-[2rem] backdrop-blur-2xl hover:bg-white/[0.03] hover:border-indigo-300/30 transition-all duration-700 h-full flex flex-col relative overflow-hidden group hover:-translate-y-2 shadow-2xl shadow-black/50">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-400/20 transition-all duration-700"></div>
            
            <span className="font-rockSalt text-4xl text-white/5 absolute top-6 right-6 group-hover:text-indigo-200/10 transition-colors">01</span>
            
            <h3 className="font-rajdhani text-3xl font-bold text-white mb-4 mt-4">Harmonie<br/><span className="text-indigo-300">Mentale</span></h3>
            <p className="font-poppins text-sm text-indigo-100/50 leading-relaxed flex-1">
              L'attitude prime sur le tableau des scores. Slow Bloom identifie la maturité de votre discours et votre adéquation avec l'esprit GOWRAX pour assurer une cohésion d'équipe irréprochable.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <div className="w-8 h-[1px] bg-indigo-400/40"></div>
              <span className="text-[10px] font-techMono text-indigo-300 uppercase tracking-widest">Self_Reflection</span>
            </div>
          </div>
        </RevealOnScroll>

        {/* Objectif 2 : Équité */}
        <RevealOnScroll delay={600}>
          <div className="bg-white/[0.01] border border-white/5 p-10 rounded-[2rem] backdrop-blur-2xl hover:bg-white/[0.03] hover:border-cyan-300/30 transition-all duration-700 h-full flex flex-col relative overflow-hidden group hover:-translate-y-2 shadow-2xl shadow-black/50">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-400/20 transition-all duration-700"></div>
            
            <span className="font-rockSalt text-4xl text-white/5 absolute top-6 right-6 group-hover:text-cyan-200/10 transition-colors">02</span>
            
            <h3 className="font-rajdhani text-3xl font-bold text-white mb-4 mt-4">Empreinte<br/><span className="text-cyan-300">Constante</span></h3>
            <p className="font-poppins text-sm text-indigo-100/50 leading-relaxed flex-1">
              Un talent fantôme n'a pas sa place sur le terrain. Le système récompense la régularité, l'assiduité aux rassemblements et l'effort continu sur la durée. L'équité est totale.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <div className="w-8 h-[1px] bg-cyan-400/40"></div>
              <span className="text-[10px] font-techMono text-cyan-300 uppercase tracking-widest">Fair_Evaluation</span>
            </div>
          </div>
        </RevealOnScroll>

        {/* Objectif 3 : Rythme */}
        <RevealOnScroll delay={700}>
          <div className="bg-white/[0.01] border border-white/5 p-10 rounded-[2rem] backdrop-blur-2xl hover:bg-white/[0.03] hover:border-fuchsia-300/30 transition-all duration-700 h-full flex flex-col relative overflow-hidden group hover:-translate-y-2 shadow-2xl shadow-black/50">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-fuchsia-500/10 rounded-full blur-3xl group-hover:bg-fuchsia-400/20 transition-all duration-700"></div>
            
            <span className="font-rockSalt text-4xl text-white/5 absolute top-6 right-6 group-hover:text-fuchsia-200/10 transition-colors">03</span>
            
            <h3 className="font-rajdhani text-3xl font-bold text-white mb-4 mt-4">Croissance<br/><span className="text-fuchsia-300">Organique</span></h3>
            <p className="font-poppins text-sm text-indigo-100/50 leading-relaxed flex-1">
              Bâtir un joueur prend du temps. Des sas de temporisation assurent que chaque tentative d'évolution soit le fruit d'une véritable remise en question et d'un entraînement ciblé.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <div className="w-8 h-[1px] bg-fuchsia-400/40"></div>
              <span className="text-[10px] font-techMono text-fuchsia-300 uppercase tracking-widest">Pacing_Control</span>
            </div>
          </div>
        </RevealOnScroll>

      </div>

      {/* CALL TO ACTION (Verrouillé - Mode Glass) */}
      <RevealOnScroll delay={800}>
        <div className="mt-32 z-10 flex flex-col items-center relative group">
          {/* Aura du bouton */}
          <div className="absolute inset-0 bg-cyan-400/5 blur-xl rounded-full scale-150 group-hover:bg-cyan-400/10 transition-colors duration-700"></div>
          
          <button disabled className="relative px-12 py-5 bg-white/[0.02] border border-white/10 rounded-[2rem] font-rajdhani font-bold text-xl text-indigo-200/40 cursor-not-allowed backdrop-blur-xl flex items-center gap-4 overflow-hidden">
            {/* Effet strié à l'intérieur */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)' }}></div>
            
            <svg className="w-6 h-6 text-indigo-200/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            <span className="tracking-[0.2em] uppercase">Initialiser le processus</span>
          </button>
          
          <div className="mt-6 flex items-center gap-2 opacity-60">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
            <span className="text-[10px] font-techMono text-indigo-200/50 uppercase tracking-[0.3em]">
              SÉQUENCE VERROUILLÉE
            </span>
          </div>
        </div>
      </RevealOnScroll>

    </div>
  );
}