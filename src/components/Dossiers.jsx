import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FiUsers, FiFolder, FiUploadCloud, FiLock, FiGlobe, FiFileText, FiTrash2, FiDownload, FiCheck, FiClock, FiAlertTriangle } from 'react-icons/fi';

export default function Dossiers({ isStaff, isCoach }) {
  const [subTab, setSubTab] = useState('agents'); // 'agents' ou 'documents'
  
  // --- STATES AGENTS ---
  const [profiles, setProfiles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Notes & Stats Agent
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [stats, setStats] = useState(null);
  const [declaredAbsences, setDeclaredAbsences] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // --- STATES DOCUMENTS ---
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  
  // Upload
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadIsPublic, setUploadIsPublic] = useState(true);
  const [uploadTargetUser, setUploadTargetUser] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // ==========================================
  // INITIALISATION
  // ==========================================
  useEffect(() => {
    if (isStaff || isCoach) {
      fetchProfiles();
      fetchDocuments();
    }
  }, [isStaff, isCoach]);

  const fetchProfiles = async () => {
    setLoadingProfiles(true);
    const { data, error } = await supabase
      .from('profiles')
      .select(`id, username, avatar_url, user_roles ( roles ( name ) )`)
      .order('username', { ascending: true });

    if (!error && data) {
      const formattedData = data.map(profile => {
        const rolesList = profile.user_roles?.map(ur => ur.roles?.name).filter(Boolean) || [];
        // On récupère TOUS les rôles d'équipe (Roster, Academy, etc.)
        const teamRoles = rolesList.filter(r => 
            r.toLowerCase().includes('roster') || 
            r.toLowerCase().includes('team') || 
            ['Academy', 'Tryhard', 'Chill'].includes(r)
        );
        return { ...profile, teamRoles };
      });
      setProfiles(formattedData);
    }
    setLoadingProfiles(false);
  };

  // ==========================================
  // LOGIQUE AGENTS
  // ==========================================
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setNotes([]);
    setStats(null);
    setDeclaredAbsences([]);
    fetchNotes(user.id);
    fetchStats(user.id);
    fetchDeclaredAbsences(user.id);
  };

  const fetchNotes = async (userId) => {
    setLoadingNotes(true);
    const { data } = await supabase
      .from('player_notes')
      .select(`id, content, created_at, author:profiles!player_notes_author_id_fkey (username, avatar_url)`)
      .eq('player_id', userId)
      .order('created_at', { ascending: false });
    if (data) setNotes(data);
    setLoadingNotes(false);
  };

  const fetchDeclaredAbsences = async (userId) => {
    const { data } = await supabase.from('absences').select('*').eq('user_id', userId).order('date_start', { ascending: false });
    if (data) setDeclaredAbsences(data);
  };

  // 🔄 MISE À JOUR : Calcul des stats identique à la page Profil
  const fetchStats = async (userId) => {
    setLoadingStats(true);
    
    // 1. Récupérer les checkins
    const { data: checkinData } = await supabase.from('checkins').select('status').eq('user_id', userId);
    
    // 2. Récupérer les absences validées
    const { data: absencesData } = await supabase
        .from('absences')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'valide');

    if (checkinData) {
      let present = 0, late = 0, absent = 0;
      checkinData.forEach(c => {
        if (c.status === 'present') present++;
        else if (c.status === 'late') late++;
        else if (c.status === 'absent') absent++;
      });
      
      const total = checkinData.length;
      const participationRate = total > 0 ? Math.round(((present + late) / total) * 100) : 100;
      
      setStats({ 
          total, 
          present, 
          late, 
          absent, 
          participationRate,
          validAbsences: absencesData ? absencesData.length : 0
      });
    }
    setLoadingStats(false);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedUser) return;
    const { data: { session } } = await supabase.auth.getSession();
    
    const { data } = await supabase
      .from('player_notes')
      .insert([{ player_id: selectedUser.id, author_id: session.user.id, content: newNote.trim() }])
      .select(`id, content, created_at, author:profiles!player_notes_author_id_fkey (username, avatar_url)`)
      .single();

    if (data) {
      setNotes([data, ...notes]);
      setNewNote('');
    }
  };

  // ==========================================
  // LOGIQUE DOCUMENTS (SECURISEE)
  // ==========================================
  const fetchDocuments = async () => {
    setLoadingDocs(true);
    const { data, error } = await supabase
      .from('user_documents')
      .select(`*, target:profiles!user_documents_user_id_fkey(username), author:profiles!user_documents_uploaded_by_fkey(username)`)
      .order('created_at', { ascending: false });
      
    if (error) console.error("Erreur Fetch Documents :", error);
    else if (data) setDocuments(data);
    
    setLoadingDocs(false);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle) return;

    setIsUploading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    const fileExt = uploadFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${uploadIsPublic ? 'global' : `private_${uploadTargetUser}`}/${fileName}`;

    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(filePath, uploadFile);

    if (storageError) {
      alert("Erreur lors de l'upload du fichier dans le coffre.");
      setIsUploading(false);
      return;
    }

    const { error: dbError } = await supabase.from('user_documents').insert({
      title: uploadTitle,
      file_path: filePath, 
      is_public: uploadIsPublic,
      user_id: uploadIsPublic ? null : uploadTargetUser,
      uploaded_by: session.user.id
    });

    if (dbError) {
      console.error("Erreur DB Document:", dbError);
      alert("Le fichier est dans le coffre, mais l'enregistrement a échoué: " + dbError.message);
    } else {
      setUploadTitle('');
      setUploadFile(null);
      fetchDocuments();
    }
    setIsUploading(false);
  };

  const handleOpenDocument = async (filePath) => {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 60);

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    } else {
      alert("Impossible d'accéder au fichier sécurisé.");
    }
  };

  const handleDeleteDocument = async (id, filePath) => {
    if (!window.confirm("Supprimer définitivement ce document du coffre-fort ?")) return;
    await supabase.storage.from('documents').remove([filePath]);
    await supabase.from('user_documents').delete().eq('id', id);
    fetchDocuments();
  };


  // ==========================================
  // RENDU
  // ==========================================
  if (!isStaff && !isCoach) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>
        <p className="text-red-400 font-rajdhani text-3xl font-bold tracking-widest drop-shadow-md mb-2">ACCÈS REFUSÉ</p>
        <p className="text-gray-400 font-poppins text-sm max-w-md">Cette section requiert une accréditation de Commandement (Niveau Staff ou Coach).</p>
      </div>
    );
  }

  const filteredProfiles = profiles.filter(p => p.username.toLowerCase().includes(searchQuery.toLowerCase()));

  // Calcul du "Vrai" nombre d'absences pour la jauge
  const unjustifiedAbsences = stats ? Math.max(0, stats.absent - stats.validAbsences) : 0;

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto animate-fade-in px-2 md:px-0 mb-10">
      
      {/* HEADER PRINCIPAL */}
      <div className="bg-[#1A1C2E]/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden">
        <div className="absolute top-[-50%] left-[-10%] w-64 h-64 bg-[#A2D2FF]/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div>
          <h2 className="text-3xl md:text-4xl font-rockSalt text-transparent bg-clip-text bg-gradient-to-r from-[#A2D2FF] to-[#F7CAD0] drop-shadow-md mb-1">
            Dossiers Classifiés
          </h2>
          <p className="text-[#A2D2FF]/80 font-techMono text-[10px] md:text-xs uppercase tracking-[0.3em]">Base de données de Commandement</p>
        </div>

        {/* SUB-NAV */}
        <div className="flex bg-black/40 border border-white/10 p-1.5 rounded-xl shadow-inner w-full md:w-auto">
            <button 
              onClick={() => setSubTab('agents')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-techMono text-xs font-bold uppercase tracking-widest transition-all ${subTab === 'agents' ? 'bg-[#A2D2FF] text-[#1A1C2E] shadow-[0_0_15px_rgba(162,210,255,0.4)]' : 'text-gray-400 hover:text-white'}`}
            >
              <FiUsers className="w-4 h-4" /> Suivi Agents
            </button>
            <button 
              onClick={() => setSubTab('documents')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-techMono text-xs font-bold uppercase tracking-widest transition-all ${subTab === 'documents' ? 'bg-[#B185DB] text-white shadow-[0_0_15px_rgba(177,133,219,0.4)]' : 'text-gray-400 hover:text-white'}`}
            >
              <FiFolder className="w-4 h-4" /> Bibliothèque
            </button>
        </div>
      </div>

      {/* ==========================================
          ONGLET 1 : SUIVI DES AGENTS
          ========================================== */}
      {subTab === 'agents' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[800px]">
          
          {/* COLONNE GAUCHE: Liste des joueurs */}
          <div className={`col-span-1 lg:col-span-1 bg-[#1A1C2E]/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-5 shadow-xl flex flex-col h-full ${selectedUser ? 'hidden lg:flex' : 'flex'}`}>
              <div className="mb-4 shrink-0">
                  <input 
                    type="text" 
                    placeholder="Scanner un profil..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-[#A2D2FF]/30 hover:border-[#A2D2FF]/60 rounded-xl p-3 text-white font-poppins text-sm focus:border-[#A2D2FF] outline-none transition-colors shadow-inner placeholder:text-gray-600"
                  />
              </div>
              
              <div className="flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar flex-1">
                  {loadingProfiles ? (
                      <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-[#A2D2FF] border-t-transparent rounded-full animate-spin"></div></div>
                  ) : filteredProfiles.length === 0 ? (
                      <span className="text-gray-500 text-xs font-poppins text-center py-4">Aucun dossier trouvé.</span>
                  ) : (
                      filteredProfiles.map((user) => (
                          <button 
                              key={user.id}
                              onClick={() => handleSelectUser(user)}
                              className={`flex items-center gap-3 p-3 rounded-xl transition-all border text-left ${selectedUser?.id === user.id ? 'bg-[#A2D2FF]/10 border-[#A2D2FF]/40 shadow-[0_0_15px_rgba(162,210,255,0.15)] text-white' : 'bg-transparent border-transparent hover:bg-white/5 text-gray-400 hover:text-white'}`}
                          >
                              {user.avatar_url ? (
                                  <img src={user.avatar_url} alt="avatar" className="w-10 h-10 rounded-full border border-white/10 object-cover shrink-0" />
                              ) : (
                                  <div className="w-10 h-10 rounded-full bg-[#1A1C2E] border border-white/10 flex items-center justify-center text-sm font-bold font-rajdhani text-white shadow-inner shrink-0">
                                    {(user.username || 'A')[0].toUpperCase()}
                                  </div>
                              )}
                              <div className="flex flex-col overflow-hidden w-full">
                                  <span className="font-rajdhani font-bold truncate text-base">{user.username}</span>
                                  
                                  {/* 🔄 MISE À JOUR : Affichage de tous les rosters */}
                                  {user.teamRoles && user.teamRoles.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-0.5">
                                          {user.teamRoles.map(role => (
                                              <span key={role} className="text-[9px] uppercase font-techMono tracking-widest text-[#F7CAD0] bg-[#F7CAD0]/10 px-1.5 py-0.5 rounded border border-[#F7CAD0]/30 whitespace-nowrap">
                                                  {role.replace('Roster ', '')}
                                              </span>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          </button>
                      ))
                  )}
              </div>
          </div>

          {/* COLONNE DROITE: Fiche Joueur & Notes */}
          <div className={`col-span-1 lg:col-span-3 bg-[#0D0E15]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-xl flex flex-col h-full relative overflow-hidden ${!selectedUser ? 'hidden lg:flex' : 'flex'}`}>
              
              {!selectedUser ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#A2D2FF]/5 rounded-full blur-[80px]"></div>
                      <FiUsers className="w-16 h-16 mb-4 text-[#A2D2FF]/40" />
                      <p className="font-techMono uppercase tracking-[0.3em] text-sm text-[#A2D2FF]/50 animate-pulse">En attente de sélection</p>
                  </div>
              ) : (
                  <div className="flex flex-col h-full z-10 relative">
                      
                      {/* BOUTON RETOUR MOBILE */}
                      <div className="p-4 lg:hidden border-b border-white/5 bg-white/[0.02]">
                        <button 
                            onClick={() => setSelectedUser(null)}
                            className="flex items-center gap-2 text-[#A2D2FF] bg-[#A2D2FF]/10 px-4 py-2 rounded-lg border border-[#A2D2FF]/30 hover:bg-[#A2D2FF]/20 text-xs font-techMono uppercase tracking-widest"
                        >
                            ← Retour Liste
                        </button>
                      </div>

                      {/* Header Profil */}
                      <div className="flex items-center gap-5 p-6 md:p-8 border-b border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent shrink-0">
                          {selectedUser.avatar_url ? (
                              <img src={selectedUser.avatar_url} alt="avatar" className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border border-white/20 shadow-[0_0_20px_rgba(162,210,255,0.2)] object-cover" />
                          ) : (
                              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#1A1C2E] to-black border border-white/20 flex items-center justify-center text-2xl font-bold font-rajdhani text-white">?</div>
                          )}
                          <div>
                              <h3 className="text-3xl md:text-4xl font-rajdhani font-bold text-white tracking-widest drop-shadow-md mb-1">{selectedUser.username}</h3>
                              
                              {/* 🔄 MISE À JOUR : Affichage de tous les rosters dans l'en-tête */}
                              {selectedUser.teamRoles && selectedUser.teamRoles.length > 0 ? (
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                      {selectedUser.teamRoles.map(role => (
                                          <span key={role} className="text-[10px] font-techMono text-[#A2D2FF] uppercase tracking-[0.2em] bg-[#A2D2FF]/10 px-2 py-0.5 rounded border border-[#A2D2FF]/20">
                                              {role}
                                          </span>
                                      ))}
                                  </div>
                              ) : (
                                  <p className="text-[10px] font-techMono text-[#A2D2FF] uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></span> Dossier Actif
                                  </p>
                              )}
                          </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                        {/* Section Statistiques Visuelles */}
                        {loadingStats ? (
                            <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-[#A2D2FF] border-t-transparent rounded-full animate-spin"></div></div>
                        ) : stats ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-black/40 border border-white/10 rounded-2xl flex flex-col items-center justify-center p-4 shadow-inner relative overflow-hidden group">
                                    <div className={`absolute bottom-0 left-0 h-1 transition-all ${stats.participationRate >= 80 ? 'bg-green-500' : stats.participationRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${stats.participationRate}%`}}></div>
                                    <span className={`text-3xl font-rajdhani font-black ${stats.participationRate >= 80 ? 'text-green-400' : stats.participationRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {stats.participationRate}%
                                    </span>
                                    <span className="text-[9px] font-techMono text-gray-500 uppercase tracking-widest mt-1">Implication</span>
                                </div>
                                <div className="bg-green-500/5 border border-green-500/20 rounded-2xl flex flex-col items-center justify-center p-4">
                                    <span className="text-3xl font-rajdhani font-black text-green-400">{stats.present}</span>
                                    <span className="text-[9px] font-techMono text-green-500/70 uppercase tracking-widest mt-1">Présents</span>
                                </div>
                                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl flex flex-col items-center justify-center p-4">
                                    <span className="text-3xl font-rajdhani font-black text-yellow-400">{stats.late}</span>
                                    <span className="text-[9px] font-techMono text-yellow-500/70 uppercase tracking-widest mt-1">Retards</span>
                                </div>
                                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl flex flex-col items-center justify-center p-4">
                                    <div className="flex items-center gap-1">
                                      <span className="text-3xl font-rajdhani font-black text-red-400">{stats.absent}</span>
                                      {stats.validAbsences > 0 && (
                                        <span className="text-xs font-techMono text-green-400" title="Absences Justifiées">(-{stats.validAbsences})</span>
                                      )}
                                    </div>
                                    <span className="text-[9px] font-techMono text-red-500/70 uppercase tracking-widest mt-1">Absences</span>
                                </div>
                            </div>
                        ) : null}

                        {/* Section Congés et Tolérance */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
                            <div className="bg-red-900/10 border border-red-500/20 rounded-2xl p-5 shadow-inner">
                                <h4 className="text-red-400 font-techMono text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Strike System
                                </h4>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 bg-black/60 h-2.5 rounded-full overflow-hidden border border-white/5">
                                        {/* 🔄 MISE À JOUR : La jauge se remplit en fonction des absences INJUSTIFIÉES */}
                                        <div 
                                          className={`h-full transition-all ${unjustifiedAbsences > 2 ? 'bg-red-500' : unjustifiedAbsences > 0 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                          style={{ width: `${Math.min(unjustifiedAbsences * 33.33, 100)}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-white font-techMono text-xs">{unjustifiedAbsences}/3</span>
                                </div>
                                <p className="text-[10px] text-red-200/50 font-poppins mt-3 italic">Le système tolère 3 absences non-justifiées. Au-delà, l'agent s'expose à une sanction de l'état major.</p>
                            </div>

                            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 max-h-[140px] overflow-y-auto custom-scrollbar">
                                <h4 className="text-[#A2D2FF] font-techMono text-xs font-bold uppercase tracking-widest mb-3 sticky top-0 bg-[#0D0E15] -mx-5 px-5 py-1">Absences Justifiées</h4>
                                {declaredAbsences.length === 0 ? (
                                    <p className="text-[10px] text-gray-500 font-poppins italic">Dossier vierge.</p>
                                ) : (
                                    <div className="flex flex-col gap-2.5">
                                        {declaredAbsences.map(abs => (
                                            <div key={abs.id} className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                                                <div className="flex flex-col max-w-[70%]">
                                                  <span className="text-gray-300 font-bold">{new Date(abs.date_start).toLocaleDateString('fr-FR')}</span>
                                                  <span className="text-gray-500 text-[10px] truncate">{abs.reason}</span>
                                                </div>
                                                <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-techMono tracking-widest ${abs.status === 'valide' ? 'bg-green-500/10 text-green-400 border-green-500/30' : abs.status === 'refuse' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'}`}>
                                                  {abs.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section Notes (Rapports Classifiés) */}
                        <div className="flex flex-col gap-6 border-t border-white/10 pt-8">
                            <form onSubmit={handleAddNote} className="bg-black/30 border border-white/5 p-5 rounded-2xl shadow-inner">
                                <label className="flex items-center gap-2 text-[#B185DB] font-techMono text-xs mb-3 uppercase tracking-widest">
                                  <FiFileText /> Rédiger un rapport d'observation
                                </label>
                                <textarea 
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Observation comportementale, avertissement, point positif..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white font-poppins focus:border-[#B185DB] outline-none resize-none transition-colors"
                                    rows="3"
                                />
                                <div className="flex justify-end mt-3">
                                  <button 
                                      type="submit" 
                                      disabled={!newNote.trim()}
                                      className="px-6 py-2.5 bg-gradient-to-r from-[#A2D2FF] to-[#B185DB] text-[#1A1C2E] font-rajdhani font-bold tracking-widest rounded-xl transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_15px_rgba(177,133,219,0.3)]"
                                  >
                                      SCELLER LE RAPPORT
                                  </button>
                                </div>
                            </form>

                            <div className="flex flex-col gap-4">
                                <h4 className="text-gray-400 font-techMono text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                                  <span className="w-8 h-px bg-white/10"></span> Archives des Rapports <span className="flex-1 h-px bg-white/10"></span>
                                </h4>
                                
                                {loadingNotes ? (
                                    <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-[#B185DB] border-t-transparent rounded-full animate-spin"></div></div>
                                ) : notes.length === 0 ? (
                                    <p className="text-center text-gray-500 text-xs font-poppins italic py-6 bg-white/[0.02] rounded-xl border border-white/5">Aucun document dans le dossier de cet agent.</p>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {notes.map(note => {
                                            const dateObj = new Date(note.created_at);
                                            return (
                                                <div key={note.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 group hover:border-[#B185DB]/30 transition-colors">
                                                      <div className="flex items-center justify-between mb-3">
                                                          <div className="flex items-center gap-3">
                                                              {note.author?.avatar_url ? (
                                                                  <img src={note.author.avatar_url} className="w-8 h-8 rounded-full border border-white/10" alt="author" />
                                                              ) : (
                                                                  <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center border border-white/10 text-xs text-white">S</div>
                                                              )}
                                                              <div className="flex flex-col">
                                                                <span className="font-rajdhani font-bold text-white text-sm">{note.author?.username || 'Staff'}</span>
                                                                <span className="text-[9px] text-gray-500 font-techMono uppercase tracking-widest">
                                                                    {dateObj.toLocaleDateString('fr-FR')} à {dateObj.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                                                                </span>
                                                              </div>
                                                          </div>
                                                      </div>
                                                      <p className="text-gray-300 font-poppins text-sm leading-relaxed pl-11">
                                                          {note.content}
                                                      </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                      </div>
                  </div>
              )}
          </div>
        </div>
      )}

      {/* ==========================================
          ONGLET 2 : BIBLIOTHÈQUE DE DOCUMENTS
          ========================================== */}
      {subTab === 'documents' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[800px]">
          
          {/* COLONNE GAUCHE : Formulaire d'Upload */}
          <div className="col-span-1 bg-[#1A1C2E]/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-xl flex flex-col gap-6">
             <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-[#B185DB]/20 flex items-center justify-center border border-[#B185DB]/30">
                  <FiUploadCloud className="text-[#B185DB] w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-rajdhani text-2xl font-bold text-white tracking-wide">Ajouter un Fichier</h3>
                  <p className="text-[9px] font-techMono text-gray-400 uppercase tracking-widest">Cryptage de bout en bout</p>
                </div>
             </div>

             <form onSubmit={handleFileUpload} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-techMono text-[#A2D2FF] uppercase tracking-widest pl-1">Nom du Document</label>
                  <input 
                    required type="text" placeholder="Ex: Contrat Tryhard - Octobre"
                    value={uploadTitle} onChange={e => setUploadTitle(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm font-poppins focus:border-[#A2D2FF] outline-none transition-colors shadow-inner"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-techMono text-[#A2D2FF] uppercase tracking-widest pl-1">Visibilité</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setUploadIsPublic(true)} className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${uploadIsPublic ? 'bg-[#A2D2FF]/20 border-[#A2D2FF]/50 text-[#A2D2FF]' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'}`}>
                      <FiGlobe className="mb-1 text-lg" />
                      <span className="text-[10px] font-techMono uppercase font-bold tracking-wider">Public (Tous)</span>
                    </button>
                    <button type="button" onClick={() => setUploadIsPublic(false)} className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${!uploadIsPublic ? 'bg-[#F7CAD0]/20 border-[#F7CAD0]/50 text-[#F7CAD0]' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'}`}>
                      <FiLock className="mb-1 text-lg" />
                      <span className="text-[10px] font-techMono uppercase font-bold tracking-wider">Privé (Agent)</span>
                    </button>
                  </div>
                </div>

                {!uploadIsPublic && (
                  <div className="flex flex-col gap-1.5 animate-fade-in">
                    <label className="text-[10px] font-techMono text-[#F7CAD0] uppercase tracking-widest pl-1">Agent Cible</label>
                    <select 
                      required value={uploadTargetUser} onChange={e => setUploadTargetUser(e.target.value)}
                      className="w-full bg-black/40 border border-[#F7CAD0]/30 rounded-xl p-3 text-white text-sm font-poppins focus:border-[#F7CAD0] outline-none transition-colors appearance-none"
                    >
                      <option value="">Sélectionner un agent...</option>
                      {profiles.map(p => <option key={p.id} value={p.id}>{p.username}</option>)}
                    </select>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-techMono text-[#A2D2FF] uppercase tracking-widest pl-1">Fichier (PDF, Image...)</label>
                  <input 
                    required type="file" 
                    onChange={e => setUploadFile(e.target.files[0])}
                    className="w-full text-xs text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-techMono file:font-bold file:bg-[#B185DB]/10 file:text-[#B185DB] hover:file:bg-[#B185DB]/20 file:transition-colors file:cursor-pointer"
                  />
                </div>

                <button 
                  type="submit" disabled={isUploading || !uploadFile || !uploadTitle}
                  className="mt-4 w-full py-4 bg-gradient-to-r from-[#A2D2FF] to-[#B185DB] text-[#1A1C2E] font-rajdhani font-bold text-lg tracking-widest rounded-xl hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-[0_0_20px_rgba(177,133,219,0.3)] flex items-center justify-center gap-2"
                >
                  {isUploading ? <><div className="w-4 h-4 border-2 border-[#1A1C2E] border-t-transparent rounded-full animate-spin"></div> CRYPTAGE...</> : 'PLACER DANS LE COFFRE'}
                </button>
             </form>
          </div>

          {/* COLONNE DROITE : Liste des Documents */}
          <div className="col-span-1 lg:col-span-2 bg-[#0D0E15]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-xl flex flex-col h-full overflow-hidden">
             <div className="flex justify-between items-end border-b border-white/5 pb-4 mb-6 shrink-0">
               <div>
                 <h3 className="font-rajdhani text-2xl font-bold text-white">Archives de la Structure</h3>
                 <p className="text-[10px] font-techMono text-gray-500 uppercase tracking-widest mt-1">Fichiers hébergés sur le serveur cloud</p>
               </div>
               <button onClick={fetchDocuments} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
               </button>
             </div>

             <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
               {loadingDocs ? (
                 <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-[#A2D2FF] border-t-transparent rounded-full animate-spin"></div></div>
               ) : documents.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full opacity-50">
                    <FiFolder className="w-16 h-16 text-gray-500 mb-4" />
                    <p className="font-poppins text-sm text-gray-400">Le coffre est vide.</p>
                 </div>
               ) : (
                 documents.map(doc => (
                   <div key={doc.id} className="bg-white/[0.02] border border-white/5 hover:border-white/10 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 shadow-inner ${doc.is_public ? 'bg-[#A2D2FF]/10 text-[#A2D2FF] border-[#A2D2FF]/30' : 'bg-[#F7CAD0]/10 text-[#F7CAD0] border-[#F7CAD0]/30'}`}>
                          {doc.is_public ? <FiGlobe className="w-5 h-5" /> : <FiLock className="w-5 h-5" />}
                        </div>
                        <div className="flex flex-col">
                          <h4 className="font-rajdhani font-bold text-lg text-white">{doc.title}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[9px] font-techMono text-gray-500 uppercase">
                              Le {new Date(doc.created_at).toLocaleDateString('fr-FR')} par {doc.author?.username || 'Staff'}
                            </span>
                            {!doc.is_public && doc.target?.username && (
                              <span className="px-2 py-0.5 rounded text-[8px] font-techMono uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20">
                                Cible: {doc.target.username}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <button 
                          onClick={() => handleOpenDocument(doc.file_path)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#B185DB]/10 hover:bg-[#B185DB]/20 text-[#B185DB] border border-[#B185DB]/30 rounded-lg font-techMono text-[10px] uppercase tracking-widest transition-colors"
                        >
                          <FiDownload /> Ouvrir
                        </button>
                        <button 
                          onClick={() => handleDeleteDocument(doc.id, doc.file_path)}
                          className="px-3 py-2 bg-red-500/5 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/50 rounded-lg transition-colors md:opacity-0 group-hover:opacity-100"
                          title="Détruire le fichier"
                        >
                          <FiTrash2 />
                        </button>
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