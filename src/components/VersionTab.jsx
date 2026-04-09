import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function VersionTab({ session }) {
  const [version, setVersion] = useState('');
  const [buildCode, setBuildCode] = useState('');
  const [devPatch, setDevPatch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
    }
    setLoading(false);
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
      updated_at: new Date().toISOString()
    });

    if (!error) {
      setBuildCode(newBuildCode);
      alert('Version synchronisée avec succès !');
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
