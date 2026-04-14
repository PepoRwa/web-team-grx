import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function VersionTab({ session }) {
  const [version, setVersion] = useState('');
  const [buildCode, setBuildCode] = useState('');
  const [devPatch, setDevPatch] = useState('');
  const [disabledPages, setDisabledPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const TABS_AVAILABLE = [
    { id: 'calendar', label: 'Calendrier' },
    { id: 'availability', label: 'Disponibilités (Heatmap)' },
    { id: 'stratbook', label: 'Strat-Book' },
    { id: 'vods', label: 'VODs & Archives' },
    { id: 'coaching', label: 'Mentorat & Objectifs' },
    { id: 'members', label: 'Effectifs & Rosters' }
  ];

  useEffect(() => {
    fetchVersion();
  }, []);

  const fetchVersion = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('app_version').select('*').eq('id', 1).single();
    if (data) {
      setVersion(data.version || '');
      setBuildCode(data.build_code || '');
      setDevPatch(data.devpatch || '');
      setDisabledPages(data.disabled_pages || []);
    }
    setLoading(false);
  };

  const toggleDisabledPage = (pageId) => {
    setDisabledPages(prev => 
      prev.includes(pageId) ? prev.filter(p => p !== pageId) : [...prev, pageId]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Générer un build code automatiquement si non fourni, ex: GRX-B3F9A
    const newBuildCode = buildCode || `GRX-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const { error } = await supabase.from('app_version').upsert({
      id: 1,
      version,
      build_code: newBuildCode,
      devpatch: devPatch,
      disabled_pages: disabledPages,
      updated_at: new Date().toISOString()
    });

    if (!error) {
      setBuildCode(newBuildCode);
      alert('Version et paramètres synchronisés avec succès !');
    } else {
      console.error(error);
      alert('Erreur lors de la sauvegarde : ' + error.message);
    }
    setIsSaving(false);
  };

  if (loading) {
    return <div className="text-gray-400 font-techMono text-sm p-4">Chargement...</div>;
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 relative overflow-hidden">
      <h3 className="text-xl font-rajdhani font-bold text-white mb-4">Gestion des Versions (Appranet)</h3>
      <p className="text-sm text-gray-400 font-poppins mb-6">
        Modifiez ici la version affichée publiquement. Le code de build sera auto-généré s'il est laissé vide.
      </p>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-techMono text-gray-500 mb-1 uppercase">Numéro de Version</label>
            <input 
              type="text" 
              value={version} 
              onChange={e => setVersion(e.target.value)} 
              placeholder="ex: 1.2.0" 
              className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white font-rajdhani outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-techMono text-gray-500 mb-1 uppercase">Code de Build (optionnel)</label>
            <input 
              type="text" 
              value={buildCode} 
              onChange={e => setBuildCode(e.target.value)} 
              placeholder="Laisser vide pour auto-générer" 
              className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white font-techMono text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div>
           <label className="block text-xs font-techMono text-gray-500 mb-1 uppercase">DevPatch (Notes de mise à jour)</label>
           <textarea 
             value={devPatch} 
             onChange={e => setDevPatch(e.target.value)} 
             placeholder="Résumé des changements, nouveautés, corrections..." 
             className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-gray-300 font-poppins text-sm outline-none focus:border-blue-500 transition-colors resize-y min-h-[100px]"
           />
        </div>

        {/* OVERRIDE PAGES */}
        <div className="mt-4 p-4 rounded-xl border border-red-500/20 bg-red-900/10">
           <h4 className="font-rajdhani text-lg font-bold text-red-500 mb-2 flex items-center gap-2">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
             MAINTENANCE (VUES DÉSACTIVÉES)
           </h4>
           <p className="text-xs text-gray-400 font-poppins mb-4">
             Cochez les applications pour bloquer temporairement l'accès aux membres. (Les Staffs et Coachs pourront toujours y accéder).
           </p>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             {TABS_AVAILABLE.map(tab => (
               <label key={tab.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${disabledPages.includes(tab.id) ? 'bg-red-500/10 border-red-500/50' : 'bg-black/50 border-white/5 hover:border-white/20'}`}>
                 <input 
                   type="checkbox" 
                   checked={disabledPages.includes(tab.id)} 
                   onChange={() => toggleDisabledPage(tab.id)}
                   className="w-4 h-4 accent-red-500"
                 />
                 <span className={`text-sm font-techMono uppercase tracking-wider ${disabledPages.includes(tab.id) ? 'text-red-400 font-bold' : 'text-gray-400'}`}>
                   {tab.label}
                 </span>
               </label>
             ))}
           </div>
        </div>

        <button 
          type="submit" 
          disabled={isSaving}
          className="mt-2 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-rajdhani font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
        >
          {isSaving ? 'Synchro en cours...' : 'Pousser la Mise à Jour'}
        </button>
      </form>
    </div>
  );
}
