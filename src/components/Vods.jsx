import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import GlobalObjectiveBanner from './GlobalObjectiveBanner';
import VodCommentsModal from './VodCommentsModal';

const MAPS = [
  "Ascent", "Bind", "Haven", "Split", "Fracture", "Pearl", "Lotus", "Sunset", "Breeze", "Abyss", "Icebox", "Corrode"
];
const STATUS_OPTIONS = ["Win", "Défaite", "Draw"];

export default function Vods({ session, isStaff, isCoach }) {
  const [vods, setVods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedVod, setSelectedVod] = useState(null);
  const [activeTab, setActiveTab] = useState('structure');
  
  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filtres
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");

  const [newVod, setNewVod] = useState({
    title: '', link: '', map: 'Ascent', date: new Date().toISOString().split('T')[0], status: 'Win', score: '', opponent: '', is_pro: false
  });

  useEffect(() => {
    fetchVods();
  }, []);

  useEffect(() => {
    const handleVodUpdate = () => {
      fetchVods();
    };
    window.addEventListener('vod_updated', handleVodUpdate);
    return () => window.removeEventListener('vod_updated', handleVodUpdate);
  }, []);

  const fetchVods = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vods')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) setVods(data);
    setLoading(false);
  };

  const handleAddVod = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    console.log("[DEBUG] Début Ajout VOD Payload:", newVod);
    const userName = session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.email.split('@')[0];
    const { error, data } = await supabase.from('vods').insert({
      user_id: session.user.id, link: newVod.link, map: newVod.map, date: newVod.date, status: newVod.status, score: newVod.score, opponent: newVod.opponent || 'Non précisé', author_name: userName, title: newVod.title || 'VOD', is_pro: newVod.is_pro
    });
    setIsSaving(false);
    if (!error) {
      console.log("[DEBUG] VOD insérée avec succès !", data);
      setIsModalOpen(false);
      setNewVod({ link: '', map: 'Ascent', date: new Date().toISOString().split('T')[0], status: 'Win', score: '', opponent: '', title: '', is_pro: false });
      fetchVods();
    } else { 
      console.error("[DEBUG] Supabase ERROR Add:", error);
      alert(`Erreur lors de l'ajout: ${error.message} (Code: ${error.code})`); 
    }
  };

  const handleDeleteVod = async (id, authorId) => {
    if (!isStaff && !isCoach && authorId !== session.user.id) return;
    if (!window.confirm("Supprimer définitivement ? 🗑️")) return;
    const { error } = await supabase.from('vods').delete().eq('id', id);
    if (!error) fetchVods();
  };

  const filteredVods = vods.filter(v => {
    const isProVod = v.is_pro === true;
    const matchTab = activeTab === 'pros' ? isProVod : !isProVod;
    const matchStatus = filterStatus === "Tous" || v.status === filterStatus;
    const matchSearch = v.opponent.toLowerCase().includes(searchQuery.toLowerCase()) || v.map.toLowerCase().includes(searchQuery.toLowerCase()) || (v.title && v.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchTab && matchStatus && matchSearch;
  });

  // LOGIQUE DE PAGINATION
  const totalPages = Math.ceil(filteredVods.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredVods.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <>
      <GlobalObjectiveBanner isStaff={isStaff} isCoach={isCoach} />

      <div className="flex items-center justify-center mb-8">
        <div className="flex bg-black/40 border border-white/10 p-1 rounded-2xl backdrop-blur-md">
          <button onClick={() => setActiveTab('structure')} className={`px-6 py-2.5 rounded-xl font-rajdhani font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'structure' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg> VODS STRUCTURE
          </button>
          <button onClick={() => setActiveTab('pros')} className={`px-6 py-2.5 rounded-xl font-rajdhani font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'pros' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> PRO'S VOD
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 animate-fade-in">
        {activeTab === 'structure' ? (
          <>
            <div className="bg-white/[0.02] border border-white/5 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 w-full md:max-w-xs relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  <input type="text" placeholder="Chercher une map, équipe..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" />
                </div>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-rajdhani font-bold text-sm rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg> AJOUTER UNE VOD
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

            {loading ? (
              <div className="flex justify-center p-8"><span className="text-blue-500 font-techMono animate-pulse uppercase tracking-widest">Initialisation du flux vidéo...</span></div>
            ) : currentItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-white/5 rounded-2xl text-center"><h3 className="font-rajdhani font-bold text-xl text-gray-400">Aucune archive disponible</h3></div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentItems.map(vod => {
                    const isWin = vod.status === 'Win';
                    const isLoss = vod.status === 'Défaite';
                    const isPro = vod.is_pro === true;
                    // VOD Pro a un style différent dominant
                    const bgGradient = isPro ? 'from-indigo-900/40 to-black' : isWin ? 'from-green-900/40 to-black' : isLoss ? 'from-red-900/40 to-black' : 'from-yellow-900/40 to-black';
                    const borderColor = isPro ? 'border-indigo-500/50' : isWin ? 'border-green-500/30' : isLoss ? 'border-red-500/30' : 'border-yellow-500/30';
                    return (
                      <div key={vod.id} className={`flex flex-col bg-gradient-to-b ${bgGradient} border ${borderColor} rounded-2xl overflow-hidden hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-300 group relative`}>
                        {isPro && (
                          <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-techMono font-bold px-3 py-1 rounded-bl-xl z-10 shadow-lg">
                            PRO VOD
                          </div>
                        )}
                        <div className="p-5 flex flex-col flex-1">
                          <div className="flex justify-between items-start mb-3">
                            <span className={`px-2 py-1 rounded text-[10px] font-techMono uppercase border ${borderColor}`}>{vod.status}</span>
                            <span className="text-xs text-gray-400 font-techMono uppercase">{new Date(vod.date).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="flex justify-between items-end mb-4">
                            <div><h3 className="font-rajdhani text-2xl font-bold text-white leading-none mb-1">{vod.map}</h3>
<p className="text-sm font-poppins text-gray-400 italic">vs {vod.opponent}</p>
{vod.title && <p className="text-xs font-rajdhani font-bold text-blue-400 mt-1">{vod.title}</p>}
</div>
                            <div className="font-rajdhani text-3xl font-extrabold text-white">{vod.score}</div>
                          </div>
                          <div className="h-px w-full bg-white/10 mb-4"></div>
                          <div className="flex flex-col gap-2 w-full">
                            <a href={vod.link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-rajdhani font-bold text-white transition-colors">VISIONNER LA VOD</a>
                            <button onClick={() => setSelectedVod(vod)} className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-sm font-rajdhani font-bold text-blue-400 transition-colors">DÉBRIEF STRATÉGIQUE</button>
                          </div>
                          <div className="flex items-center justify-between text-[10px] uppercase font-techMono mt-4 text-gray-500">
                            <span className="truncate">Déposé par {vod.author_name}</span>
                            {(isStaff || isCoach || session.user.id === vod.user_id) && (
                              <button onClick={() => handleDeleteVod(vod.id, vod.user_id)} className="text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PAGINATION TACTIQUE */}
                {totalPages > 1 && (
                  <div className="flex flex-col items-center gap-4 mt-10">
                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-1.5 rounded-xl backdrop-blur-md">
                      <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 text-gray-400 hover:text-white disabled:opacity-20 transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`w-8 h-8 rounded-lg font-techMono text-xs transition-all ${currentPage === i + 1 ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-500 hover:text-white hover:bg-white/5"}`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>

                      <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 text-gray-400 hover:text-white disabled:opacity-20 transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                    <span className="font-techMono text-[10px] text-gray-600 uppercase tracking-widest">Page {currentPage} / {totalPages} — Total archives: {filteredVods.length}</span>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 bg-indigo-900/10 border border-indigo-500/20 rounded-3xl text-center backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 mx-auto border border-indigo-500/40 animate-pulse"><svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg></div>
              <h2 className="font-rajdhani font-black text-4xl text-white uppercase tracking-tighter mb-4">PRO'S ARCHIVES <span className="text-indigo-400">INCOMING</span></h2>
              <p className="max-w-md mx-auto text-gray-400 font-poppins text-base leading-relaxed">Une sélection des meilleures VODs de la scène professionnelle analysées pour l'évolution de <span className="text-white font-bold">GOWRAX</span>.</p>
              <div className="mt-8 px-6 py-3 bg-black/60 border border-indigo-500/30 rounded-xl inline-flex items-center gap-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                <span className="font-techMono text-xs text-indigo-300 uppercase tracking-widest">En attente de synchronisation</span>
              </div>
            </div>
            <div className="absolute bottom-4 right-6 font-techMono text-[10px] text-indigo-500/30 uppercase tracking-[0.5em]">Database_restricted_v4.0</div>
          </div>
        )}
      </div>

      {/* MODAL AJOUT VOD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1A1C2E] border border-white/10 rounded-2xl w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center"><h2 className="text-xl font-rajdhani font-bold text-white uppercase tracking-tighter italic">DÉPOSER UNE <span className="text-blue-500">VOD</span></h2><button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors font-techMono">X</button></div>
            <div className="p-6 overflow-y-auto hidden-scrollbar flex-1">
              <form id="add-vod-form" onSubmit={handleAddVod} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1"><label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest">Titre</label><input type="text" required value={newVod.title} onChange={e => setNewVod({...newVod, title: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm" placeholder="Titre de la VOD / Match" /></div>
                <div className="flex flex-col gap-1"><label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest">Lien Vidéo</label><input type="url" required value={newVod.link} onChange={e => setNewVod({...newVod, link: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm" placeholder="https://..." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1"><label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest">Map Jouée</label><select value={newVod.map} onChange={e => setNewVod({...newVod, map: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 cursor-pointer text-sm">{MAPS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                  <div className="flex flex-col gap-1"><label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest">Date</label><input type="date" required value={newVod.date} onChange={e => setNewVod({...newVod, date: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 [color-scheme:dark] text-sm" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1"><label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest">Résultat</label><select value={newVod.status} onChange={e => setNewVod({...newVod, status: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 cursor-pointer text-sm">{STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div className="flex flex-col gap-1"><label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest">Score</label><input type="text" required value={newVod.score} onChange={e => setNewVod({...newVod, score: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm" placeholder="13-11" /></div>
                </div>
                <div className="flex flex-col gap-1"><label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest">Équipe Adverse</label><input type="text" value={newVod.opponent} onChange={e => setNewVod({...newVod, opponent: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm" placeholder="Karmine Corp..." /></div>
                {(isStaff || isCoach) && (
                  <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" id="is_pro_checkbox" checked={newVod.is_pro} onChange={e => setNewVod({...newVod, is_pro: e.target.checked})} className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-600 focus:ring-2" />
                    <label htmlFor="is_pro_checkbox" className="text-sm font-rajdhani text-gray-300">Marquer comme VOD Pro</label>
                  </div>
                )}
              </form>
            </div>
            <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-black/20 rounded-b-2xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-white transition-all uppercase">ANNULER</button>
              <button type="submit" form="add-vod-form" disabled={isSaving} className="px-6 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition-all uppercase">{isSaving ? 'SAUVEGARDE...' : 'VALIDER L\'ARCHIVE'}</button>
            </div>
          </div>
        </div>
      )}

      {selectedVod && <VodCommentsModal vod={selectedVod} session={session} isStaff={isStaff} isCoach={isCoach} onClose={() => setSelectedVod(null)} />}
    </>
  );
}