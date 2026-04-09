import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const MAPS = [
  "Toutes",
  "Ascent",
  "Bind",
  "Haven",
  "Split",
  "Fracture",
  "Pearl",
  "Lotus",
  "Sunset",
  "Breeze",
  "Abyss",
  "Icebox",
  "Corrode"
];const SIDES = ["Tous", "Attaque", "Défense"];export default function Stratbook({ isStaff, isCoach }) {
  const [selectedMap, setSelectedMap] = useState("Toutes");
  const [selectedSide, setSelectedSide] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [strats, setStrats] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [viewStrat, setViewStrat] = useState(null);

  // Form states
  const [newStrat, setNewStrat] = useState({ title: '', description: '', map: 'Ascent', side: 'Attaque' });
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchStrats();
  }, []);

  const fetchStrats = async () => {
    const { data, error } = await supabase.from('strats').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setStrats(data);
    }
  };

  const handleAddStrat = async (e) => {
    e.preventDefault();
    if (!newStrat.title || !newStrat.map || !newStrat.side) return;
    
    setIsUploading(true);
    let imageUrl = null;

    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('strats')
        .upload(filePath, file);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('strats')
          .getPublicUrl(filePath);
        imageUrl = publicUrl;
      } else {
        console.error("Erreur upload:", uploadError);
      }
    }

    const { error } = await supabase.from('strats').insert({
      title: newStrat.title,
      description: newStrat.description,
      map: newStrat.map,
      side: newStrat.side,
      image_url: imageUrl
    });

    setIsUploading(false);
    if (!error) {
      setIsModalOpen(false);
      setNewStrat({ title: '', description: '', map: 'Ascent', side: 'Attaque' });
      setFile(null);
      fetchStrats();
    } else {
      console.error("Erreur BDD:", error);
    }
  };

  const handleDeleteStrat = async (id, imageUrl) => {
    if (!window.confirm("Es-tu sûr de vouloir supprimer cette stratégie ? 🗑️")) return;
    
    // Supprimer l'image associée du Storage
    if (imageUrl) {
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      await supabase.storage.from('strats').remove([fileName]);
    }

    // Supprimer de la base de données
    const { error } = await supabase.from('strats').delete().eq('id', id);
    
    if (!error) {
      setViewStrat(null);
      fetchStrats();
    } else {
      console.error("Erreur suppression BDD:", error);
      alert("Erreur lors de la suppression.");
    }
  };

  // Filtrage des données
  const filteredStrats = strats.filter(strat => {
    const matchMap = selectedMap === "Toutes" || strat.map === selectedMap;
    const matchSide = selectedSide === "Tous" || strat.side === selectedSide;
    const matchSearch = strat.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       strat.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchMap && matchSide && matchSearch;
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
              placeholder="Rechercher une stratégie..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gowrax-purple focus:ring-1 focus:ring-gowrax-purple transition-all"
            />
          </div>

          {(isStaff || isCoach) && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-2 bg-gradient-to-r from-gowrax-purple to-gowrax-neon text-white font-rajdhani font-bold text-sm rounded-xl shadow-[0_0_15px_rgba(111,45,189,0.5)] hover:shadow-[0_0_25px_rgba(214,47,127,0.7)] transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              AJOUTER UNE STRATÉGIE
            </button>
          )}
        </div>

        <div className="h-px w-full bg-white/5 my-1"></div>

        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
            <span className="text-[10px] font-techMono text-gray-500 uppercase mr-2 whitespace-nowrap shrink-0">Map :</span>
            {MAPS.map(map => (
              <button 
                key={map}
                onClick={() => setSelectedMap(map)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-rajdhani font-bold transition-all snap-center border ${selectedMap === map ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
              >
                {map}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-techMono text-gray-500 uppercase mr-2">Side :</span>
            <div className="flex bg-black/40 border border-white/5 rounded-lg p-1">
              {SIDES.map(side => (
                <button 
                  key={side}
                  onClick={() => setSelectedSide(side)}
                  className={`px-3 py-1 text-xs font-rajdhani font-bold rounded-md transition-all ${
                    selectedSide === side 
                      ? (side === 'Attaque' ? 'bg-red-500/20 text-red-400' : side === 'Défense' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white')
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {side}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* GRILLE DES STRATÉGIES */}
      {filteredStrats.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
          <svg className="w-12 h-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          <h3 className="font-rajdhani font-bold text-xl text-gray-400">Aucune donnée tactique</h3>
          <p className="text-gray-500 text-sm mt-2 font-poppins">Essayez de modifier vos filtres.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStrats.map(strat => (
            <div key={strat.id} onClick={() => setViewStrat(strat)} className="group flex flex-col bg-black/60 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-gowrax-purple/50 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(111,45,189,0.2)] cursor-pointer">
              
              {/* Image Thumbnail */}
              <div className="relative h-32 w-full bg-gradient-to-br from-gray-800 to-black overflow-hidden flex items-center justify-center border-b border-white/5">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30"></div>
                {strat.side === 'Attaque' && <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 blur-[50px] rounded-full"></div>}
                {strat.side === 'Défense' && <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[50px] rounded-full"></div>}
                
                {strat.image_url ? (
                   <img src={strat.image_url} alt="Strat" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80 group-hover:opacity-100 transition-opacity z-0" />
                ) : (
                   <span className="font-rajdhani font-extrabold text-3xl text-white/20 tracking-widest uppercase z-10">{strat.map}</span>
                )}

                {/* Badges sur l'image */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[9px] font-techMono text-white uppercase">{strat.map}</span>
                  <span className={`px-2 py-0.5 rounded-md backdrop-blur-md border text-[9px] font-techMono uppercase ${strat.side === 'Attaque' ? 'bg-red-500/20 border-red-500/50 text-red-300' : 'bg-blue-500/20 border-blue-500/50 text-blue-300'}`}>
                    {strat.side}
                  </span>
                </div>
              </div>

              {/* Contenu */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-rajdhani text-xl font-bold text-white group-hover:text-gowrax-neon transition-colors">{strat.title}</h3>
                </div>
                
                <p className="text-xs text-gray-400 font-poppins line-clamp-3 mb-4 flex-1">
                  {strat.description}
                </p>

                <div className="h-px w-full bg-white/5 mb-4"></div>

                <div className="flex items-center justify-between text-[10px] uppercase font-techMono">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    <span>{strat.author || 'Gowrax Team'}</span>
                  </div>
                  <span className="text-gowrax-purple px-2 py-0.5 bg-gowrax-purple/10 rounded border border-gowrax-purple/20">
                    {strat.tag || 'Tactique'}
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* MODAL AJOUT STRAT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1A1C2E] border border-white/10 rounded-2xl w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-rajdhani font-bold text-white">AJOUTER UNE <span className="text-gowrax-neon">STRATÉGIE</span></h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto hidden-scrollbar flex-1">
              <form id="add-strat-form" onSubmit={handleAddStrat} className="flex flex-col gap-4">
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-techMono text-gray-400 uppercase">Titre de la Strat</label>
                  <input type="text" required value={newStrat.title} onChange={e => setNewStrat({...newStrat, title: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-gowrax-purple" placeholder="Ex: Prise Mid Fast..." />
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-techMono text-gray-400 uppercase">Map</label>
                    <select value={newStrat.map} onChange={e => setNewStrat({...newStrat, map: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-gowrax-purple cursor-pointer">
                      {MAPS.filter(m => m !== "Toutes").map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-techMono text-gray-400 uppercase">Side</label>
                    <select value={newStrat.side} onChange={e => setNewStrat({...newStrat, side: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-gowrax-purple cursor-pointer">
                      <option value="Attaque">Attaque</option>
                      <option value="Défense">Défense</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-techMono text-gray-400 uppercase">Description / Setup</label>
                  <textarea required value={newStrat.description} onChange={e => setNewStrat({...newStrat, description: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white h-24 resize-none focus:outline-none focus:border-gowrax-purple" placeholder="Expliquez la strat détaillée..."></textarea>
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-xs font-techMono text-gray-400 uppercase flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    Schéma / Screenshot (Optionnel)
                  </label>
                  <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gowrax-purple/20 file:text-gowrax-purple hover:file:bg-gowrax-purple/30 transition-all cursor-pointer bg-black/20 border border-white/5 rounded-xl block w-full" />
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-black/20 rounded-b-2xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                ANNULER
              </button>
              <button type="submit" form="add-strat-form" disabled={isUploading} className="px-6 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-gowrax-purple to-gowrax-neon text-white hover:shadow-[0_0_15px_rgba(214,47,127,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {isUploading ? (
                  <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> SAUVEGARDE...</>
                ) : 'SAUVEGARDER LA STRAT'}
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* MODAL LECTURE STRAT */}
      {viewStrat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setViewStrat(null)}>
          <div 
            className="bg-[#1A1C2E] border border-white/10 rounded-2xl w-full max-w-4xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            {/* Header / Image plein écran */}
            <div className="relative w-full h-64 md:h-80 bg-gradient-to-br from-gray-800 to-black overflow-hidden flex-shrink-0 border-b border-white/5 flex flex-col justify-center items-center">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 z-0"></div>
              
              {viewStrat.side === 'Attaque' && <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/20 blur-[80px] rounded-full z-0"></div>}
              {viewStrat.side === 'Défense' && <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full z-0"></div>}
              
              <button onClick={() => setViewStrat(null)} className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-white/10 p-2 rounded-full text-white backdrop-blur-md transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>

              {viewStrat.image_url ? (
                <img src={viewStrat.image_url} alt={viewStrat.title} className="absolute inset-0 w-full h-full object-contain z-10 p-2 bg-black/40" />
              ) : (
                <span className="font-rajdhani font-extrabold text-5xl md:text-8xl text-white/10 tracking-widest uppercase z-10">{viewStrat.map}</span>
              )}
            </div>

            {/* Contenu textuel complet */}
            <div className="p-6 md:p-10 overflow-y-auto hidden-scrollbar flex-1 relative flex flex-col">
              <div className="flex gap-2 mb-4">
                <span className="px-3 py-1 bg-white/10 rounded-md text-xs font-techMono text-white uppercase">{viewStrat.map}</span>
                <span className={`px-3 py-1 rounded-md text-xs font-techMono uppercase ${viewStrat.side === 'Attaque' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>{viewStrat.side}</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-rajdhani font-bold text-white mb-2">{viewStrat.title}</h2>
              
              <div className="flex items-center gap-2 mb-8 text-xs font-techMono text-gray-500 uppercase">
                <span>PAR {viewStrat.author || 'Staff Gowrax'}</span>
                <span>•</span>
                <span className="text-gowrax-purple">{viewStrat.tag || 'Tactique'}</span>
              </div>

              <div className="bg-black/30 border border-white/5 rounded-xl p-6 flex-1">
                <h3 className="text-sm font-techMono text-gray-400 mb-4 uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Déroulé & Setup</h3>
                <p className="text-gray-300 font-poppins whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                  {viewStrat.description}
                </p>
              </div>
              
              {(isStaff || isCoach) && (
                <div className="flex justify-end pt-6 mt-auto">
                  <button 
                    onClick={() => handleDeleteStrat(viewStrat.id, viewStrat.image_url)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 border border-red-500/20 rounded-xl text-xs md:text-sm font-rajdhani font-bold transition-all shadow-[0_0_10px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    SUPPRIMER LA STRATÉGIE
                  </button>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}