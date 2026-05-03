import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AdminProfiles({ session }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [absences, setAbsences] = useState([]);
  
  // Separation of docs
  const [userSpecificDocs, setUserSpecificDocs] = useState([]);
  const [publicDocs, setPublicDocs] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("members"); // 'members' | 'globalDocs'

  // Form states Individuel
  const [indTitle, setIndTitle] = useState("");
  const [indUrl, setIndUrl] = useState("");

  // Form states Groupes / Publics
  const [pubTitle, setPubTitle] = useState("");
  const [pubUrl, setPubUrl] = useState("");
  const [targetGroup, setTargetGroup] = useState("ALL"); // ALL, High Roster, Tryhard, Academy...

  useEffect(() => {
    fetchUsers();
    fetchPublicDocuments();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: pData } = await supabase.from('profiles').select('*').order('username', { ascending: true });
    if (pData) setUsers(pData);
    setLoading(false);
  };

  const fetchPublicDocuments = async () => {
    const { data } = await supabase.from('user_documents').select('*').eq('is_public', true);
    if (data) setPublicDocs(data);
  };

  const selectUser = async (user) => {
    setSelectedUser(user);
    const { data: aData } = await supabase.from('absences').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (aData) setAbsences(aData);

    const { data: dData } = await supabase.from('user_documents').select('*').eq('user_id', user.id).eq('is_public', false);
    if (dData) setUserSpecificDocs(dData);
  };

  const updateAbsenceStatus = async (id, status) => {
    const { error } = await supabase.from('absences').update({ status }).eq('id', id);
    if (!error) {
      setAbsences(absences.map(a => a.id === id ? { ...a, status } : a));
    }
  };

  // 1. Ajouter un document UNIQUEMENT à la cible sélectionnée (PRIVÉ)
  const addIndividualDocument = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    const { data, error } = await supabase.from('user_documents').insert([{
      user_id: selectedUser.id,
      title: indTitle,
      url: indUrl,
      is_public: false
    }]).select('*').single();
    
    if (!error && data) {
      setUserSpecificDocs([...userSpecificDocs, data]);
      setIndTitle('');
      setIndUrl('');
    }
  };

  // 2. Ajouter un document GLOBAL (Public) ou pour TOUT UN GROUPE (dupliqué en privé)
  const addGroupDocument = async (e) => {
    e.preventDefault();
    if (targetGroup === "ALL") {
      // Document public (général statuts etc) qui sera affiché pour tout le monde
      const { data, error } = await supabase.from('user_documents').insert([{
        user_id: session?.user?.id || users[0]?.id, // Default to current admin user id for reference
        title: pubTitle,
        url: pubUrl,
        is_public: true
      }]).select('*').single();

      if (!error && data) {
        setPublicDocs([...publicDocs, data]);
        setPubTitle('');
        setPubUrl('');
      }
    } else {
      // Assigner à un groupe ciblé: on va créer des documents "Privés" en cascade à chaque membre du groupe
      const cibles = users.filter(u => u.custom_affiliations?.includes(targetGroup));
      if(cibles.length === 0) return alert("Aucun membre trouvé dans le groupe " + targetGroup);

      const payload = cibles.map(c => ({
        user_id: c.id,
        title: `${pubTitle} [${targetGroup}]`,
        url: pubUrl,
        is_public: false
      }));

      const { error } = await supabase.from('user_documents').insert(payload);
      if(!error) {
        alert(`Document assigné avec succès à ${cibles.length} membre(s) ! \n\nNote: Les membres verront le document dans leur section "Personnelle".`);
        if (selectedUser && cibles.find(c => c.id === selectedUser.id)) {
           // Reload si l'utilisateur est concerné
           selectUser(selectedUser);
        }
        setPubTitle('');
        setPubUrl('');
      } else {
        console.error("Erreur lors de l'insertion en groupe:", error);
      }
    }
  };

  const deleteDocument = async (id, isPublicList) => {
    const { error } = await supabase.from('user_documents').delete().eq('id', id);
    if (!error) {
       if (isPublicList) {
         setPublicDocs(publicDocs.filter(d => d.id !== id));
       } else {
         setUserSpecificDocs(userSpecificDocs.filter(d => d.id !== id));
       }
    }
  };

  return (
    <div className="bg-black/30 border border-white/5 rounded-2xl p-6 mt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h3 className="font-rajdhani text-xl font-bold text-[#00FF41] flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          ADMINISTRATION : PROFILS & DOCUMENTS
        </h3>
        
        {/* TAB SWITCHER */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 font-rajdhani font-bold text-sm tracking-wide rounded-xl border transition-colors ${activeTab === 'members' ? 'bg-[#00FF41]/20 border-[#00FF41]/50 text-[#00FF41]' : 'border-white/10 text-gray-500 hover:text-gray-300'}`}
          >
            PANEL MEMBRES
          </button>
          <button 
            onClick={() => setActiveTab('globalDocs')}
            className={`px-4 py-2 font-rajdhani font-bold text-sm tracking-wide rounded-xl border transition-colors ${activeTab === 'globalDocs' ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'border-white/10 text-gray-500 hover:text-gray-300'}`}
          >
            DOCUMENTS GLOBAUX & GROUPES
          </button>
        </div>
      </div>

      {activeTab === 'globalDocs' && (
         <div className="bg-white/5 border border-white/10 rounded-xl p-6 animate-fade-in">
           <h4 className="font-rajdhani font-bold text-white mb-2 text-xl border-b border-white/10 pb-2">CRÉER OU DIFFUSER UN DOCUMENT</h4>
           <p className="text-xs font-poppins text-gray-400 mb-6">"SEULS LES FONDATEURS OU HEAD COACHS peuvent ajouter/modifier/supprimer des documents." Assignez-les à tout un Roster (privatisé par joueur) ou à TOUS (Option "Documents Généraux" Publics).</p>
           
           <form onSubmit={addGroupDocument} className="flex gap-4 flex-col md:flex-row bg-black/40 p-4 rounded-xl border border-white/5 items-end">
              <div className="flex-1 w-full space-y-1">
                <label className="text-[10px] font-techMono text-gray-500 uppercase tracking-widest pl-1">Nom / Titre du doc</label>
                <input required placeholder="Statuts Gowrax 2026..." value={pubTitle} onChange={e => setPubTitle(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-purple-500 focus:outline-none" />
              </div>
              <div className="flex-1 w-full space-y-1">
                <label className="text-[10px] font-techMono text-gray-500 uppercase tracking-widest pl-1">URL / Fichier</label>
                <input required placeholder="https://docs.google.com/..." value={pubUrl} onChange={e => setPubUrl(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-purple-500 focus:outline-none" />
              </div>
              <div className="w-full md:w-48 space-y-1">
                <label className="text-[10px] font-techMono text-gray-500 uppercase tracking-widest pl-1">Cible</label>
                <select value={targetGroup} onChange={e => setTargetGroup(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-purple-500 focus:outline-none cursor-pointer">
                  <option value="ALL">TOUS (Public)</option>
                  <option value="High Roster">GROUPE: High Roster</option>
                  <option value="Tryhard">GROUPE: Tryhard</option>
                  <option value="Academy">GROUPE: Academy</option>
                  <option value="Staff">GROUPE: Staff</option>
                </select>
              </div>
              <button type="submit" className="w-full md:w-auto h-[42px] px-6 bg-purple-500/20 text-purple-300 font-bold font-rajdhani tracking-wider border border-purple-500/40 rounded-lg hover:bg-purple-500 hover:text-white transition-all uppercase whitespace-nowrap">
                Distribuer
              </button>
           </form>

           <div className="mt-8">
             <h4 className="font-rajdhani font-bold text-gray-300 mb-4 inline-block bg-purple-900/30 px-3 py-1 rounded border border-purple-500/20 text-sm">ARCHIVES: DOCUMENTS PUBLICS (Généraux à tous les membres)</h4>
             {publicDocs.length === 0 ? <p className="text-xs text-gray-500 italic px-2">Aucun document public n'est actuellement diffusé.</p> : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {publicDocs.map(d => (
                    <div key={d.id} className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-white/5 hover:border-purple-500/30 transition-colors">
                      <div className="overflow-hidden pr-3">
                        <a href={d.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-gray-200 hover:text-purple-400 hover:underline truncate block">{d.title}</a>
                        <span className="text-[9px] font-techMono text-gray-500 mt-1 truncate block">{d.url}</span>
                      </div>
                      <button onClick={() => deleteDocument(d.id, true)} className="p-2 bg-red-500/10 text-red-500/70 hover:bg-red-500 hover:text-white rounded-lg transition-colors" title="Détruire Définitivement">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  ))}
               </div>
             )}
              <p className="text-[10px] text-gray-600 font-techMono mt-4 border-t border-white/5 pt-4">Les documents assignés à des Rosters n'apparaissent pas ici. Ils sont gérés "privés" directement depuis le panel des membres concernés.</p>
           </div>
         </div>
      )}

      {activeTab === 'members' && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
        {/* Liste des utilisateurs */}
        <div className="col-span-1 bg-white/5 rounded-xl p-4 max-h-[60vh] overflow-y-auto border border-white/10">
          <h4 className="font-rajdhani font-bold mb-3 text-gray-300">SÉLECTIONNER UN MEMBRE</h4>
          {loading ? <p className="text-xs text-gray-500">Chargement...</p> : (
            <div className="flex flex-col gap-2">
              {users.map(u => (
                <button 
                  key={u.id}
                  onClick={() => selectUser(u)}
                  className={`text-left px-3 py-2 rounded-lg text-sm font-poppins truncate transition-colors ${selectedUser?.id === u.id ? 'bg-[#00FF41]/20 border border-[#00FF41]/50 text-[#00FF41]' : 'hover:bg-white/10 text-gray-400'}`}
                >
                  {u.username || 'Membre GOWRAX'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Détails et Management du Profil Actif */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          {!selectedUser ? (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm font-techMono uppercase border border-dashed border-gray-700 rounded-xl p-6">
              Sélectionnez un profil pour l'éditer personnellement
            </div>
          ) : (
            <>
              {/* Informations du joueur */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="font-rajdhani font-bold text-white mb-2">INFOS PRINCIPALES</h4>
                <p className="text-xs text-gray-400">ID Discord: {selectedUser.discord_id}</p>
                <p className="text-xs text-gray-400">Nom: {selectedUser.username}</p>
                <p className="text-xs text-gray-400 mt-2">Assignation actuelle : <span className="text-[#00FF41]">{selectedUser.custom_affiliations?.join(', ') || 'Aucune'}</span></p>
              </div>

              {/* Gestion des absences */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="font-rajdhani font-bold text-white mb-3">VALIDATION DES ABSENCES</h4>
                {absences.length === 0 ? <p className="text-xs text-gray-500 italic">Aucune absence enregistrée.</p> : (
                  <div className="flex flex-col gap-2">
                     {absences.map(a => (
                       <div key={a.id} className="flex flex-col md:flex-row md:items-center justify-between bg-black/40 p-3 rounded-lg border border-white/5 gap-3">
                         <div>
                           <p className="text-sm text-gray-300">{new Date(a.date_start).toLocaleDateString()} au {new Date(a.date_end).toLocaleDateString()}</p>
                           <p className="text-xs text-gray-500">{a.reason}</p>
                           <p className={`text-[10px] font-techMono uppercase mt-1 ${a.status === 'validée' ? 'text-[#00FF41]' : a.status === 'refusée' ? 'text-red-500' : 'text-yellow-500'}`}>Status: {a.status || 'en attente'}</p>
                         </div>
                         <div className="flex gap-2">
                           <button onClick={() => updateAbsenceStatus(a.id, 'validée')} className="text-[10px] font-techMono uppercase px-2 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/40 rounded">Valider</button>
                           <button onClick={() => updateAbsenceStatus(a.id, 'refusée')} className="text-[10px] font-techMono uppercase px-2 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded">Refuser</button>
                           <button onClick={() => updateAbsenceStatus(a.id, 'en attente')} className="text-[10px] font-techMono uppercase px-2 py-1 bg-gray-500/20 text-gray-400 hover:bg-gray-500/40 rounded">Attente</button>
                         </div>
                       </div>
                     ))}
                  </div>
                )}
              </div>

              {/* Gestion des documents INDIVIDUELS */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="font-rajdhani font-bold text-[#00FF41] mb-3 border-b border-[#00FF41]/20 pb-2">DOCUMENTS PERSONNELS ASSIGNÉS (Strict Privé)</h4>
                
                <form onSubmit={addIndividualDocument} className="flex gap-2 mb-4">
                  <input required placeholder="Titre privé" value={indTitle} onChange={e => setIndTitle(e.target.value)} className="flex-1 bg-black/50 border border-white/10 rounded p-2 text-xs text-white" />
                  <input required placeholder="URL" value={indUrl} onChange={e => setIndUrl(e.target.value)} className="flex-1 bg-black/50 border border-white/10 rounded p-2 text-xs text-white" />
                  <button type="submit" className="text-[10px] font-techMono bg-[#00FF41]/20 text-[#00FF41] border border-[#00FF41]/50 px-4 py-2 rounded hover:bg-[#00FF41] hover:text-black transition-all uppercase tracking-widest">
                    Assigner
                  </button>
                </form>

                {userSpecificDocs.length === 0 ? <p className="text-xs text-gray-500 italic">Aucun document privé assigné à ce joueur (les diffusions de rosters n'apparaissent pas ici s'il n'en a pas).</p> : (
                  <div className="flex flex-col gap-2">
                     {userSpecificDocs.map(d => (
                       <div key={d.id} className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-white/5 hover:bg-black/60">
                         <div className="overflow-hidden">
                           <a href={d.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-gray-300 hover:text-[#00FF41] hover:underline truncate block">{d.title}</a>
                         </div>
                         <button onClick={() => deleteDocument(d.id, false)} className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors" title="Retirer l'accès">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                         </button>
                       </div>
                     ))}
                  </div>
                )}
              </div>

            </>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
