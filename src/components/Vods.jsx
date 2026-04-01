import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const MAPS = ["Ascent", "Bind", "Haven", "Split", "Fracture", "Pearl", "Lotus", "Sunset", "Breeze", "Abyss"];
const STATUS_OPTIONS = ["Win", "Défaite", "Draw"];

export default function Vods({ session, isStaff, isCoach }) {
  const [vods, setVods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Filtres
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");

  // Formulaire
  const [newVod, setNewVod] = useState({
    link: '',
    map: 'Ascent',
    date: new Date().toISOString().split('T')[0],
    status: 'Win',
    score: '',
    opponent: ''
  });

  useEffect(() => {
    fetchVods();
  }, []);

  const fetchVods = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vods')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setVods(data);
    }
    setLoading(false);
  };

  const handleAddVod = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const userName = session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.email.split('@')[0];

    const { error } = await supabase.from('vods').insert({
      user_id: session.user.id,
      link: newVod.link,
      map: newVod.map,
      date: newVod.date,
      status: newVod.status,
      score: newVod.score,
      opponent: newVod.opponent || 'Non précisé',
      author_name: userName
    });

    setIsSaving(false);

    if (!error) {
      setIsModalOpen(false);
      setNewVod({
        link: '',
        map: 'Ascent',
        date: new Date().toISOString().split('T')[0],
        status: 'Win',
        score: '',
        opponent: ''
      });
      fetchVods();
    } else {
      console.error("Erreur ajout VOD:", error);
      alert("Erreur lors de l'ajout de la VOD.");
    }
  };

  const handleDeleteVod = async (id, authorId) => {
    // Vérification: Staff/Coach ou créateur
    if (!isStaff && !isCoach && authorId !== session.user.id) {
      alert("Tu n'as pas l'autorisation de supprimer cette VOD.");
      return;
    }

    if (!window.confirm("Supprimer cette VOD définitivement ? 🗑️")) return;

    const { error } = await supabase.from('vods').delete().eq('id', id);
    if (!error) {
      fetchVods();
    }
  };

  const filteredVods = vods.filter(v => {
    const matchStatus = filterStatus === "Tous" || v.status === filterStatus;
    const matchSearch = v.opponent.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        v.map.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      {/* BARRE D'OUTILS ET FILTRES */}
      <div className="bg-white/[0.02] border border-white/5 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex-1 w-full md:max-w-xs relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
              type="text" 
              placeholder="Chercher une map, équipe..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-rajdhani font-bold text-sm rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.5)] hover:shadow-[0_0_25px_rgba(79,70,229,0.7)] transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            AJOUTER UNE VOD
          </button>
        </div>

        <div className="h-px w-full bg-white/5 my-1"></div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-[10px] font-techMono text-gray-500 uppercase mr-2 whitespace-nowrap shrink-0">Résultat :</span>
          {["Tous", "Win", "Défaite", "Draw"].map(status => {
            const colors = {
              "Tous": "hover:bg-white/10",
              "Win": "text-green-400 hover:bg-green-500/20",
              "Défaite": "text-red-400 hover:bg-red-500/20",
              "Draw": "text-yellow-400 hover:bg-yellow-500/20"
            };
            const activeColors = {
              "Tous": "bg-white/20 text-white",
              "Win": "bg-green-500/30 text-green-300 border-green-500/50",
              "Défaite": "bg-red-500/30 text-red-300 border-red-500/50",
              "Draw": "bg-yellow-500/30 text-yellow-300 border-yellow-500/50"
            };

            return (
              <button 
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-rajdhani font-bold transition-all border border-transparent ${filterStatus === status ? activeColors[status] : colors[status]}`}
              >
                {status}
              </button>
            )
          })}
        </div>
      </div>

      {/* LISTE DES VODS */}
      {loading ? (
        <div className="flex justify-center p-8">
            <span className="text-blue-500 font-techMono animate-pulse uppercase">Chargement des archives vidéo...</span>
        </div>
      ) : filteredVods.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
          <svg className="w-12 h-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
          <h3 className="font-rajdhani font-bold text-xl text-gray-400">Aucune VOD trouvée</h3>
          <p className="text-gray-500 text-sm mt-2 font-poppins">Soyez le premier à uploader un match !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVods.map(vod => {
            const ds = new Date(vod.date);
            const isWin = vod.status === 'Win';
            const isLoss = vod.status === 'Défaite';
            
            const bgGradient = isWin ? 'from-green-900/40 to-black' : isLoss ? 'from-red-900/40 to-black' : 'from-yellow-900/40 to-black';
            const borderColor = isWin ? 'border-green-500/30' : isLoss ? 'border-red-500/30' : 'border-yellow-500/30';
            const badgeColor = isWin ? 'bg-green-500/20 text-green-400' : isLoss ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400';

            return (
              <div key={vod.id} className={`flex flex-col bg-gradient-to-b ${bgGradient} border ${borderColor} rounded-2xl overflow-hidden hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-300 relative group`}>
                
                <div className="p-5 flex flex-col flex-1">
                  
                  {/* Badge & Date */}
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-techMono uppercase border ${borderColor} ${badgeColor}`}>
                      {vod.status}
                    </span>
                    <span className="text-xs text-gray-400 font-techMono uppercase">
                      {ds.toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  
                  {/* Titre / Map & Score */}
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h3 className="font-rajdhani text-2xl font-bold text-white leading-none mb-1">{vod.map}</h3>
                      <p className="text-sm font-poppins text-gray-400 italic">vs {vod.opponent}</p>
                    </div>
                    <div className="font-rajdhani text-3xl font-extrabold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                      {vod.score}
                    </div>
                  </div>

                  <div className="h-px w-full bg-white/10 mb-4"></div>

                  {/* Bouton Lien */}
                  <a 
                    href={vod.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-rajdhani font-bold text-white transition-colors group-hover:border-white/30"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    VISIONNER LA VOD
                  </a>

                  {/* Meta (Auteur + Delete Staff) */}
                  <div className="flex items-center justify-between text-[10px] uppercase font-techMono mt-4 text-gray-500">
                    <div className="flex items-center gap-1.5 flex-1 overflow-hidden">
                      <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                      <span className="truncate">Déposé par {vod.author_name}</span>
                    </div>
                    
                    {(isStaff || isCoach || session.user.id === vod.user_id) && (
                      <button 
                        onClick={(e) => { e.preventDefault(); handleDeleteVod(vod.id, vod.user_id); }}
                        className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors ml-2"
                        title="Supprimer la VOD"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL AJOUT VOD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1A1C2E] border border-white/10 rounded-2xl w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-rajdhani font-bold text-white">DÉPOSER UNE <span className="text-blue-500">VOD</span></h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto hidden-scrollbar flex-1">
              <form id="add-vod-form" onSubmit={handleAddVod} className="flex flex-col gap-4">
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-techMono text-gray-400 uppercase">Lien Vidéo (YouTube, Twitch, Drive...)</label>
                  <input type="url" required value={newVod.link} onChange={e => setNewVod({...newVod, link: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="https://..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-techMono text-gray-400 uppercase">Map Jouée</label>
                    <select value={newVod.map} onChange={e => setNewVod({...newVod, map: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer">
                      {MAPS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-techMono text-gray-400 uppercase">Date du Match</label>
                    <input type="date" required value={newVod.date} onChange={e => setNewVod({...newVod, date: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-techMono text-gray-400 uppercase">Résultat</label>
                    <select value={newVod.status} onChange={e => setNewVod({...newVod, status: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer">
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-techMono text-gray-400 uppercase">Score (ex: 13-11)</label>
                    <input type="text" required value={newVod.score} onChange={e => setNewVod({...newVod, score: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="13-11" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-techMono text-gray-400 uppercase">Équipe Adverse (Facultatif)</label>
                  <input type="text" value={newVod.opponent} onChange={e => setNewVod({...newVod, opponent: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="Karmine Corp..." />
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-black/20 rounded-b-2xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                ANNULER
              </button>
              <button type="submit" form="add-vod-form" disabled={isSaving} className="px-6 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {isSaving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : 'VALIDER L\'ARCHIVE'}
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
