import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { usePermissions } from '../hooks/usePermissions';

// Import du EventCard
import EventCard from './EventCard';
import GlobalObjectiveBanner from './GlobalObjectiveBanner';

// --- SOUS-COMPOSANT BOUTON GOOGLE (Design Officiel) ---
const GoogleCalendarButton = ({ className }) => (
  <a 
    href="https://calendar.google.com/calendar/render?cid=teamgowrax@gmail.com" 
    target="_blank" 
    rel="noopener noreferrer"
    className={`px-5 py-2.5 bg-white/[0.05] hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-xl transition-all shadow-[0_4px_15px_rgba(0,0,0,0.2)] flex items-center justify-center gap-3 group ${className}`}
  >
    {/* Vrai logo officiel Google "G" */}
    <svg viewBox="0 0 24 24" className="w-5 h-5 drop-shadow-sm transition-transform group-hover:scale-110" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.31-1.03 2.41-2.16 3.14v2.6h3.5c2.05-1.89 3.3-4.67 3.3-7.75z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.5-2.6c-.98.66-2.23 1.06-3.78 1.06-2.91 0-5.38-1.97-6.26-4.62H2.07v2.69C3.89 20.45 7.63 23 12 23z" fill="#34A853"/>
      <path d="M5.74 14.18c-.22-.66-.35-1.36-.35-2.18s.13-1.52.35-2.18V7.13H2.07C1.38 8.5 1 10.18 1 12s.38 3.5 1.07 4.87l3.67-2.69z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.63 1 3.89 3.55 2.07 7.13l3.67 2.69c.88-2.65 3.35-4.44 6.26-4.44z" fill="#EA4335"/>
    </svg>
    <span className="font-rajdhani font-bold text-xs md:text-sm tracking-widest text-gray-300 group-hover:text-white transition-colors uppercase mt-0.5">
      S'abonner à l'Agenda
    </span>
  </a>
);

