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
  const [editIcon, setEditIcon] = useState('🎯');
  const [editRevealSoon, setEditRevealSoon] = useState(false); // Nouveau state

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
      reveal_soon: editRevealSoon // Sauvegarde du statut
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
    setEditIcon(objective?.icon || '🎯');
    setEditRevealSoon(objective?.reveal_soon || false);
    setIsEditing(true);
  };

  if (loading) return null;

  if (isEditing && (isStaff || isCoach)) {
    return (
      <div className="bg-gowrax-void border border-gowrax-purple/50 rounded-2xl p-4 mb-6 shadow-[0_0_20px_rgba(111,45,189,0.3)] animate-fade-in">
        <h3 className="font-rajdhani font-bold text-xl text-white mb-4 uppercase tracking-tighter text-center">Éditer le Cap de la Saison</h3>
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input type="text" value={editIcon} onChange={(e) => setEditIcon(e.target.value)} className="w-16 bg-black/50 border border-gray-600 rounded p-2 text-white font-techMono text-center" maxLength={2} />
            <input type="text" required value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="TITRE DE L'OBJECTIF" className="flex-1 bg-black/50 border border-gray-600 rounded p-2 text-white font-rajdhani font-bold uppercase" />
          </div>
          
          <textarea required value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full bg-black/50 border border-gray-600 rounded p-2 text-sm text-white font-poppins" rows="3" />
          
          <div className="flex flex-col md:flex-row gap-4 items-center bg-black/30 p-3 rounded-xl border border-white/5">
            <div className="flex-1 w-full">
              <label className="text-[10px] font-techMono text-gray-500 mb-1 block">DATE D'ÉCHÉANCE</label>
              <input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} disabled={editRevealSoon} className="w-full bg-black/50 border border-gray-600 rounded p-2 text-white disabled:opacity-30 transition-opacity" />
            </div>
            
            <div className="flex items-center gap-3 px-4 py-2 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setEditRevealSoon(!editRevealSoon)}>
               <input type="checkbox" checked={editRevealSoon} onChange={(e) => setEditRevealSoon(e.target.checked)} className="accent-gowrax-neon w-4 h-4" />
               <span className="text-xs font-rajdhani font-bold text-white uppercase italic">Révélé prochainement</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2">
             <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-xs font-techMono text-gray-400">ANNULER</button>
             <button type="submit" className="px-6 py-2 bg-gowrax-purple text-white font-rajdhani font-bold rounded hover:bg-gowrax-neon transition-all">VALIDER LE CAP</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-black via-gowrax-purple/20 to-black border border-gowrax-purple/50 rounded-2xl p-1 mb-8 shadow-[0_0_40px_rgba(111,45,189,0.2)] animate-pulse-glow relative group">
      <div className="bg-gowrax-void/90 backdrop-blur-xl rounded-xl p-5 md:p-8 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        
        <div className="absolute -top-1 left-10 bg-gowrax-neon px-3 py-1 rounded-b-lg shadow-[0_0_15px_#D62F7F]">
          <span className="font-techMono text-[10px] text-white font-bold tracking-[0.2em]">VISION SAISONNIÈRE</span>
        </div>

        <div className="relative shrink-0 hidden md:block">
            <div className="absolute inset-0 bg-gowrax-neon/20 blur-xl rounded-full"></div>
            <div className="w-20 h-20 rounded-full bg-black/40 border-2 border-gowrax-neon items-center justify-center text-4xl shadow-[0_0_20px_rgba(214,47,127,0.4)] flex relative z-10">
            {objective?.icon || '🎯'}
            </div>
        </div>
        
        <div className="flex-1 text-center md:text-left mt-2 md:mt-0">
          <div className="mb-1">
            <span className="font-rockSalt text-gowrax-neon text-xs opacity-80">Objectif de Structure</span>
          </div>
          <h2 className="font-rajdhani text-3xl md:text-4xl font-black text-white tracking-tighter uppercase leading-none">
            {objective?.title || 'DÉFINITION DU CAP EN COURS'}
          </h2>
          <p className="text-gray-400 font-poppins text-base mt-2 max-w-3xl italic">
            "{objective?.description || 'Le staff prépare les prochaines étapes de la structure.'}"
          </p>
        </div>

        {/* Bloc Deadline Dynamique ou Teasing */}
        {(objective?.deadline || objective?.reveal_soon) && (
          <div className="shrink-0 flex flex-col items-center justify-center bg-gowrax-neon/10 border border-gowrax-neon/40 rounded-xl p-4 min-w-[160px] backdrop-blur-sm relative overflow-hidden group-hover:border-gowrax-neon transition-colors">
            <span className="text-[10px] font-techMono text-gowrax-neon uppercase font-bold mb-1 tracking-widest">ÉCHÉANCE</span>
            
            {objective.reveal_soon ? (
              <div className="flex flex-col items-center">
                <span className="font-rajdhani font-black text-white text-xl italic animate-pulse">COMING SOON</span>
                <span className="text-[8px] font-techMono text-gray-500 mt-1 uppercase">Transmission en cours</span>
              </div>
            ) : (
              <span className="font-rajdhani font-black text-white text-2xl">
                {new Date(objective.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
              </span>
            )}
          </div>
        )}

        {(isStaff || isCoach) && (
          <button onClick={openEdit} className="absolute top-4 right-4 p-2 bg-white/5 border border-white/10 rounded-full text-gray-500 hover:text-gowrax-neon opacity-0 group-hover:opacity-100 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          </button>
        )}
      </div>
    </div>
  );
}