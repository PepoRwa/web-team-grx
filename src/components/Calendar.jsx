import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { usePermissions } from '../hooks/usePermissions';

// Import du EventCard
import EventCard from './EventCard';

export default function Calendar({ session }) {
  const { isStaff, isCoach } = usePermissions(session);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // NOUVEAU : État pour le filtre

  // Formulaire Coach
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('training');
  const [newRoster, setNewRoster] = useState('Tous'); // NOUVEAU: Type de roster
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newEndTime, setNewEndTime] = useState(''); // NOUVEAU

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: true })
      .gte('start_time', new Date().toISOString()); // On ne récupère que les events à venir

    if (error) {
      console.error("Erreur de récupération des événements:", error);
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
          roster_type: newRoster
        }
      ])
      .select()
      .single();

    if (!error && data) {
      setEvents(prev => [...prev, data].sort((a,b) => new Date(a.start_time) - new Date(b.start_time)));
      
      // Envoi d'une notification globale (user_id IS NULL)
      await supabase.from('notifications').insert({
        user_id: null,
        type: 'event',
        title: `Nouvel évènement : ${newTitle} [${newRoster}]`,
        message: `Un évènement (${newType}) a été planifié le ${newDate} à ${newTime}. N'oublie pas de signifier ta présence !`
      });

      setShowForm(false);
    } else {
      console.error("Erreur de création:", error);
    }
  };

  const handleDeleteEvent = async (id) => {
    if(!window.confirm("Supprimer définitivement cet événement ?")) return;

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
       console.error("Erreur suppression:", error);
    } else {
       fetchEvents();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-8 bg-black/40 border border-gowrax-purple/30 backdrop-blur-md rounded-xl p-6 shadow-[0_0_20px_rgba(111,45,189,0.2)]">
      
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
      <div className="flex flex-wrap gap-2 mb-6">
        <button 
          onClick={() => setFilterType('all')} 
          className={`px-3 py-1 text-xs font-techMono uppercase rounded border ${filterType === 'all' ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-gray-600 hover:text-white'}`}
        >
          Tous
        </button>
        <button 
          onClick={() => setFilterType('training')} 
          className={`px-3 py-1 text-xs font-techMono uppercase rounded border ${filterType === 'training' ? 'bg-gowrax-purple text-white border-gowrax-purple' : 'bg-transparent text-gowrax-purple border-gowrax-purple hover:bg-gowrax-purple/20'}`}
        >
          Entraînements
        </button>
        <button 
          onClick={() => setFilterType('match')} 
          className={`px-3 py-1 text-xs font-techMono uppercase rounded border ${filterType === 'match' ? 'bg-gowrax-neon text-white border-gowrax-neon' : 'bg-transparent text-gowrax-neon border-gowrax-neon hover:bg-gowrax-neon/20'}`}
        >
          Matchs
        </button>
        <button 
          onClick={() => setFilterType('tournament')} 
          className={`px-3 py-1 text-xs font-techMono uppercase rounded border ${filterType === 'tournament' ? 'bg-yellow-600 text-black border-yellow-500' : 'bg-transparent text-yellow-500 border-yellow-600 hover:bg-yellow-600/20'}`}
        >
          Tournois
        </button>
        <button 
          onClick={() => setFilterType('meeting')} 
          className={`px-3 py-1 text-xs font-techMono uppercase rounded border ${filterType === 'meeting' ? 'bg-gray-700 text-white border-gray-500' : 'bg-transparent text-gray-400 border-gray-600 hover:bg-gray-700/50'}`}
        >
          Réunions
        </button>
      </div>

      {/* LISTE DES ÉVÉNEMENTS */}
      {loading ? (
        <div className="flex justify-center p-8">
            <span className="text-gowrax-purple font-techMono animate-pulse uppercase">Fetching coordinates...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center p-8 bg-white/5 rounded border border-white/10">
            <p className="text-gray-400 font-poppins">Aucune opération planifiée dans la base de données.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {events.filter(e => filterType === 'all' || e.event_type === filterType).length === 0 ? (
             <div className="text-center p-8 bg-white/5 rounded border border-white/10">
                 <p className="text-gray-400 font-poppins">Aucune opération pour ce filtre.</p>
             </div>
          ) : (
            events
              .filter(e => filterType === 'all' || e.event_type === filterType)
              .map((event) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  session={session} 
                  isStaff={isStaff} 
                  isCoach={isCoach} 
                  onDelete={handleDeleteEvent} 
                />
              ))
          )}
        </div>
      )}

    </div>
  );
}
