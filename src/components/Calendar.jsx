import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { usePermissions } from '../hooks/usePermissions';

// Import du EventCard
import EventCard from './EventCard';
import GlobalObjectiveBanner from './GlobalObjectiveBanner';

export default function Calendar({ session }) {
  const { roles, loading: rolesLoading, isStaff, isCoach } = usePermissions(session);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [filterType, setFilterType] = useState('all'); // NOUVEAU : État pour le filtre
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Formulaire Coach
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('training');
  const [newRoster, setNewRoster] = useState('Tous'); // NOUVEAU: Type de roster
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newEndTime, setNewEndTime] = useState(''); // NOUVEAU

  // Assignation manuelle
  const [profiles, setProfiles] = useState([]);
  const [assignedMembers, setAssignedMembers] = useState([]);

  useEffect(() => {
    if (!rolesLoading) {
      fetchEvents();
    }
  }, [rolesLoading, roles]);

    
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

    // Combine date et heure format HTML5 vers ISO
    const start_time = new Date(`${newDate}T${newTime}`).toISOString();
    const end_time = new Date(`${newDate}T${newEndTime}`).toISOString();

    const { data, error } = await supabase
      .from('events')
      .insert([
        { 
          title: newTitle, 
          event_type: newType, 
          start_time: start_time,
          end_time: end_time,
          roster_type: newRoster,
          assigned_members: assignedMembers
        }
      ])
      .select()
      .single();

    if (!error && data) {
      setEvents(prev => [...prev, data].sort((a,b) => new Date(a.start_time) - new Date(b.start_time)));
      
        // Si des membres ont été ciblés spécifiquement on insère des convocs persos
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

        // Envoi d'une notification globale ciblée
        await supabase.from('notifications').insert({
          user_id: null,
          target_roster: newRoster, 
          type: 'global', // Modifié en 'global' pour que le bot le détecte
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
  
  // NOUVEAU: Filtrage des événements en fonction des rôles du membre
  const accessibleEvents = events.filter(e => {
    // Les membres du staff et les coachs voient tout
    if (isStaff || isCoach) return true;
    
    // Si expressément assigné
    if (e.assigned_members && Array.isArray(e.assigned_members) && e.assigned_members.includes(session?.user?.id)) return true;

    // Les évènements mis sur "Tous" sont visibles par tous les membres
    if (!e.roster_type || e.roster_type === 'Tous') return true;

    // Sinon, on vérifie si l'utilisateur possède le rôle précis (ex: 'High Roster', 'Academy', etc.)
    return roles.includes(e.roster_type);
  });

  // Séparer les events futurs et passés
  const futureEvents = accessibleEvents.filter(e => new Date(e.end_time) >= now);
  const filteredFutureEvents = futureEvents.filter(e => filterType === 'all' || e.event_type === filterType);

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
      
      <div className="w-full max-w-5xl mx-auto my-8 font-poppins text-white">
      
      <div className="flex justify-between items-center mb-6 border-b border-gowrax-purple/50 pb-4">
        <div>
            <h2 className="text-3xl font-rajdhani text-white drop-shadow-[0_2px_4px_rgba(111,45,189,0.8)]">CALENDRIER TACTIQUE</h2>
            <p className="text-gowrax-neon font-techMono text-xs uppercase tracking-widest mt-1">Opérations à venir</p>
        </div>
        
        {/* Le bouton d'ajout n'apparaît que pour le Staff ou les Coachs */}
        {(isStaff || isCoach) && (
           <button 
             onClick={() => setShowForm(!showForm)}
             className={`px-4 py-2 font-rajdhani font-bold rounded border ${showForm ? 'bg-red-500/20 text-red-500 border-red-500' : 'bg-gowrax-purple/20 text-gowrax-neon border-gowrax-neon hover:bg-gowrax-neon hover:text-white'} transition-all`}
           >
             {showForm ? 'FERMER PANEL COACH' : 'AJOUTER MISSION'}
           </button>
        )}
      </div>

      {/* FORMULAIRE DE CRÉATION D'ÉVÉNEMENT (COACH ONLY) */}
      {showForm && (isStaff || isCoach) && (
        <form onSubmit={handleCreateEvent} className="bg-gowrax-void/60 border border-gowrax-purple p-6 rounded-lg shadow-lg mb-8">
          <h3 className="font-rajdhani text-2xl text-gowrax-neon mb-4 border-b border-gowrax-purple pb-2">PLANIFIER UN ÉVÉNEMENT</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input 
              type="text" placeholder="Titre de la session..." required
              value={newTitle} onChange={e => setNewTitle(e.target.value)}
              className="p-2 bg-black border border-gray-600 rounded text-white"
            />
            <select 
              value={newType} onChange={e => setNewType(e.target.value)}
              className="p-2 bg-black border border-gray-600 rounded text-white"
            >
              <option value="training">Entraînement</option>
              <option value="match">Match Officiel</option>
              <option value="tournament">Tournoi / Qualif</option>
              <option value="meeting">Réunion Tactique</option>
            </select>
            <select 
              value={newRoster} onChange={e => setNewRoster(e.target.value)}
              className="p-2 bg-black border border-gray-600 rounded text-white"
            >
              <option value="Tous">Tous les Rosters</option>
              <option value="High Roster">High Roster</option>
              <option value="Academy">Academy</option>
              <option value="Chill">Chill</option>
              <option value="Tryhard">Tryhard</option>
            </select>
          </div>

          {/* SÉLECTION DES MEMBRES SPÉCIFIQUES (Optionnel) */}
          <div className="mt-2 mb-4 p-3 bg-black/40 rounded border border-gray-600">
            <p className="text-xs text-gray-400 mb-2 font-techMono uppercase tracking-widest">Assigner des joueurs spécifiques (Envoie un DM Discord)</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
              {profiles.map(p => (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={assignedMembers.includes(p.id)}
                    onChange={(e) => {
                      if (e.target.checked) setAssignedMembers(prev => [...prev, p.id]);
                      else setAssignedMembers(prev => prev.filter(id => id !== p.id));
                    }}
                    className="accent-gowrax-purple bg-black border-gray-600 rounded"
                  />
                  <span className="text-sm font-rajdhani text-gray-300 group-hover:text-white transition-colors truncate">{p.username}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex flex-col">
              <label className="text-xs text-gray-400 mb-1">Date</label>
              <input 
                type="date" required value={newDate} onChange={e => setNewDate(e.target.value)} 
                className="p-2 bg-black border border-gray-600 rounded text-white [color-scheme:dark]"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-gray-400 mb-1">Heure de début</label>
              <input 
                type="time" required value={newTime} onChange={e => setNewTime(e.target.value)} 
                className="p-2 bg-black border border-gray-600 rounded text-white [color-scheme:dark]"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-gray-400 mb-1">Heure de fin</label>
              <input 
                type="time" required value={newEndTime} onChange={e => setNewEndTime(e.target.value)} 
                className="p-2 bg-black border border-gray-600 rounded text-white [color-scheme:dark]"
              />
            </div>
          </div>

          <button type="submit" className="w-full py-3 bg-gowrax-neon text-white font-rajdhani font-bold text-lg rounded hover:bg-gowrax-purple transition-colors shadow-[0_0_10px_rgba(214,47,127,0.5)] mt-4">
            DÉPLOYER L'ÉVÉNEMENT
          </button>
        </form>
      )}

      {/* FILTRES EN HAUT DE LISTE */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2 custom-scrollbar">
        <button 
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 font-rajdhani rounded-full transition-all ${filterType === 'all' ? 'bg-gowrax-neon text-white shadow-[0_0_10px_rgba(255,107,0,0.8)]' : 'bg-gowrax-void border border-gowrax-purple text-gray-400 hover:text-white'}`}
        >
          TOUS
        </button>
        <button 
          onClick={() => setFilterType('training')}
          className={`px-4 py-2 font-rajdhani rounded-full transition-all ${filterType === 'training' ? 'bg-gowrax-purple text-white shadow-[0_0_10px_rgba(111,45,189,0.8)]' : 'bg-gowrax-void border border-gowrax-purple text-gray-400 hover:text-white'}`}
        >
          ENTRAÎNEMENTS
        </button>
        <button 
          onClick={() => setFilterType('match')}
          className={`px-4 py-2 font-rajdhani rounded-full transition-all ${filterType === 'match' ? 'bg-gowrax-neon text-white shadow-[0_0_10px_rgba(214,47,127,0.8)]' : 'bg-gowrax-void border border-gowrax-purple text-gray-400 hover:text-white'}`}
        >
          MATCHS
        </button>
        <button 
          onClick={() => setFilterType('tournament')}
          className={`px-4 py-2 font-rajdhani rounded-full transition-all ${filterType === 'tournament' ? 'bg-yellow-600 text-black shadow-[0_0_10px_rgba(202,138,4,0.8)]' : 'bg-gowrax-void border border-gowrax-purple text-gray-400 hover:text-white'}`}
        >
          TOURNOIS
        </button>
        <button
          onClick={() => setFilterType('meeting')}
          className={`px-4 py-2 font-rajdhani rounded-full transition-all ${filterType === 'meeting' ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(66,153,225,0.8)]' : 'bg-gowrax-void border border-gowrax-purple text-gray-400 hover:text-white'}`}
        >
          RÉUNIONS
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 font-techMono text-gowrax-neon animate-pulse">
            [ SCAN_SATELLITE_EN_COURS... ]
        </div>
      ) : filteredFutureEvents.length === 0 ? (
        <div className="bg-gowrax-void/60 border border-gowrax-purple/30 p-10 rounded-xl text-center shadow-lg">
            <span className="font-rajdhani text-2xl text-gray-500">AUCUN ÉVÈNEMENT PROGRAMMÉ</span>
            <p className="font-techMono mt-2 text-xs text-gray-600">Le radar est vide pour le moment.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredFutureEvents.map((event) => (
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
      )}

      {/* SECTION ÉVÈNEMENTS PASSÉS */}
      {/* SECTION ÉVÈNEMENTS PASSÉS AVEC PAGINATION */}
        {filteredPastEvents.length > 0 && (
          <div className="mt-12 border-t border-gowrax-purple/30 pt-6">
            <button 
              onClick={() => setShowPastEvents(!showPastEvents)}
              className="w-full py-3 flex items-center justify-center gap-2 text-gray-400 hover:text-white font-rajdhani text-lg bg-gowrax-void/40 hover:bg-gowrax-void/80 rounded border border-gray-800 transition-colors"
            >
              {showPastEvents ? '▼ MASQUER LES ARCHIVES' : `▶ VOIR LES ARCHIVES (${filteredPastEvents.length})`}
            </button>
            
            {showPastEvents && (
              <div className="mt-6 flex flex-col gap-4 animate-fade-in">
                {/* Liste des 3 événements de la page actuelle */}
                <div className="flex flex-col gap-4 opacity-75 grayscale hover:grayscale-0 transition-all duration-500">
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

                {/* CONTRÔLES DE PAGINATION (Numéros de page) */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-6 font-techMono text-sm">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      className="p-2 border border-gowrax-purple/50 rounded disabled:opacity-30 hover:bg-gowrax-purple/20 transition-all"
                    >
                      &lt; PRÉCÉDENT
                    </button>
                    
                    <div className="flex gap-2">
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-8 h-8 rounded border ${currentPage === i + 1 ? 'bg-gowrax-neon border-gowrax-neon text-white shadow-[0_0_10px_rgba(214,47,127,0.5)]' : 'border-gowrax-purple/50 text-gray-400 hover:text-white'}`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    <button 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className="p-2 border border-gowrax-purple/50 rounded disabled:opacity-30 hover:bg-gowrax-purple/20 transition-all"
                    >
                      SUIVANT &gt;
                    </button>
                  </div>
                )}
                
                <p className="text-center text-[10px] text-gray-600 font-techMono mt-2 uppercase">
                  Page {currentPage} sur {totalPages} — Total archives : {filteredPastEvents.length}
                </p>
              </div>
            )}
          </div>
        )}
    </div>
    </>
  );
}
