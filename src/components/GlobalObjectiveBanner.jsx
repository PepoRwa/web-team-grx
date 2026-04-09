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
  const [editIcon, setEditIcon] = useState('🎯'); // Default icon

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
      icon: editIcon
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
    } else {
      console.error("Erreur lors de la sauvegarde de l'objectif:", result.error);
    }
  };

  const openEdit = () => {
    setEditTitle(objective?.title || '');
    setEditDescription(objective?.description || '');
    setEditDeadline(objective?.deadline ? new Date(objective.deadline).toISOString().split('T')[0] : '');
    setEditIcon(objective?.icon || '🎯');
    setIsEditing(true);
  };

  if (loading) return null; // Don't show anything while loading

  if (!isEditing && !objective) {
    if (isStaff || isCoach) {
      return (
        <div className="mb-6 flex justify-center">
           <button onClick={openEdit} className="text-sm text-gowrax-neon border border-gowrax-neon/50 px-4 py-2 rounded-full hover:bg-gowrax-neon/20 transition-colors">
              + DEFINIR UN OBJECTIF GLOBAL
           </button>
        </div>
      );
    }
    return null;
  }

  if (isEditing && (isStaff || isCoach)) {
    return (
      <div className="bg-gowrax-void border border-gowrax-purple/50 rounded-2xl p-4 mb-6 shadow-[0_0_20px_rgba(111,45,189,0.3)] animate-fade-in relative overflow-hidden">
        <h3 className="font-rajdhani font-bold text-xl text-white mb-4">ÉDITER L'OBJECTIF GLOBAL</h3>
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input type="text" value={editIcon} onChange={(e) => setEditIcon(e.target.value)} placeholder="Émoji / Icône" className="w-16 bg-black/50 border border-gray-600 rounded p-2 text-white font-techMono text-center" maxLength={2} />
            <input type="text" required value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Titre de l'objectif (ex: QUALIFICATION VCT)" className="flex-1 bg-black/50 border border-gray-600 rounded p-2 text-white font-rajdhani font-bold" />
          </div>
          <textarea required value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description détaillée..." className="w-full bg-black/50 border border-gray-600 rounded p-2 text-sm text-white font-poppins" rows="3" />
          <input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} className="w-full bg-black/50 border border-gray-600 rounded p-2 text-white [color-scheme:dark]" />
          
          <div className="flex justify-end gap-2 mt-2">
             <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-xs font-techMono text-gray-400 hover:text-white">ANNULER</button>
             <button type="submit" className="px-6 py-2 bg-gowrax-purple text-white font-rajdhani font-bold rounded hover:bg-gowrax-neon transition-colors shadow-[0_0_10px_#6F2DBD]">ENREGISTRER</button>
          </div>
        </form>
      </div>
    );
  }

  if (!objective && !(isStaff || isCoach)) return null;

  return (
    <div className="bg-gradient-to-r from-black via-gowrax-purple/20 to-black border border-gowrax-purple/50 rounded-2xl p-1 mb-6 shadow-[0_0_30px_rgba(111,45,189,0.3)] animate-pulse-glow relative overflow-hidden group">
      {/* Ligne lumineuse animée */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gowrax-neon to-transparent opacity-50"></div>
      
      <div className="bg-gowrax-void/90 backdrop-blur-md rounded-xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-4 md:gap-6 relative">
        {/* Icône */}
        <div className="w-16 h-16 shrink-0 rounded-full bg-gowrax-purple/30 border border-gowrax-purple items-center justify-center text-3xl shadow-[0_0_15px_#6F2DBD] hidden md:flex">
          {objective?.icon || '🎯'}
        </div>
        
        {/* Contenu */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="font-rajdhani text-2xl md:text-3xl font-extrabold text-white tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] flex items-center justify-center md:justify-start gap-2">
            <span className="md:hidden">{objective?.icon || '🎯'}</span>
            {objective?.title || 'AUCUN OBJECTIF ACTUEL'}
          </h2>
          <p className="text-gray-300 font-poppins text-sm mt-1 max-w-2xl">
            {objective?.description || 'En attente de définition par le Staff.'}
          </p>
        </div>

        {/* Deadline */}
        {objective?.deadline && (
          <div className="shrink-0 flex flex-col items-center justify-center bg-black/50 border border-gowrax-neon/30 rounded-lg p-3 min-w-[120px]">
            <span className="text-[10px] font-techMono text-gowrax-neon uppercase tracking-widest mb-1">DEADLINE</span>
            <span className="font-rajdhani font-bold text-white text-lg">
              {new Date(objective.deadline).toLocaleDateString('fr-FR')}
            </span>
          </div>
        )}

        {/* Bouton Edit Staff */}
        {(isStaff || isCoach) && (
          <button 
            onClick={openEdit}
            className="absolute top-2 right-2 p-1.5 bg-black/50 border border-gray-600 rounded text-gray-400 hover:text-white hover:border-white transition-colors opacity-0 group-hover:opacity-100"
            title="Modifier l'objectif global"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          </button>
        )}
      </div>
    </div>
  );
}
