import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import GlobalObjectiveBanner from './GlobalObjectiveBanner';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

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

export default function Availability({ session, isStaff, isCoach }) {
  const [activeTab, setActiveTab] = useState('grille'); 
  const [viewMode, setViewMode] = useState('perso'); 
  
  const ROSTERS = ['Tous', 'High Roster', 'Academy', 'Chill', 'Tryhard'];
  const [activeRoster, setActiveRoster] = useState('Tous');
  const [activeMember, setActiveMember] = useState('Tous'); 

  const [mySchedule, setMySchedule] = useState({});
  const [loadingMySchedule, setLoadingMySchedule] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState(true); 

  const [allSchedules, setAllSchedules] = useState([]);
  const [loadingHeatmap, setLoadingHeatmap] = useState(true);

  // --- ABSENCES ---
  const [absences, setAbsences] = useState([]);
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [newAbsence, setNewAbsence] = useState({ date_start: '', date_end: '', reason: '' });
  const [isSavingAbsence, setIsSavingAbsence] = useState(false);
  
  const [editingAbsenceId, setEditingAbsenceId] = useState(null);
  const [editAbsenceData, setEditAbsenceData] = useState({ date_start: '', date_end: '', reason: '' });

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

  // --- FETCH DATA ---
  const fetchAbsences = async () => {
    let query = supabase.from('absences').select('*');
    if (!isStaff && !isCoach) query = query.eq('user_id', session.user.id);
    
    const { data: absencesData, error } = await query.order('created_at', { ascending: false });
    
    if (!error && absencesData) {
      const userIds = [...new Set(absencesData.map(a => a.user_id))];
      const { data: profilesData } = await supabase.from('profiles').select('id, username').in('id', userIds);
      const profilesMap = (profilesData || []).reduce((acc, p) => ({...acc, [p.id]: p.username}), {});
      
      setAbsences(absencesData.map(a => ({...a, user_name: profilesMap[a.user_id] || 'Inconnu'})));
    }
  };

  const fetchAllSchedules = async () => {
    setLoadingHeatmap(true);
    const { data: schedulesData } = await supabase.from('user_availabilities').select('user_id, schedule');
    const { data: rolesData } = await supabase.from('user_roles').select('user_id, roles(name)');
    const { data: profilesData } = await supabase.from('profiles').select('id, username'); 

    if (schedulesData) {
      const rolesMap = {};
      (rolesData || []).forEach(item => {
        if (!rolesMap[item.user_id]) rolesMap[item.user_id] = [];
        if (item.roles && item.roles.name) rolesMap[item.user_id].push(item.roles.name);
      });

      const profilesMap = (profilesData || []).reduce((acc, p) => ({...acc, [p.id]: p.username}), {});

      const enhancedSchedules = schedulesData.map(s => ({
        ...s,
        username: profilesMap[s.user_id] || 'Agent Inconnu',
        roles: rolesMap[s.user_id] || []
      }));

      enhancedSchedules.sort((a, b) => a.username.localeCompare(b.username));
      setAllSchedules(enhancedSchedules);
    }
    setLoadingHeatmap(false);
  };

  const filteredSchedules = React.useMemo(() => {
    let result = allSchedules;
    if (activeRoster !== 'Tous') {
      result = result.filter(user => user.roles && user.roles.includes(activeRoster));
    }
    if (activeMember !== 'Tous') {
      result = result.filter(user => user.user_id === activeMember);
    }
    return result;
  }, [allSchedules, activeRoster, activeMember]);

  const handleExportCSV = () => {
    if (filteredSchedules.length === 0) return alert("Aucune donnée à exporter.");
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Joueur;Roster;Jour;Creneaux Disponibles\n";

    filteredSchedules.forEach(user => {
      const rosters = user.roles.join(', ');
      JOURS.forEach(jour => {
        const slots = HALF_HOURS.filter(time => user.schedule[jour] && user.schedule[jour][time]);
        if (slots.length > 0) {
          csvContent += `${user.username};${rosters};${jour};"${slots.join(', ')}"\n`;
        }
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Gowrax_Dispos_${activeRoster}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchMySchedule = async () => {
    setLoadingMySchedule(true);
    const { data } = await supabase.from('user_availabilities').select('schedule').eq('user_id', session.user.id).maybeSingle();
    setMySchedule(data?.schedule || {});
    setLoadingMySchedule(false);
  };

  const handleMouseDown = (jour, time) => {
    setIsDragging(true);
    const willBeAvailable = !(mySchedule[jour] || {})[time];
    setDragAction(willBeAvailable);
    setMySchedule(prev => ({...prev, [jour]: {...(prev[jour] || {}), [time]: willBeAvailable}}));
  };

  const handleMouseEnter = (jour, time) => {
    if (!isDragging) return;
    setMySchedule(prev => ({...prev, [jour]: {...(prev[jour] || {}), [time]: dragAction}}));
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const handleSaveSchedule = async () => {
    setIsSaving(true);
    const { error } = await supabase.from('user_availabilities').upsert({
      user_id: session.user.id, schedule: mySchedule, updated_at: new Date().toISOString()
    });
    if (error) alert("Erreur lors de la sauvegarde.");
    setIsSaving(false);
  };

  const handleMacroChange = (jour, value) => {
    setMySchedule(prev => {
      const dayData = { ...(prev[jour] || {}), macro: value };
      HALF_HOURS.forEach(t => {
        const h = parseInt(t.split(':')[0], 10);
        if (value === 'allday') dayData[t] = true;
        else if (value === 'indispo') dayData[t] = false;
        else if (value === 'matin') dayData[t] = (h >= 8 && h < 13);
        else if (value === 'aprem') dayData[t] = (h >= 14 && h < 19);
        else if (value === 'soir') dayData[t] = (h >= 19 && h <= 23);
        else if (value === 'nuit') dayData[t] = (h >= 0 && h < 6);
      });
      return { ...prev, [jour]: dayData };
    });
  };

  const getHeatmapColor = (jour, creneau) => {
    if (filteredSchedules.length === 0) return 'bg-[#0D0E15] text-gray-600';
    const count = filteredSchedules.reduce((acc, user) => (user.schedule[jour]?.[creneau] ? acc + 1 : acc), 0);
    const pct = count / filteredSchedules.length;
    
    if (pct === 0) return 'bg-[#0D0E15] text-gray-600';
    if (pct < 0.4) return 'bg-[#6F2DBD]/30 text-white';
    if (pct < 0.8) return 'bg-[#B185DB]/60 text-white font-bold shadow-[inset_0_0_10px_rgba(177,133,219,0.3)]';
    return 'bg-[#F7CAD0] text-[#1A1C2E] font-black shadow-[inset_0_0_15px_rgba(247,202,208,0.8)]'; 
  };

  // --- LOGIQUE SAUVEGARDE ABSENCES ---
  const handleCreateAbsence = async (e) => {
    e.preventDefault();
    setIsSavingAbsence(true);
    
    const { error } = await supabase.from('absences').insert({
      user_id: session.user.id,
      date_start: new Date(newAbsence.date_start).toISOString(),
      date_end: new Date(newAbsence.date_end).toISOString(),
      reason: newAbsence.reason
    });
    
    setIsSavingAbsence(false);
    
    if (!error) {
      await supabase.from('notifications').insert({
        type: 'global',
        title: '🔴 Nouvelle Absence Déclarée',
        message: `Une absence a été signalée sur le site par un membre.\n**Du :** ${new Date(newAbsence.date_start).toLocaleDateString('fr-FR')} \n**Au :** ${new Date(newAbsence.date_end).toLocaleDateString('fr-FR')} \n**Motif :** ${newAbsence.reason}`,
        target_roster: 'Staff'
      });

      setNewAbsence({ date_start: '', date_end: '', reason: '' });
      setIsAbsenceModalOpen(false); 
      fetchAbsences();
    } else {
      alert("Erreur lors de l'ajout de l'absence: " + error.message);
    }
  };

  const startEditing = (abs) => {
    setEditingAbsenceId(abs.id);
    const formatDateForInput = (dateStr) => {
      const d = new Date(dateStr);
      const pad = (n) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    
    setEditAbsenceData({
      date_start: formatDateForInput(abs.date_start),
      date_end: formatDateForInput(abs.date_end),
      reason: abs.reason
    });
  };

  const handleSaveEdit = async (id) => {
    const { error } = await supabase.from('absences').update({
      date_start: new Date(editAbsenceData.date_start).toISOString(),
      date_end: new Date(editAbsenceData.date_end).toISOString(),
      reason: editAbsenceData.reason,
      status: 'modifie'
    }).eq('id', id);

    if (!error) {
      setEditingAbsenceId(null);
      fetchAbsences();
      
      await supabase.from('notifications').insert({
        type: 'global',
        title: '🟠 Absence Modifiée',
        message: `Une absence a été modifiée par un membre et nécessite une re-validation.\n**Nouveau Motif :** ${editAbsenceData.reason}`,
        target_roster: 'Staff'
      });
    } else {
      alert("Erreur lors de la modification de l'absence.");
    }
  };

  const updateAbsenceStatus = async (id, status) => {
    const { error } = await supabase.from('absences').update({ status }).eq('id', id);
    if (!error) fetchAbsences();
  };

  return (
    <>
      <GlobalObjectiveBanner isStaff={isStaff} isCoach={isCoach} />
      
      <div className="w-full max-w-[1400px] mx-auto my-8 bg-[#1A1C2E]/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      
      {/* ================= HEADER PREMIUM ================= */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 border-b border-white/10 pb-6">
        <div>
            <h2 className="text-3xl md:text-4xl font-rockSalt text-transparent bg-clip-text bg-gradient-to-r from-white to-[#A2D2FF] drop-shadow-md mb-3">
               Planning & Disponibilités
            </h2>
            <div className="flex gap-3">
                <button onClick={() => setActiveTab('grille')} className={`font-techMono text-xs uppercase px-4 py-2 rounded-xl transition-all duration-300 ${activeTab === 'grille' ? 'bg-[#A2D2FF]/20 text-[#A2D2FF] border border-[#A2D2FF]/30' : 'bg-black/20 text-gray-500 hover:text-white hover:bg-white/10'}`}>
                  La Grille
                </button>
                <button onClick={() => setActiveTab('absences')} className={`font-techMono text-xs uppercase px-4 py-2 rounded-xl transition-all duration-300 ${activeTab === 'absences' ? 'bg-[#F7CAD0]/20 text-[#F7CAD0] border border-[#F7CAD0]/30' : 'bg-black/20 text-gray-500 hover:text-white hover:bg-white/10'}`}>
                  Registre des Absences
                </button>
            </div>
        </div>

        <div className="flex flex-col items-end gap-4 w-full lg:w-auto">
          <button 
            onClick={() => { setActiveTab('absences'); setIsAbsenceModalOpen(true); }}
            className="w-full lg:w-auto px-6 py-3 bg-gradient-to-r from-red-600/80 to-red-500/80 hover:from-red-500 hover:to-red-400 text-white font-rajdhani font-bold text-lg rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] flex items-center justify-center gap-2 border border-red-400/50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            DÉCLARER UNE ABSENCE
          </button>

          {activeTab === 'grille' && (isStaff || isCoach) && (
              <div className="flex bg-[#0D0E15] border border-white/10 rounded-xl p-1.5 shadow-inner w-full lg:w-auto">
                  <button onClick={() => setViewMode('perso')} className={`flex-1 px-6 py-2 font-techMono text-xs uppercase rounded-lg transition-all ${viewMode === 'perso' ? 'bg-[#6F2DBD] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
                     Ma Grille
                  </button>
                  <button onClick={() => setViewMode('heatmap')} className={`flex-1 px-6 py-2 font-techMono text-xs uppercase rounded-lg transition-all ${viewMode === 'heatmap' ? 'bg-[#A2D2FF] text-[#1A1C2E] font-bold shadow-[0_0_15px_rgba(162,210,255,0.4)]' : 'text-gray-400 hover:text-white'}`}>
                     Vue Staff
                  </button>
              </div>
          )}
        </div>
      </div>

      {/* ================= CONTENU PRINCIPAL ================= */}
      {activeTab === 'grille' ? (
        viewMode === 'perso' ? (
          /* ================= GRILLE PERSO ================= */
          <div className="flex flex-col gap-6 animate-fade-in">
              {loadingMySchedule ? (
                  <p className="text-[#A2D2FF] font-techMono animate-pulse">Extraction de ta grille en cours...</p>
              ) : (
                  <>
                    <div className="bg-[#0D0E15]/80 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden shadow-2xl relative">
                        <div className="overflow-x-auto custom-scrollbar select-none" onMouseLeave={handleMouseUp}>
                            <table className="w-full text-center border-collapse min-w-[900px] table-fixed">
                                <thead className="sticky top-0 z-30 bg-[#1A1C2E]/95 backdrop-blur-xl shadow-md border-b border-white/10">
                                <tr>
                                    <th className="p-4 text-gray-500 font-techMono text-xs uppercase tracking-widest w-24 sticky left-0 bg-[#1A1C2E]/95 z-40 border-r border-white/5">Heure</th>
                                    {JOURS.map(jour => (
                                        <th key={jour} className="p-4 font-rajdhani text-lg text-white capitalize border-x border-white/5">{jour}</th>
                                    ))}
                                </tr>
                                <tr className="bg-black/20">
                                    <td className="p-2 text-[#A2D2FF] font-techMono text-[10px] uppercase tracking-widest sticky left-0 bg-[#1A1C2E]/95 z-40 border-r border-white/5 border-b border-white/10">Macros</td>
                                    {JOURS.map(jour => {
                                        const mac = mySchedule[jour]?.macro || '';
                                        return (
                                            <td key={`macro-${jour}`} className="p-2 border-x border-white/5 border-b border-white/10">
                                                <select 
                                                    value={mac} onChange={e => handleMacroChange(jour, e.target.value)}
                                                    className={`w-full bg-[#1A1C2E] border p-2 rounded-lg text-xs font-poppins cursor-pointer outline-none transition-colors
                                                        ${mac === 'allday' ? 'text-green-400 border-green-500/30' : 
                                                          mac === 'indispo' ? 'text-red-400 border-red-500/30' : 
                                                          mac !== '' ? 'text-[#A2D2FF] border-[#A2D2FF]/30' : 'text-gray-400 border-white/10'}
                                                    `}
                                                >
                                                    <option value="">-- Personnalisé --</option>
                                                    <option value="allday">🟢 Dispo totale</option>
                                                    <option value="matin">🌅 Matin (8h-13h)</option>
                                                    <option value="aprem">☕ Aprem (14h-19h)</option>
                                                    <option value="soir">🌙 Soir (19h-23h)</option>
                                                    <option value="nuit">🦉 Nuit (00h-06h)</option>
                                                    <option value="indispo">🔴 Indisponible</option>
                                                </select>
                                            </td>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="bg-transparent">
                                {HALF_HOURS.map(time => {
                                    const isFullHour = time.endsWith(':00');
                                    const isEndOfHour = time.endsWith(':30');

                                    return (
                                        <tr key={time} className="h-9 group hover:bg-white/[0.02] transition-colors">
                                            {isFullHour && (
                                                <td rowSpan="2" className="p-2 text-gray-500 font-techMono text-xs align-top pt-3 sticky left-0 bg-[#0D0E15]/90 z-20 border-r border-white/5">
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
                                                        className={`border-x border-white/5 cursor-pointer transition-all duration-150
                                                            ${isEndOfHour ? 'border-b border-white/10' : 'border-b border-white/[0.02]'}
                                                            ${isAvailable 
                                                              ? 'bg-gradient-to-br from-[#A2D2FF]/30 to-[#B185DB]/30 border-[#A2D2FF]/50 shadow-[inset_0_0_15px_rgba(162,210,255,0.2)]' 
                                                              : 'hover:bg-white/5'}
                                                        `}
                                                    >
                                                        <div className="w-full h-full min-h-[35px]"></div>
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

                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-2">
                      <p className="text-gray-400 font-poppins text-sm leading-relaxed bg-[#0D0E15] p-5 rounded-2xl border border-white/5 flex-1 shadow-inner">
                         🖱️ <strong className="text-white">Astuce PC :</strong> Maintenez le clic enfoncé et balayez les cases pour cocher/décocher rapidement votre semaine.
                      </p>
                      <button 
                          onClick={handleSaveSchedule} disabled={isSaving}
                          className="px-10 py-5 bg-gradient-to-r from-[#6F2DBD] to-[#B185DB] text-white font-rajdhani font-extrabold text-xl rounded-2xl shadow-[0_0_20px_rgba(111,45,189,0.4)] hover:shadow-[0_0_30px_rgba(177,133,219,0.6)] hover:scale-105 transition-all w-full md:w-auto uppercase disabled:opacity-50"
                      >
                          {isSaving ? "SAUVEGARDE..." : "VALIDER MA GRILLE"}
                      </button>
                    </div>
                  </>
              )}
          </div>
        ) : (
          /* ================= VUE STAFF (HEATMAP + FILTRES) ================= */
          <div className="flex flex-col gap-6 animate-fade-in">
              
              <div className="bg-[#0D0E15] border border-[#A2D2FF]/30 p-6 rounded-3xl shadow-[0_0_20px_rgba(162,210,255,0.1)] flex flex-col lg:flex-row gap-6 justify-between items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#A2D2FF]/5 blur-[50px] rounded-full pointer-events-none"></div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto z-10">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-techMono text-[#A2D2FF] uppercase tracking-widest">Filtre Roster</label>
                        <select value={activeRoster} onChange={e => setActiveRoster(e.target.value)} className="bg-[#1A1C2E] border border-white/10 rounded-xl p-3 text-white font-poppins text-sm outline-none focus:border-[#A2D2FF] min-w-[150px]">
                          {ROSTERS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-techMono text-[#A2D2FF] uppercase tracking-widest">Filtre Membre</label>
                        <select value={activeMember} onChange={e => setActiveMember(e.target.value)} className="bg-[#1A1C2E] border border-white/10 rounded-xl p-3 text-white font-poppins text-sm outline-none focus:border-[#A2D2FF] min-w-[200px]">
                          <option value="Tous">-- Tous les membres --</option>
                          {allSchedules.map(u => <option key={u.user_id} value={u.user_id}>{u.username}</option>)}
                        </select>
                      </div>
                  </div>

                  <div className="z-10 flex flex-col items-center lg:items-end gap-2 w-full lg:w-auto">
                    <p className="text-xs text-gray-400 font-poppins"><strong className="text-white">{filteredSchedules.length}</strong> agent(s) trouvés.</p>
                    <button 
                      onClick={handleExportCSV}
                      className="px-6 py-3 bg-[#A2D2FF]/10 text-[#A2D2FF] hover:bg-[#A2D2FF]/20 border border-[#A2D2FF]/30 font-rajdhani font-bold rounded-xl transition-all flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      EXPORTER (CSV)
                    </button>
                  </div>
              </div>

              {loadingHeatmap ? (
                  <div className="flex justify-center p-10"><div className="w-8 h-8 border-2 border-[#A2D2FF] border-t-transparent rounded-full animate-spin"></div></div>
              ) : (
                  <div className="bg-[#0D0E15]/80 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                      <div className="overflow-x-auto custom-scrollbar select-none">
                          <table className="w-full text-center border-collapse min-w-[900px] table-fixed">
                              <thead className="sticky top-0 z-30 bg-[#1A1C2E]/95 backdrop-blur-xl shadow-md border-b border-white/10">
                              <tr>
                                  <th className="p-4 text-gray-500 font-techMono text-xs uppercase tracking-widest w-24 sticky left-0 bg-[#1A1C2E]/95 z-40 border-r border-white/5">Heure</th>
                                  {JOURS.map(jour => (
                                      <th key={jour} className="p-4 font-rajdhani text-lg text-white capitalize border-x border-white/5">{jour}</th>
                                  ))}
                              </tr>
                          </thead>
                          <tbody>
                              {HALF_HOURS.map(time => {
                                  const isFullHour = time.endsWith(':00');
                                  const isEndOfHour = time.endsWith(':30');

                                  return (
                                      <tr key={time} className="h-9 transition-colors">
                                          {isFullHour && (
                                              <td rowSpan="2" className="p-2 text-gray-500 font-techMono text-xs align-top pt-3 sticky left-0 bg-[#0D0E15]/90 z-20 border-r border-white/5">
                                                  {time.split(':')[0]}h
                                              </td>
                                          )}
                                          {JOURS.map(jour => {
                                              const count = filteredSchedules.reduce((acc, user) => (user.schedule[jour]?.[time] ? acc + 1 : acc), 0);
                                              const isSingleMember = activeMember !== 'Tous';
                                              const cellColor = isSingleMember 
                                                  ? (count > 0 ? 'bg-[#A2D2FF]/30 border-[#A2D2FF]/50 shadow-[inset_0_0_15px_rgba(162,210,255,0.2)]' : 'bg-transparent hover:bg-white/5')
                                                  : getHeatmapColor(jour, time);

                                              return (
                                                  <td 
                                                      key={`heatmap-${jour}-${time}`} 
                                                      className={`border-x border-white/5 transition-all duration-300
                                                          ${isEndOfHour ? 'border-b border-white/10' : 'border-b border-white/[0.02]'}
                                                          ${cellColor}
                                                      `}
                                                  >
                                                      <div className="w-full h-full min-h-[35px] flex items-center justify-center font-techMono text-[10px] opacity-70">
                                                          {!isSingleMember && count > 0 ? `${count}/${filteredSchedules.length}` : ''}
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
              )}
          </div>
        )
      ) : (
        /* ================= VUE ABSENCES ================= */
        <div className="flex flex-col gap-6 animate-fade-in">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-4 md:p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <div>
              <h3 className="font-rajdhani text-2xl font-bold text-white tracking-widest">HISTORIQUE DES ABSENCES</h3>
              <p className="text-gray-400 font-poppins text-sm">Consultez l'état de vos demandes. Les validations sont effectuées par le Staff.</p>
            </div>
          </div>

          <div>
            {absences.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                <svg className="w-12 h-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <h3 className="font-rajdhani font-bold text-xl text-gray-400">Aucune absence déclarée</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {absences.map(abs => {
                  
                  const statusMap = {
                    'en_attente': { color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30', label: 'En attente' },
                    'modifie': { color: 'text-orange-500 bg-orange-500/10 border-orange-500/30', label: 'Modifié - À valider' },
                    'valide': { color: 'text-green-500 bg-green-500/10 border-green-500/30', label: 'Validée' },
                    'refuse': { color: 'text-red-500 bg-red-500/10 border-red-500/30', label: 'Refusée' }
                  };
                  
                  if (editingAbsenceId === abs.id) {
                     return (
                       <div key={abs.id} className="bg-black/50 border border-orange-500/50 rounded-2xl p-5 flex flex-col gap-4 relative shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                          <h4 className="font-rajdhani font-bold text-orange-400 text-lg flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            MODIFIER L'ABSENCE
                          </h4>
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-techMono text-gray-500 uppercase">Nouvelle Date de Début</label>
                              <input type="datetime-local" value={editAbsenceData.date_start} onChange={e => setEditAbsenceData({...editAbsenceData, date_start: e.target.value})} className="bg-black/50 border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-orange-500 outline-none w-full" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-techMono text-gray-500 uppercase">Nouvelle Date de Fin</label>
                              <input type="datetime-local" value={editAbsenceData.date_end} onChange={e => setEditAbsenceData({...editAbsenceData, date_end: e.target.value})} className="bg-black/50 border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-orange-500 outline-none w-full" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-techMono text-gray-500 uppercase">Nouveau Motif</label>
                              <input type="text" value={editAbsenceData.reason} onChange={e => setEditAbsenceData({...editAbsenceData, reason: e.target.value})} className="bg-black/50 border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-orange-500 outline-none w-full" />
                            </div>
                          </div>
                          <div className="flex justify-end gap-3 mt-2 border-t border-white/5 pt-4">
                            <button onClick={() => setEditingAbsenceId(null)} className="text-xs font-techMono text-gray-400 hover:text-white px-3 py-2 transition-colors">ANNULER</button>
                            <button onClick={() => handleSaveEdit(abs.id)} className="text-xs font-techMono bg-orange-500/20 text-orange-400 border border-orange-500/50 hover:bg-orange-500 hover:text-white px-4 py-2 rounded-lg transition-all shadow-[0_0_10px_rgba(249,115,22,0.3)]">SAUVEGARDER</button>
                          </div>
                       </div>
                     );
                  }

                  const ds = new Date(abs.date_start);
                  const de = new Date(abs.date_end);
                  let userName = abs.user_id === session.user.id ? 'Moi' : abs.user_name;

                  return (
                    <div key={abs.id} className={`bg-black/40 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 relative transition-all hover:border-white/20 hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] ${abs.status === 'refuse' ? 'opacity-70 grayscale' : ''}`}>
                      <div className="flex justify-between items-start">
                         <div className="flex items-center gap-2">
                           <span className="font-rajdhani font-bold text-white text-xl">{userName}</span>
                           {abs.user_id !== session.user.id && (
                             <span className="text-[9px] text-gray-400 font-techMono uppercase px-1.5 py-0.5 border border-gray-600 rounded bg-black/50">Agent</span>
                           )}
                         </div>
                         <div className="flex flex-col items-end gap-2">
                           <span className={`px-2 py-1 text-[10px] font-techMono uppercase border rounded shadow-inner ${statusMap[abs.status]?.color || statusMap['en_attente'].color}`}>
                             {statusMap[abs.status]?.label || 'En attente'}
                           </span>
                           {abs.user_id === session.user.id && abs.status === 'valide' && (
                             <button onClick={() => startEditing(abs)} className="text-[10px] text-gray-400 hover:text-white font-techMono flex items-center gap-1 transition-colors bg-white/5 hover:bg-white/10 px-2 py-1 rounded">
                               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                               MODIFIER
                             </button>
                           )}
                         </div>
                      </div>
                      
                      <div className="text-xs font-techMono text-gray-400 bg-black/30 p-3 rounded-lg border border-white/5">
                        <div className="flex justify-between mb-1">
                          <span>Du:</span> <span className="text-white">{ds.toLocaleDateString()} - {ds.getHours()}h{ds.getMinutes().toString().padStart(2, '0')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Au:</span> <span className="text-white">{de.toLocaleDateString()} - {de.getHours()}h{de.getMinutes().toString().padStart(2, '0')}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm font-poppins text-gray-300 mt-1 italic border-l-2 border-red-500/50 pl-3">
                        "{abs.reason}"
                      </p>

                      {(isStaff || isCoach) && (abs.status === 'en_attente' || abs.status === 'modifie') && (
                        <div className="mt-3 pt-3 border-t border-white/5 flex gap-2 justify-end">
                          <button onClick={() => updateAbsenceStatus(abs.id, 'valide')} className="text-xs font-techMono text-green-500 hover:text-white hover:bg-green-500/40 px-3 py-1.5 rounded transition-all border border-green-500/30 bg-green-500/10">✓ VALIDER</button>
                          <button onClick={() => updateAbsenceStatus(abs.id, 'refuse')} className="text-xs font-techMono text-red-500 hover:text-white hover:bg-red-500/40 px-3 py-1.5 rounded transition-all border border-red-500/30 bg-red-500/10">✗ REFUSER</button>
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

      {/* ================= MODALE ABSENCE ================= */}
      {isAbsenceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1A1C2E] border border-red-500/30 rounded-2xl w-full max-w-lg shadow-[0_20px_50px_rgba(239,68,68,0.2)] flex flex-col overflow-hidden">
            
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
              <h2 className="text-xl font-rajdhani font-bold text-white inline-flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                DÉCLARER UNE <span className="text-red-500">ABSENCE</span>
              </h2>
              <button onClick={() => setIsAbsenceModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-6">
              <form id="absence-form" onSubmit={handleCreateAbsence} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-techMono text-gray-500 uppercase tracking-widest">Début</label>
                    <input 
                      type="datetime-local" 
                      required
                      value={newAbsence.date_start}
                      onChange={e => setNewAbsence({...newAbsence, date_start: e.target.value})}
                      className="bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-red-500 outline-none transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-techMono text-gray-500 uppercase tracking-widest">Fin</label>
                    <input 
                      type="datetime-local" 
                      required
                      value={newAbsence.date_end}
                      onChange={e => setNewAbsence({...newAbsence, date_end: e.target.value})}
                      className="bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-red-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-techMono text-gray-500 uppercase tracking-widest">Justificatif / Motif</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Voyage scolaire, panne de matériel..."
                    value={newAbsence.reason}
                    onChange={e => setNewAbsence({...newAbsence, reason: e.target.value})}
                    className="bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-red-500 outline-none w-full transition-colors"
                  />
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-black/40">
              <button 
                type="button" 
                onClick={() => setIsAbsenceModalOpen(false)} 
                className="px-5 py-2.5 rounded-xl text-xs font-techMono text-gray-400 hover:text-white transition-colors"
              >
                ANNULER
              </button>
              <button 
                type="submit" 
                form="absence-form"
                disabled={isSavingAbsence}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-rajdhani font-bold text-sm rounded-xl transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] flex items-center gap-2"
              >
                {isSavingAbsence ? 'ENVOI...' : 'SOUMETTRE'}
              </button>
            </div>

          </div>
        </div>
      )}

      </div>
    </>
  );
}