import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function CoachingHub({ session, isStaff, isCoach }) {
  const [myGoals, setMyGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vue Staff
  const [profiles, setProfiles] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerGoals, setPlayerGoals] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '' });

  useEffect(() => {
    // Si c'est un joueur classique, il voit ses propres objectifs
    if (!isStaff && !isCoach) {
      fetchMyGoals();
    } else {
      // Si c'est un Staff/Coach, on charge la liste des joueurs
      fetchProfiles();
    }
  }, [isStaff, isCoach, session.user.id]);

  useEffect(() => {
    // Si un Staff regarde un joueur spécifique
    if (selectedPlayer) {
      fetchPlayerGoals(selectedPlayer.id);
    }
  }, [selectedPlayer]);

  const fetchMyGoals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coaching_goals')
      .select('*')
      .eq('player_id', session.user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMyGoals(data);
    }
    setLoading(false);
  };

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .order('username', { ascending: true });

    if (!error && data) {
      setProfiles(data);
      if (data.length > 0) setSelectedPlayer(data[0]); // Sélectionne le 1er par défaut
    }
    setLoading(false);
  };

  const fetchPlayerGoals = async (playerId) => {
    const { data, error } = await supabase
      .from('coaching_goals')
      .select('*')
      .eq('player_id', playerId)
      .order('status', { ascending: false }) // in_progress avant completed
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPlayerGoals(data);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!formData.title || !selectedPlayer) return;

    const { data, error } = await supabase
      .from('coaching_goals')
      .insert({
        player_id: selectedPlayer.id,
        coach_id: session.user.id,
        coach_name: session.user.user_metadata.full_name || session.user.email,
        coach_avatar: session.user.user_metadata.avatar_url,
        title: formData.title,
        description: formData.description,
        status: 'in_progress'
      })
      .select()
      .single();

    if (!error && data) {
      setPlayerGoals([data, ...playerGoals]);
      setFormData({ title: '', description: '' });
    } else {
      alert("Erreur lors de la création de l'objectif. (" + (error?.message || 'Inconnue') + ")");
    }
  };

  const updateGoalStatus = async (goalId, newStatus) => {
    // Optimistic UI update
    setPlayerGoals(prev => prev.map(g => g.id === goalId ? { ...g, status: newStatus } : g));
    setMyGoals(prev => prev.map(g => g.id === goalId ? { ...g, status: newStatus } : g));

    const { error } = await supabase
      .from('coaching_goals')
      .update({ status: newStatus })
      .eq('id', goalId);

    if (error) {
      console.error("Erreur de MAJ:", error);
      // Refresh to cancel optimism if failed
      if (selectedPlayer) fetchPlayerGoals(selectedPlayer.id);
      else fetchMyGoals();
    }
  };

  const deleteGoal = async (goalId) => {
    if (!window.confirm("Supprimer cet objectif tactique ?")) return;

    setPlayerGoals(prev => prev.filter(g => g.id !== goalId));
    await supabase.from('coaching_goals').delete().eq('id', goalId);
  };

  // --- COMPOSANT : CARTE OBJECTIF ---
  const GoalCard = ({ goal, isStaffView }) => (
    <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${goal.status === 'completed' ? 'bg-green-900/10 border-green-500/20' : goal.status === 'failed' ? 'bg-red-900/10 border-red-500/20' : 'bg-white/[0.03] border-white/10 hover:border-gowrax-purple/50'}`}>
        
        {/* Encart Coach (Traçabilité demandée) */}
        <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
                <img src={goal.coach_avatar || 'https://via.placeholder.com/30'} alt="Coach" className={`w-6 h-6 rounded-full border ${goal.status === 'completed' ? 'border-green-500/50' : 'border-gowrax-purple/50'}`} />
                <div className="flex flex-col">
                    <span className="text-[9px] font-techMono text-gray-500 uppercase leading-none">Assigné par</span>
                    <span className="text-xs font-rajdhani font-bold text-gray-300 shadow-sm">{goal.coach_name || 'Coach Inconnu'}</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span className={`text-[10px] font-techMono px-2 py-0.5 rounded-full border ${goal.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : goal.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-gowrax-purple/20 text-gowrax-purple border-gowrax-purple/30'}`}>
                    {goal.status === 'completed' ? '✅ Atteint' : goal.status === 'failed' ? '❌ Échoué' : '⌛ En cours'}
                </span>
                {isStaffView && (
                    <button onClick={() => deleteGoal(goal.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                )}
            </div>
        </div>

        <h4 className={`text-lg font-rajdhani font-bold mb-1 ${goal.status === 'completed' ? 'text-green-100 line-through opacity-70' : 'text-white'}`}>{goal.title}</h4>
        {goal.description && (
            <p className="text-xs font-poppins text-gray-400 whitespace-pre-wrap leading-relaxed">{goal.description}</p>
        )}

        {/* Actions */}
        {isStaffView && goal.status === 'in_progress' && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                <button onClick={() => updateGoalStatus(goal.id, 'completed')} className="flex-1 py-1.5 text-xs font-techMono bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500 hover:text-white transition-colors">
                    Marquer Validé
                </button>
                <button onClick={() => updateGoalStatus(goal.id, 'failed')} className="flex-1 py-1.5 text-xs font-techMono bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                    Marquer Échoué
                </button>
            </div>
        )}
        
        {/* Le Joueur ou Coach peut repasser un objectif validé "En cours" */}
        {isStaffView && goal.status !== 'in_progress' && (
             <div className="mt-4 pt-4 border-t border-white/5">
                <button onClick={() => updateGoalStatus(goal.id, 'in_progress')} className="w-full py-1.5 text-[10px] font-techMono text-gray-500 hover:text-white border border-white/5 rounded-lg hover:bg-white/5 transition-colors">
                    Remettre en cours
                </button>
             </div>
        )}
    </div>
  );

  // ==========================================
  // RENDU PRINCIPAL
  // ==========================================
  if (loading && (!profiles.length && myGoals.length === 0)) {
    return <div className="text-center p-10 font-techMono animate-pulse">INIT COACHING SYSTEM...</div>;
  }

  // --- VUE JOUEUR (Mes Objectifs Actuels) ---
  if (!isStaff && !isCoach) {
    return (
        <div className="flex flex-col h-full animate-fade-in pb-16">
             <div className="mb-6 flex justify-between items-end">
                <div>
                    <h3 className="font-rajdhani text-2xl font-bold tracking-wide">MES OBJECTIFS <span className="text-gowrax-neon">TACTIQUES</span></h3>
                    <p className="font-poppins text-sm text-gray-400">Consignes et axes de progression fixés par le Staff GOWRAX.</p>
                </div>
            </div>

            {myGoals.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="w-16 h-16 bg-gowrax-purple/20 rounded-full flex items-center justify-center mb-4 border border-gowrax-purple/30">
                        <svg className="w-8 h-8 text-gowrax-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h4 className="font-rajdhani text-xl font-bold text-white mb-2">Aucun objectif actif</h4>
                    <p className="text-sm font-poppins text-gray-500 max-w-sm">Tu n'as pas de focus d'entraînement assigné pour le moment. Rapproche-toi de ton coach en Pracc !</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Objectifs en cours d'abord */}
                    {myGoals.filter(g => g.status === 'in_progress').map(goal => <GoalCard key={goal.id} goal={goal} isStaffView={false} />)}
                    {/* Objectifs terminés/échoués ensuite */}
                    {myGoals.filter(g => g.status !== 'in_progress').map(goal => <GoalCard key={goal.id} goal={goal} isStaffView={false} />)}
                </div>
            )}
        </div>
    );
  }

  // --- VUE STAFF / COACH (Mode Mentorat) ---
  return (
    <div className="flex flex-col md:flex-row h-[75vh] md:h-[80vh] bg-black/40 border border-white/10 rounded-2xl overflow-hidden animate-fade-in shadow-2xl">
        
        {/* Colonne Gauche : Sélection du Joueur */}
        <div className="w-full md:w-80 bg-black/60 border-b md:border-b-0 md:border-r border-white/10 flex flex-col">
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-gowrax-purple/10 to-transparent">
                <h3 className="font-rajdhani font-bold text-lg text-white">MODE MENTORAT</h3>
                <p className="text-[10px] font-techMono text-gray-500 uppercase">Sélection du Viseur</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {profiles.map(profile => (
                    <button
                        key={profile.id}
                        onClick={() => setSelectedPlayer(profile)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${selectedPlayer?.id === profile.id ? 'bg-gowrax-purple border-gowrax-neon border shadow-[0_0_15px_rgba(214,47,127,0.3)]' : 'bg-transparent border border-transparent hover:bg-white/5'}`}
                    >
                        <img src={profile.avatar_url || 'https://via.placeholder.com/40'} alt={profile.username} className="w-10 h-10 rounded-full bg-black/50 object-cover border border-white/20"/>
                        <span className="font-rajdhani font-bold text-sm text-left truncate">{profile.username}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* Colonne Droite : Objectifs du Joueur et Formulaire */}
        <div className="flex-1 flex flex-col relative bg-gradient-to-br from-transparent to-black/80">
            {selectedPlayer ? (
                <>
                    {/* Header Joueur Sélectionné */}
                    <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
                        <img src={selectedPlayer.avatar_url || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded-xl object-cover shadow-[0_0_10px_rgba(255,255,255,0.1)] border border-white/20"/>
                        <div>
                            <h2 className="font-rajdhani text-2xl font-bold">{selectedPlayer.username}</h2>
                            <p className="text-xs font-techMono text-gowrax-neon">FOCUS & OBJECTIFS</p>
                        </div>
                    </div>

                    {/* Liste des objectifs  */}
                    <div className="flex-1 p-6 overflow-y-auto basis-2/3">
                        {playerGoals.length === 0 ? (
                             <p className="text-center text-gray-500 font-poppins pt-10 text-sm">Ce joueur n'a aucun objectif assigné.</p>
                        ) : (
                            <div className="grid grid-col-1 lg:grid-cols-2 gap-4">
                                {playerGoals.map(goal => <GoalCard key={goal.id} goal={goal} isStaffView={true} />)}
                            </div>
                        )}
                    </div>

                    {/* Formulaire d'Assignation Rapide */}
                    <div className="p-6 border-t border-white/10 bg-black/50 basis-1/3">
                        <p className="text-[10px] font-techMono uppercase text-gowrax-purple mb-3 tracking-widest">// ASSIGNER UN NOUVEL OBJECTIF</p>
                        <form onSubmit={handleCreateGoal} className="flex flex-col gap-3">
                            <input 
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder="Ex: Crosshair Placement (Head level)" 
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-rajdhani font-bold text-white focus:outline-none focus:border-gowrax-purple transition-colors placeholder:text-gray-600"
                            />
                            <div className="flex gap-3">
                                <textarea 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Détails tactiques et remarques des VODs à corriger..." 
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-poppins text-white focus:outline-none focus:border-gowrax-purple transition-colors h-14 resize-none placeholder:text-gray-600"
                                />
                                <button type="submit" className="w-32 bg-gowrax-purple hover:bg-gowrax-neon text-white font-rajdhani font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(111,45,189,0.4)] flex items-center justify-center">
                                    ASSiGNER
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 font-techMono text-sm animate-pulse">
                    EN ATTENTE DE SÉLECTION...
                </div>
            )}
        </div>
    </div>
  );
}
