import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { usePermissions } from '../hooks/usePermissions';

export default function Promotions({ session }) {
  const { roles, isStaff, isCoach, isFounder } = usePermissions(session);
  const [promotions, setPromotions] = useState([]);
  const [myPromotion, setMyPromotion] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    target_roster: 'Academy',
    valorant_name: '',
    valorant_tag: '',
    age: '',
    availability_days: 1, // Days per week
    notes: '',
  });

  const [aiEval, setAiEval] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);

  useEffect(() => {
    fetchPromotions();
  }, [isStaff, isFounder]);

  const fetchPromotions = async () => {
    // Check if table exists properly (mocking standard behavior)
    const { data: userData } = await supabase
      .from('promotions')
      .select('*')
      .eq('user_id', session.user.id)
      .limit(1);

    if (userData && userData.length > 0) {
      setMyPromotion(userData[0]);
    }

    if (isStaff || isCoach || isFounder) {
      const { data: allData } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (allData) setPromotions(allData);
    }
    setLoading(false);
  };

  const simulateValorantApi = async (name, tag) => {
    try {
        const encodedName = encodeURIComponent(name.trim());
        const encodedTag = encodeURIComponent(tag.trim().replace(/^#/, ''));
        const res = await fetch(`https://api.henrikdev.xyz/valorant/v1/mmr/eu/${encodedName}/${encodedTag}`, {
            headers: {
                "Authorization": "HDEV-2d2c3f3b-c136-49c5-bddf-2c4981afb121"
            }
        });
        
        if (res.ok) {
            const json = await res.json();
            return {
                rank: json.data.currenttierpatched || "Unranked",
                tier: json.data.currenttier || 0,
                real: true
            };
        } else if (res.status === 404) {
            return { error: "Joueur/Rank introuvable. Vérifiez l'orthographe (Espaces compris)." };
        } else if (res.status === 429) {
            return { error: "API Valorant surchargée, réessayez plus tard." };
        } else {
            return { error: `HTTP (${res.status})` };
        }
    } catch (e) {
        return { error: "Erreur de connexion à l'API HenrikDev." };
    }
  };

  const evaluateDossier = async () => {
    setEvalLoading(true);
    setAiEval(null);
    
    setTimeout(async () => {
      let score = 100;
      let reasons = [];
      let rankData = await simulateValorantApi(formData.valorant_name, formData.valorant_tag);

      // Verify if API failed (Not Found, Overloaded etc.)
      if (rankData.error) {
          setAiEval({
            score: 0,
            status: 'REJECTED_BY_AI',
            reasons: [{ type: 'critical', text: `Erreur API: ${rankData.error}` }],
            rankData: { rank: 'Introuvable', tier: 0 }
          });
          setEvalLoading(false);
          return;
      }

      // Critère 1: Age
      if (formData.age < 18) {
        if (formData.target_roster === 'Academy') {
          reasons.push({ type: 'warning', text: 'Mineur (Toléré pour l\'Academy)' });
          score -= 10;
        } else {
          reasons.push({ type: 'critical', text: `Mineur. Autorisation requise des CEO pour le ${formData.target_roster}` });
          score -= 40;
        }
      } else {
        reasons.push({ type: 'success', text: 'Majeur (Critère validé)' });
      }

      // Critère 2: Rank (High Roster & Tryhard)
      if (['High Roster', 'Tryhard'].includes(formData.target_roster)) {
        if (rankData.tier < 21) { // 21 = Ascendant 1
          reasons.push({ type: 'critical', text: `Rank insuffisant (${rankData.rank}). Requis: Ascendant 1+` });
          score -= 50;
        } else {
          reasons.push({ type: 'success', text: `Rank Elite détecté: ${rankData.rank}` });
        }
      }

      // Critère 3: Disponibilité
      if (formData.availability_days < 3) {
        reasons.push({ type: 'critical', text: `Disponibilité trop faible (${formData.availability_days}j/sem).` });
        score -= 30;
      } else if (formData.availability_days >= 5) {
        reasons.push({ type: 'success', text: `Excellente disponibilité (${formData.availability_days}j/sem)` });
        score += 10;
      } else {
        reasons.push({ type: 'warning', text: `Disponibilité moyenne (${formData.availability_days}j/sem)` });
      }

      const status = score >= 80 ? 'APPROVED_BY_AI' : score >= 50 ? 'MANUAL_REVIEW' : 'REJECTED_BY_AI';

      setAiEval({ score, reasons, status, rankData });
      setEvalLoading(false);
    }, 2000);
  };

  const submitDossier = async () => {
    const payload = {
      user_id: session.user.id,
      user_name: session.user.user_metadata.full_name || session.user.email,
      target_roster: formData.target_roster,
      valorant_id: `${formData.valorant_name}#${formData.valorant_tag}`,
      age: formData.age,
      availability: formData.availability_days,
      notes: formData.notes,
      ai_score: aiEval.score,
      ai_status: aiEval.status,
      rank_snapshot: aiEval.rankData.rank,
      status: 'pending' // pending manual validation by default
    };

    const { data, error } = await supabase.from('promotions').insert([payload]).select();
    if (!error && data) {
      setMyPromotion(data[0]);
    } else {
      console.log("Create table 'promotions' if it doesn't exist, this is a mockup fallback.", error);
      // Fallback local if DB not configured yet by user
      setMyPromotion({ ...payload, id: 999, created_at: new Date().toISOString() });
    }
  };

  const updateDossierStatus = async (id, newStatus) => {
    const { error } = await supabase.from('promotions').update({ status: newStatus }).eq('id', id);
    if (error) {
        console.error("DB Error:", error);
        alert(`Action refusée (Problème de base de données). L'avez-vous bien configurée avec RLS (Row Level Security) ? => ${error.message}`);
    } else {
        setPromotions(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    }
  };

  if (loading) {
    return <div className="flex justify-center py-10"><span className="text-gowrax-neon animate-pulse font-techMono">LOADING PORTAL...</span></div>;
  }

  return (
    <div className="flex flex-col gap-6 font-poppins pb-20 md:pb-0 relative w-full overflow-hidden">
      <div className="flex items-center gap-3 mb-2">
        <h2 className="font-rajdhani text-2xl md:text-4xl font-extrabold uppercase text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-gowrax-neon">
          PORTAIL D'ÉVOLUTION GOWRAX
        </h2>
      </div>

      {/* VUE JOUEUR : FAIRE UNE DEMANDE OU VOIR SON STATUT */}
      {!myPromotion && (
        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gowrax-neon/10 rounded-full blur-3xl"></div>
          
          <h3 className="font-rajdhani text-xl font-bold text-white mb-4">CRÉER UN DOSSIER DE PROMOTION</h3>
          <p className="text-xs text-gray-400 mb-6">Le système G.O.W.R.A.X évaluera automatiquement vos statistiques In-Game avant soumission au Staff.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-[10px] font-techMono text-gray-400 mb-1 uppercase">Roster Cible</label>
              <select 
                value={formData.target_roster}
                onChange={e => setFormData({...formData, target_roster: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-gowrax-neon transition-colors"
              >
                <option value="Academy">Academy</option>
                <option value="Chill">Chill Roster</option>
                <option value="Tryhard">Tryhard Roster</option>
                <option value="High Roster">High Roster (Elite)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] font-techMono text-gray-400 mb-1 uppercase">Âge</label>
              <input 
                type="number" 
                value={formData.age}
                onChange={e => setFormData({...formData, age: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-gowrax-neon transition-colors"
                placeholder="Ex: 19"
              />
            </div>

            <div>
              <label className="block text-[10px] font-techMono text-gray-400 mb-1 uppercase">Riot ID (Pseudo)</label>
              <input 
                type="text" 
                value={formData.valorant_name}
                onChange={e => setFormData({...formData, valorant_name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-gowrax-neon transition-colors"
                placeholder="Ex: Tenz"
              />
            </div>

            <div>
              <label className="block text-[10px] font-techMono text-gray-400 mb-1 uppercase">Tagline (Riot)</label>
              <input 
                type="text" 
                value={formData.valorant_tag}
                onChange={e => setFormData({...formData, valorant_tag: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-gowrax-neon transition-colors"
                placeholder="Ex: 0000"
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-2">
              <label className="block text-[10px] font-techMono text-gray-400 uppercase">Jours Disponibles par semaine</label>
              <input 
                type="range" 
                min="1" max="7" 
                value={formData.availability_days}
                onChange={e => setFormData({...formData, availability_days: e.target.value})}
                className="w-full accent-gowrax-neon bg-gray-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="text-center text-xs text-white font-bold">{formData.availability_days} Jours (Soirées incluses)</div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-techMono text-gray-400 mb-1 uppercase">Motivation / Tracker.gg</label>
              <textarea 
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-gowrax-neon transition-colors h-24"
                placeholder="Collez ici votre lien Tracker.gg et vos motivations..."
              />
            </div>
          </div>

          <button 
            onClick={evaluateDossier}
            disabled={!formData.valorant_name || !formData.valorant_tag || !formData.age || evalLoading}
            className="w-full py-4 bg-gradient-to-r from-teal-500/20 to-gowrax-neon/20 border border-teal-500/50 hover:bg-teal-500 hover:text-white rounded-xl font-rajdhani font-bold text-lg transition-all tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3"
          >
            {evalLoading ? (
              <><span className="w-4 h-4 rounded-full border-2 border-t-white border-white/30 animate-spin"></span> LANCEMENT DE L'IA D'ÉVALUATION</>
            ) : (
              '1. PRÉ-ÉVALUATION DU DOSSIER'
            )}
          </button>

          {/* AI EVALUATION RESULT */}
          {aiEval && !evalLoading && (
            <div className="mt-6 p-5 border rounded-xl bg-black/60 relative overflow-hidden animate-fade-in
              ${aiEval.status === 'APPROVED_BY_AI' ? 'border-green-500/50' : aiEval.status === 'MANUAL_REVIEW' ? 'border-yellow-500/50' : 'border-red-500/50'}">
              
              <div className="flex justify-between items-center mb-4">
                <span className="font-techMono text-xs text-gray-400">RAPPORT D'ANALYSE SYSTÈME</span>
                <span className={`px-3 py-1 font-bold text-[10px] rounded-full font-techMono tracking-widest
                  ${aiEval.status === 'APPROVED_BY_AI' ? 'bg-green-500/20 text-green-400' : aiEval.status === 'MANUAL_REVIEW' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                  {aiEval.status}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {aiEval.reasons.map((r, i) => (
                  <div key={i} className="flex gap-3 text-xs md:text-sm items-start">
                    <span className={`mt-0.5 ${r.type === 'success' ? 'text-green-500' : r.type === 'warning' ? 'text-yellow-500' : 'text-red-500'}`}>
                      {r.type === 'success' ? '✓' : r.type === 'warning' ? '⚠️' : '❌'}
                    </span>
                    <span className="text-gray-300 font-poppins">{r.text}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={submitDossier}
                className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-rajdhani font-bold text-white transition-all uppercase tracking-widest"
              >
                2. SOUMETTRE AUX RECRUTEURS / COACHS
              </button>
            </div>
          )}
        </div>
      )}

      {/* VUE JOUEUR : DOSSIER EN COURS */}
      {myPromotion && (
        <div className="bg-black/40 border border-teal-500/30 rounded-2xl p-6 backdrop-blur-xl mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-rajdhani text-xl font-bold text-white uppercase">VOTRE DEMANDE : {myPromotion.target_roster}</h3>
            <span className={`px-3 py-1 text-xs font-bold font-techMono rounded-full uppercase
              ${myPromotion.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 
                myPromotion.status === 'accepted' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 
                'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
              {myPromotion.status === 'pending' ? 'EN ATTENTE STAFF' : myPromotion.status === 'accepted' ? 'APPROUVÉ' : 'REFUSÉ'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm bg-white/5 p-4 rounded-xl">
            <div><span className="text-gray-500 font-techMono text-[10px] block">Riot ID</span>{myPromotion.valorant_id}</div>
            <div><span className="text-gray-500 font-techMono text-[10px] block">Rank API Capture</span>{myPromotion.rank_snapshot}</div>
            <div><span className="text-gray-500 font-techMono text-[10px] block">IA Score</span><span className="text-teal-400">{myPromotion.ai_score}/100</span></div>
            <div><span className="text-gray-500 font-techMono text-[10px] block">Dispo. Enregistrée</span>{myPromotion.availability} J/Semaine</div>
          </div>
        </div>
      )}

      {/* VUE STAFF / FONDA / COACH */}
      {(isStaff || isCoach || isFounder) && (
        <div className="flex flex-col gap-6">
          <div className="bg-teal-900/10 border border-teal-500/30 p-6 rounded-2xl relative overflow-hidden shadow-[0_0_30px_rgba(20,184,166,0.1)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-rajdhani text-2xl font-bold text-teal-400 tracking-wide">PANEL RECRUTEMENTS & PROMOTIONS</h3>
              <div className="px-3 py-1 bg-teal-500/10 border border-teal-500/30 rounded-full font-techMono text-[10px] text-teal-300">
                {isFounder ? 'CEO ACCESS' : 'COACH ACCESS'}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {promotions.length === 0 ? (
                <div className="p-8 text-center bg-black/40 rounded-xl border border-white/5">
                  <p className="text-gray-500 font-techMono text-xs animate-pulse">AUCUN DOSSIER EN ATTENTE / BASE NON INITIALISÉE</p>
                  <p className="text-[10px] text-gray-600 mt-2">Nécessite la table 'promotions' sur Supabase.</p>
                </div>
              ) : (
                promotions.map(promo => (
                  <div key={promo.id} className="p-4 bg-black/60 rounded-xl border border-white/10 hover:border-teal-500/50 transition-colors flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-white text-lg">{promo.user_name}</h4>
                        <span className="font-techMono text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300">ÂGE: {promo.age}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                          ${promo.ai_score >= 80 ? 'bg-green-500/20 text-green-400' : promo.ai_score >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                          Score: {promo.ai_score}/100
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                        <div className="bg-white/5 p-2 rounded text-xs"><span className="text-gray-500 block text-[9px] uppercase">Roster Demandé</span>{promo.target_roster}</div>
                        <div className="bg-white/5 p-2 rounded text-xs"><span className="text-gray-500 block text-[9px] uppercase">Riot ID</span>{promo.valorant_id}</div>
                        <div className="bg-white/5 p-2 rounded text-xs"><span className="text-gray-500 block text-[9px] uppercase">Rank Estimé</span>{promo.rank_snapshot}</div>
                        <div className="bg-white/5 p-2 rounded text-xs"><span className="text-gray-500 block text-[9px] uppercase">Disponibilité</span>{promo.availability}j/sem</div>
                      </div>

                      <p className="text-[11px] text-gray-400 italic bg-white/[0.02] p-2 rounded border border-white/5">"{promo.notes}"</p>
                    </div>

                    <div className="flex md:flex-col gap-2 justify-center min-w-[140px]">
                      {promo.status === 'pending' ? (
                        <>
                          <button onClick={() => updateDossierStatus(promo.id, 'accepted')} className="flex-1 py-2 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white border border-green-500/30 rounded-lg text-xs font-bold uppercase transition-colors">Accepter</button>
                          <button onClick={() => updateDossierStatus(promo.id, 'declined')} className="flex-1 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 rounded-lg text-xs font-bold uppercase transition-colors">Refuser</button>
                        </>
                      ) : (
                        <div className={`p-3 text-center border rounded-lg font-bold text-xs uppercase
                          ${promo.status === 'accepted' ? 'border-green-500/50 text-green-500 bg-green-500/10' : 'border-red-500/50 text-red-500 bg-red-500/10'}`}>
                          {promo.status}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
