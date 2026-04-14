import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Members({ session, isStaff, isCoach }) {
  const [discordMembers, setDiscordMembers] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Tous');

  // Modal Coach/Staff
  const [selectedMember, setSelectedMember] = useState(null);
  const [editAffiliations, setEditAffiliations] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // 1. On récupère le cache global de Discord
    const { data: dcData } = await supabase.from('discord_cache').select('*').order('highest_role', { ascending: true });
    if (dcData) {
      setDiscordMembers(dcData);
    }

    // 2. On récupère les profils (pour les notes persos, affiliations web)
    const { data: profData } = await supabase.from('profiles').select('*');
    if (profData) {
      const pMap = profData.reduce((acc, p) => ({ ...acc, [p.discord_id || p.username]: p }), {});
      setProfilesMap(pMap);
    }

    setLoading(false);
  };

  const rosters = ['Tous', 'High Roster', 'Academy', 'Tryhard', 'Chill', 'Staff', 'Autre'];

  const filteredMembers = discordMembers.filter(m => {
    if (filter === 'Tous') return true;
    const role = (m.highest_role || '').toUpperCase();
    
    if (filter === 'High Roster') return role.includes('HIGH');
    if (filter === 'Academy') return role.includes('ACADEMY');
    if (filter === 'Tryhard') return role.includes('TRYHARD');
    if (filter === 'Chill') return role.includes('CHILL');
    if (filter === 'Staff') return role.includes('FONDAT') || role.includes('STAFF') || role.includes('COACH') || role.includes('MODÉRATEUR') || role.includes('TECH') || role.includes('CREATIVE');
    
    // Autre
    return !['HIGH', 'ACADEMY', 'TRYHARD', 'CHILL', 'FONDAT', 'STAFF', 'COACH', 'MODÉRATEUR', 'TECH', 'CREATIVE'].some(r => role.includes(r));
  });

  const handleOpenEdit = (member) => {
    if (!isStaff && !isCoach) return;
    
    // Chercher le profil
    const prof = profilesMap[member.discord_id] || profilesMap[member.username];
    setSelectedMember({ ...member, profile: prof });
    
    // Preparer les champs
    setEditAffiliations(prof?.custom_affiliations?.join(', ') || '');
    setEditNotes(prof?.coach_notes || '');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!selectedMember || !selectedMember.profile) {
      alert("Ce membre ne s'est jamais connecté au site. Profil web inexistant, impossible de sauvegarder des données privées.");
      return;
    }

    setIsSaving(true);
    const splitAffiliations = editAffiliations.split(',').map(s => s.trim()).filter(Boolean);

    const { error } = await supabase.from('profiles')
      .update({
        custom_affiliations: splitAffiliations,
        coach_notes: editNotes
      })
      .eq('id', selectedMember.profile.id);

    if (!error) {
      // Mettre à jour l'UI localement
      setProfilesMap(prev => ({
        ...prev,
        [selectedMember.discord_id]: { 
          ...prev[selectedMember.discord_id], 
          custom_affiliations: splitAffiliations, 
          coach_notes: editNotes 
        }
      }));
      setSelectedMember(null);
    } else {
      console.error(error);
      alert('Erreur: ' + error.message);
    }
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col h-full animate-fade-in relative z-10 pb-20 md:pb-0">
      
      {/* HEADER SECTION */}
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="font-rajdhani text-3xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 uppercase">
            EFFECTIFS & ROSTERS
          </h2>
          <p className="font-poppins text-sm text-gray-400 mt-1 max-w-xl">
             Base de données des agents certifiés. { (isStaff || isCoach) ? 'Gérez les affiliations et notes d\'évolution en cliquant sur un profil.' : 'Consultez la composition des lignes de l\'équipe.' }
          </p>
        </div>
      </div>

      {/* FILTRES */}
      <div className="flex flex-wrap gap-2 mb-6">
        {rosters.map(r => (
           <button 
             key={r}
             onClick={() => setFilter(r)}
             className={`px-4 py-2 font-techMono text-xs uppercase rounded-xl transition-all shadow-lg ${
                filter === r 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                  : 'bg-black/40 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white'
             }`}
           >
             {r}
           </button>
        ))}
      </div>

      {/* GRILLE MEMBRES */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
        {loading ? (
          <div className="flex justify-center p-10">
            <span className="text-emerald-500 font-techMono animate-pulse tracking-widest">CHARGEMENT DE LA MATRICE DES AGENTS...</span>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 opacity-50">
            <svg className="w-12 h-12 text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            <p className="font-rajdhani font-bold text-gray-400 text-lg">Aucun agent dans cette division.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMembers.map(member => {
              const prof = profilesMap[member.discord_id] || profilesMap[member.username];
              const affils = prof?.custom_affiliations || [];
              const isRegistered = !!prof;

              return (
                <div 
                  key={member.discord_id} 
                  onClick={() => handleOpenEdit(member)}
                  className={`bg-black/60 backdrop-blur-md border rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden transition-all duration-300 ${
                    (isStaff || isCoach) ? 'cursor-pointer hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-[0_5px_20px_rgba(16,185,129,0.2)]' : 'border-white/10'
                  }`}
                >
                  {/* Badge Discord */}
                  <div className="absolute top-0 right-0 bg-white/5 backdrop-blur-xl px-3 py-1 rounded-bl-xl border-b border-l border-white/5 font-techMono text-[8px] uppercase tracking-widest text-gray-500">
                    Discord Sync
                  </div>

                  <div className="flex items-center gap-4 mt-2">
                    <div className="relative shrink-0">
                      <img 
                        src={member.avatar_url || 'https://via.placeholder.com/60'} 
                        alt="avatar" 
                        className="w-14 h-14 rounded-xl border border-white/10 object-cover" 
                      />
                      {isRegistered && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-black flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.8)]" title="Inscrit sur le site">
                           <svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <h3 className="font-rajdhani font-bold text-xl text-white truncate leading-tight">
                        {member.global_name || member.username}
                      </h3>
                      <span className="font-poppins text-xs text-gray-500 truncate">@{member.username}</span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-col gap-2 mt-2">
                    
                    {/* Role Principal Discord */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[8px] font-techMono text-gray-500 uppercase mr-1">Serveur :</span>
                      <span className={`px-2 py-0.5 text-[9px] font-techMono font-bold rounded uppercase tracking-wider ${
                        (member.highest_role || '').toUpperCase().includes('FONDAT') || (member.highest_role || '').toUpperCase().includes('STAFF') ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        (member.highest_role || '').toUpperCase().includes('HIGH') ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        (member.highest_role || '').toUpperCase().includes('ACADEMY') ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                        (member.highest_role || '').toUpperCase().includes('TRYHARD') ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {member.highest_role || 'Membre'}
                      </span>
                    </div>
                    
                    {/* Affiliations Web (Custom) */}
                    {affils.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 items-center pt-1 border-t border-white/5">
                        <span className="text-[8px] font-techMono text-emerald-500/70 uppercase mr-1">Rôles GOWRAX :</span>
                        {affils.map((affil, idx) => (
                          <span key={idx} className="px-2 py-0.5 text-[9px] font-techMono font-bold rounded uppercase tracking-wider bg-emerald-500/40 text-white border border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                            {affil}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Indicateur notes privées pour staff */}
                  {(isStaff || isCoach) && prof?.coach_notes && (
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-techMono text-gray-500 uppercase">
                      <span className="flex items-center gap-1 text-teal-500">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        Note Dossier Active
                      </span>
                      <span>Dossier Lié</span>
                    </div>
                  )}

                  {!isRegistered && (isStaff || isCoach) && (
                    <div className="mt-2 pt-2 border-t border-white/5 text-[9px] font-techMono text-red-500/70 uppercase">
                      Passif - Non inscrit web ❌
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL EDITION (Staff/Coach Uniquement) */}
      {selectedMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedMember(null)} />
          
          <div className="bg-gowrax-void border border-emerald-500/20 rounded-2xl w-full max-w-lg relative z-10 shadow-[0_0_50px_rgba(16,185,129,0.3)] animate-scale-up overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 bg-gradient-to-r from-emerald-900/20 to-transparent flex justify-between items-start">
              <div className="flex gap-4 items-center">
                 <img src={selectedMember.avatar_url || 'https://via.placeholder.com/60'} className="w-12 h-12 rounded-xl object-cover border border-emerald-500/50" />
                 <div>
                   <h3 className="font-rajdhani font-bold text-2xl text-white leading-none">{selectedMember.global_name || selectedMember.username}</h3>
                   <span className="text-emerald-400 font-techMono text-[10px] uppercase">MODIFICATION DE DOSSIER CLASSIFIÉ</span>
                 </div>
              </div>
            </div>

            {selectedMember.profile ? (
              <form onSubmit={handleSaveProfile} className="p-6 flex flex-col gap-5 bg-black/40">
                <div>
                  <label className="font-techMono text-[10px] text-emerald-400 uppercase mb-2 flex items-center gap-2 font-bold">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                    TAGS OFFICIELS GOWRAX (Séparés par virgule)
                  </label>
                  <input 
                    type="text"
                    value={editAffiliations}
                    onChange={e => setEditAffiliations(e.target.value)}
                    placeholder="ex: Ligne Principale, Main Tracker, Analyste"
                    className="w-full bg-black/60 border border-emerald-500/50 rounded-lg p-3 text-sm text-white font-poppins focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all outline-none"
                  />
                  <p className="text-[10px] text-gray-400 font-poppins mt-2 bg-black/50 p-2 rounded border border-white/5">
                     💡 Ces rôles s'affichent uniquement sur le site (en vert). Ils n'ont <b>aucun effet sur Discord</b>. Très utile pour créer des sous-groupes ou du tryhard ciblé.
                  </p>
                </div>

                <div>
                  <label className="font-techMono text-[10px] text-gray-400 uppercase mb-2 flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    Notes de Coaching (Privé)
                  </label>
                  <textarea 
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    placeholder="Axes d'amélioration, remarques de comportement, décisions de lineup..."
                    className="w-full bg-black/60 border border-white/10 rounded-lg p-3 text-sm text-gray-300 font-poppins focus:border-emerald-500 outline-none resize-none h-32"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setSelectedMember(null)} className="px-5 py-2 rounded-lg font-rajdhani font-bold text-sm bg-white/5 text-gray-400 hover:bg-white/10 transition-colors uppercase">
                    Annuler
                  </button>
                  <button type="submit" disabled={isSaving} className="px-5 py-2 rounded-lg font-rajdhani font-bold text-sm bg-emerald-600 text-white hover:bg-emerald-500 transition-colors uppercase shadow-[0_0_15px_rgba(16,185,129,0.4)] disabled:opacity-50">
                    {isSaving ? 'SAUVEGARDE...' : 'METTRE A JOUR'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-8 flex flex-col items-center justify-center text-center bg-black/40">
                <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-4 border border-red-500/50">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <h4 className="font-rajdhani text-xl text-white font-bold mb-2">Profil Web Inexistant</h4>
                <p className="text-gray-400 font-poppins text-xs mb-6">
                  {selectedMember.global_name || selectedMember.username} est présent(e) sur le Discord mais ne s'est encore jamais connecté(e) sur le site GOWRAX. Impossible d'attacher des affiliations ou notes. Demandez à cet agent de se connecter une première fois.
                </p>
                <button onClick={() => setSelectedMember(null)} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-rajdhani font-bold uppercase rounded-lg">
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
