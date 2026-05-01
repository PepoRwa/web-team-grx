import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function VodCommentsModal({ vod, session, isStaff, isCoach, onClose }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewed, setIsReviewed] = useState(!!vod.reviewed_at);
  const [isPro, setIsPro] = useState(!!vod.is_pro);
  
  const [allProfiles, setAllProfiles] = useState([]);
  const [playersPresent, setPlayersPresent] = useState(() => {
    try {
      if (Array.isArray(vod.players_present)) return vod.players_present;
      return [];
    } catch { return []; }
  });

  useEffect(() => {
    fetchComments();
    if (isStaff || isCoach) {
      fetchProfiles();
    }
  }, [vod.id]);

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('id, username').order('username', { ascending: true });
    if (data) setAllProfiles(data);
  };

  const fetchComments = async () => {
    setLoading(true);
    let query = supabase
      .from('vod_comments')
      .select(`
        *,
        profiles (username, avatar_url)
      `)
      .eq('vod_id', vod.id)
      .order('created_at', { ascending: true });

    // Les joueurs normaux ne peuvent voir que les commentaires publics
    if (!(isStaff || isCoach)) {
      query = query.eq('is_private', false);
    }

    const { data, error } = await query;
    if (!error && data) {
      setComments(data);
    }
    setLoading(false);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    const { data, error } = await supabase
      .from('vod_comments')
      .insert([{
        vod_id: vod.id,
        author_id: session.user.id,
        content: newComment.trim(),
        is_private: isPrivate
      }])
      .select(`
        *,
        profiles (username, avatar_url)
      `)
      .single();

    if (!error && data) {
      setComments(prev => [...prev, data]);
      setNewComment('');
      setIsPrivate(false);
    } else {
      console.error("Erreur ajout commentaire:", error);
    }
    setIsSubmitting(false);
  };

  const handleDeleteComment = async (id) => {
    if (!window.confirm("Supprimer ce commentaire ?")) return;
    
    const { error } = await supabase.from('vod_comments').delete().eq('id', id);
    if (!error) {
      setComments(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleUpdateVodMeta = async () => {
    if (!isStaff && !isCoach) {
      alert("Erreur : Privilèges Staff/Coach requis.");
      return;
    }
    try {
      console.log("[DEBUG] Début de la mise à jour VOD ID:", vod.id);
      const updateData = {
        players_present: playersPresent,
        is_pro: isPro
      };
      if (isReviewed && !vod.reviewed_at) {
        updateData.reviewed_at = new Date().toISOString();
        updateData.reviewed_by = session.user.id;
      } else if (!isReviewed && vod.reviewed_at) {
        updateData.reviewed_at = null;
        updateData.reviewed_by = null;
      }

      console.log("[DEBUG] Payload Update:", updateData);

      const { data, error } = await supabase.from('vods').update(updateData).eq('id', vod.id);
      
      if (error) {
        console.error("[DEBUG] Supabase ERROR:", error);
        alert(`Erreur Supabase: ${error.message} (${error.code}) - Détails: ${error.details}`);
        return;
      }

      console.log("[DEBUG] Supabase SUCCESS:", data);
      alert('Métadonnées de la VOD mises à jour avec succès !');
      // On déclenche un reload externe possiblement si besoin
      if (typeof onClose === 'function') {
        // En vrai onClose ferme la modale, mais on veut un refresh parent : on fait avec window.dispatchEvent ou une props.
        window.dispatchEvent(new Event('vod_updated'));
      }
    } catch (err) {
      console.error("[DEBUG] Exception Capturée:", err);
      alert(`Exception inattendue: ${err.message}`);
    }
  };

  const togglePlayer = (profileId) => {
    setPlayersPresent(prev => 
      prev.includes(profileId) 
        ? prev.filter(id => id !== profileId) 
        : [...prev, profileId]
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="bg-gowrax-void border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-scale-up overflow-hidden">
        
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div>
            <h3 className="font-rajdhani font-bold text-2xl text-white">Discussion VOD</h3>
            <p className="text-gray-400 text-sm font-poppins">{vod.map} - vs {vod.opponent} ({vod.score})</p>
            {vod.title && <p className="text-xs font-rajdhani font-bold text-blue-400">{vod.title} {isReviewed && <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 rounded">REVIEWED</span>} {isPro && <span className="ml-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded">PRO VOD</span>}</p>}
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Coach / Staff metadata area */}
        {(isStaff || isCoach) && (
          <div className="p-4 border-b border-white/5 bg-blue-900/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-rajdhani text-gray-300 font-bold mb-1">Membres présents sur la VOD</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_pro_toggle" checked={isPro} onChange={e => setIsPro(e.target.checked)} className="w-4 h-4 text-indigo-500 bg-gray-800 border-gray-600 rounded" />
                  <label htmlFor="is_pro_toggle" className="text-sm font-rajdhani text-indigo-400">Classer VOD PRO</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="reviewed_toggle" checked={isReviewed} onChange={e => setIsReviewed(e.target.checked)} className="w-4 h-4 text-green-500 bg-gray-800 border-gray-600 rounded" />
                  <label htmlFor="reviewed_toggle" className="text-sm font-rajdhani text-green-400">Marquer Review</label>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto hidden-scrollbar bg-black/30 p-2 rounded-xl border border-white/5">
                {allProfiles.map(p => (
                  <label key={p.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-colors ${playersPresent.includes(p.id) ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                    <input type="checkbox" className="hidden" checked={playersPresent.includes(p.id)} onChange={() => togglePlayer(p.id)} />
                    {p.username}
                  </label>
                ))}
                {allProfiles.length === 0 && <span className="text-xs text-gray-500 italic">Chargement des membres...</span>}
              </div>
              <div className="flex justify-end mt-1">
                <button onClick={handleUpdateVodMeta} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-colors shadow-lg">Enregistrer ces paramètres</button>
              </div>
            </div>
          </div>
        )}

        {/* Liste des commentaires */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 custom-scrollbar bg-gradient-to-b from-black/0 to-black/40">
          {loading ? (
            <div className="flex justify-center p-8">
              <span className="text-gray-500 font-techMono animate-pulse text-xs uppercase">Chargement des retours...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
               <svg className="w-12 h-12 text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
               <p className="font-rajdhani font-bold text-gray-400">Aucune analyse pour le moment.</p>
            </div>
          ) : (
            comments.map(c => (
              <div 
                key={c.id} 
                className={`p-4 rounded-xl border relative group flex gap-3 ${
                  c.is_private 
                    ? 'bg-red-500/5 border-red-500/20' 
                    : 'bg-white/5 border-white/10'
                }`}
              >
                {/* Avatar */}
                <div className="shrink-0 mt-1">
                  {c.profiles?.avatar_url ? (
                    <img src={c.profiles.avatar_url} alt="avatar" className="w-8 h-8 rounded-full border border-gray-700" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold border border-gray-700">?</div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                       <span className="font-rajdhani font-bold text-white text-sm md:text-base">{c.profiles?.username || 'Utilisateur'}</span>
                       {c.is_private && (
                         <span className="px-2 py-0.5 rounded text-[9px] font-techMono bg-red-500/20 text-red-400 uppercase tracking-widest border border-red-500/30">Privé (Staff)</span>
                       )}
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] text-gray-500 font-techMono">{new Date(c.created_at).toLocaleDateString('fr-FR')} - {new Date(c.created_at).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</span>
                       {(isStaff || isCoach || c.author_id === session.user.id) && (
                         <button onClick={() => handleDeleteComment(c.id)} className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all" title="Supprimer">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                         </button>
                       )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 font-poppins whitespace-pre-wrap leading-relaxed">
                    {c.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Commentaire (Uniquement Coach / Staff) */}
        {(isStaff || isCoach) && (
          <div className="p-4 md:p-6 border-t border-white/5 bg-black/40">
            <form onSubmit={handleAddComment} className="flex flex-col gap-3">
              <textarea 
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Rédiger une analyse, remarque..."
                className="w-full bg-black/60 border border-gray-700 hover:border-gray-500 focus:border-blue-500 rounded-xl p-3 text-sm text-white font-poppins outline-none resize-none transition-colors"
                rows="3"
                required
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={isPrivate}
                    onChange={e => setIsPrivate(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-black/50 accent-red-500"
                  />
                  <span className="text-xs font-techMono text-gray-400 group-hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    Avis Privé (Coach Uniquement)
                  </span>
                </label>
                <button 
                  type="submit" 
                  disabled={!newComment.trim() || isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-rajdhani font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? 'ENVOI...' : 'PUBLIER'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
