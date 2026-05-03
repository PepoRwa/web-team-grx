import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FiSettings, FiSliders, FiSave, FiEye, FiEyeOff, FiActivity, FiDatabase } from 'react-icons/fi';

// Liste des modules disponibles dans l'application
const AVAILABLE_MODULES = [
  { id: 'calendar', name: 'Calendrier Tactique', icon: '📅' },
  { id: 'availability', name: 'Disponibilités (Heatmap)', icon: '🕒' },
  { id: 'stratbook', name: 'Strat-Book', icon: '🗺️' },
  { id: 'vods', name: 'Archives VOD', icon: '🎬' },
  { id: 'coaching', name: 'Mentorat & Objectifs', icon: '🎯' },
  { id: 'profil', name: 'Profil Agent', icon: '👤' },
  { id: 'dossiers', name: 'Dossiers Staff', icon: '📁' },
  { id: 'evolution', name: 'Slow Bloom (Évolution)', icon: '🌸' },
  { id: 'lineups', name: 'Lineups', icon: '🧱' }
];

export default function DevPanel({ session }) {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // States Paramètres
  const [version, setVersion] = useState('');
  const [buildCode, setBuildCode] = useState('');
  const [disabledPages, setDisabledPages] = useState([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_version')
      .select('*')
      .eq('id', 1)
      .single();

    if (!error && data) {
      setVersion(data.version || '');
      setBuildCode(data.build_code || '');
      setDisabledPages(data.disabled_pages || []);
    }
    setLoading(false);
    setHasChanges(false);
  };

  const toggleModule = (moduleId) => {
    setDisabledPages(prev => {
      const newArray = prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId) 
        : [...prev, moduleId];
      return newArray;
    });
    setHasChanges(true);
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    setHasChanges(true);
  };

  const saveSettings = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('app_version')
      .upsert({
        id: 1, // On garde toujours l'ID 1 pour la configuration globale
        version: version,
        build_code: buildCode,
        disabled_pages: disabledPages,
        updated_at: new Date().toISOString()
      });

    if (!error) {
      setHasChanges(false);
      // Rafraîchissement forcé pour appliquer les changements à la sidebar de App.jsx
      setTimeout(() => window.location.reload(), 1000); 
    } else {
      alert("Erreur lors de la sauvegarde de la configuration.");
    }
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-32 animate-fade-in">
        <div className="w-16 h-16 border-4 border-[#A2D2FF] border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(162,210,255,0.5)]"></div>
        <span className="text-[#A2D2FF] font-techMono text-xs animate-pulse uppercase tracking-[0.3em]">
          Connexion au Cœur...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full h-full animate-fade-in pb-16 md:pb-0">
      
      {/* ================= HEADER ================= */}
      <div className="bg-[#1A1C2E]/60 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#A2D2FF]/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1A1C2E] to-black border border-white/20 flex items-center justify-center shadow-inner">
            <FiSettings className="w-8 h-8 text-[#A2D2FF]" />
          </div>
          <div>
            <h2 className="font-rajdhani text-3xl md:text-4xl font-black text-white tracking-widest uppercase">Centre de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A2D2FF] to-[#B185DB]">Contrôle</span></h2>
            <p className="font-techMono text-[10px] md:text-xs text-[#A2D2FF]/80 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#A2D2FF] animate-pulse"></span>
              Configuration Globale
            </p>
          </div>
        </div>

        <button 
          onClick={saveSettings}
          disabled={!hasChanges || isSaving}
          className={`relative z-10 px-8 py-4 font-rajdhani font-bold text-lg tracking-widest rounded-xl transition-all flex items-center gap-3 ${
            hasChanges 
              ? 'bg-gradient-to-r from-[#B185DB] to-[#A2D2FF] text-[#1A1C2E] shadow-[0_0_20px_rgba(162,210,255,0.4)] hover:scale-105' 
              : 'bg-white/5 text-gray-500 border border-white/10 opacity-50 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <><div className="w-5 h-5 border-2 border-[#1A1C2E] border-t-transparent rounded-full animate-spin"></div> ENREGISTREMENT...</>
          ) : (
            <><FiSave className="w-5 h-5" /> SAUVEGARDER</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ================= GESTION DE VERSION ================= */}
        <div className="bg-[#1A1C2E]/60 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] shadow-xl flex flex-col gap-6 lg:col-span-1 h-fit">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <FiDatabase className="text-[#B185DB] w-6 h-6" />
            <h3 className="font-rajdhani text-2xl font-bold text-white tracking-wide">Version Système</h3>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest pl-1">Version Actuelle (ex: 2.1.0)</label>
              <input 
                type="text" 
                value={version} 
                onChange={handleInputChange(setVersion)}
                placeholder="2.0.0"
                className="bg-black/40 border border-white/10 hover:border-white/20 focus:border-[#B185DB] rounded-xl px-4 py-3 text-white font-techMono text-sm outline-none transition-colors shadow-inner"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest pl-1">Code Build (ex: SLOW_BLOOM_01)</label>
              <input 
                type="text" 
                value={buildCode} 
                onChange={handleInputChange(setBuildCode)}
                placeholder="NEXUS_BUILD"
                className="bg-black/40 border border-white/10 hover:border-white/20 focus:border-[#B185DB] rounded-xl px-4 py-3 text-white font-techMono text-sm outline-none transition-colors shadow-inner"
              />
            </div>
            
            <div className="mt-4 p-4 bg-[#B185DB]/5 border border-[#B185DB]/20 rounded-xl">
              <p className="text-xs font-poppins text-[#B185DB]/80 leading-relaxed italic">
                Ces informations sont affichées en bas de l'écran pour les agents. Utile pour vérifier que le cache PWA s'est bien mis à jour sur leurs téléphones.
              </p>
            </div>
          </div>
        </div>

        {/* ================= GESTION DES MODULES (VUES) ================= */}
        <div className="bg-[#1A1C2E]/60 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] shadow-xl flex flex-col gap-6 lg:col-span-2">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <FiSliders className="text-[#A2D2FF] w-6 h-6" />
            <h3 className="font-rajdhani text-2xl font-bold text-white tracking-wide">État des Modules (Vues)</h3>
          </div>

          <p className="text-sm font-poppins text-gray-400 leading-relaxed">
            Désactivez temporairement l'accès à certaines sections de l'application (Maintenance, mise à jour en cours). 
            <strong className="text-white"> Le Staff garde accès à tout, même aux modules désactivés.</strong>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {AVAILABLE_MODULES.map(module => {
              const isDisabled = disabledPages.includes(module.id);
              
              return (
                <div 
                  key={module.id} 
                  onClick={() => toggleModule(module.id)}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                    isDisabled 
                      ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10' 
                      : 'bg-white/[0.02] border-white/10 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{module.icon}</span>
                    <span className={`font-rajdhani font-bold text-lg transition-colors ${isDisabled ? 'text-gray-500 line-through' : 'text-white'}`}>
                      {module.name}
                    </span>
                  </div>
                  
                  {/* Toggle Switch UI */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-techMono text-[10px] uppercase tracking-widest transition-colors ${
                    isDisabled ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-[#A2D2FF]/10 text-[#A2D2FF] border-[#A2D2FF]/30'
                  }`}>
                    {isDisabled ? <><FiEyeOff /> DÉSACTIVÉ</> : <><FiEye /> ACTIF</>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}