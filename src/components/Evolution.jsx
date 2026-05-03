import React, { useState, useEffect, useRef } from 'react';

// ============================================================================
// 🌸 GOWRAX AI - DIALOGUE ENGINE (Sandbox Visuelle)
// ============================================================================
const DUMMY_DICTIONARY = {
  positive: ["améliorer", "apprendre", "tryhard", "déterminé", "équipe", "collectif", "support", "ensemble", "calme", "objectif", "évoluer"],
  negative: ["carry", "solo", "meilleur", "nuls", "troll", "chiant", "gueuler", "rage", "toxic", "ez", "facile"]
};

const analyzeSimple = (text) => {
  const words = text.toLowerCase().split(/\s+/);
  let pos = 0, neg = 0;
  words.forEach(w => {
    if (DUMMY_DICTIONARY.positive.some(kw => w.includes(kw))) pos++;
    if (DUMMY_DICTIONARY.negative.some(kw => w.includes(kw))) neg++;
  });
  return { pos, neg };
};

export default function SlowBloomChat() {
  const [showWarning, setShowWarning] = useState(true); // État du Pop-up
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: "Bonjour. Je suis l'interface Gowrax AI. La progression est un chemin organique.", delay: 500 },
    { 
      id: 2, 
      sender: 'ai', 
      text: "Pour commencer, d'où viens-tu ?", 
      type: 'options',
      options: ['Roster Academy', 'Roster Tryhard', 'Externe (Nouveau)'],
      delay: 2000 
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [step, setStep] = useState(1); 
  const [isTyping, setIsTyping] = useState(false);
  const [targetRoster, setTargetRoster] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const addAiMessage = (msgObj, delay = 1000) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', ...msgObj }]);
      setIsTyping(false);
    }, delay);
  };

  const handleOptionClick = (option) => {
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: option }]);
    
    if (step === 1) {
      addAiMessage({ 
        text: `Noté. Et vers quelle lumière souhaites-tu te tourner ?`, 
        type: 'options',
        options: ['Roster Tryhard', 'High Roster']
      }, 1500);
      setStep(2);
    } 
    else if (step === 2) {
      setTargetRoster(option);
      let warningText = "";
      if (option === 'High Roster') {
        warningText = "\n\n*(Attention : pour les protocoles particuliers d'intégration au sein du High Roster concernant les mineurs, le staff est seul habilité à gérer le dossier directement.)*";
      }
      addAiMessage({ text: `L'ambition est une excellente chose. Quel est ton âge actuel ?${warningText}` }, 1500);
      setStep(3);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userText }]);
    setInputValue('');

    if (step === 3) {
      const age = parseInt(userText);
      if (isNaN(age) || age < 15) {
        addAiMessage({ text: "La structure exige un minimum de 15 ans pour évoluer au sein de nos rangs." }, 1000);
      } else {
        addAiMessage({ text: `Parfait. Pour synchroniser tes données de combat, donne-moi ton Riot ID (Ex: Pseudo#TAG).` }, 1500);
        setStep(4);
      }
    }
    else if (step === 4) {
      if (!userText.includes('#')) {
        addAiMessage({ text: "Il manque le hashtag (#). Format attendu : Pseudo#TAG." }, 1000);
      } else {
        addAiMessage({ text: `Connexion aux serveurs Vanguard pour [${userText}]...` }, 1000);
        setTimeout(() => addAiMessage({ text: "Signal intercepté. Rang calibré : Ascendant." }), 3500);
        setTimeout(() => addAiMessage({ text: "L'art de la guerre ne s'arrête pas au score. Comment conçois-tu le jeu en équipe et qu'est-ce qui te pousse à viser plus haut ?" }), 5500);
        setStep(5);
      }
    }
    else if (step === 5) {
      if (userText.length < 20) {
        addAiMessage({ text: "Ce n'est pas suffisant pour que je puisse cerner ta détermination. Développe davantage." }, 1000);
      } else {
        setStep(6);
        const analysis = analyzeSimple(userText);
        
        addAiMessage({ type: 'analysis', text: "Analyse" }, 500);

        setTimeout(() => {
          if (analysis.neg > analysis.pos) {
            addAiMessage({ text: "J'ai lu tes mots. Je perçois une forte résonance de l'ego. Garde à l'esprit que l'équipe prime sur l'individu." });
          } else if (analysis.pos > 0) {
            addAiMessage({ text: "J'ai lu tes mots. La volonté et l'esprit collectif sont marqués. Le système apprécie ton approche." });
          } else {
            addAiMessage({ text: "J'ai lu tes mots. Ton profil est mesuré. Le système a enregistré ton essence." });
          }
          
          setTimeout(() => addAiMessage({ text: "Le cycle est complet. Ton dossier virtuel est clôturé. La patience est la racine de toutes les victoires." }), 3000);
          setStep(7);
        }, 5000);
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#0D0E15] font-poppins selection:bg-[#B185DB] selection:text-white relative overflow-hidden">
      
      {/* ==================================================== */}
      {/* ⚠️ POP-UP AVERTISSEMENT (WIP) */}
      {/* ==================================================== */}
      {showWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0D0E15]/90 backdrop-blur-xl animate-fade-in">
          <div className="bg-[#1A1C2E]/90 border border-[#B185DB]/30 rounded-[2rem] p-8 md:p-12 max-w-lg text-center shadow-[0_0_50px_rgba(177,133,219,0.2)] relative overflow-hidden">
            {/* Lueur d'arrière-plan du pop-up */}
            <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-40 h-40 bg-[#F7CAD0]/20 rounded-full blur-[60px] pointer-events-none"></div>

            <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 relative z-10">
              <svg className="w-8 h-8 text-[#F7CAD0]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            
            <h2 className="font-rajdhani text-3xl text-white font-bold tracking-widest mb-4 relative z-10">ZÔNE DE TEST</h2>
            
            <p className="font-poppins text-gray-400 text-sm leading-relaxed mb-8 relative z-10">
              L'interface <span className="text-[#B185DB] font-bold">Slow Bloom</span> est actuellement en cours de développement. Vous pouvez interagir avec l'agent IA et explorer l'environnement, mais le système n'est pas finalisé et <strong className="text-[#F7CAD0]">aucune donnée ne sera sauvegardée</strong>.
            </p>
            
            <button
              onClick={() => setShowWarning(false)}
              className="px-8 py-4 bg-gradient-to-r from-[#B185DB]/20 to-[#F7CAD0]/20 hover:from-[#B185DB]/40 hover:to-[#F7CAD0]/40 text-[#F0F2F5] border border-[#F7CAD0]/30 rounded-full font-techMono text-sm tracking-widest transition-all shadow-[0_0_20px_rgba(247,202,208,0.1)] hover:shadow-[0_0_30px_rgba(247,202,208,0.3)] hover:-translate-y-1 relative z-10"
            >
              COMPRIS, LAISSEZ-MOI TESTER
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 🌌 BACKGROUND ÉDITORIAL GÉANT */}
      {/* ==================================================== */}
      <div className="absolute inset-0 pointer-events-none z-0 flex flex-col justify-center opacity-[0.03] select-none">
        <div className="whitespace-nowrap flex animate-[scroll-left_60s_linear_infinite]">
          <span className="font-rajdhani font-black text-[18vw] leading-none text-transparent bg-clip-text bg-gradient-to-r from-white to-[#F7CAD0] px-4">
            SLOW BLOOM SLOW BLOOM SLOW BLOOM SLOW BLOOM
          </span>
        </div>
        <div className="whitespace-nowrap flex animate-[scroll-right_70s_linear_infinite] mt-[-2vw]">
          <span className="font-rajdhani font-black text-[18vw] leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#B185DB] to-[#A2D2FF] px-4">
            GOWRAX EVOLUTION GOWRAX EVOLUTION GOWRAX EVOLUTION
          </span>
        </div>
        <div className="whitespace-nowrap flex animate-[scroll-left_80s_linear_infinite] mt-[-2vw]">
          <span className="font-rajdhani font-black text-[18vw] leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#F0F2F5] to-transparent px-4">
            NEURAL NETWORK NEURAL NETWORK NEURAL NETWORK
          </span>
        </div>
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 mix-blend-screen opacity-70">
        <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-[#6F2DBD]/20 rounded-full blur-[150px] animate-pulse-slow"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[30vw] h-[30vw] bg-[#F7CAD0]/10 rounded-full blur-[120px] animate-float"></div>
      </div>

      {/* ==================================================== */}
      {/* 💬 INTERFACE DE CHAT */}
      {/* ==================================================== */}
      <div className="w-full max-w-3xl h-[85vh] flex flex-col bg-[#1A1C2E]/70 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] z-10 overflow-hidden relative transition-all duration-700">
        
        {/* En-tête */}
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-md relative z-20">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#B185DB] to-[#F7CAD0] flex items-center justify-center shadow-[0_0_20px_rgba(177,133,219,0.3)] border border-[#F0F2F5]/20">
                <span className="font-rockSalt text-sm text-[#1A1C2E]">AI</span>
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-[#1A1C2E] rounded-full animate-pulse"></div>
            </div>
            <div>
              <h2 className="font-rajdhani text-2xl text-white font-bold tracking-widest drop-shadow-md">Gowrax AI</h2>
              <p className="text-[10px] text-[#A2D2FF] font-techMono uppercase tracking-widest">Protocole Slow Bloom • <span className="text-green-400">En ligne</span></p>
            </div>
          </div>
          <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white/30">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
        </div>

        {/* Zone des messages */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col gap-6 custom-scrollbar scroll-smooth relative z-10">
          {messages.map((msg, index) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
              
              <div className="flex max-w-[85%] items-end gap-3">
                {msg.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#B185DB] to-[#F7CAD0] shrink-0 opacity-80 mb-1 border border-white/20"></div>
                )}
                
                <div className={`p-5 text-sm md:text-base leading-relaxed shadow-lg whitespace-pre-wrap ${
                  msg.sender === 'user' 
                    ? 'bg-gradient-to-br from-white/10 to-white/5 text-white rounded-3xl rounded-tr-sm border border-white/10 backdrop-blur-md' 
                    : 'bg-[#0D0E15]/60 text-[#F0F2F5] border border-[#B185DB]/30 rounded-3xl rounded-tl-sm backdrop-blur-md'
                }`}>
                  
                  {msg.type !== 'analysis' && <span>{msg.text}</span>}

                  {msg.type === 'analysis' && (
                    <div className="w-64 flex flex-col gap-3 py-2">
                      <div className="flex justify-between items-center font-techMono text-xs text-[#F7CAD0] uppercase tracking-widest">
                        <span className="animate-pulse">Analyse lexicale...</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#1A1C2E] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#B185DB] to-[#F7CAD0] w-full animate-[progress_4s_ease-in-out_forwards] origin-left"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {msg.type === 'options' && step < 3 && msg.id === messages[messages.length - 1].id && (
                <div className="flex flex-wrap gap-2 mt-3 ml-9">
                  {msg.options.map((opt, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleOptionClick(opt)}
                      className="px-6 py-3 bg-[#B185DB]/10 hover:bg-[#B185DB]/30 border border-[#B185DB]/40 text-[#B185DB] hover:text-[#F0F2F5] font-rajdhani font-bold text-sm tracking-widest rounded-2xl transition-all shadow-[0_0_10px_rgba(177,133,219,0.1)] hover:shadow-[0_0_20px_rgba(177,133,219,0.3)] hover:-translate-y-0.5"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start items-end gap-3 animate-fade-in">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#B185DB] to-[#F7CAD0] shrink-0 opacity-50 mb-1 border border-white/10"></div>
              <div className="bg-[#0D0E15]/60 border border-[#B185DB]/20 rounded-3xl rounded-tl-sm px-5 py-4 flex items-center gap-2 backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-[#F7CAD0] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-[#F7CAD0] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-[#F7CAD0] animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Zone de saisie */}
        <div className="p-4 md:p-8 bg-[#0D0E15]/80 backdrop-blur-2xl border-t border-white/5 relative z-20">
          <form onSubmit={handleSend} className="flex gap-3 relative max-w-2xl mx-auto">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping || step === 7 || step === 1 || step === 2 || step === 6}
              placeholder={
                (step === 1 || step === 2) ? "Sélectionnez une option ci-dessus..." :
                step === 6 ? "Analyse en cours..." :
                step === 7 ? "La floraison suit son cours." : 
                "Répondez à l'interface..."
              }
              className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 rounded-full px-8 py-5 text-white font-poppins text-sm focus:border-[#B185DB] focus:bg-white/10 outline-none transition-all disabled:opacity-30 pr-20 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
            />
            <button 
              type="submit" 
              disabled={!inputValue.trim() || isTyping || step === 7 || step === 1 || step === 2 || step === 6}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-[#B185DB] to-[#F7CAD0] rounded-full flex items-center justify-center text-[#1A1C2E] hover:scale-105 transition-transform disabled:opacity-30 disabled:hover:scale-100 shadow-[0_0_20px_rgba(177,133,219,0.4)]"
            >
              <svg className="w-6 h-6 translate-x-[1px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </button>
          </form>
          <div className="text-center mt-4">
            <span className="font-techMono text-[10px] text-[#A2D2FF] uppercase tracking-widest opacity-50">Connexion chiffrée • Gowrax Neural Network</span>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes progress {
          0% { transform: scaleX(0); }
          20% { transform: scaleX(0.2); }
          50% { transform: scaleX(0.4); }
          80% { transform: scaleX(0.8); }
          100% { transform: scaleX(1); }
        }
        @keyframes scroll-left {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
      `}} />
    </div>
  );
}