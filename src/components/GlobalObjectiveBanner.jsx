import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function GlobalObjectiveBanner({ isStaff, isCoach }) {
  const [objective, setObjective] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editIcon, setEditIcon] = useState('🌸');
  const [editRevealSoon, setEditRevealSoon] = useState(false); 

  useEffect(() => {
    fetchObjective();
  }, []);

  const fetchObjective = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('global_objective')
      .select('*')
      .single();

    if (!error && data) {
      setObjective(data);
    }
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      title: editTitle,
      description: editDescription,
      deadline: editDeadline || null,
      icon: editIcon,
      reveal_soon: editRevealSoon 
    };

    let result;
    if (objective?.id) {
      result = await supabase.from('global_objective').update(payload).eq('id', objective.id).select().single();
    } else {
      result = await supabase.from('global_objective').insert([payload]).select().single();
    }

    if (!result.error && result.data) {
      setObjective(result.data);
      setIsEditing(false);
    }
  };

  const openEdit = () => {
    setEditTitle(objective?.title || '');
    setEditDescription(objective?.description || '');
    setEditDeadline(objective?.deadline ? new Date(objective.deadline).toISOString().split('T')[0] : '');
    setEditIcon(objective?.icon || '🌸');
    setEditRevealSoon(objective?.reveal_soon || false);
    setIsEditing(true);
  };

  if (loading) return null;

  // ==========================================
  // MODE ÉDITION (STAFF / COACH)
  // ==========================================
  if (isEditing && (isStaff || isCoach)) {
    return (
      <div className="bg-[#1A1C2E]/90 backdrop-blur-2xl border border-[#B185DB]/40 rounded-3xl p-6 md:p-8 mb-8 shadow-[0_20px_50px_rgba(177,133,219,0.2)] animate-fade-in w-full max-w-[1400px] mx-auto relative overflow-hidden">
        
        {/* Lueur de fond édition */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#B185DB]/10 blur-[60px] rounded-full pointer-events-none"></div>

        <h3 className="font-rajdhani font-bold text-2xl text-white mb-6 uppercase tracking-widest text-center flex items-center justify-center gap-3 relative z-10">
          <svg className="w-6 h-6 text-[#F7CAD0]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          Éditer le Cap de la Saison
        </h3>
        
        <form onSubmit={handleSave} className="flex flex-col gap-5 relative z-10">
          <div className="flex gap-4">
            <div className="flex flex-col gap-1 w-24 shrink-0">
               <label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest pl-1">Icône</label>
               <input type="text" value={editIcon} onChange={(e) => setEditIcon(e.target.value)} className="w-full bg-black/40 border border-white/10 hover:border-white/20 rounded-xl p-3 text-white font-techMono text-center focus:border-[#B185DB] outline-none transition-colors shadow-inner" maxLength={2} />
            </div>
            <div className="flex flex-col gap-1 flex-1">
               <label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest pl-1">Titre de l'objectif</label>
               <input type="text" required value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Ex: QUALIFICATION VCT" className="w-full bg-black/40 border border-white/10 hover:border-white/20 rounded-xl p-3 text-white font-rajdhani font-bold text-lg uppercase focus:border-[#B185DB] outline-none transition-colors shadow-inner" />
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest pl-1">Description</label>
            <textarea required value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full bg-black/40 border border-white/10 hover:border-white/20 rounded-xl p-4 text-sm text-white font-poppins focus:border-[#B185DB] outline-none resize-none transition-colors shadow-inner" rows="3" />
          </div>
          
          <div className="flex flex-col md:flex-row gap-5 items-center bg-white/[0.02] p-5 rounded-2xl border border-white/5">
            <div className="flex-1 w-full">
              <label className="text-[10px] font-techMono text-[#A2D2FF] mb-1.5 block uppercase tracking-widest">DATE D'ÉCHÉANCE</label>
              <input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} disabled={editRevealSoon} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white disabled:opacity-30 transition-all focus:border-[#A2D2FF] outline-none [color-scheme:dark]" />
            </div>
            
            <div className="h-10 w-px bg-white/10 hidden md:block mx-2"></div>
            
            <label className="flex items-center gap-3 px-6 py-3 border border-white/10 rounded-xl bg-black/20 hover:bg-black/40 transition-colors cursor-pointer group w-full md:w-auto">
               <input type="checkbox" checked={editRevealSoon} onChange={(e) => setEditRevealSoon(e.target.checked)} className="w-5 h-5 accent-[#B185DB] bg-black/50 border-white/20 rounded cursor-pointer" />
               <span className="text-sm font-rajdhani font-bold text-gray-300 group-hover:text-white uppercase tracking-widest transition-colors mt-0.5">Révélé prochainement (Teasing)</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-4 border-t border-white/5 pt-6">
             <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 text-xs font-techMono text-gray-400 hover:text-white transition-colors">ANNULER</button>
             <button type="submit" className="px-10 py-3 bg-gradient-to-r from-[#B185DB] to-[#F7CAD0] text-[#1A1C2E] font-rajdhani font-extrabold text-lg tracking-widest rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(247,202,208,0.4)]">VALIDER LE CAP</button>
          </div>
        </form>
      </div>
    );
  }

  // ==========================================
  // MODE AFFICHAGE NORMAL (PREMIUM)
  // ==========================================
  return (
    <div className="w-full max-w-[1400px] mx-auto px-2 md:px-0 mt-8 mb-6 animate-fade-in relative z-10 group">
      
      {/* Conteneur principal Glassmorphism */}
      <div className="bg-[#1A1C2E]/60 backdrop-blur-2xl border border-[#F0F2F5]/10 rounded-[2rem] p-6 md:p-10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-500 hover:shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
        
        {/* Lueurs dynamiques en arrière-plan */}
        <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[150%] bg-[#B185DB]/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-[#B185DB]/20 transition-colors duration-700"></div>
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[100%] bg-[#F7CAD0]/5 rounded-full blur-[60px] pointer-events-none"></div>
        
        {/* EN-TÊTE FLOTTANT : Badge + Bouton d'édition (Nouveau placement) */}
        <div className="absolute top-6 right-6 flex items-center gap-3">
            <div className="px-4 py-1.5 rounded-full border border-[#B185DB]/30 bg-[#B185DB]/10 backdrop-blur-md shadow-[0_0_15px_rgba(177,133,219,0.2)]">
                <span className="font-techMono text-[10px] text-[#B185DB] font-bold tracking-[0.2em] uppercase">Vision Saisonnière</span>
            </div>
            
            {(isStaff || isCoach) && (
              <button 
                onClick={openEdit} 
                className="p-1.5 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:text-white hover:bg-[#B185DB]/40 hover:border-[#B185DB]/50 transition-all duration-300 shadow-sm"
                title="Éditer l'objectif"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </button>
            )}
        </div>

        {/* Section Icône */}
        <div className="relative shrink-0 hidden md:flex items-center justify-center mt-4 md:mt-0">
            <div className="absolute inset-0 bg-[#F7CAD0]/20 blur-2xl rounded-full animate-pulse-slow"></div>
            <div className="w-24 h-24 rounded-full bg-black/40 border border-[#F0F2F5]/10 flex items-center justify-center text-5xl shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] relative z-10">
              {objective?.icon || '🌸'}
            </div>
        </div>
        
        {/* Section Texte */}
        <div className="flex-1 text-center md:text-left mt-10 md:mt-0 relative z-10">
          <div className="mb-2">
            <span className="font-rockSalt text-transparent bg-clip-text bg-gradient-to-r from-[#F0F2F5] to-[#F7CAD0] text-sm md:text-base drop-shadow-md">Slow Bloom Phase</span>
          </div>
          <h2 className="font-rajdhani text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-wider uppercase leading-tight drop-shadow-lg pr-0 md:pr-4">
            {objective?.title || 'DÉFINITION DU CAP EN COURS'}
          </h2>
          <p className="text-[#A2D2FF]/80 font-poppins text-sm md:text-base mt-3 max-w-2xl italic leading-relaxed mx-auto md:mx-0">
            "{objective?.description || 'Le système prépare les prochaines étapes de l\'évolution de la structure.'}"
          </p>
        </div>

        {/* Bloc Deadline Dynamique ou Teasing */}
        {(objective?.deadline || objective?.reveal_soon) && (
          <div className="shrink-0 flex flex-col items-center justify-center bg-black/20 border border-white/5 rounded-3xl p-6 min-w-[200px] backdrop-blur-md relative overflow-hidden group-hover:border-[#B185DB]/30 transition-colors duration-500 shadow-inner z-10 mt-6 md:mt-0">
            
            {/* Petit effet brillant interne au bloc deadline */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#F7CAD0]/10 blur-xl rounded-full"></div>

            <span className="text-[10px] font-techMono text-gray-400 uppercase font-bold mb-2 tracking-[0.3em]">Échéance</span>
            
            {objective.reveal_soon ? (
              <div className="flex flex-col items-center">
                <span className="font-rajdhani font-black text-transparent bg-clip-text bg-gradient-to-r from-[#B185DB] to-[#F7CAD0] text-2xl italic animate-pulse tracking-widest drop-shadow-[0_0_10px_rgba(247,202,208,0.3)]">
                  EN ATTENTE
                </span>
                <span className="text-[9px] font-techMono text-[#A2D2FF]/50 mt-2 uppercase tracking-widest flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#A2D2FF] animate-ping"></div>
                   Calculs en cours
                </span>
              </div>
            ) : (
              <span className="font-rajdhani font-black text-white text-3xl tracking-widest drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
                {new Date(objective.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
              </span>
            )}
          </div>
        )}

      </div>
    </div>
  );
}