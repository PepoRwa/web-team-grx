import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// Génère les créneaux par palier de 30 mins de 00h à 23h30
const generateHalfHours = () => {
    const times = [];
    for (let i = 0; i <= 23; i++) {
        const hourStr = i < 10 ? `0${i}` : `${i}`;
        times.push(`${hourStr}:00`);
        times.push(`${hourStr}:30`);
    }
    return times;
};
const HALF_HOURS = generateHalfHours();

import GlobalObjectiveBanner from './GlobalObjectiveBanner';

export default function Availability({ session, isStaff, isCoach }) {
  const [activeTab, setActiveTab] = useState('grille'); // 'grille' ou 'absences'
  const [viewMode, setViewMode] = useState('perso'); // 'perso' ou 'heatmap'
  
  // ROSTERS 
  const ROSTERS = ['Tous', 'High Roster', 'Academy', 'Chill', 'Tryhard'];
  const [activeRoster, setActiveRoster] = useState('Tous');

  // Pour ma grille perso
  const [mySchedule, setMySchedule] = useState({});
  const [loadingMySchedule, setLoadingMySchedule] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Variables Drag & Drop
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState(true); // true = ajoute dispo, false = retire dispo

  // Pour le heatmap et les dispos des autres
  const [allSchedules, setAllSchedules] = useState([]);
  const [loadingHeatmap, setLoadingHeatmap] = useState(true);

  // --- LOGIQUE ABSENCES ---
  const [absences, setAbsences] = useState([]);
  const [newAbsence, setNewAbsence] = useState({ date_start: '', date_end: '', reason: '' });
  const [isSavingAbsence, setIsSavingAbsence] = useState(false);

  useEffect(() => {
    if (activeTab === 'grille') {
      fetchMySchedule();
      if (viewMode === 'heatmap') {
        fetchAllSchedules();
      }
    } else if (activeTab === 'absences') {
      fetchAbsences();
    }
  }, [viewMode, activeTab]);

  const fetchAbsences = async () => {
    let query = supabase.from('absences').select('*');
    
    if (!isStaff && !isCoach) {
      query = query.eq('user_id', session.user.id);
    }
    
    const { data: absencesData, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error("Erreur de récupération des absences :", error);
    } else if (absencesData) {
      // Pour afficher le pseudo : On récupère directement les profils correspondants
      const userIds = [...new Set(absencesData.map(a => a.user_id))];
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);
        
      const profilesMap = (profilesData || []).reduce((acc, p) => ({...acc, [p.id]: p.username}), {});
      
      const augmentedData = absencesData.map(a => ({
        ...a,
        user_name: profilesMap[a.user_id] || 'Utilisateur introuvable'
      }));
      
      setAbsences(augmentedData);
    }
  };

  const handleCreateAbsence = async (e) => {
    e.preventDefault();
    setIsSavingAbsence(true);
    
    // 1. Ajouter l'absence dans la base de données
    const { error, data } = await supabase.from('absences').insert({
      user_id: session.user.id,
      date_start: new Date(newAbsence.date_start).toISOString(),
      date_end: new Date(newAbsence.date_end).toISOString(),
      reason: newAbsence.reason
    }).select();
    
    setIsSavingAbsence(false);
    
    if (!error) {
      // 2. Alerter Discord via la table notifications (Le Bot écoute ça !)
      await supabase.from('notifications').insert({
        type: 'global',
        title: '🔴 Nouvelle Absence Déclarée',
        message: `Une absence a été signalée sur le site par un membre.\n**Du :** ${new Date(newAbsence.date_start).toLocaleDateString('fr-FR')} \n**Au :** ${new Date(newAbsence.date_end).toLocaleDateString('fr-FR')} \n**Motif :** ${newAbsence.reason}`,
        target_roster: 'Staff' // <--- Le bot l'enverra dans le salon mappé à 'Tous' ou 'Staff' si tu l'ajoutes au JS du Bot
      });

      setNewAbsence({ date_start: '', date_end: '', reason: '' });
      fetchAbsences();
    } else {
      console.error("Erreur ajout:", error);
      alert("Erreur lors de l'ajout de l'absence: " + error.message);
    }
  };

  const updateAbsenceStatus = async (id, status) => {
    const { error } = await supabase.from('absences').update({ status }).eq('id', id);
    if (!error) fetchAbsences();
  };

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

  // NOUVEAUX HANDLERS POUR LE DRAG SUR LA GRILLE PRONOTE
  const handleMouseDown = (jour, time) => {
    setIsDragging(true);
    const dayData = mySchedule[jour] || {};
    const willBeAvailable = !dayData[time];
    setDragAction(willBeAvailable);
    
    // Modifie immédiatement la cellule cliquée
    setMySchedule(prev => ({
      ...prev,
      [jour]: {
        ...(prev[jour] || {}),
        [time]: willBeAvailable
      }
    }));
  };

  const handleMouseEnter = (jour, time) => {
    if (!isDragging) return;
    setMySchedule(prev => ({
      ...prev,
      [jour]: {
        ...(prev[jour] || {}),
        [time]: dragAction
      }
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Sécurité: si on sort le clic de la grille, on stop le drag
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

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
    }
    setIsSaving(false);
  };

  // Gestion du sélecteur "Macro" de disponibilité de la journée 
  const handleMacroChange = (jour, value) => {
    setMySchedule(prev => {
      const dayData = { ...(prev[jour] || {}) };
      dayData.macro = value;
      
      // Autocomplete magique selon le choix
      if (value === 'allday') {
        HALF_HOURS.forEach(t => dayData[t] = true);
      } else if (value === 'indispo') {
        HALF_HOURS.forEach(t => dayData[t] = false);
      } else if (value === 'matin') {
        HALF_HOURS.forEach(t => {
            const h = parseInt(t.split(':')[0], 10);
            // Matin de 08:00 à 12:30 (exclu 13:00)
            dayData[t] = !!(h >= 8 && h < 13);
        });
      } else if (value === 'aprem') {
        HALF_HOURS.forEach(t => {
            const h = parseInt(t.split(':')[0], 10);
            // Aprem de 14:00 à 18:30
            dayData[t] = !!(h >= 14 && h < 19);
        });
      } else if (value === 'soir') {
        HALF_HOURS.forEach(t => {
            const h = parseInt(t.split(':')[0], 10);
            // Soirée de 19:00 à 23:30
            dayData[t] = !!(h >= 19 && h <= 23);
        });
      } else if (value === 'nuit') {
         HALF_HOURS.forEach(t => {
            const h = parseInt(t.split(':')[0], 10);
            // Nuit de 00:00 à 05:00
            dayData[t] = !!(h >= 0 && h < 6);
        });
      }

      return { ...prev, [jour]: dayData };
    });
  };

  // --- LOGIQUE HEATMAP (COACH/STAFF) ---
  const fetchAllSchedules = async () => {
    setLoadingHeatmap(true);
    
    // 1. On récupère les grilles de dispo de tout le monde
    const { data: schedulesData, error: errSchedules } = await supabase
      .from('user_availabilities')
      .select('user_id, schedule');

    // 2. On récupère les rôles pour faire le filtre par roster
    const { data: rolesData, error: errRoles } = await supabase
      .from('user_roles')
      .select('user_id, roles(name)');

    if (!errSchedules && schedulesData) {
      // Associer user_id -> tableau de rôles
      const rolesMap = {};
      if (rolesData) {
        rolesData.forEach(item => {
          if (!rolesMap[item.user_id]) rolesMap[item.user_id] = [];
          if (item.roles && item.roles.name) {
            rolesMap[item.user_id].push(item.roles.name);
          }
        });
      }

      // On enrichit chaque grille avec son tableau de rôles
      const enhancedSchedules = schedulesData.map(s => ({
        ...s,
        roles: rolesMap[s.user_id] || []
      }));

      setAllSchedules(enhancedSchedules);
    }
    setLoadingHeatmap(false);
  };

  // Appliquer le filtre Roster
  const filteredSchedules = React.useMemo(() => {
    if (activeRoster === 'Tous') return allSchedules;
    return allSchedules.filter(user => user.roles && user.roles.includes(activeRoster));
  }, [allSchedules, activeRoster]);

  const getHeatmapColor = (jour, creneau) => {
    if (filteredSchedules.length === 0) return 'bg-black/40 text-gray-500';
    
    const count = filteredSchedules.reduce((acc, user) => {
      if (user.schedule[jour] && user.schedule[jour][creneau]) return acc + 1;
      return acc;
    }, 0);

    const percentage = count / filteredSchedules.length;
    
    if (percentage === 0) return 'bg-black/40 text-gray-500';
    if (percentage < 0.3) return 'bg-gowrax-neon/20 text-white';
    if (percentage < 0.7) return 'bg-gowrax-purple/50 text-white';
    return 'bg-green-500 shadow-[inset_0_0_15px_rgba(34,197,94,0.6)] text-white font-bold'; 
  };

  return (
    <>
      <GlobalObjectiveBanner isStaff={isStaff} isCoach={isCoach} />
      
      <div className="w-full max-w-5xl mx-auto my-8 bg-black/40 border border-gowrax-cyan/30 backdrop-blur-md rounded-xl p-6 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-white/20 pb-4 gap-4">
        <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-rajdhani text-white tracking-widest drop-shadow-[0_2px_4px_rgba(255,255,255,0.2)] flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
               PLANIFICATION GLOBALE
               {activeTab === 'grille' && viewMode === 'perso' && (
                 <button 
                   onClick={handleSaveSchedule}
                   disabled={isSaving}
                   className="hidden md:flex px-4 py-2 bg-gowrax-purple text-white font-rajdhani text-sm font-bold rounded shadow-[0_0_15px_rgba(111,45,189,0.5)] hover:bg-gowrax-neon transition-all uppercase disabled:opacity-50 ml-auto items-center justify-center"
                 >
                   {isSaving ? "ÉMISSION..." : "VALIDER"}
                 </button>
               )}
            </h2>
            <div className="flex gap-4 mt-2">
                <button 
                  onClick={() => setActiveTab('grille')}
                  className={`font-techMono text-xs uppercase px-3 py-1 rounded transition-colors ${activeTab === 'grille' ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
                >Disponibilités</button>
                <button 
                  onClick={() => setActiveTab('absences')}
                  className={`font-techMono text-xs uppercase px-3 py-1 rounded transition-colors ${activeTab === 'absences' ? 'bg-red-500/20 text-red-300' : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'}`}
                >Absences (Congés/Imprévus)</button>
            </div>
        </div>

        {/* Boutons de switch de vue (Staff/Coach uniquement pour le heatmap) - Seulement dans l'onglet Grille */}
        {activeTab === 'grille' && (isStaff || isCoach) && (
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

      {activeTab === 'grille' ? (
        viewMode === 'perso' ? (
          /* ================= VUE: GRILLE PERSONNELLE ================= */
          <div className="flex flex-col gap-6">
              {loadingMySchedule ? (
                  <p className="text-gowrax-purple font-techMono animate-pulse">Extraction de ta grille en cours...</p>
              ) : (
                  <>
                    <div className="relative group overflow-hidden rounded-xl border border-gowrax-purple/30 bg-black/40 p-1 md:p-2 shadow-[0_0_20px_rgba(111,45,189,0.15)] transition-all hover:shadow-[0_0_30px_rgba(111,45,189,0.3)]">
                        {/* HUD Corners */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-gowrax-neon pointer-events-none z-50"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-gowrax-neon pointer-events-none z-50"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-gowrax-neon pointer-events-none z-50"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-gowrax-neon pointer-events-none z-50"></div>
                        
                        <div className="relative overflow-x-auto pb-2 custom-scrollbar select-none rounded-lg" onMouseLeave={handleMouseUp}>
                            <table className="w-full text-center border-collapse min-w-[800px] table-fixed relative">
                                <thead className="sticky top-0 z-30 bg-[#1A1C35]/90 backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.8)]">
                                <tr>
                                    <th className="p-2 border border-gray-700 text-gray-400 font-techMono text-xs bg-black/80 w-16 md:w-24 align-middle sticky left-0 z-40">
                                        Horaire
                                    </th>
                                    {JOURS.map(jour => (
                                        <th key={jour} className="p-2 md:p-3 border-l border-r border-t border-gray-700 font-rajdhani text-sm md:text-lg text-white bg-black/30 capitalize min-w-[100px] md:min-w-[120px]">
                                            {jour}
                                        </th>
                                    ))}
                                </tr>
                                <tr className="bg-[#1A1C2E]">
                                    <td className="p-1 border border-gray-700 font-techMono text-[10px] text-gowrax-purple uppercase tracking-widest bg-black/80 align-middle sticky left-0 z-40 w-16 md:w-24">
                                        Tendance
                                    </td>
                                    {JOURS.map(jour => {
                                        const mac = mySchedule[jour]?.macro || '';
                                        return (
                                            <td key={`macro-${jour}`} className="p-1.5 border-l border-r border-b border-gray-700 bg-black/30">
                                                <select 
                                                    value={mac}
                                                    onChange={e => handleMacroChange(jour, e.target.value)}
                                                    className={`w-full bg-black/80 border p-1 rounded text-[10px] sm:text-xs font-techMono cursor-pointer outline-none transition-colors
                                                        ${mac === 'allday' ? 'text-green-400 border-green-500/50' : 
                                                          mac === 'indispo' ? 'text-red-400 border-red-500/50' : 
                                                          mac !== '' ? 'text-gowrax-neon border-gowrax-neon/50' : 'text-gray-400 border-gray-700'}
                                                    `}
                                                >
                                                    <option value="">Sélection libre</option>
                                                    <option value="allday">🟢 Toute la journée</option>
                                                    <option value="matin">🌅 Matin</option>
                                                    <option value="aprem">☕ Après-midi</option>
                                                    <option value="soir">🌙 Soirée</option>
                                                    <option value="nuit">🦉 Nuit</option>
                                                    <option value="indispo">🔴 Indisponible</option>
                                                </select>
                                            </td>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {HALF_HOURS.map((time, index) => {
                                    // La bordure du bas est rouge tous les 1h pour bien séparer
                                    const isFullHour = time.endsWith(':00');
                                    const isEndOfHour = time.endsWith(':30');

                                    return (
                                        <tr key={time} className="h-8 group">
                                            {isFullHour && (
                                                <td rowSpan="2" className="p-1 border border-gray-700 bg-black/80 text-gray-300 font-techMono text-[10px] md:text-xs shadow-inner align-top pt-2 sticky left-0 z-20 w-16 md:w-24">
                                                    {time.split(':')[0]}h
                                                </td>
                                            )}
                                            {JOURS.map(jour => {
                                                const isAvailable = mySchedule[jour]?.[time] === true;
                                                return (
                                                    <td 
                                                        key={`${jour}-${time}`} 
                                                        onMouseDown={() => handleMouseDown(jour, time)}
                                                        onMouseEnter={() => handleMouseEnter(jour, time)}
                                                        className={`border-l border-r border-gray-700 cursor-pointer transition-colors
                                                            ${isEndOfHour ? 'border-b border-gray-800' : 'border-b border-gray-800/30'}
                                                            ${isAvailable ? 'bg-green-500/20 border-green-500 shadow-[inset_0_0_15px_rgba(34,197,94,0.3)]' : 'bg-black/20 hover:bg-white/5'}
                                                        `}
                                                    >
                                                        <div className="w-full h-full min-h-[30px] flex items-center justify-center">
                                                            
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
                      <p className="text-gray-400 font-poppins text-xs italic bg-black/30 p-3 rounded-lg border border-white/5 flex-1">
                         � <strong>Sur mobile ou PC :</strong> Utilise les onglets "Tendance" (Matin/Aprem/Soir...) pour pré-remplir instantanément la journée sans t'embêter !<br/>
                         🖱️ <strong>Sur PC :</strong> Tu peux aussi maintenir le clic enfoncé et balayer la zone pour cocher/décocher rapidement.
                      </p>
                      <button 
                          onClick={handleSaveSchedule}
                          disabled={isSaving}
                          className="px-6 py-3 bg-gowrax-purple text-white font-rajdhani font-bold text-xl rounded shadow-[0_0_15px_rgba(111,45,189,0.5)] hover:bg-gowrax-neon hover:shadow-[0_0_20px_rgba(214,47,127,0.8)] transition-all w-full md:w-auto uppercase disabled:opacity-50 shrink-0"
                      >
                          {isSaving ? "Émission des données..." : "VALIDER MA GRILLE"}
                      </button>
                    </div>
                  </>
              )}
          </div>
      ) : (
          /* ================= VUE: HEATMAP ÉQUIPE (COACH) ================= */
          <div className="flex flex-col gap-6">
              
              {/* --- FILTRE ROSTER --- */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white/[0.02] border border-white/10 p-4 rounded-xl mb-2 shadow-inner">
                  <div className="flex flex-col gap-1">
                      <h3 className="font-rajdhani font-bold text-white text-lg flex items-center gap-2">
                        <svg className="w-4 h-4 text-gowrax-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                        Filtre Roster
                      </h3>
                      <p className="text-xs font-poppins text-gray-400">Croisez l'affluence en fonction d'une escouade spécifique.</p>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap mt-3 md:mt-0">
                      {ROSTERS.map(roster => (
                          <button 
                              key={roster}
                              onClick={() => setActiveRoster(roster)}
                              className={`px-4 py-2 font-techMono text-xs rounded-lg transition-all border ${activeRoster === roster ? 'bg-gowrax-neon text-white border-gowrax-neon shadow-[0_0_15px_rgba(214,47,127,0.4)]' : 'bg-black/50 text-gray-400 border-white/5 hover:border-white/20 hover:text-white'}`}
                          >
                              {roster}
                          </button>
                      ))}
                  </div>
              </div>

              {loadingHeatmap ? (
                  <p className="text-gowrax-neon font-techMono animate-pulse">Compilation des coordonnées d'escouade...</p>
              ) : (
                  <>
                    <p className="text-gray-400 font-poppins text-sm mb-2">
                        Le <strong className="text-green-500">Heatmap</strong> t'indique les créneaux où le plus de joueurs sont disponibles.
                        Couleur vive = Forte disponibilité (Idéal pour des Praccs/Matchs). 
                        Base de calcul : {filteredSchedules.length} agents détectés sur l'effectif sélectionné.
                    </p>

                    <div className="relative group overflow-hidden rounded-xl border border-gowrax-neon/30 bg-black/40 p-1 md:p-2 shadow-[0_0_20px_rgba(214,47,127,0.15)] transition-all hover:shadow-[0_0_30px_rgba(214,47,127,0.3)]">
                        {/* HUD Corners */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-gowrax-neon pointer-events-none z-50"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-gowrax-neon pointer-events-none z-50"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-gowrax-neon pointer-events-none z-50"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-gowrax-neon pointer-events-none z-50"></div>
                        
                        <div className="relative overflow-x-auto pb-2 custom-scrollbar select-none rounded-lg">
                            <table className="w-full text-center border-collapse min-w-[800px] table-fixed relative">
                                <thead className="sticky top-0 z-30 bg-[#251025]/90 backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.8)]">
                                <tr>
                                    <th className="p-2 border border-gray-700 text-gray-400 font-techMono text-xs bg-black/80 w-16 md:w-24 sticky left-0 z-40">Horaire</th>
                                    {JOURS.map(jour => (
                                        <th key={jour} className="p-2 md:p-3 border border-gray-700 font-rajdhani text-sm md:text-lg text-white bg-black/30 capitalize min-w-[100px] md:min-w-[120px]">
                                            {jour}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {HALF_HOURS.map((time, index) => {
                                    const isFullHour = time.endsWith(':00');
                                    const isEndOfHour = time.endsWith(':30');

                                    return (
                                        <tr key={time} className="h-8">
                                            {isFullHour && (
                                                <td rowSpan="2" className="p-1 border border-gray-700 bg-black/80 text-gray-300 font-techMono text-[10px] md:text-xs shadow-inner align-top pt-2 sticky left-0 z-20 w-16 md:w-24">
                                                    {time.split(':')[0]}h
                                                </td>
                                            )}
                                            {JOURS.map(jour => {
                                                const count = filteredSchedules.reduce((acc, user) => {
                                                    if (user.schedule[jour] && user.schedule[jour][time]) return acc + 1;
                                                    return acc;
                                                }, 0);
                                                
                                                return (
                                                    <td 
                                                        key={`heatmap-${jour}-${time}`} 
                                                        className={`border-l border-r border-gray-700 transition-colors
                                                            ${isEndOfHour ? 'border-b border-gray-800' : 'border-b border-gray-800/30'}
                                                            ${getHeatmapColor(jour, time)}
                                                        `}
                                                    >
                                                        <div className="w-full h-full min-h-[30px] flex items-center justify-center font-techMono text-xs opacity-80">
                                                            {count > 0 ? `${count}/${filteredSchedules.length}` : ''}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        </div>
                    </div>
                  </>
              )}
          </div>
        )
      ) : (
        /* ================= VUE: GESTION DES ABSENCES ================= */
        <div className="flex flex-col gap-8 animate-fade-in">
          
          {/* Nouveau Formulaire d'absence */}
          <div className="bg-black/30 border border-red-500/20 rounded-xl p-6">
            <h3 className="font-rajdhani text-xl font-bold text-red-400 mb-4 inline-flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              DÉCLARER UNE ABSENCE
            </h3>
            
            <form onSubmit={handleCreateAbsence} className="flex flex-col md:flex-row gap-4 align-top">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-techMono text-gray-500 uppercase">Début de l'absence</label>
                <input 
                  type="datetime-local" 
                  required
                  value={newAbsence.date_start}
                  onChange={e => setNewAbsence({...newAbsence, date_start: e.target.value})}
                  className="bg-black/50 border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-red-500 outline-none"
                />
              </div>

              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-techMono text-gray-500 uppercase">Fin de l'absence</label>
                <input 
                  type="datetime-local" 
                  required
                  value={newAbsence.date_end}
                  onChange={e => setNewAbsence({...newAbsence, date_end: e.target.value})}
                  className="bg-black/50 border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-red-500 outline-none"
                />
              </div>

              <div className="flex flex-col gap-1 flex-[2]">
                <label className="text-xs font-techMono text-gray-500 uppercase">Justificatif / Motif</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Voyage scolaire, panne PC, RDV médical..."
                  value={newAbsence.reason}
                  onChange={e => setNewAbsence({...newAbsence, reason: e.target.value})}
                  className="bg-black/50 border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-red-500 outline-none w-full"
                />
              </div>

              <button 
                type="submit"
                disabled={isSavingAbsence}
                className="self-end px-6 py-2 bg-red-600/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white rounded-lg font-rajdhani font-bold transition-all disabled:opacity-50 h-[40px] whitespace-nowrap"
              >
                SOUMETTRE
              </button>
            </form>
          </div>

          <div className="h-px w-full bg-white/10"></div>

          {/* Liste des absences */}
          <div>
            <h3 className="font-rajdhani text-xl text-white mb-4">HISTORIQUE DES ABSENCES</h3>
            
            {absences.length === 0 ? (
              <p className="text-gray-500 font-poppins text-sm italic p-4 bg-black/20 rounded">Aucune absence déclarée pour le moment.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {absences.map(abs => {
                  const statusMap = {
                    'en_attente': { color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30', label: 'En attente' },
                    'valide': { color: 'text-green-500 bg-green-500/10 border-green-500/30', label: 'Validée' },
                    'refuse': { color: 'text-red-500 bg-red-500/10 border-red-500/30', label: 'Refusée' }
                  };
                  const ds = new Date(abs.date_start);
                  const de = new Date(abs.date_end);

                  let userName = abs.user_id === session.user.id ? 'Moi' : abs.user_name;

                  return (
                    <div key={abs.id} className={`bg-black/50 border border-white/5 rounded-xl p-4 flex flex-col gap-2 relative shadow-[0_0_15px_rgba(0,0,0,0.5)] ${abs.status === 'refuse' ? 'opacity-70' : ''}`}>
                      <div className="flex justify-between items-start">
                         <div className="flex items-center gap-2">
                           <span className="font-rajdhani font-bold text-white text-lg">{userName}</span>
                           {abs.user_id !== session.user.id && (
                             <span className="text-[10px] text-gray-500 font-techMono uppercase px-1 border border-gray-600 rounded">Agent</span>
                           )}
                         </div>
                         <span className={`px-2 py-0.5 text-xs font-techMono uppercase border rounded ${statusMap[abs.status]?.color || statusMap['en_attente'].color}`}>
                           {statusMap[abs.status]?.label || 'En attente'}
                         </span>
                      </div>
                      
                      <div className="text-xs font-techMono text-gray-400">
                        Du <span className="text-white">{ds.toLocaleDateString()} à {ds.getHours()}h{ds.getMinutes() < 10 ? '0'+ds.getMinutes() : ds.getMinutes()}</span><br/>
                        Au <span className="text-white">{de.toLocaleDateString()} à {de.getHours()}h{de.getMinutes() < 10 ? '0'+de.getMinutes() : de.getMinutes()}</span>
                      </div>
                      
                      <p className="text-sm font-poppins text-gray-300 mt-1 italic border-l-2 border-red-500/50 pl-3">
                        "{abs.reason}"
                      </p>

                      {/* Outils Staff */}
                      {(isStaff || isCoach) && abs.status === 'en_attente' && (
                        <div className="mt-3 pt-3 border-t border-white/5 flex gap-2 justify-end">
                          <button onClick={() => updateAbsenceStatus(abs.id, 'valide')} className="text-xs font-bold text-green-500 hover:text-green-400 hover:bg-green-500/10 px-3 py-1 rounded transition-colors border border-green-500/20">✓ VALIDER</button>
                          <button onClick={() => updateAbsenceStatus(abs.id, 'refuse')} className="text-xs font-bold text-red-500 hover:text-red-400 hover:bg-red-500/10 px-3 py-1 rounded transition-colors border border-red-500/20">✗ REFUSER</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
    </>
  );
}