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
    if (!isStaff && !isCoach) {
      fetchMyGoals();
    } else {
      fetchProfiles();
    }
  }, [isStaff, isCoach, session.user.id]);

  useEffect(() => {
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
        .select(`
            id, 
            username, 
            avatar_url,
            user_roles (
                roles (
                    name
                )
            )
        `)
        .order('username');

    if (data && !error) {
        const formattedProfiles = data.map(profile => {
            const rolesList = profile.user_roles?.map(ur => ur.roles?.name).filter(Boolean) || [];
            const isStaffOrCoach = rolesList.some(r => ['Fondateurs', 'Staff', 'Chef du Staff', 'Coach', 'Head Coach'].includes(r));
            const teamRole = rolesList.find(r => r.toLowerCase().includes('roster') || r.includes('Team '));
            
            return { ...profile, rolesList, isStaffOrCoach, teamRole };
        });
        
        const sorted = formattedProfiles.sort((a, b) => {
            if (a.isStaffOrCoach && !b.isStaffOrCoach) return 1;
            if (!a.isStaffOrCoach && b.isStaffOrCoach) return -1;
            return (a.username || '').localeCompare(b.username || '');
        });
        
        setProfiles(sorted);
    }
    setLoading(false);
  };

  const fetchPlayerGoals = async (playerId) => {
    const { data, error } = await supabase
      .from('coaching_goals')
      .select('*')
      .eq('player_id', playerId)
      .order('status', { ascending: false }) 
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
      await supabase.from('notifications').insert({
        type: 'personal',
        user_id: selectedPlayer.id, 
        title: '🎯 Nouvel Objectif de Coaching',
        message: `Ton coach **${session.user.user_metadata.full_name || 'Staff GOWRAX'}** t'a assigné un nouvel objectif tactique :\n\n**Objectif :** ${formData.title}\n**Détails :** ${formData.description || 'Aucun détail supplémentaire'}\n\n*Consulte ton espace personnel sur le site pour suivre ta progression.*`
      });

      setPlayerGoals([data, ...playerGoals]);
      setFormData({ title: '', description: '' });
    } else {
      alert("Erreur lors de la création de l'objectif.");
    }
  };

  const updateGoalStatus = async (goalId, newStatus) => {
    setPlayerGoals(prev => prev.map(g => g.id === goalId ? { ...g, status: newStatus } : g));
    setMyGoals(prev => prev.map(g => g.id === goalId ? { ...g, status: newStatus } : g));

    const { error } = await supabase.from('coaching_goals').update({ status: newStatus }).eq('id', goalId);

    if (error) {
      if (selectedPlayer) fetchPlayerGoals(selectedPlayer.id);
      else fetchMyGoals();
    }
  };

  const deleteGoal = async (goalId) => {
    if (!window.confirm("Supprimer cet objectif tactique ?")) return;
    setPlayerGoals(prev => prev.filter(g => g.id !== goalId));
    await supabase.from('coaching_goals').delete().eq('id', goalId);
  };

  // ==========================================
  // COMPOSANT : CARTE OBJECTIF (Premium Style)
  // ==========================================
  const GoalCard = ({ goal, isStaffView }) => (
    <div className={`p-6 rounded-[1.5rem] border backdrop-blur-md transition-all duration-300 relative overflow-hidden group shadow-lg
        ${goal.status === 'completed' ? 'bg-green-900/10 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 
          goal.status === 'failed' ? 'bg-red-900/10 border-red-500/30' : 
          'bg-white/[0.02] border-white/10 hover:border-[#B185DB]/50 hover:shadow-[0_10px_30px_rgba(177,133,219,0.1)]'}`}>
        
        {/* Glow Ligne de côté */}
        {goal.status === 'in_progress' && (
            <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-[1.5rem] bg-gradient-to-b from-[#B185DB] to-[#A2D2FF] opacity-50 group-hover:opacity-100 transition-opacity"></div>
        )}

        <div className="flex justify-between items-start mb-4 pl-2">
            <div className="flex items-center gap-3">
                <img src={goal.coach_avatar || 'https://via.placeholder.com/30'} alt="Coach" className={`w-8 h-8 rounded-full border ${goal.status === 'completed' ? 'border-green-500/50' : 'border-[#B185DB]/50'} object-cover`} />
                <div className="flex flex-col">
                    <span className="text-[9px] font-techMono text-gray-500 uppercase tracking-widest leading-none mb-0.5">Assigné par</span>
                    <span className="text-sm font-rajdhani font-bold text-gray-200">{goal.coach_name || 'Coach Inconnu'}</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span className={`text-[10px] font-techMono px-3 py-1 rounded-lg border uppercase tracking-widest ${
                    goal.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 
                    goal.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 
                    'bg-[#B185DB]/10 text-[#B185DB] border-[#B185DB]/30'
                }`}>
                    {goal.status === 'completed' ? '✅ Atteint' : goal.status === 'failed' ? '❌ Échoué' : '⌛ En cours'}
                </span>
                
                {isStaffView && (
                    <button onClick={() => deleteGoal(goal.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-lg transition-all ml-1 border border-transparent hover:border-red-500/30">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                )}
            </div>
        </div>

        <div className="pl-2">
            <h4 className={`text-xl font-rajdhani font-bold mb-2 tracking-wide ${goal.status === 'completed' ? 'text-green-100/70 line-through' : 'text-white'}`}>{goal.title}</h4>
            {goal.description && (
                <p className={`text-sm font-poppins whitespace-pre-wrap leading-relaxed ${goal.status === 'completed' ? 'text-gray-500' : 'text-gray-400'}`}>{goal.description}</p>
            )}
        </div>

        {/* Actions Rapides Coach */}
        {isStaffView && goal.status === 'in_progress' && (
            <div className="flex gap-3 mt-6 pt-4 border-t border-white/5 pl-2">
                <button onClick={() => updateGoalStatus(goal.id, 'completed')} className="flex-1 py-2 text-xs font-techMono tracking-widest bg-green-500/5 text-green-400 border border-green-500/30 rounded-xl hover:bg-green-500 hover:text-white hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all">
                    ✓ VALIDER
                </button>
                <button onClick={() => updateGoalStatus(goal.id, 'failed')} className="flex-1 py-2 text-xs font-techMono tracking-widest bg-red-500/5 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all">
                    ✗ ÉCHOUER
                </button>
            </div>
        )}
        
        {isStaffView && goal.status !== 'in_progress' && (
             <div className="mt-5 pt-4 border-t border-white/5 pl-2">
                <button onClick={() => updateGoalStatus(goal.id, 'in_progress')} className="w-full py-2 text-xs font-techMono tracking-widest text-gray-500 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 hover:border-[#A2D2FF]/50 transition-all flex items-center justify-center gap-2">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    RESTAURER
                </button>
             </div>
        )}
    </div>
  );

  // ==========================================
  // RENDU PRINCIPAL
  // ==========================================
  if (loading && (!profiles.length && myGoals.length === 0)) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-12 h-12 border-4 border-[#B185DB] border-t-transparent rounded-full animate-spin mb-4"></div>
            <span className="font-techMono text-xs text-[#B185DB] uppercase tracking-[0.3em] animate-pulse">INIT MENTORAT...</span>
        </div>
    );
  }

  // --- VUE JOUEUR (Mes Objectifs Actuels) ---
  if (!isStaff && !isCoach) {
    return (
        <div className="flex flex-col h-full animate-fade-in pb-16 px-4 md:px-0">
             <div className="mb-8 flex justify-between items-end border-b border-white/10 pb-6">
                <div>
                    <h3 className="font-rajdhani text-3xl md:text-4xl font-black tracking-wide text-white drop-shadow-md">
                        MES OBJECTIFS <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A2D2FF] to-[#B185DB]">TACTIQUES</span>
                    </h3>
                    <p className="font-poppins text-sm text-[#A2D2FF]/80 mt-2">Consignes et axes de progression fixés par le Staff GOWRAX.</p>
                </div>
            </div>

            {myGoals.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-[#1A1C2E]/40 backdrop-blur-md border border-white/5 rounded-[2rem] shadow-inner">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#1A1C2E] to-[#B185DB]/20 rounded-full flex items-center justify-center mb-6 border border-[#B185DB]/30 shadow-[0_0_20px_rgba(177,133,219,0.1)]">
                        <svg className="w-10 h-10 text-[#B185DB]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h4 className="font-rajdhani text-2xl font-bold text-white mb-3 tracking-widest">AUCUN OBJECTIF ACTIF</h4>
                    <p className="text-sm font-poppins text-gray-400 max-w-md leading-relaxed">Tu n'as pas de focus d'entraînement assigné pour le moment. Rapproche-toi de ton coach en Pracc pour faire évoluer ton jeu !</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {myGoals.filter(g => g.status === 'in_progress').map(goal => <GoalCard key={goal.id} goal={goal} isStaffView={false} />)}
                    {myGoals.filter(g => g.status !== 'in_progress').map(goal => <GoalCard key={goal.id} goal={goal} isStaffView={false} />)}
                </div>
            )}
        </div>
    );
  }

  // --- VUE STAFF / COACH (Mode Mentorat Premium) ---
  return (
    <div className="flex flex-col md:flex-row h-[80vh] min-h-[600px] bg-[#1A1C2E]/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] overflow-hidden animate-fade-in shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
        
        {/* Colonne Gauche : Sélection du Joueur */}
        <div className={`w-full md:w-96 lg:w-[28rem] flex-shrink-0 bg-[#0D0E15]/80 border-b md:border-b-0 md:border-r border-white/10 flex-col ${selectedPlayer ? 'hidden md:flex' : 'flex'} h-full md:h-auto`}>
            
            <div className="p-6 md:p-8 border-b border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
                <h3 className="font-rajdhani font-bold text-2xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">MENTORAT</h3>
                <p className="text-[10px] font-techMono text-[#A2D2FF] uppercase tracking-[0.3em] mt-1">Sélection de l'Agent</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {profiles.map(profile => (
                    <button
                        key={profile.id}
                        onClick={() => setSelectedPlayer(profile)}
                        className={`w-full flex items-center gap-4 p-4 rounded-[1rem] transition-all duration-300 ${
                            selectedPlayer?.id === profile.id 
                            ? 'bg-gradient-to-r from-[#B185DB]/20 to-transparent border border-[#B185DB]/40 shadow-[0_0_20px_rgba(177,133,219,0.2)]' 
                            : 'bg-transparent border border-transparent hover:bg-white/[0.03] hover:border-white/10'
                        }`}
                    >
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt="avatar" className="w-12 h-12 rounded-full border-2 border-white/10 object-cover group-hover:border-[#A2D2FF]/50 transition-colors" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1A1C2E] to-[#6F2DBD] flex items-center justify-center font-bold text-white border-2 border-white/10 group-hover:border-[#A2D2FF]/50 transition-colors shadow-inner">
                                {(profile.username || 'A')[0].toUpperCase()}
                            </div>
                        )}
                        <div className="flex-1 flex flex-col justify-center text-left">
                            <div className="flex justify-between items-center mb-1">
                                <span className={`font-rajdhani font-bold text-lg tracking-wide transition-colors ${selectedPlayer?.id === profile.id ? 'text-white' : 'text-gray-300'}`}>
                                    {profile.username || 'Inconnu'}
                                </span>
                                {profile.teamRole && (
                                    <span className="text-[9px] uppercase font-techMono tracking-widest text-[#F7CAD0] bg-[#F7CAD0]/10 px-2 py-0.5 rounded border border-[#F7CAD0]/30 ml-2 whitespace-nowrap">
                                        {profile.teamRole.replace('Roster ', '')}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs font-poppins text-gray-500">
                                {selectedPlayer?.id === profile.id ? 'Agent en cours d\'analyse' : 'Cliquer pour examiner'}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>

        {/* Colonne Droite : Objectifs du Joueur et Formulaire */}
        <div className={`flex-1 flex-col relative bg-transparent h-full ${selectedPlayer ? 'flex absolute inset-0 md:static z-20 bg-[#1A1C2E] md:bg-transparent' : 'hidden md:flex'}`}>
            {selectedPlayer ? (
                <>
                    {/* Header Joueur Sélectionné (Mobile Friendly + Premium) */}
                    <div className="p-6 md:p-8 border-b border-white/5 flex items-center gap-5 bg-white/[0.02] flex-shrink-0 backdrop-blur-md">
                        <button 
                            className="md:hidden p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors border border-white/10" 
                            onClick={() => setSelectedPlayer(null)}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        </button>
                        
                        <div className="relative">
                            <img src={selectedPlayer.avatar_url || 'https://via.placeholder.com/60'} className="w-14 h-14 md:w-16 md:h-16 rounded-[1rem] object-cover shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/20"/>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#1A1C2E] rounded-full"></div>
                        </div>
                        
                        <div>
                            <h2 className="font-rajdhani text-2xl md:text-3xl font-bold text-white tracking-widest">{selectedPlayer.username}</h2>
                            <p className="text-[10px] md:text-xs font-techMono text-[#A2D2FF] tracking-[0.3em] uppercase mt-1">Dossier Tactique Actif</p>
                        </div>
                    </div>

                    {/* Liste des objectifs  */}
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                        {playerGoals.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-60">
                                <svg className="w-16 h-16 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                                <p className="text-center text-gray-400 font-poppins text-sm tracking-wide">Dossier vierge. Assigner le premier objectif ci-dessous.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-5 pb-4">
                                {playerGoals.map(goal => <GoalCard key={goal.id} goal={goal} isStaffView={true} />)}
                            </div>
                        )}
                    </div>

                    {/* Formulaire d'Assignation Rapide */}
                    <div className="p-6 border-t border-white/5 bg-[#0D0E15]/50 flex-shrink-0 backdrop-blur-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="w-2 h-2 rounded-full bg-[#B185DB] animate-pulse"></span>
                            <p className="text-[10px] font-techMono uppercase text-[#B185DB] tracking-[0.3em]">Créer une Assignation</p>
                        </div>
                        
                        <form onSubmit={handleCreateGoal} className="flex flex-col gap-4">
                            <input 
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder="Titre de l'objectif (Ex: Améliorer le crosshair placement)" 
                                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-5 py-4 text-sm font-rajdhani font-bold text-white focus:outline-none focus:border-[#B185DB] transition-colors placeholder:text-gray-600 placeholder:font-poppins placeholder:font-normal shadow-inner"
                            />
                            <div className="flex flex-col md:flex-row gap-4">
                                <textarea 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Détails tactiques, remarques des VODs à corriger..." 
                                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-5 py-4 text-xs font-poppins text-white focus:outline-none focus:border-[#B185DB] transition-colors h-24 md:h-16 resize-none placeholder:text-gray-600 shadow-inner"
                                />
                                <button type="submit" className="w-full md:w-48 bg-gradient-to-br from-[#B185DB] to-[#F7CAD0] text-[#1A1C2E] font-rajdhani font-extrabold text-lg tracking-widest rounded-xl transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(247,202,208,0.4)] flex items-center justify-center py-4 md:py-0">
                                    DÉPLOYER
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 opacity-50 relative">
                    {/* Glowing Orb in background */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#B185DB]/10 rounded-full blur-[80px]"></div>
                    
                    <svg className="w-20 h-20 mb-6 text-[#A2D2FF]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    <span className="font-techMono text-sm uppercase tracking-[0.3em] text-[#A2D2FF]/50 animate-pulse">En attente de sélection d'agent</span>
                </div>
            )}
        </div>
    </div>
  );
}