import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FiCrosshair, FiMap, FiVideo, FiPlus, FiFilter, FiTrash2, FiEdit2, FiPlayCircle, FiShield, FiTarget } from 'react-icons/fi';

const AGENTS = ["Astra", "Breach", "Brimstone", "Chamber", "Clove", "Cypher", "Deadlock", "Fade", "Gekko", "Harbor", "Iso", "Jett", "KAY/O", "Killjoy", "Neon", "Omen", "Phoenix", "Raze", "Reyna", "Sage", "Skye", "Sova", "Viper", "Vyse", "Yoru"];
const MAPS = ["Abyss", "Ascent", "Bind", "Breeze", "Fracture", "Haven", "Icebox", "Lotus", "Pearl", "Split", "Sunset"];

export default function Lineups({ session, isStaff, isCoach }) {
  const [lineups, setLineups] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtres
  const [filterMap, setFilterMap] = useState('All');
  const [filterAgent, setFilterAgent] = useState('All');
  const [filterSide, setFilterSide] = useState('All');

  // Formulaire d'ajout / Édition
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null); // ID du lineup en cours de modification
  const [formData, setFormData] = useState({
    title: '', description: '', map_name: MAPS[0], agent_name: AGENTS[0], side: 'Attaque', difficulty: 'Moyen', video_url: ''
  });

  useEffect(() => {
    fetchLineups();
  }, []);

  const fetchLineups = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lineups')
      .select(`*, author:profiles!lineups_author_id_fkey(username, avatar_url)`)
      .order('created_at', { ascending: false });

    if (!error && data) setLineups(data);
    setLoading(false);
  };

  // Vider et fermer le formulaire
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ title: '', description: '', map_name: MAPS[0], agent_name: AGENTS[0], side: 'Attaque', difficulty: 'Moyen', video_url: '' });
  };

  const handleEdit = (lineup) => {
    setFormData({
      title: lineup.title,
      description: lineup.description || '',
      map_name: lineup.map_name,
      agent_name: lineup.agent_name,
      side: lineup.side,
      difficulty: lineup.difficulty,
      video_url: lineup.video_url
    });
    setEditingId(lineup.id);
    setShowForm(true);
    // Remonter doucement vers le formulaire
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (editingId) {
      // MODE MODIFICATION
      const { data, error } = await supabase
        .from('lineups')
        .update({
          title: formData.title,
          description: formData.description,
          map_name: formData.map_name,
          agent_name: formData.agent_name,
          side: formData.side,
          difficulty: formData.difficulty,
          video_url: formData.video_url
        })
        .eq('id', editingId)
        .select(`*, author:profiles!lineups_author_id_fkey(username, avatar_url)`)
        .single();

      if (!error && data) {
        setLineups(lineups.map(l => l.id === editingId ? data : l));
        handleCloseForm();
      } else {
        alert("Erreur lors de la modification du lineup.");
      }
    } else {
      // MODE CRÉATION
      const { data, error } = await supabase.from('lineups').insert([{
        ...formData,
        author_id: session.user.id
      }]).select(`*, author:profiles!lineups_author_id_fkey(username, avatar_url)`).single();

      if (!error && data) {
        setLineups([data, ...lineups]);
        handleCloseForm();
      } else {
        alert("Erreur lors de l'enregistrement du lineup.");
      }
    }
    
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Détruire ce lineup des archives ?")) return;
    const { error } = await supabase.from('lineups').delete().eq('id', id);
    if (!error) setLineups(lineups.filter(l => l.id !== id));
  };

  // Convertir lien YT normal en embed
  const getEmbedUrl = (url) => {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
    return ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}?rel=0` : null;
  };

  const filteredLineups = lineups.filter(l => 
    (filterMap === 'All' || l.map_name === filterMap) &&
    (filterAgent === 'All' || l.agent_name === filterAgent) &&
    (filterSide === 'All' || l.side === filterSide)
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto animate-fade-in px-2 md:px-0 mb-10">
      
      {/* HEADER PRINCIPAL */}
      <div className="bg-[#1A1C2E]/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden">
        <div className="absolute top-[-50%] left-[-10%] w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div>
          <h2 className="text-3xl md:text-4xl font-rockSalt text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-[#A2D2FF] drop-shadow-md mb-1">
            Laboratoire Lineups
          </h2>
          <p className="text-teal-400/80 font-techMono text-[10px] md:text-xs uppercase tracking-[0.3em]">Base de données Géométrique</p>
        </div>

        <button 
          onClick={showForm ? handleCloseForm : () => setShowForm(true)}
          className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-rajdhani font-bold text-sm uppercase tracking-widest transition-all shadow-lg w-full md:w-auto z-10 ${showForm ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20' : 'bg-gradient-to-r from-teal-500 to-[#A2D2FF] text-[#1A1C2E] hover:scale-105 shadow-[0_0_20px_rgba(20,184,166,0.3)]'}`}
        >
          {showForm ? 'FERMER LE PANNEAU' : <><FiPlus className="w-5 h-5" /> Partager un Lineup</>}
        </button>
      </div>

      {/* FORMULAIRE D'AJOUT / ÉDITION */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#0D0E15]/80 backdrop-blur-2xl border border-teal-500/30 rounded-[2rem] p-6 md:p-8 shadow-[0_0_30px_rgba(20,184,166,0.1)] relative overflow-hidden animate-fade-in">
            <h3 className="font-rajdhani text-2xl text-teal-400 font-bold mb-6 flex items-center gap-3">
              <FiCrosshair /> {editingId ? 'RECALIBRAGE DU VECTEUR' : 'NOUVEAU VECTEUR'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                <div className="flex flex-col gap-1.5 lg:col-span-2">
                  <label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest pl-1">Intitulé de l'action</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Retake B Default Plant" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-teal-400 outline-none transition-colors" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest pl-1">Carte</label>
                  <select value={formData.map_name} onChange={e => setFormData({...formData, map_name: e.target.value})} className="w-full bg-[#1A1C2E] border border-white/10 rounded-xl p-3 text-white text-sm focus:border-teal-400 outline-none appearance-none">
                    {MAPS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest pl-1">Agent</label>
                  <select value={formData.agent_name} onChange={e => setFormData({...formData, agent_name: e.target.value})} className="w-full bg-[#1A1C2E] border border-white/10 rounded-xl p-3 text-white text-sm focus:border-teal-400 outline-none appearance-none">
                    {AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest pl-1">Lien Vidéo (YouTube recommandé)</label>
                  <input required type="url" value={formData.video_url} onChange={e => setFormData({...formData, video_url: e.target.value})} placeholder="https://..." className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-teal-400 outline-none transition-colors" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest pl-1">Side</label>
                  <select value={formData.side} onChange={e => setFormData({...formData, side: e.target.value})} className="w-full bg-[#1A1C2E] border border-white/10 rounded-xl p-3 text-white text-sm focus:border-teal-400 outline-none appearance-none">
                    <option value="Attaque">Attaque</option><option value="Défense">Défense</option><option value="Retake">Retake</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest pl-1">Difficulté</label>
                  <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} className="w-full bg-[#1A1C2E] border border-white/10 rounded-xl p-3 text-white text-sm focus:border-teal-400 outline-none appearance-none">
                    <option value="Facile">Facile</option><option value="Moyen">Moyen</option><option value="Pixel Perfect">Pixel Perfect 🎯</option>
                  </select>
                </div>
            </div>

            <div className="flex flex-col gap-1.5 mb-8">
              <label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest pl-1">Description & Repères (Optionnel)</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Aligner le HUD avec le nuage..." className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-teal-400 outline-none resize-none h-20" />
            </div>

            <div className="flex gap-4">
                {editingId && (
                    <button type="button" onClick={handleCloseForm} className="w-1/3 py-4 bg-white/5 text-gray-400 border border-white/10 font-rajdhani font-bold text-lg tracking-widest rounded-xl hover:bg-white/10 hover:text-white transition-all">
                      ANNULER
                    </button>
                )}
                <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-teal-500/20 text-teal-400 border border-teal-500/50 font-rajdhani font-bold text-lg tracking-widest rounded-xl hover:bg-teal-500 hover:text-black transition-all disabled:opacity-50">
                  {isSubmitting ? 'ENREGISTREMENT...' : (editingId ? 'METTRE À JOUR LE LINEUP' : 'TÉLÉVERSER LE LINEUP')}
                </button>
            </div>
        </form>
      )}

      {/* FILTRES */}
      <div className="flex flex-wrap items-center gap-3 bg-[#1A1C2E]/40 border border-white/10 p-3 rounded-2xl backdrop-blur-md shadow-inner">
          <div className="flex items-center gap-2 px-3 py-1 text-[#A2D2FF] font-techMono text-xs uppercase tracking-widest border-r border-white/10">
            <FiFilter /> Filtres
          </div>
          
          <select value={filterMap} onChange={e => setFilterMap(e.target.value)} className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-xs font-techMono text-white outline-none focus:border-teal-400 appearance-none">
             <option value="All">Toutes les Cartes</option>
             {MAPS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          
          <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)} className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-xs font-techMono text-white outline-none focus:border-teal-400 appearance-none">
             <option value="All">Tous les Agents</option>
             {AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          
          <select value={filterSide} onChange={e => setFilterSide(e.target.value)} className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-xs font-techMono text-white outline-none focus:border-teal-400 appearance-none">
             <option value="All">Tous les Sides</option>
             <option value="Attaque">Attaque</option><option value="Défense">Défense</option><option value="Retake">Retake</option>
          </select>
      </div>

      {/* GRILLE DE LINEUPS */}
      {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-teal-400 border-t-transparent rounded-full animate-spin"></div></div>
      ) : filteredLineups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50 bg-black/20 rounded-[2rem] border border-white/5">
             <FiCrosshair className="w-16 h-16 text-gray-500 mb-4" />
             <p className="font-poppins text-gray-400 text-center">Aucun lineup trouvé pour ces paramètres.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredLineups.map(lineup => {
                 const embedUrl = getEmbedUrl(lineup.video_url);
                 const canManage = session.user.id === lineup.author_id || isStaff || isCoach;

                 return (
                    <div key={lineup.id} className="bg-[#1A1C2E]/60 backdrop-blur-md border border-white/10 hover:border-teal-500/30 rounded-3xl overflow-hidden flex flex-col group transition-all duration-300 shadow-lg hover:shadow-[0_10px_30px_rgba(20,184,166,0.15)]">
                        
                        {/* HEADER CARTE */}
                        <div className="p-4 flex items-start justify-between border-b border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent">
                            <div className="flex items-center gap-2">
                                <span className="bg-teal-500/20 border border-teal-500/30 text-teal-400 text-[10px] font-techMono uppercase px-2 py-1 rounded-md flex items-center gap-1"><FiMap /> {lineup.map_name}</span>
                                <span className="bg-[#B185DB]/20 border border-[#B185DB]/30 text-[#B185DB] text-[10px] font-techMono uppercase px-2 py-1 rounded-md">{lineup.agent_name}</span>
                            </div>
                            
                            {/* BOUTONS D'ACTION (Apparaissent au survol) */}
                            {canManage && (
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => handleEdit(lineup)} className="text-gray-500 hover:text-[#A2D2FF] bg-black/40 hover:bg-[#A2D2FF]/10 p-1.5 rounded-lg border border-transparent hover:border-[#A2D2FF]/30 transition-all" title="Modifier">
                                        <FiEdit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDelete(lineup.id)} className="text-gray-500 hover:text-red-400 bg-black/40 hover:bg-red-500/10 p-1.5 rounded-lg border border-transparent hover:border-red-500/30 transition-all" title="Supprimer">
                                        <FiTrash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* VIDEO / MEDIA */}
                        <div className="w-full aspect-video bg-black flex items-center justify-center relative overflow-hidden border-b border-white/5">
                            {embedUrl ? (
                                <iframe src={embedUrl} className="w-full h-full absolute inset-0" frameBorder="0" allowFullScreen></iframe>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <FiVideo className="w-10 h-10 text-gray-600" />
                                    <a href={lineup.video_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 px-4 py-2 rounded-xl text-xs font-techMono uppercase tracking-widest transition-colors">
                                        <FiPlayCircle className="w-4 h-4" /> Voir la vidéo
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* INFOS */}
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[9px] font-techMono uppercase tracking-widest flex items-center gap-1 ${lineup.side === 'Attaque' ? 'text-orange-400' : lineup.side === 'Défense' ? 'text-[#A2D2FF]' : 'text-purple-400'}`}>
                                    {lineup.side === 'Attaque' ? <FiTarget /> : <FiShield />} {lineup.side}
                                </span>
                                <span className="text-gray-600">•</span>
                                <span className={`text-[9px] font-techMono uppercase tracking-widest ${lineup.difficulty === 'Pixel Perfect' ? 'text-red-400 font-bold animate-pulse' : 'text-gray-400'}`}>
                                    {lineup.difficulty}
                                </span>
                            </div>
                            
                            <h4 className="font-rajdhani text-xl font-bold text-white mb-2">{lineup.title}</h4>
                            {lineup.description && <p className="text-xs font-poppins text-gray-400 line-clamp-3 mb-4 flex-1">{lineup.description}</p>}
                            
                            {/* FOOTER CARTE */}
                            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {lineup.author?.avatar_url ? (
                                        <img src={lineup.author.avatar_url} className="w-6 h-6 rounded-full border border-white/10" alt="author" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-white font-bold">U</div>
                                    )}
                                    <span className="text-xs font-rajdhani font-bold text-gray-300">{lineup.author?.username || 'Anonyme'}</span>
                                </div>
                                <span className="text-[9px] font-techMono text-gray-600 uppercase">{new Date(lineup.created_at).toLocaleDateString('fr-FR')}</span>
                            </div>
                        </div>
                    </div>
                 );
              })}
          </div>
      )}
    </div>
  );
}