import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const CRENEAUX = [
    { key: 'matin', label: 'Matin (09-12h)' },
    { key: 'midi', label: 'Midi (12-14h)' },
    { key: 'aprem', label: 'Aprèm (14-18h)' },
    { key: 'soir', label: 'Soir (18-23h)' },
    { key: 'nuit', label: 'Nuit (23h-02h+)' }
];

export default function Availability({ session, isStaff, isCoach }) {
  const [viewMode, setViewMode] = useState('perso'); // 'perso' ou 'heatmap'
  
  // Pour ma grille perso
  const [mySchedule, setMySchedule] = useState({});
  const [loadingMySchedule, setLoadingMySchedule] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Pour le heatmap et les dispos des autres
  const [allSchedules, setAllSchedules] = useState([]);
  const [loadingHeatmap, setLoadingHeatmap] = useState(true);

  useEffect(() => {
    fetchMySchedule();
    if (viewMode === 'heatmap') {
      fetchAllSchedules();
    }
  }, [viewMode]);

  // --- LOGIQUE MA GRILLE PERSO ---
  const fetchMySchedule = async () => {
    setLoadingMySchedule(true);
    const { data, error } = await supabase
      .from('user_availabilities')
      .select('schedule')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (!error && data) {
      setMySchedule(data.schedule || {});
    } else {
      setMySchedule({}); // Grille vide par défaut
    }
    setLoadingMySchedule(false);
  };

  const handleCellClick = (jour, creneau) => {
    setMySchedule(prev => {
      const dayData = prev[jour] || {};
      return {
        ...prev,
        [jour]: {
          ...dayData,
          [creneau]: !dayData[creneau]
        }
      };
    });
  };

  const handleSaveSchedule = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('user_availabilities')
      .upsert({
        user_id: session.user.id,
        schedule: mySchedule,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error("Erreur d'enregistrement:", error);
      alert("Erreur lors de la sauvegarde de ta grille.");
    } else {
      // Petite animation ou notif visuelle possible ici
    }
    setIsSaving(false);
  };

  // --- LOGIQUE HEATMAP (COACH/STAFF) ---
  const fetchAllSchedules = async () => {
    setLoadingHeatmap(true);
    const { data, error } = await supabase
      .from('user_availabilities')
      .select('user_id, schedule');

    if (!error && data) {
      setAllSchedules(data);
    }
    setLoadingHeatmap(false);
  };

  const getHeatmapColor = (jour, creneau) => {
    if (allSchedules.length === 0) return 'bg-black/40 border-gray-700 text-gray-500';
    
    // Compter le nombre de personnes ayant "true" pour ce jour et ce créneau
    const count = allSchedules.reduce((acc, user) => {
      if (user.schedule[jour] && user.schedule[jour][creneau]) return acc + 1;
      return acc;
    }, 0);

    const percentage = count / allSchedules.length;
    
    if (percentage === 0) return 'bg-black/40 border-red-500/20 text-gray-500';
    if (percentage < 0.3) return 'bg-gowrax-neon/20 border-gowrax-neon/40 text-white';
    if (percentage < 0.7) return 'bg-gowrax-purple/50 border-gowrax-purple text-white';
    return 'bg-green-500 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)] text-white font-bold'; // Meilleur créneau
  };

  return (
    <div className="w-full max-w-5xl mx-auto my-8 bg-black/40 border border-gowrax-cyan/30 backdrop-blur-md rounded-xl p-6 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-white/20 pb-4 gap-4">
        <div>
            <h2 className="text-3xl font-rajdhani text-white tracking-widest drop-shadow-[0_2px_4px_rgba(255,255,255,0.2)]">
               DÉTECTION RADAR (DISPONIBILITÉS)
            </h2>
            <p className="text-gray-400 font-techMono text-xs uppercase mt-1">Coche tes créneaux de raid</p>
        </div>

        {/* Boutons de switch de vue (Staff/Coach uniquement pour le heatmap, ou tout le monde si on le veut public) */}
        {(isStaff || isCoach) && (
            <div className="flex border border-gray-600 rounded bg-black/50 p-1">
                <button 
                   onClick={() => setViewMode('perso')}
                   className={`px-4 py-1 font-techMono text-xs uppercase rounded transition-colors ${viewMode === 'perso' ? 'bg-gowrax-purple text-white' : 'text-gray-400 hover:text-white'}`}
                >
                   Ma Grille
                </button>
                <button 
                   onClick={() => setViewMode('heatmap')}
                   className={`px-4 py-1 font-techMono text-xs uppercase rounded transition-colors ${viewMode === 'heatmap' ? 'bg-gowrax-neon text-white shadow-[0_0_10px_rgba(214,47,127,0.5)]' : 'text-gray-400 hover:text-white'}`}
                >
                   Heatmap Staff
                </button>
            </div>
        )}
      </div>

      {viewMode === 'perso' ? (
          /* ================= VUE: GRILLE PERSONNELLE ================= */
          <div className="flex flex-col gap-6">
              {loadingMySchedule ? (
                  <p className="text-gowrax-purple font-techMono animate-pulse">Extraction de ta grille en cours...</p>
              ) : (
                  <>
                    <div className="overflow-x-auto pb-4 custom-scrollbar">
                        <table className="w-full text-center border-collapse min-w-[600px]">
                            <thead>
                                <tr>
                                    <th className="p-3 border text-gray-400 font-techMono text-xs bg-black/50">Jours &#8594;<br/>Heures &#8595;</th>
                                    {JOURS.map(jour => (
                                        <th key={jour} className="p-3 border border-gray-700 font-rajdhani text-lg text-white bg-black/30 w-32 uppercase">
                                            {jour}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {CRENEAUX.map(creneau => (
                                    <tr key={creneau.key}>
                                        <td className="p-3 border border-gray-700 bg-black/50 text-gray-300 font-techMono text-xs text-left">
                                            {creneau.label}
                                        </td>
                                        {JOURS.map(jour => {
                                            const isAvailable = mySchedule[jour]?.[creneau.key] === true;
                                            return (
                                                <td 
                                                    key={`${jour}-${creneau.key}`} 
                                                    onClick={() => handleCellClick(jour, creneau.key)}
                                                    className={`p-1 border border-gray-700 cursor-pointer transition-all hover:border-white ${isAvailable ? 'bg-green-500/20 border-green-500 shadow-[inset_0_0_15px_rgba(34,197,94,0.3)]' : 'bg-black/40 hover:bg-white/5'}`}
                                                >
                                                    <div className="h-10 w-full flex items-center justify-center">
                                                        {isAvailable && <span className="text-green-500 font-bold">&#10003;</span>}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button 
                        onClick={handleSaveSchedule}
                        disabled={isSaving}
                        className="px-6 py-3 bg-gowrax-purple text-white font-rajdhani font-bold text-xl rounded shadow-[0_0_15px_rgba(111,45,189,0.5)] hover:bg-gowrax-neon hover:shadow-[0_0_20px_rgba(214,47,127,0.8)] transition-all w-full md:w-auto self-end uppercase disabled:opacity-50"
                    >
                        {isSaving ? "Émission des données..." : "VALIDER MA GRILLE"}
                    </button>
                  </>
              )}
          </div>
      ) : (
          /* ================= VUE: HEATMAP ÉQUIPE (COACH) ================= */
          <div className="flex flex-col gap-6">
              {loadingHeatmap ? (
                  <p className="text-gowrax-neon font-techMono animate-pulse">Compilation des coordonnées d'escouade...</p>
              ) : (
                  <>
                    <p className="text-gray-400 font-poppins text-sm mb-2">
                        Le <strong className="text-green-500">Heatmap</strong> t'indique les créneaux où le plus de joueurs sont disponibles. 
                        Couleur vive = Forte disponibilité (Idéal pour des Praccs/Matchs). 
                        Base de calcul : {allSchedules.length} agents détectés.
                    </p>

                    <div className="overflow-x-auto pb-4 custom-scrollbar">
                        <table className="w-full text-center border-collapse min-w-[600px]">
                            <thead>
                                <tr>
                                    <th className="p-3 border border-gray-700 text-gray-400 font-techMono text-xs bg-black/50">Jours &#8594;<br/>Heures &#8595;</th>
                                    {JOURS.map(jour => (
                                        <th key={jour} className="p-3 border border-gray-700 font-rajdhani text-lg text-white bg-black/30 w-32 uppercase">
                                            {jour}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {CRENEAUX.map(creneau => (
                                    <tr key={creneau.key}>
                                        <td className="p-3 border border-gray-700 bg-black/50 text-gray-300 font-techMono text-xs text-left">
                                            {creneau.label}
                                        </td>
                                        {JOURS.map(jour => {
                                            // Calcul du nombre de dispos pour l'affichage de la bulle
                                            const count = allSchedules.reduce((acc, user) => {
                                                if (user.schedule[jour] && user.schedule[jour][creneau.key]) return acc + 1;
                                                return acc;
                                            }, 0);
                                            
                                            return (
                                                <td 
                                                    key={`heatmap-${jour}-${creneau.key}`} 
                                                    className={`p-1 border border-gray-700 transition-colors ${getHeatmapColor(jour, creneau.key)}`}
                                                >
                                                    <div className="h-10 w-full flex items-center justify-center font-techMono text-sm">
                                                        {count > 0 ? `${count}/${allSchedules.length}` : '-'}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                  </>
              )}
          </div>
      )}

    </div>
  );
}