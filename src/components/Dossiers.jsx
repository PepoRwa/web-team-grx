import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Dossiers({ isStaff, isCoach }) {
  const [profiles, setProfiles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Note System
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Stats System
  const [stats, setStats] = useState(null);
  const [declaredAbsences, setDeclaredAbsences] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // Add search/filter
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isStaff || isCoach) {
      fetchProfiles();
    }
  }, [isStaff, isCoach]);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .order('username', { ascending: true });

    if (!error && data) {
      setProfiles(data);
    } else {
      console.error("Erreur de récupération des profils:", error);
    }
    setLoading(false);
  };

  const fetchNotes = async (userId) => {
    setLoadingNotes(true);
    const { data, error } = await supabase
      .from('player_notes')
      .select(`
        id, content, created_at,
        author:profiles!player_notes_author_id_fkey (username, avatar_url)
      `)
      .eq('player_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setNotes(data);
    } else {
      console.error("Erreur notes:", error);
    }
    setLoadingNotes(false);
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setNotes([]);
    setStats(null);
    setDeclaredAbsences([]);
    fetchNotes(user.id);
    fetchStats(user.id);
    fetchDeclaredAbsences(user.id);
  };

  const fetchDeclaredAbsences = async (userId) => {
    const { data, error } = await supabase
      .from('absences')
      .select('*')
      .eq('user_id', userId)
      .order('date_start', { ascending: false });
    
    if (!error && data) {
      setDeclaredAbsences(data);
    }
  };

  const fetchStats = async (userId) => {
    setLoadingStats(true);
    const { data, error } = await supabase
      .from('checkins')
      .select('status')
      .eq('user_id', userId);

    if (!error && data) {
      let present = 0, late = 0, absent = 0, pending = 0;
      data.forEach(c => {
        if (c.status === 'present') present++;
        else if (c.status === 'late') late++;
        else if (c.status === 'absent') absent++;
        else if (c.status === 'pending') pending++;
      });

      const totalResponded = present + late + absent;
      // Taux de participation : (Présents + Retards) / Total des réponses (on exclut les "en attente" d'events futurs)
      const participationRate = totalResponded > 0 ? Math.round(((present + late) / totalResponded) * 100) : 0;
      // Ponctualité : Présents purs / (Présents + Retards)
      const punctualityRate = (present + late) > 0 ? Math.round((present / (present + late)) * 100) : 0;

      setStats({
        total: data.length,
        present, late, absent, pending,
        participationRate, punctualityRate
      });
    } else {
      console.error("Erreur récupération statistiques:", error);
    }
    setLoadingStats(false);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedUser) return;

    // auth.uid() is handled by passing down from App or using supabase.auth inside
    const { data: userSession } = await supabase.auth.getSession();
    const currentUserId = userSession?.session?.user?.id;

    const { data, error } = await supabase
      .from('player_notes')
      .insert([
        {
          player_id: selectedUser.id,
          author_id: currentUserId,
          content: newNote.trim()
        }
      ])
      .select(`
        id, content, created_at,
        author:profiles!player_notes_author_id_fkey (username, avatar_url)
      `)
      .single();

    if (!error && data) {
      setNotes([data, ...notes]);
      setNewNote('');
    } else {
      console.error("Erreur lors de l'ajout de note:", error);
    }
  };

  if (!isStaff && !isCoach) {
    return (
      <div className="text-center p-8 bg-red-500/10 rounded-xl border border-red-500/50">
        <p className="text-red-500 font-rajdhani text-xl font-bold">ACCÈS REFUSÉ</p>
        <p className="text-gray-400 font-techMono text-sm mt-2">Niveau d'accréditation insuffisant pour consulter les dossiers.</p>
      </div>
    );
  }

  const filteredProfiles = profiles.filter(p => p.username.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="w-full max-w-5xl mx-auto my-8 bg-black/40 border border-blue-500/30 backdrop-blur-md rounded-xl p-6 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
      
      <div className="flex flex-col mb-6 border-b border-blue-500/50 pb-4">
        <h2 className="text-3xl font-rajdhani text-white drop-shadow-[0_2px_4px_rgba(59,130,246,0.8)]">DOSSIERS CLASSIFIÉS</h2>
        <p className="text-blue-400 font-techMono text-xs uppercase tracking-widest mt-1">Niveau d'accréditation : Staff & Coach</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* COLONNE GAUCHE: Liste des joueurs */}
        <div className="col-span-1 border-r border-white/10 pr-4 drop-shadow-md">
            <div className="mb-4">
                <input 
                  type="text" 
                  placeholder="Rechercher un profil..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-black/50 border border-blue-500/50 rounded p-2 text-white font-techMono text-sm focus:border-blue-400 outline-none"
                />
            </div>
            
            <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                    <span className="text-blue-400 text-xs font-techMono animate-pulse">Chargement de la base de données...</span>
                ) : filteredProfiles.length === 0 ? (
                    <span className="text-gray-500 text-xs font-poppins text-center">Aucun dossier trouvé.</span>
                ) : (
                    filteredProfiles.map((user) => (
                        <button 
                            key={user.id}
                            onClick={() => handleSelectUser(user)}
                            className={`flex items-center gap-3 p-3 rounded transition-all border ${selectedUser?.id === user.id ? 'bg-blue-900/30 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)] text-white' : 'bg-transparent border-transparent hover:bg-white/5 text-gray-300'}`}
                        >
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-full border border-blue-400/50" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-xs font-bold font-rajdhani text-blue-300">?</div>
                            )}
                            <span className="font-rajdhani font-bold truncate text-left">{user.username}</span>
                        </button>
                    ))
                )}
            </div>
        </div>

        {/* COLONNE DROITE: Fiche Joueur & Notes */}
        <div className="col-span-1 md:col-span-2 pl-0 md:pl-2">
            {!selectedUser ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-500 opacity-50">
                    <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z"></path></svg>
                    <p className="font-techMono uppercase tracking-widest text-sm">Sélectionner un dossier</p>
                </div>
            ) : (
                <div className="flex flex-col h-full bg-black/30 rounded-lg p-5 border border-white/5">
                    
                    {/* Header Profil */}
                    <div className="flex items-center gap-4 mb-6 border-b border-blue-500/20 pb-4">
                        {selectedUser.avatar_url ? (
                            <img src={selectedUser.avatar_url} alt="avatar" className="w-16 h-16 rounded-full border-2 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center text-xl font-bold font-rajdhani text-blue-300">?</div>
                        )}
                        <div>
                            <h3 className="text-2xl font-rajdhani font-bold text-white tracking-widest">{selectedUser.username}</h3>
                            <p className="text-xs font-techMono text-gray-400 mt-1">ID: {selectedUser.id.substring(0, 8)}... | DOSSIER ACTIF</p>
                        </div>
                    </div>

                    {/* Section Statistiques Visuelles */}
                    {loadingStats ? (
                        <div className="text-blue-400 text-xs font-techMono animate-pulse mb-6 text-center">Extraction des données télémétriques...</div>
                    ) : stats ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                            {/* Winrate Participation */}
                            <div className="bg-black/50 border border-blue-500/40 rounded flex flex-col items-center justify-center p-3 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                                <span className={`text-2xl font-rajdhani font-bold ${stats.participationRate >= 80 ? 'text-green-400' : stats.participationRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {stats.participationRate}%
                                </span>
                                <span className="text-[10px] font-techMono text-gray-400 uppercase tracking-wider text-center mt-1">Participation</span>
                            </div>

                            {/* Présences */}
                            <div className="bg-green-500/10 border border-green-500/30 rounded flex flex-col items-center justify-center p-3">
                                <span className="text-2xl font-rajdhani font-bold text-green-400">{stats.present}</span>
                                <span className="text-[10px] font-techMono text-green-500/70 uppercase tracking-wider mt-1">Présent</span>
                            </div>

                            {/* Retards */}
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded flex flex-col items-center justify-center p-3">
                                <span className="text-2xl font-rajdhani font-bold text-yellow-400">{stats.late}</span>
                                <span className="text-[10px] font-techMono text-yellow-500/70 uppercase tracking-wider mt-1">Retards</span>
                            </div>

                            {/* Absences */}
                            <div className="bg-red-500/10 border border-red-500/30 rounded flex flex-col items-center justify-center p-3">
                                <span className="text-2xl font-rajdhani font-bold text-red-400">{stats.absent}</span>
                                <span className="text-[10px] font-techMono text-red-500/70 uppercase tracking-wider mt-1">Absences</span>
                            </div>
                        </div>
                    ) : null}

                    {/* Section Congés et Tolérance */}
                    {selectedUser && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-red-900/10 border border-red-500/30 rounded-lg p-4">
                                <h4 className="text-red-400 font-rajdhani text-sm font-bold uppercase mb-2">TOLÉRANCE ABSENCES</h4>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 bg-black/50 h-3 rounded-full overflow-hidden border border-white/5">
                                        <div 
                                          className={`h-full ${stats?.absent > 2 ? 'bg-red-500 animate-pulse' : stats?.absent > 0 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                          style={{ width: `${Math.min((stats?.absent || 0) * 33.33, 100)}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-white font-techMono text-xs">{stats?.absent || 0} / 3 Strikes</span>
                                </div>
                                <p className="text-[10px] text-gray-500 font-poppins mt-2 italic">Basé sur le nombre d'absences injustifiées (non validées).</p>
                            </div>

                            <div className="bg-purple-900/10 border border-purple-500/30 rounded-lg p-4 max-h-[100px] overflow-y-auto hidden-scrollbar">
                                <h4 className="text-purple-400 font-rajdhani text-sm font-bold uppercase mb-2 sticky top-0 bg-black/60 rounded px-1">CONGÉS / ABSENCES DÉCLARÉES</h4>
                                {declaredAbsences.length === 0 ? (
                                    <p className="text-[10px] text-gray-500 font-poppins italic">Aucune absence justifiée.</p>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {declaredAbsences.map(abs => (
                                            <div key={abs.id} className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1">
                                                <span className="text-gray-300 truncate w-3/4">{new Date(abs.date_start).toLocaleDateString()} - {abs.reason}</span>
                                                <span className={`${abs.status === 'valide' ? 'text-green-400' : abs.status === 'refuse' ? 'text-red-400' : 'text-yellow-400'} uppercase font-bold`}>{abs.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Section Formulaire d'ajout de note */}
                    <form onSubmit={handleAddNote} className="mb-6">
                        <label className="block text-blue-400 font-techMono text-xs mb-2 uppercase">Ajouter un rapport confidentiel :</label>
                        <textarea 
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Observation comportementale, avertissement de retard, point positif sur la progression..."
                            className="w-full bg-black/60 border border-blue-500/30 rounded p-3 text-sm text-white font-poppins focus:border-blue-400 outline-none resize-none"
                            rows="3"
                        />
                        <button 
                            type="submit" 
                            disabled={!newNote.trim()}
                            className="mt-2 w-full py-2 bg-blue-600/20 text-blue-300 border border-blue-500 hover:bg-blue-600 hover:text-white font-rajdhani font-bold rounded transition-colors disabled:opacity-50"
                        >
                            ENREGISTRER LE RAPPORT
                        </button>
                    </form>

                    {/* Historique des Notes */}
                    <div className="flex-1 overflow-y-auto">
                       <h4 className="text-gray-400 font-techMono text-xs uppercase mb-3 px-1 border-b border-gray-800 pb-1">Archive des rapports</h4>
                       
                       {loadingNotes ? (
                           <div className="text-center py-4 text-blue-400 text-xs font-techMono animate-pulse">Décodage des archives...</div>
                       ) : notes.length === 0 ? (
                           <p className="text-center text-gray-500 text-sm font-poppins italic py-4">Aucun document dans le dossier de cet agent.</p>
                       ) : (
                           <div className="flex flex-col gap-3 pr-2">
                               {notes.map(note => {
                                   const dateObj = new Date(note.created_at);
                                   return (
                                       <div key={note.id} className="bg-blue-900/10 border border-blue-500/20 rounded p-4 group hover:border-blue-500/50 transition-colors">
                                            <div className="flex items-center justify-between pl-2 mb-2 border-l-2 border-blue-500">
                                                <div className="flex items-center gap-2">
                                                    {note.author?.avatar_url && (
                                                        <img src={note.author.avatar_url} className="w-5 h-5 rounded-full" alt="author" />
                                                    )}
                                                    <span className="font-rajdhani font-bold text-gray-300 text-sm">{note.author?.username || 'Staff'}</span>
                                                </div>
                                                <span className="text-[10px] text-gray-500 font-techMono">
                                                    {dateObj.toLocaleDateString()} - {dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                            <p className="text-gray-300 font-poppins text-sm leading-relaxed pl-2">
                                                {note.content}
                                            </p>
                                       </div>
                                   );
                               })}
                           </div>
                       )}
                    </div>

                </div>
            )}
        </div>

      </div>
    </div>
  );
}