export default function Calendar({ session }) {
  const { roles, loading: rolesLoading, isStaff, isCoach } = usePermissions(session);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [filterType, setFilterType] = useState('all'); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // NOUVEAU : Pagination (Load More) pour les évènements futurs
  const [visibleFutureCount, setVisibleFutureCount] = useState(3);

  // Formulaire Coach
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('training');
  const [newRoster, setNewRoster] = useState('Tous'); 
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newEndTime, setNewEndTime] = useState(''); 

  // Assignation manuelle
  const [profiles, setProfiles] = useState([]);
  const [assignedMembers, setAssignedMembers] = useState([]);

  useEffect(() => {
    if (!rolesLoading) {
      fetchEvents();
    }
  }, [rolesLoading, roles]);

  // Réinitialiser la limite d'affichage si on change de filtre
  useEffect(() => {
    setVisibleFutureCount(3);
  }, [filterType]);
    
  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: true });

    if (isStaff || isCoach) {
      const { data: profData } = await supabase.from('profiles').select('id, username, discord_id').order('username', { ascending: true });
      if (profData) setProfiles(profData);
    }

    if (error) {
      console.error("Erreur de récupération des events:", error);
    } else {
      setEvents(data);
    }
    setLoading(false);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newTitle || !newDate || !newTime || !newEndTime) return;

    const start_time = new Date(`${newDate}T${newTime}`).toISOString();
    const end_time = new Date(`${newDate}T${newEndTime}`).toISOString();

    let googleEventId = null;

    try {
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('google-calendar-sync', {
        body: { 
          title: newTitle, 
          start_time: start_time, 
          end_time: end_time 
        }
      });

      if (edgeError) {
        console.error("Erreur d'invocation Edge Function :", edgeError);
        alert("Attention : L'évènement n'a pas pu être synchronisé avec Google Calendar, mais sera tout de même ajouté au site.");
      } else if (edgeData && edgeData.google_event_id) {
        googleEventId = edgeData.google_event_id;
      }
    } catch (err) {
      console.error("Crash réseau Edge Function :", err);
    }

    const { data, error } = await supabase
      .from('events')
      .insert([
        { 
          title: newTitle, 
          event_type: newType, 
          start_time: start_time,
          end_time: end_time,
          roster_type: newRoster,
          assigned_members: assignedMembers,
          google_event_id: googleEventId 
        }
      ])
      .select()
      .single();

    if (!error && data) {
      setEvents(prev => [...prev, data].sort((a,b) => new Date(a.start_time) - new Date(b.start_time)));
      
        if (assignedMembers.length > 0) {
          const personalNotifs = assignedMembers.map(uid => {
            const p = profiles.find(prof => prof.id === uid);
            return {
              user_id: uid,
              discord_id: p?.discord_id || null,
              type: 'personal',
              title: `🗓️ Convocation : ${newTitle}`,
              message: `Tu as été convoqué(e) à un évènement : "**${newType}**".\n**⏰ Heure :** ${newDate} de ${newTime} à ${newEndTime}\n⚠️ _Connecte-toi sur le site pour valider ta présence !_`
            };
          });
          await supabase.from('notifications').insert(personalNotifs);
        }

        await supabase.from('notifications').insert({
          user_id: null,
          target_roster: newRoster, 
          type: 'global', 
          title: `🗓️ Nouvel évènement ajouté : ${newTitle}`,
          message: `Un évènement "**${newType}**" a été planifié pour l'équipe **${newRoster}** ${assignedMembers.length > 0 ? '(+ Convocation ciblée)' : ''} !
**⏰ Heure :** ${newDate} de ${newTime} à ${newEndTime}
⚠️ _Connectez-vous sur le site pour valider votre présence !_`
        });      
      setShowForm(false);
      setNewTitle('');
      setAssignedMembers([]);
    } else {
      console.error("Erreur de création:", error);
    }
  };

  const handleDeleteEvent = async (id) => {
    if(!window.confirm("Supprimer cet évènement définitivement ?")) return;
    
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (!error) {
       fetchEvents();
    }
  };

  const now = new Date();
  
  const accessibleEvents = events.filter(e => {
    if (isStaff || isCoach) return true;
    if (e.assigned_members && Array.isArray(e.assigned_members) && e.assigned_members.includes(session?.user?.id)) return true;
    if (!e.roster_type || e.roster_type === 'Tous') return true;
    return roles.includes(e.roster_type);
  });

  const futureEvents = accessibleEvents.filter(e => new Date(e.end_time) >= now);
  const filteredFutureEvents = futureEvents.filter(e => filterType === 'all' || e.event_type === filterType);
  
  // Limiter le nombre d'évènements futurs affichés
  const displayedFutureEvents = filteredFutureEvents.slice(0, visibleFutureCount);

  const pastEvents = accessibleEvents
    .filter(e => new Date(e.end_time) < now)
    .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

  const filteredPastEvents = pastEvents.filter(e => filterType === 'all' || e.event_type === filterType);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPastEvents = filteredPastEvents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPastEvents.length / itemsPerPage);

  return (
    <>
      <GlobalObjectiveBanner isStaff={isStaff} isCoach={isCoach} />
      
      <div className="w-full max-w-[1200px] mx-auto my-6 md:my-8 px-2 md:px-4 font-poppins text-white animate-fade-in">
      
      <div className="bg-[#1A1C2E]/60 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        {/* ================= HEADER ================= */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4 border-b border-white/10 pb-6">
          <div className="w-full text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-rockSalt text-transparent bg-clip-text bg-gradient-to-r from-[#F0F2F5] to-[#A2D2FF] drop-shadow-md mb-2">
                Calendrier Tactique
              </h2>
              <p className="text-[#A2D2FF] font-techMono text-[10px] md:text-xs uppercase tracking-[0.2em] flex items-center justify-center md:justify-start gap-2">
                <span className="w-2 h-2 rounded-full bg-[#A2D2FF] animate-pulse"></span>
                Opérations Planifiées
              </p>
          </div>
          
          <div className="flex flex-col w-full md:w-auto gap-3 shrink-0">
             <GoogleCalendarButton className="md:hidden w-full" />

             {(isStaff || isCoach) && (
               <button 
                 onClick={() => setShowForm(!showForm)}
                 className={`w-full md:w-auto px-6 py-3 font-rajdhani font-bold text-sm tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 border shrink-0 ${
                   showForm 
                    ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20' 
                    : 'bg-[#B185DB]/10 text-[#B185DB] border-[#B185DB]/30 hover:bg-[#B185DB]/20 hover:shadow-[0_0_20px_rgba(177,133,219,0.3)]'
                 }`}
               >
                 {showForm ? (
                   <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg> FERMER LE PANNEAU</>
                 ) : (
                   <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg> AJOUTER UNE MISSION</>
                 )}
               </button>
             )}
          </div>
        </div>

        {/* ================= FORMULAIRE COACH ================= */}
        {showForm && (isStaff || isCoach) && (
          <form onSubmit={handleCreateEvent} className="bg-[#0D0E15]/80 backdrop-blur-md border border-[#A2D2FF]/30 p-5 md:p-8 rounded-[1.5rem] md:rounded-3xl shadow-[0_0_30px_rgba(162,210,255,0.1)] mb-8 md:mb-10 relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 right-0 w-40 h-40 md:w-64 md:h-64 bg-[#A2D2FF]/5 blur-[60px] rounded-full pointer-events-none"></div>
            
            <h3 className="font-rajdhani text-xl md:text-2xl text-[#A2D2FF] mb-5 md:mb-6 flex items-center gap-3 relative z-10">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              PLANIFICATION DE L'ÉVÉNEMENT
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-5 md:mb-6 relative z-10">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest pl-1">Intitulé de la session</label>
                <input 
                  type="text" placeholder="Ex: Pracc vs Team X" required
                  value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  className="p-3 md:p-3.5 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl text-white text-sm focus:border-[#A2D2FF] outline-none transition-colors w-full"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest pl-1">Catégorie</label>
                <select 
                  value={newType} onChange={e => setNewType(e.target.value)}
                  className="p-3 md:p-3.5 bg-[#1A1C2E] border border-white/10 hover:border-white/20 rounded-xl text-white text-sm focus:border-[#A2D2FF] outline-none transition-colors appearance-none cursor-pointer w-full"
                >
                  <option value="training">Entraînement</option>
                  <option value="match">Match Officiel / Scrim</option>
                  <option value="tournament">Tournoi / Qualif</option>
                  <option value="meeting">Réunion Tactique</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest pl-1">Roster Cible</label>
                <select 
                  value={newRoster} onChange={e => setNewRoster(e.target.value)}
                  className="p-3 md:p-3.5 bg-[#1A1C2E] border border-white/10 hover:border-white/20 rounded-xl text-white text-sm focus:border-[#A2D2FF] outline-none transition-colors appearance-none cursor-pointer w-full"
                >
                  <option value="Tous">Tous les Rosters (Global)</option>
                  <option value="High Roster">High Roster</option>
                  <option value="Academy">Academy</option>
                  <option value="Chill">Chill</option>
                  <option value="Tryhard">Tryhard</option>
                </select>
              </div>
            </div>

            <div className="mb-5 md:mb-6 p-4 md:p-5 bg-white/[0.02] rounded-2xl border border-white/5 relative z-10">
              <p className="text-[10px] text-[#B185DB] mb-3 font-techMono uppercase tracking-widest flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                Assignation Manuelle (DM Discord)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 max-h-48 md:max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {profiles.map(p => (
                  <label key={p.id} className="flex items-center gap-3 cursor-pointer group bg-black/20 p-2 md:p-2.5 rounded-lg border border-transparent hover:border-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={assignedMembers.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) setAssignedMembers(prev => [...prev, p.id]);
                        else setAssignedMembers(prev => prev.filter(id => id !== p.id));
                      }}
                      className="w-4 h-4 accent-[#B185DB] bg-black/50 border-white/20 rounded cursor-pointer shrink-0"
                    />
                    <span className="text-sm font-rajdhani text-gray-400 group-hover:text-white transition-colors truncate">{p.username}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-6 md:mb-8 relative z-10">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest pl-1">Date</label>
                <input 
                  type="date" required value={newDate} onChange={e => setNewDate(e.target.value)} 
                  className="p-3 md:p-3.5 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl text-white text-sm focus:border-[#A2D2FF] outline-none transition-colors w-full [color-scheme:dark]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest pl-1">Début (Heure)</label>
                <input 
                  type="time" required value={newTime} onChange={e => setNewTime(e.target.value)} 
                  className="p-3 md:p-3.5 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl text-white text-sm focus:border-[#A2D2FF] outline-none transition-colors w-full [color-scheme:dark]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest pl-1">Fin (Heure)</label>
                <input 
                  type="time" required value={newEndTime} onChange={e => setNewEndTime(e.target.value)} 
                  className="p-3 md:p-3.5 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl text-white text-sm focus:border-[#A2D2FF] outline-none transition-colors w-full [color-scheme:dark]"
                />
              </div>
            </div>

            <button type="submit" className="w-full py-3 md:py-4 bg-gradient-to-r from-[#A2D2FF] to-[#B185DB] text-[#1A1C2E] font-rajdhani font-extrabold text-lg md:text-xl tracking-widest rounded-xl hover:scale-[1.01] transition-all shadow-[0_0_20px_rgba(162,210,255,0.4)] relative z-10 flex items-center justify-center gap-2">
              DÉPLOYER LA MISSION
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </button>
          </form>
        )}

        {/* ================= FILTRES DE VUE ET BOUTON GOOGLE (DESKTOP) ================= */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-4 w-full">
          <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 md:pb-4 custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0 flex-1 w-full md:w-auto">
            <button 
              onClick={() => setFilterType('all')}
              className={`px-4 md:px-6 py-2 md:py-2.5 font-rajdhani font-bold text-xs md:text-sm tracking-widest rounded-xl transition-all whitespace-nowrap border shrink-0 ${
                filterType === 'all' 
                  ? 'bg-white/10 text-white border-white/30 shadow-inner' 
                  : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              TOUT
            </button>
            <button 
              onClick={() => setFilterType('training')}
              className={`px-4 md:px-6 py-2 md:py-2.5 font-rajdhani font-bold text-xs md:text-sm tracking-widest rounded-xl transition-all whitespace-nowrap border shrink-0 ${
                filterType === 'training' 
                  ? 'bg-[#B185DB]/20 text-[#B185DB] border-[#B185DB]/50 shadow-[0_0_15px_rgba(177,133,219,0.3)]' 
                  : 'bg-transparent border-white/10 text-gray-500 hover:text-[#B185DB]/70 hover:border-[#B185DB]/30 hover:bg-[#B185DB]/5'
              }`}
            >
              ENTRAÎNEMENTS
            </button>
            <button 
              onClick={() => setFilterType('match')}
              className={`px-4 md:px-6 py-2 md:py-2.5 font-rajdhani font-bold text-xs md:text-sm tracking-widest rounded-xl transition-all whitespace-nowrap border shrink-0 ${
                filterType === 'match' 
                  ? 'bg-[#F7CAD0]/20 text-[#F7CAD0] border-[#F7CAD0]/50 shadow-[0_0_15px_rgba(247,202,208,0.3)]' 
                  : 'bg-transparent border-white/10 text-gray-500 hover:text-[#F7CAD0]/70 hover:border-[#F7CAD0]/30 hover:bg-[#F7CAD0]/5'
              }`}
            >
              MATCHS
            </button>
            <button 
              onClick={() => setFilterType('tournament')}
              className={`px-4 md:px-6 py-2 md:py-2.5 font-rajdhani font-bold text-xs md:text-sm tracking-widest rounded-xl transition-all whitespace-nowrap border shrink-0 ${
                filterType === 'tournament' 
                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]' 
                  : 'bg-transparent border-white/10 text-gray-500 hover:text-yellow-500/70 hover:border-yellow-500/30 hover:bg-yellow-500/5'
              }`}
            >
              TOURNOIS
            </button>
            <button
              onClick={() => setFilterType('meeting')}
              className={`px-4 md:px-6 py-2 md:py-2.5 font-rajdhani font-bold text-xs md:text-sm tracking-widest rounded-xl transition-all whitespace-nowrap border shrink-0 ${
                filterType === 'meeting' 
                  ? 'bg-[#A2D2FF]/20 text-[#A2D2FF] border-[#A2D2FF]/50 shadow-[0_0_15px_rgba(162,210,255,0.3)]' 
                  : 'bg-transparent border-white/10 text-gray-500 hover:text-[#A2D2FF]/70 hover:border-[#A2D2FF]/30 hover:bg-[#A2D2FF]/5'
              }`}
            >
              RÉUNIONS
            </button>
          </div>

          <GoogleCalendarButton className="hidden md:flex shrink-0 mb-4" />
        </div>

        {/* ================= LISTE DES ÉVÉNEMENTS ================= */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 md:py-16 gap-4">
              <div className="w-8 md:w-10 h-10 border-4 border-[#A2D2FF] border-t-transparent rounded-full animate-spin"></div>
              <span className="font-techMono text-[10px] md:text-xs text-[#A2D2FF] uppercase tracking-[0.3em] animate-pulse">Synchronisation...</span>
          </div>
        ) : filteredFutureEvents.length === 0 ? (
          <div className="bg-[#0D0E15]/50 border border-white/5 p-8 md:p-12 rounded-[1.5rem] md:rounded-3xl text-center shadow-inner flex flex-col items-center justify-center">
              <svg className="w-12 h-12 md:w-16 md:h-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <span className="font-rajdhani text-xl md:text-2xl text-gray-400 font-bold tracking-widest">AUCUNE OPÉRATION IMMINENTE</span>
              <p className="font-poppins mt-2 text-xs md:text-sm text-gray-500">Reposez-vous, agent. Le radar est vide.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 md:gap-5">
              {displayedFutureEvents.map((event) => (
                <div key={event.id} className="transition-all hover:-translate-y-1">
                  <EventCard 
                    event={event} 
                    session={session} 
                    isStaff={isStaff} 
                    isCoach={isCoach}
                    onDelete={handleDeleteEvent}
                  />
                </div>
              ))}
            </div>

            {/* BOUTON LOAD MORE (FUTURS) */}
            {filteredFutureEvents.length > visibleFutureCount && (
              <div className="flex justify-center mt-8 animate-fade-in">
                <button
                  onClick={() => setVisibleFutureCount(prev => prev + 3)}
                  className="px-6 py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-[#A2D2FF]/30 rounded-xl text-[#A2D2FF] font-rajdhani font-bold text-sm tracking-widest transition-all shadow-[0_0_10px_rgba(162,210,255,0)] hover:shadow-[0_0_15px_rgba(162,210,255,0.15)] flex items-center gap-3 group"
                >
                  Afficher Plus
                  <svg className="w-4 h-4 transform group-hover:translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
              </div>
            )}
          </>
        )}

        {/* ================= ARCHIVES (ÉVÈNEMENTS PASSÉS) ================= */}
        {filteredPastEvents.length > 0 && (
          <div className="mt-12 md:mt-16 pt-6 md:pt-8 border-t border-white/10 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1A1C2E] px-4">
               <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>

            <button 
              onClick={() => setShowPastEvents(!showPastEvents)}
              className="w-full py-3 md:py-4 flex items-center justify-center gap-2 md:gap-3 text-gray-400 hover:text-white font-rajdhani font-bold text-base md:text-lg tracking-widest bg-white/[0.02] hover:bg-white/5 rounded-xl md:rounded-2xl border border-white/5 transition-colors"
            >
              {showPastEvents ? 'MASQUER LES ARCHIVES' : `CONSULTER LES ARCHIVES (${filteredPastEvents.length})`}
              <svg className={`w-4 h-4 md:w-5 md:h-5 transition-transform ${showPastEvents ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            
            {showPastEvents && (
              <div className="mt-6 md:mt-8 flex flex-col gap-5 md:gap-6 animate-fade-in">
                
                <div className="flex flex-col gap-4 md:gap-5 opacity-80 hover:opacity-100 transition-opacity duration-500">
                  {currentPastEvents.map((event) => (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                      session={session} 
                      isStaff={isStaff} 
                      isCoach={isCoach}
                      onDelete={handleDeleteEvent}
                    />
                  ))}
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="flex flex-col items-center gap-2 md:gap-3 mt-6 md:mt-8">
                    <div className="flex items-center justify-center gap-2 md:gap-3 font-techMono text-sm w-full overflow-x-auto pb-2 custom-scrollbar">
                      <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="px-3 md:px-4 py-2 border border-white/10 bg-white/5 rounded-xl disabled:opacity-30 hover:bg-white/10 hover:border-[#A2D2FF]/50 transition-all text-gray-300 hover:text-white flex items-center gap-1 shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                      </button>
                      
                      <div className="flex flex-wrap justify-center gap-1 md:gap-2 bg-black/20 p-1 md:p-1.5 rounded-xl border border-white/5 shrink-0">
                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`w-8 h-8 md:w-10 md:h-10 rounded-lg font-bold transition-all text-xs md:text-sm ${
                              currentPage === i + 1 
                                ? 'bg-gradient-to-br from-[#A2D2FF] to-[#B185DB] text-[#1A1C2E] shadow-[0_0_15px_rgba(162,210,255,0.4)]' 
                                : 'text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>

                      <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="px-3 md:px-4 py-2 border border-white/10 bg-white/5 rounded-xl disabled:opacity-30 hover:bg-white/10 hover:border-[#A2D2FF]/50 transition-all text-gray-300 hover:text-white flex items-center gap-1 shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7-7"></path></svg>
                      </button>
                    </div>
                    <span className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest">
                      Page {currentPage} sur {totalPages}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
      </div>
    </>
  );
}