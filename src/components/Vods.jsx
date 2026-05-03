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
  const [editingVodId, setEditingVodId] = useState(null);
  const [selectedVod, setSelectedVod] = useState(null);
  const [activeTab, setActiveTab] = useState('structure');
  
  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filtres
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");

  const defaultVodState = {
    title: '', link: '', map: 'Ascent', date: new Date().toISOString().split('T')[0], 
    status: 'Win', score: '', opponent: '', is_pro: false, players_present: '', description_pro: ''
  };
  const [newVod, setNewVod] = useState(defaultVodState);

  useEffect(() => {
    fetchVods();
  }, []);

  useEffect(() => {
    const handleVodUpdate = () => { fetchVods(); };
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

  const openAddModal = () => {
    setEditingVodId(null);
    setNewVod({ ...defaultVodState, is_pro: activeTab === 'pros' });
    setIsModalOpen(true);
  };

  const handleEditClick = (vod) => {
    setEditingVodId(vod.id);
    setNewVod({
      title: vod.title || '',
      link: vod.link || '',
      map: vod.map || 'Ascent',
      date: vod.date,
      status: vod.status || 'Win',
      score: vod.score || '',
      opponent: vod.opponent || '',
      is_pro: vod.is_pro || false,
      players_present: Array.isArray(vod.players_present) ? vod.players_present.join(', ') : '',
      description_pro: vod.description_pro || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveVod = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const userName = session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.email.split('@')[0];
    
    // Parse les joueurs en tableau JSON
    const playersArray = newVod.players_present ? newVod.players_present.split(',').map(p => p.trim()).filter(Boolean) : [];

    const payload = {
      link: newVod.link, 
      map: newVod.map, 
      date: newVod.date, 
      status: newVod.status || 'Win', // <-- LA CORRECTION EST ICI (On remet un statut valide pour Supabase)      
      score: newVod.score, 
      opponent: newVod.opponent || 'Non précisé', 
      title: newVod.title || 'VOD', 
      is_pro: activeTab === 'pros',
      players_present: playersArray,
      description_pro: newVod.description_pro || null
    };
    
    let error;
    if (editingVodId) {
      const res = await supabase.from('vods').update(payload).eq('id', editingVodId);
      error = res.error;
    } else {
      payload.user_id = session.user.id;
      payload.author_name = userName;
      const res = await supabase.from('vods').insert([payload]);
      error = res.error;
    }
    
    setIsSaving(false);
    if (!error) {
      setIsModalOpen(false);
      setEditingVodId(null);
      setNewVod(defaultVodState);
      fetchVods();
    } else { 
      alert(`Erreur lors de l'enregistrement: ${error.message}`); 
    }
  };

  const handleDeleteVod = async (id, authorId) => {
    if (!isStaff && !isCoach && authorId !== session.user.id) return;
    if (!window.confirm("Supprimer définitivement cette archive ? 🗑️")) return;
    const { error } = await supabase.from('vods').delete().eq('id', id);
    if (!error) fetchVods();
  };

  const filteredVods = vods.filter(v => {
    const isProVod = v.is_pro === true;
    if ((activeTab === 'pros') !== isProVod) return false;

    const matchStatus = filterStatus === "Tous" || v.status === filterStatus;
    const matchSearch = v.opponent?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        v.map?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (v.title && v.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return (activeTab === 'pros' ? matchSearch : (matchStatus && matchSearch));
  });

  // PAGINATION
  const totalPages = Math.ceil(filteredVods.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredVods.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <>
      <GlobalObjectiveBanner isStaff={isStaff} isCoach={isCoach} />

      {/* SELECTEUR D'ONGLETS */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex bg-black/40 border border-white/10 p-1 rounded-2xl backdrop-blur-md">
          <button onClick={() => {setActiveTab('structure'); setCurrentPage(1);}} className={`px-6 py-2.5 rounded-xl font-rajdhani font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'structure' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
             VODS TEAM
          </button>
          <button onClick={() => {setActiveTab('pros'); setCurrentPage(1);}} className={`px-6 py-2.5 rounded-xl font-rajdhani font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'pros' ? 'bg-[#F7CAD0] text-[#1A1C2E] shadow-[0_0_15px_rgba(247,202,208,0.5)]' : 'text-gray-400 hover:text-[#F7CAD0]'}`}>
             PRO'S VOD
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 animate-fade-in">
        {/* BARRE DE RECHERCHE ET FILTRES */}
        <div className={`border backdrop-blur-md p-4 md:p-6 rounded-2xl flex flex-col gap-4 ${activeTab === 'pros' ? 'bg-[#F7CAD0]/5 border-[#F7CAD0]/20' : 'bg-white/[0.02] border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 w-full md:max-w-xs relative">
              <input type="text" placeholder="Chercher une map, équipe..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" />
            </div>
            <button onClick={openAddModal} className={`flex items-center justify-center gap-2 px-5 py-2 font-rajdhani font-bold text-sm rounded-xl transition-all shadow-lg ${activeTab === 'pros' ? 'bg-[#F7CAD0] text-[#1A1C2E] hover:bg-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:brightness-110'}`}>
              AJOUTER {activeTab === 'pros' ? "UNE VOD PRO" : "UNE VOD"}
            </button>
          </div>
          
          {activeTab === 'structure' && (
            <>
              <div className="h-px w-full bg-white/5 my-1"></div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <span className="text-[10px] font-techMono text-gray-500 uppercase mr-2 whitespace-nowrap shrink-0">Résultat :</span>
                {["Tous", "Win", "Défaite", "Draw"].map(status => (
                  <button key={status} onClick={() => setFilterStatus(status)} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-rajdhani font-bold transition-all border border-transparent ${filterStatus === status ? 'bg-white/20 text-white' : 'text-gray-400 hover:bg-white/10'}`}>
                    {status}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* AFFICHAGE DES CARTES */}
        {loading ? (
          <div className="flex justify-center p-8"><span className={`${activeTab === 'pros' ? 'text-[#F7CAD0]' : 'text-blue-500'} font-techMono animate-pulse uppercase tracking-widest`}>Initialisation des archives...</span></div>
        ) : currentItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-white/5 rounded-2xl text-center"><h3 className="font-rajdhani font-bold text-xl text-gray-400">Aucune archive disponible</h3></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentItems.map(vod => {
              // DA Spécifique selon l'onglet
              const isPro = activeTab === 'pros';
              const bgGradient = isPro ? 'from-[#F7CAD0]/10 to-[#1A1C2E]' : (vod.status === 'Win' ? 'from-green-900/40 to-black' : vod.status === 'Défaite' ? 'from-red-900/40 to-black' : 'from-yellow-900/40 to-black');
              const borderColor = isPro ? 'border-[#F7CAD0]/30' : (vod.status === 'Win' ? 'border-green-500/30' : vod.status === 'Défaite' ? 'border-red-500/30' : 'border-yellow-500/30');

              return (
                <div key={vod.id} className={`flex flex-col bg-gradient-to-b ${bgGradient} border ${borderColor} rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-300 group relative`}>
                  <div className="p-5 flex flex-col flex-1">
                    
                    {/* Header Carte */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-2 items-center">
                        {!isPro && <span className={`px-2 py-1 rounded text-[10px] font-techMono uppercase border ${borderColor}`}>{vod.status}</span>}
                        {isPro && <span className="px-2 py-1 rounded text-[10px] font-techMono uppercase border border-[#F7CAD0]/50 bg-[#F7CAD0]/20 text-[#F7CAD0]">PRO VOD</span>}
                        {/* BADGE REVIEWED POUR TEAM */}
                        {!isPro && vod.reviewed_at && <span className="px-2 py-1 rounded text-[10px] font-techMono uppercase border border-green-500/50 bg-green-500/20 text-green-300">REVIEWED</span>}
                      </div>
                      <span className="text-xs text-gray-400 font-techMono uppercase">{new Date(vod.date).toLocaleDateString('fr-FR')}</span>
                    </div>

                    {/* Infos VOD */}
                    <div className="flex justify-between items-end mb-4">
                      <div className="flex-1">
                        <h3 className={`font-rajdhani text-2xl font-bold leading-none mb-1 ${isPro ? 'text-[#F0F2F5]' : 'text-white'}`}>{vod.map}</h3>
                        <p className={`text-sm font-poppins italic ${isPro ? 'text-[#B185DB]' : 'text-gray-400'}`}>{isPro ? 'Analyse : ' : 'vs '}{vod.opponent}</p>
                        {vod.title && <p className={`text-xs font-rajdhani font-bold mt-1 uppercase ${isPro ? 'text-[#F7CAD0]' : 'text-blue-400'}`}>{vod.title}</p>}
                      </div>
                      <div className={`font-rajdhani text-3xl font-extrabold ${isPro ? 'text-[#F7CAD0]' : 'text-white'}`}>{vod.score}</div>
                    </div>

                    {/* Description Pro */}
                    {isPro && vod.description_pro && (
                      <div className="mb-4 p-3 bg-black/40 rounded-xl border border-white/5 text-xs text-gray-300 font-poppins line-clamp-3">
                        {vod.description_pro}
                      </div>
                    )}

                    <div className="h-px w-full bg-white/10 mb-4"></div>
                    
                    {/* Actions */}
                    <div className="flex flex-col gap-2 w-full mt-auto">
                      <a href={vod.link} target="_blank" rel="noreferrer" className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-rajdhani font-bold transition-colors ${isPro ? 'bg-[#F7CAD0]/10 hover:bg-[#F7CAD0]/20 text-[#F7CAD0] border border-[#F7CAD0]/20' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}>
                        VISIONNER LA VOD
                      </a>
                      <button onClick={() => setSelectedVod(vod)} className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-rajdhani font-bold transition-colors ${isPro ? 'bg-[#B185DB]/20 hover:bg-[#B185DB]/30 text-[#E9C46A] border border-[#B185DB]/30' : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20'}`}>
                        DÉBRIEF {isPro ? 'PUBLIC' : 'STRATÉGIQUE'}
                      </button>
                    </div>

                    {/* Footer (Auteur + Edition) */}
                    <div className="flex items-center justify-between text-[10px] uppercase font-techMono mt-4 text-gray-500">
                      <span className="truncate">Déposé par {vod.author_name}</span>
                      <div className="flex gap-3">
                        {(isStaff || isCoach || session.user.id === vod.user_id) && (
                          <button onClick={() => handleEditClick(vod)} className={`${isPro ? 'text-[#F7CAD0] hover:text-white' : 'text-blue-400 hover:text-white'} transition-colors`}>EDITER</button>
                        )}
                        {(isStaff || isCoach || session.user.id === vod.user_id) && (
                          <button onClick={() => handleDeleteVod(vod.id, vod.user_id)} className="text-red-500 hover:text-white transition-colors">SUPPR</button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-4 mt-10">
            <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-1.5 rounded-xl">
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-lg font-techMono text-xs transition-all ${currentPage === i + 1 ? (activeTab === 'pros' ? "bg-[#F7CAD0] text-[#1A1C2E]" : "bg-blue-600 text-white") : "text-gray-500 hover:bg-white/5"}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL FORMULAIRE (S'adapte si Pro ou Team) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`border rounded-2xl w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] ${activeTab === 'pros' ? 'bg-[#1A1C2E] border-[#F7CAD0]/30' : 'bg-[#1A1C2E] border-white/10'}`}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className={`text-xl font-rajdhani font-bold uppercase tracking-tighter italic ${activeTab === 'pros' ? 'text-[#F7CAD0]' : 'text-white'}`}>
                {editingVodId ? 'MODIFIER' : 'DÉPOSER'} {activeTab === 'pros' ? 'UNE VOD PRO' : 'UNE VOD'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white font-techMono">X</button>
            </div>
            
            <div className="p-6 overflow-y-auto hidden-scrollbar flex-1">
              <form id="save-vod-form" onSubmit={handleSaveVod} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-techMono text-gray-400 uppercase">Titre</label>
                  <input type="text" required value={newVod.title} onChange={e => setNewVod({...newVod, title: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm" placeholder="Titre de la session..." />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-techMono text-gray-400 uppercase">Lien Vidéo</label>
                  <input type="url" required value={newVod.link} onChange={e => setNewVod({...newVod, link: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm" placeholder="https://..." />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-techMono text-gray-400 uppercase">Map</label>
                    <select value={newVod.map} onChange={e => setNewVod({...newVod, map: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm">
                      {MAPS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-techMono text-gray-400 uppercase">Date</label>
                    <input type="date" required value={newVod.date} onChange={e => setNewVod({...newVod, date: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 [color-scheme:dark] text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {activeTab === 'structure' && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-techMono text-gray-400 uppercase">Résultat</label>
                      <select value={newVod.status} onChange={e => setNewVod({...newVod, status: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm">
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}
                  <div className={`flex flex-col gap-1 ${activeTab === 'pros' ? 'col-span-2' : ''}`}>
                    <label className="text-[10px] font-techMono text-gray-400 uppercase">Score</label>
                    <input type="text" required value={newVod.score} onChange={e => setNewVod({...newVod, score: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm" placeholder="13-11" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-techMono text-gray-400 uppercase">{activeTab === 'pros' ? 'Équipes impliquées' : 'Équipe Adverse'}</label>
                  <input type="text" value={newVod.opponent} onChange={e => setNewVod({...newVod, opponent: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm" placeholder={activeTab === 'pros' ? 'Karmine Corp vs FNATIC' : 'Karmine Corp...'} />
                </div>

                {/* CHAMP SPECIFIQUE TEAM : JOUEURS PRESENTS */}
                {activeTab === 'structure' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-techMono text-gray-400 uppercase">Joueurs Présents (Séparés par une virgule)</label>
                    <input type="text" value={newVod.players_present} onChange={e => setNewVod({...newVod, players_present: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm" placeholder="Suku, Tetsu, Waylay..." />
                  </div>
                )}

                {/* CHAMP SPECIFIQUE PRO : DESCRIPTION */}
                {activeTab === 'pros' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-techMono text-gray-400 uppercase">Description / Focus de l'Analyse</label>
                    <textarea rows="3" value={newVod.description_pro} onChange={e => setNewVod({...newVod, description_pro: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#F7CAD0] text-sm resize-none" placeholder="Setup de Killjoy sur B, rotation rapide..."></textarea>
                  </div>
                )}

              </form>
            </div>
            
            <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-black/20 rounded-b-2xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-white transition-all uppercase">ANNULER</button>
              <button type="submit" form="save-vod-form" disabled={isSaving} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase ${activeTab === 'pros' ? 'bg-[#F7CAD0] text-[#1A1C2E] hover:bg-white' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
                {isSaving ? 'ENREGISTREMENT...' : 'VALIDER'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedVod && <VodCommentsModal vod={selectedVod} session={session} isStaff={isStaff} isCoach={isCoach} onClose={() => setSelectedVod(null)} />}
    </>
  );
}