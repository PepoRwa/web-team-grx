import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function DevPanel({ session, onlineUsers = {} }) {
  const [activeTab, setActiveTab] = useState('issues'); // 'sessions', 'logs', 'issues'
  
  // Data states
  const [logs, setLogs] = useState([]);
  const [issues, setIssues] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);

  // States Issue
  const [newIssue, setNewIssue] = useState({ title: '', description: '', priority: 'medium' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // States Commentaires / Détail Issue
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const [discordMembers, setDiscordMembers] = useState([]);

  useEffect(() => {
    fetchData();
    // Si on change d'onglet, on quitte le ticket sélectionné
    if (activeTab !== 'issues') setSelectedIssue(null);
  }, [activeTab]);

  useEffect(() => {
    if (selectedIssue) fetchComments(selectedIssue.id);
  }, [selectedIssue]);

  // SYSTEME DE RADAR (TEMPS REEL)
  useEffect(() => {
    if (activeTab !== 'sessions') return;

    const fetchDiscordCache = async () => {
      const { data, error } = await supabase.from('discord_cache').select('*').order('highest_role', { ascending: true });
      if (data) setDiscordMembers(data);
    };
    fetchDiscordCache();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Fetch profiles mapping
    // Remarque: On fetch de nouveau 'profiles' si l'onglet est 'sessions' pour avoir des 'last_seen' frais
    const { data: profData } = await supabase.from('profiles').select('id, username, avatar_url, is_dev, last_seen, last_page, discord_id');
    if (profData) {
      const profMap = profData.reduce((acc, p) => ({...acc, [p.id]: p}), {});
      setProfiles(profMap);
    }

    // 2. Fetch according to tab
    if (activeTab === 'logs') {
      const { data, error } = await supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) console.error("Erreur Fetch Logs:", error);
      if (data) setLogs(data);
    } else if (activeTab === 'issues') {
      const { data, error } = await supabase.from('bug_reports').select('*').order('created_at', { ascending: false });
      if (error) console.error("Erreur Fetch Bug Reports:", error);
      if (data) setIssues(data);
    }
    
    setLoading(false);
  };

  const fetchComments = async (issueId) => {
    const { data } = await supabase.from('bug_comments').select('*').eq('bug_id', issueId).order('created_at', { ascending: true });
    if (data) setComments(data);
  };

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await supabase.from('bug_reports').insert({
      title: newIssue.title,
      description: newIssue.description,
      priority: newIssue.priority,
      author_id: session.user.id,
      status: 'open'
    });

    if (!error) {
      await supabase.from('notifications').insert({
        type: 'global',
        target_roster: 'Staff',
        title: `🚨 Nouveau Bug: ${newIssue.title}`,
        message: `Priorité: **${newIssue.priority.toUpperCase()}**\nAuteur: ${profiles[session.user.id]?.username || 'Système'}\n\n*Allez dans le panel TECH_CORE pour l'inspecter.*`
      });
      setNewIssue({ title: '', description: '', priority: 'medium' });
      fetchData();
    }
    setIsSubmitting(false);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedIssue) return;

    const { error } = await supabase.from('bug_comments').insert({
      bug_id: selectedIssue.id,
      author_id: session.user.id,
      content: newComment
    });

    if (!error) {
      setNewComment('');
      fetchComments(selectedIssue.id);
    }
  };

  const updateIssueStatus = async (id, newStatus) => {
    await supabase.from('bug_reports').update({ status: newStatus }).eq('id', id);
    if (selectedIssue && selectedIssue.id === id) {
      setSelectedIssue({...selectedIssue, status: newStatus});
    }
    fetchData();
  };

  const assignToMe = async (id) => {
    await supabase.from('bug_reports').update({ assigned_to: session.user.id }).eq('id', id);
    if (selectedIssue && selectedIssue.id === id) {
      setSelectedIssue({...selectedIssue, assigned_to: session.user.id});
    }
    fetchData();
  };

  const generateTestLog = async () => {
    await supabase.from('system_logs').insert({
      level: 'warning',
      action: 'SYSTEM_TEST',
      details: 'Test de déclenchement manuel du panel d\'audit par un développeur.',
      user_id: session.user.id
    });
    fetchData();
  };

  return (
    <div className="flex flex-col h-full animate-fade-in pb-16 md:pb-0">
      <div className="mb-6 border-b border-gray-700 pb-4">
        <h2 className="font-techMono text-2xl font-bold tracking-widest text-[#00FF41]">⚠️ DEV_CORE_PANEL</h2>
        <p className="font-poppins text-sm text-gray-400">Système d'administration avancé - Niveau Accréditation: DEV</p>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex bg-black/40 border border-white/10 rounded-lg p-1 mb-6 mr-auto overflow-x-auto whitespace-nowrap custom-scrollbar">
        <button onClick={() => setActiveTab('issues')} className={`px-4 py-2 font-techMono text-xs uppercase rounded transition-colors ${activeTab === 'issues' ? 'bg-[#00FF41]/20 text-[#00FF41]' : 'text-gray-400 hover:text-white'}`}>
          🐞 Bug Tracker (Tickets)
        </button>
        <button onClick={() => setActiveTab('logs')} className={`px-4 py-2 font-techMono text-xs uppercase rounded transition-colors ${activeTab === 'logs' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}>
          📝 Audit Logs
        </button>
        <button onClick={() => setActiveTab('sessions')} className={`px-4 py-2 font-techMono text-xs uppercase rounded transition-colors ${activeTab === 'sessions' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white'}`}>
          🟢 Live Radar
        </button>
      </div>

      <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-4 md:p-6 overflow-hidden flex flex-col shadow-2xl relative">
        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <p className="text-[#00FF41] font-techMono animate-pulse">EXTRACTION DES DONNÉES EN COURS...</p>
          </div>
        ) : (
          <>
            {/* ===================== ONGLET 1: LOGS D'AUDIT ===================== */}
            {activeTab === 'logs' && (
              <div className="flex flex-col h-full space-y-4">
                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                  <div>
                    <h3 className="font-rajdhani text-xl font-bold text-blue-400">LOGS SYSTÈME (HISTORIQUE)</h3>
                    <p className="text-xs text-gray-500 font-techMono">Trace de toutes les actions, erreurs et crashs de l'app.</p>
                  </div>
                  <button onClick={generateTestLog} className="text-[10px] font-techMono px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded border border-yellow-500/30 hover:bg-yellow-500 hover:text-black transition-colors">
                    SIMULER UN LOG⚠️
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {logs.length === 0 ? <p className="text-gray-500 font-techMono p-4 bg-white/5 rounded">Aucun log détecté dans la matrice.</p> : null}
                  {logs.map(log => (
                    <div key={log.id} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 bg-black/80 border border-white/5 p-3 rounded font-techMono text-xs shadow-inner hover:bg-white/[0.02] transition-colors">
                      <span className={`px-2 py-1 rounded text-black font-bold uppercase min-w-[80px] text-center ${
                        log.level === 'error' || log.level === 'critical' ? 'bg-red-500' : 
                        log.level === 'warning' ? 'bg-yellow-500' : 'bg-blue-400'
                      }`}>
                        {log.level}
                      </span>
                      <span className="text-gray-500 min-w-[140px]">{new Date(log.created_at).toLocaleString()}</span>
                      {log.user_id && (
                        <span className="text-purple-400">@{profiles[log.user_id]?.username || 'User'}</span>
                      )}
                      <span className="text-white font-bold">{log.action}</span>
                      <span className="text-gray-400 flex-1 md:text-right break-all">{log.details}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===================== ONGLET 2: BUG TRACKER ===================== */}
            {activeTab === 'issues' && (
              selectedIssue ? (
                /* --- VUE DETAILS DU TICKET --- */
                <div className="flex flex-col h-full animate-fade-in">
                  <button onClick={() => setSelectedIssue(null)} className="self-start text-[10px] font-techMono mb-4 px-3 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors">
                    ← RETOUR AUX TICKETS
                  </button>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                           <span className="text-gray-500 font-techMono text-xs">#{selectedIssue.id}</span>
                           <span className={`px-2 py-0.5 text-[10px] font-techMono rounded uppercase text-white ${
                              selectedIssue.priority === 'critical' ? 'bg-red-600 animate-pulse' :
                              selectedIssue.priority === 'high' ? 'bg-orange-500' :
                              selectedIssue.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-500'
                            }`}>PRIORITÉ: {selectedIssue.priority}</span>
                        </div>
                        <h3 className="font-rajdhani text-2xl font-bold text-[#00FF41]">{selectedIssue.title}</h3>
                        <p className="text-xs text-gray-400 mt-2 font-poppins">{selectedIssue.description}</p>
                      </div>
                      
                      <div className="flex flex-col gap-2 border-l border-white/10 pl-4">
                         {selectedIssue.status !== 'closed' && selectedIssue.status !== 'resolved' && (
                           <>
                              <button onClick={() => assignToMe(selectedIssue.id)} className="text-[10px] font-techMono px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded border border-purple-500/30 hover:bg-purple-500 hover:text-white transition-colors text-left uppercase">
                                🙋‍♂️ M'assigner ce bug
                              </button>
                              <button onClick={() => updateIssueStatus(selectedIssue.id, 'resolved')} className="text-[10px] font-techMono px-3 py-1.5 bg-green-500/20 text-green-400 rounded border border-green-500/30 hover:bg-green-500 hover:text-white transition-colors text-left uppercase">
                                ✅ Marquer comme Résolu
                              </button>
                           </>
                         )}
                         <div className="text-xs text-gray-500 font-techMono mt-2">
                           Assigné à : <span className="text-white">{profiles[selectedIssue.assigned_to]?.username || 'Personne'}</span>
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* DISCUSSION/COMMENTAIRES DU TICKET */}
                  <div className="flex-1 flex flex-col bg-black/50 border border-white/5 rounded-xl overflow-hidden">
                    <div className="p-3 bg-white/5 border-b border-white/5 font-techMono text-xs text-gray-400">
                      THREAD DE RÉSOLUTION
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                      {comments.length === 0 ? (
                        <p className="text-center text-gray-600 font-poppins text-sm italic mt-10">Aucun commentaire technique pour l'instant.</p>
                      ) : (
                        comments.map(c => (
                          <div key={c.id} className={`flex flex-col max-w-[80%] ${c.author_id === session.user.id ? 'ml-auto items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <img src={profiles[c.author_id]?.avatar_url || 'https://via.placeholder.com/20'} className="w-4 h-4 rounded-full" />
                              <span className="text-[10px] font-techMono text-gray-500">
                                {profiles[c.author_id]?.username} • {new Date(c.created_at).toLocaleDateString()} {new Date(c.created_at).getHours()}:{new Date(c.created_at).getMinutes()}
                              </span>
                            </div>
                            <div className={`px-4 py-2 rounded-xl text-sm font-poppins ${
                              profiles[c.author_id]?.is_dev ? 'bg-[#00FF41]/10 border border-[#00FF41]/30 text-[#00FF41]' : 'bg-white/10 text-white'
                            }`}>
                              {c.content}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={handleAddComment} className="p-3 bg-white/5 border-t border-white/5 flex gap-2">
                      <input 
                        value={newComment} onChange={e => setNewComment(e.target.value)}
                        placeholder="Ajouter une note de résolution ou demander des précisions..."
                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#00FF41] outline-none"
                      />
                      <button type="submit" className="px-4 bg-[#00FF41] text-black font-techMono font-bold rounded-lg hover:bg-[#00FF41]/80 transition-colors uppercase text-sm">
                        Envoyer
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                /* --- VUE LISTE DES TICKETS --- */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
                  
                  {/* NOUVEAU TICKET FORM */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-4 overflow-y-auto">
                    <div>
                      <h3 className="font-rajdhani text-xl font-bold text-[#00FF41]">NOUVELLE ISSUE</h3>
                      <p className="text-xs text-gray-500">Ouvrir un ticket pour un bug récurrent ou un défaut visuel.</p>
                    </div>
                    <form onSubmit={handleCreateIssue} className="flex flex-col gap-3">
                      <input 
                        required value={newIssue.title} onChange={e => setNewIssue({...newIssue, title: e.target.value})}
                        placeholder="Titre court (ex: Crash Calendrier)..." 
                        className="bg-black border border-white/10 p-2 rounded text-sm text-white font-poppins focus:border-[#00FF41] outline-none"
                      />
                      <select 
                        value={newIssue.priority} onChange={e => setNewIssue({...newIssue, priority: e.target.value})}
                        className="bg-black border border-white/10 p-2 rounded text-sm text-white font-poppins focus:border-[#00FF41] outline-none"
                      >
                        <option value="low">Priorité: BASSE</option>
                        <option value="medium">Priorité: NORMALE</option>
                        <option value="high">Priorité: HAUTE</option>
                        <option value="critical">Priorité: CRITIQUE 💥</option>
                      </select>
                      <textarea 
                        required value={newIssue.description} onChange={e => setNewIssue({...newIssue, description: e.target.value})}
                        placeholder="Description complète, comment reproduire le bug..." 
                        className="bg-black border border-white/10 p-2 rounded text-sm text-white font-poppins focus:border-[#00FF41] outline-none h-32 resize-none"
                      />
                      <button type="submit" disabled={isSubmitting} className="bg-[#00FF41]/20 text-[#00FF41] font-techMono py-3 rounded hover:bg-[#00FF41] hover:text-black border border-[#00FF41]/50 transition-colors uppercase text-sm disabled:opacity-50 mt-2">
                        Soumettre Issue
                      </button>
                    </form>
                  </div>

                  {/* LISTE DES TICKETS */}
                  <div className="lg:col-span-2 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    <h3 className="font-rajdhani text-xl font-bold border-b border-white/10 pb-2">TICKETS ACTIFS ({issues.filter(i => i.status !== 'closed' && i.status !== 'resolved').length})</h3>
                    {issues.length === 0 ? <p className="text-gray-500 font-techMono text-sm">La base de données est propre. Aucun ticket.</p> : null}
                    
                    {issues.map(issue => (
                      <div 
                        key={issue.id} 
                        onClick={() => setSelectedIssue(issue)}
                        className={`p-4 rounded-xl border flex flex-col gap-2 cursor-pointer transition-transform hover:scale-[1.01] ${
                        issue.status === 'resolved' ? 'border-green-500/20 bg-green-500/5' : 
                        issue.status === 'closed' ? 'border-gray-700 bg-gray-900/20 opacity-50' : 
                        'border-white/10 bg-white/5 hover:border-[#00FF41]/50 hover:bg-[#00FF41]/5'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-[10px] font-techMono rounded uppercase ${
                              issue.priority === 'critical' ? 'bg-red-500 text-white animate-pulse' :
                              issue.priority === 'high' ? 'bg-orange-500 text-white' :
                              issue.priority === 'medium' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
                            }`}>{issue.priority}</span>
                            <h4 className="font-poppins font-bold text-white text-base max-w-[200px] md:max-w-md truncate">{issue.title}</h4>
                          </div>
                          <span className={`text-[10px] font-techMono px-2 py-0.5 rounded border ${
                             issue.status === 'resolved' ? 'text-green-500 border-green-500' :
                             issue.status === 'closed' ? 'text-red-500 border-red-500' :
                             'text-blue-400 border-blue-500 bg-blue-500/10'
                          }`}>
                            {issue.status}
                          </span>
                        </div>
                        
                        <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap justify-between items-center gap-2">
                          <div className="flex items-center gap-2 text-[10px] font-techMono text-gray-500 uppercase">
                            <img src={profiles[issue.author_id]?.avatar_url || 'https://via.placeholder.com/20'} className="w-5 h-5 rounded-full" />
                            Signalé par {profiles[issue.author_id]?.username || 'Système'}
                          </div>
                          {issue.assigned_to && (
                             <span className="text-[#00FF41] text-[10px] font-techMono flex items-center gap-1 bg-[#00FF41]/10 px-2 py-1 rounded">
                               🧑‍💻 Assigné: {profiles[issue.assigned_to]?.username}
                             </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* ===================== ONGLET 3: RADAR (UNIQUEMENT PC) ===================== */}
            {activeTab === 'sessions' && (
              <>
                <div className="md:hidden flex flex-col items-center justify-center p-10 h-full text-center space-y-4">
                   <h3 className="font-techMono text-2xl text-red-500 animate-pulse">RESTREINT AU PC</h3>
                   <p className="text-gray-500 font-poppins text-sm max-w-md">L'interface du Radar de Scan croisé (Membres Discord x Profils Web x WebSocket Temp-Réel) est trop volumineuse pour être affichée sur mobile.</p>
                </div>
                
                <div className="hidden md:flex flex-col h-full animate-fade-in space-y-4">
                   <div className="flex justify-between items-center border-b border-white/10 pb-4">
                     <div>
                        <h3 className="font-rajdhani text-2xl font-bold tracking-wider text-purple-400">🕵️ GLOBAL RADAR SYSTEM</h3>
                        <p className="text-sm font-techMono text-gray-500">Scan des membres du serveur VS Inscrits sur le site Web.</p>
                     </div>
                     <div className="flex gap-4 items-center">
                        <div className="flex flex-col items-end">
                           <span className="font-techMono text-[10px] text-gray-500 uppercase">Connectés Site</span>
                           <div className="flex items-center gap-2">
                             <div className="w-3 h-3 bg-purple-500 rounded-full animate-ping"></div>
                             <span className="font-bold text-white text-lg">{Object.keys(onlineUsers).length}</span>
                           </div>
                        </div>
                        <div className="h-8 w-px bg-white/20 mx-2"></div>
                        <div className="flex flex-col items-start bg-black/50 px-4 py-2 border border-white/10 rounded-lg">
                           <span className="font-techMono text-[10px] text-gray-500 uppercase">Membres Discord</span>
                           <span className="font-bold text-white text-lg">{discordMembers.length}</span>
                        </div>
                     </div>
                   </div>

                   <div className="flex-1 overflow-x-auto overflow-y-auto bg-black/60 border border-white/5 rounded-xl custom-scrollbar relative">
                     <table className="w-full text-left font-techMono">
                       <thead className="sticky top-0 bg-[#0B0D17] border-b border-white/10 text-[10px] uppercase text-gray-500 z-10">
                         <tr>
                           <th className="p-3 w-10">Statut</th>
                           <th className="p-3">Membre Server</th>
                           <th className="p-3">Rôle Majeur</th>
                           <th className="p-3">Inscrit Web?</th>
                           <th className="p-3">Activité Site</th>
                         </tr>
                       </thead>
                       <tbody>
                        {discordMembers.map(member => {
                          // Chercher si le joueur s'est inscrit sur le site via la liaison discord
                          // On compare le nom d'utilisateur de la base profiles avec celui du cache Discord
                          const enrolledProfile = Object.values(profiles).find(p => 
                            p && (
                              (p.discord_id && p.discord_id === member.discord_id) ||
                              (p.username && (
                                p.username.toLowerCase() === member.username.toLowerCase() || 
                                (member.global_name && p.username.toLowerCase() === member.global_name.toLowerCase())
                              ))
                            )
                          );
                          
                          // Chercher s'il est en ce moment même sur le site (Presence)
                           let isOnline = false;
                           let action = 'Hors-ligne';

                           Object.values(onlineUsers || {}).forEach(arr => {
                             if (arr && arr[0]) {
                               const uName = arr[0].username?.toLowerCase();
                               if (
                                 (arr[0].discord_id && arr[0].discord_id === member.discord_id) ||
                                 uName === member.username?.toLowerCase() || 
                                 uName === member.global_name?.toLowerCase()
                               ) {
                                 isOnline = true;
                                 action = `Sur la page : ${arr[0].tab.toUpperCase()}`;
                               }
                             }
                           });

                           // Si pas en ligne mais a un profil, on tente d'afficher son 'last_seen'
                           if (!isOnline && enrolledProfile?.last_seen) {
                             const lastVisibleDate = new Date(enrolledProfile.last_seen);
                             action = `Vu dernièrement sur : ${enrolledProfile.last_page || 'Inconnue'} (${lastVisibleDate.toLocaleDateString('fr-FR')} à ${lastVisibleDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})})`;
                           }

                           return (
                             <tr key={member.discord_id} className="border-b border-white/5 hover:bg-white/5 transition-colors h-14">
                               <td className="p-3 text-center align-middle">
                                 {isOnline ? (
                                   <div className="w-3 h-3 bg-[#00FF41] rounded-full mx-auto shadow-[0_0_10px_#00FF41]"></div>
                                 ) : (
                                   <div className="w-2 h-2 bg-gray-700 rounded-full mx-auto"></div>
                                 )}
                               </td>
                               <td className="p-3">
                                  <div className="flex items-center gap-3">
                                      <img src={member.avatar_url || 'https://via.placeholder.com/40'} className="w-8 h-8 rounded-lg outline outline-1 outline-white/10" />
                                      <div className="flex flex-col">
                                          <span className="font-bold text-white text-sm">{member.global_name}</span>
                                          <span className="text-[10px] text-gray-600">@{member.username}</span>
                                      </div>
                                  </div>
                               </td>
                               <td className="p-3">
                                  <span className={`px-2 py-1 text-[10px] font-bold rounded ${
                                      member.highest_role.includes('Staff') || member.highest_role.includes('Admin') ? 'bg-red-500/20 border border-red-500/50 text-red-400' :
                                      member.highest_role.includes('Roster') || member.highest_role.includes('Tryhard') ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400' : 
                                      'bg-gray-500/20 border border-gray-500/50 text-gray-400'
                                  }`}>
                                     {member.highest_role}
                                  </span>
                               </td>
                               <td className="p-3 text-xs">
                                  {enrolledProfile ? (
                                    <span className="text-[#00FF41]">✅ OUI</span>
                                  ) : (
                                    <span className="text-gray-500">❌ NON</span>
                                  )}
                               </td>
                               <td className="p-3 text-xs italic">
                                  {isOnline ? (
                                    <span className="text-[#00FF41] flex items-center gap-2">
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                       {action}
                                    </span>
                                  ) : (
                                    <span className="text-gray-600">Inactif</span>
                                  )}
                               </td>
                             </tr>
                           )
                         })}
                       </tbody>
                     </table>
                   </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
