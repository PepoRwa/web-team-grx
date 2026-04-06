import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function EventCard({ event, session, isStaff, isCoach, onDelete }) {
  const [checkin, setCheckin] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // États du menu de check-in
  const [showMenu, setShowMenu] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NOUVEAU: États pour le Panel Coach (Roll-call)
  const [showRollCall, setShowRollCall] = useState(false);
  const [rollCallData, setRollCallData] = useState([]);
  const [loadingRollCall, setLoadingRollCall] = useState(false);

  useEffect(() => {
    fetchMyCheckin();
  }, [event.id]);

  const fetchMyCheckin = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('checkins')
      .select('*')
      .eq('event_id', event.id)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (!error && data) {
      setCheckin(data);
      setSelectedStatus(data.status);
      setNote(data.note || '');
    }
    setLoading(false);
  };

  const handleCheckinSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStatus) return;
    
    // Empêcher la soumission si retard/absent mais pas de note
    if ((selectedStatus === 'late' || selectedStatus === 'absent') && !note.trim()) {
      alert("Une justification est requise pour une absence ou un retard.");
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await supabase
      .from('checkins')
      .upsert({
        event_id: event.id,
        user_id: session.user.id,
        status: selectedStatus,
        note: note.trim() || null
      }, { onConflict: 'event_id, user_id' })
      .select()
      .single();

    if (!error && data) {
      setCheckin(data);
      setShowMenu(false);
    } else {
      console.error("Erreur lors du check-in:", error);
      alert("Erreur réseau. Impossible d'enregistrer la présence.");
    }
    setIsSubmitting(false);
  };

  // NOUVEAU: Fetcher tous les check-ins d'un évènement avec le profil associé
  const fetchRollCall = async () => {
    setLoadingRollCall(true);
    const { data, error } = await supabase
      .from('checkins')
      .select(`
        *,
        profiles (
          username,
          avatar_url,
          discord_id
        )
      `)
      .eq('event_id', event.id);

    if (!error && data) {
      setRollCallData(data);
    } else {
      console.error("Erreur RollCall :", error);
    }
    setLoadingRollCall(false);
  };

  // NOUVEAU: Forcer le statut d'un joueur en tant que coach
  const handleForceStatus = async (userId, newStatus) => {
    const { data, error } = await supabase
      .from('checkins')
      .upsert({
        event_id: event.id,
        user_id: userId,
        status: newStatus,
        marked_by_coach: true
      }, { onConflict: 'event_id, user_id' })
      .select(`
        *,
        profiles (
          username,
          avatar_url,
          discord_id
        )
      `)
      .single();

    if (!error && data) {
      // Mettre à jour l'entrée locale sans re-fetch tout
      setRollCallData(prev => prev.map(c => c.user_id === userId ? data : c));
      
      // Notifier le joueur que le staff a modifié sa présence
      await supabase.from('notifications').insert({
        user_id: userId,
        target_discord_id: data.profiles.discord_id,
        type: 'alerte',
        title: 'Check-in Modifié par le Staff',
        message: `Ton statut pour l'évènement [${event.title}] a été forcé sur "${newStatus}" par le Coach.`
      });
    }
  };

  // NOUVEAU: Toggle de l'interface coach
  const toggleRollCall = () => {
    if (!showRollCall) {
      fetchRollCall();
    }
    setShowRollCall(!showRollCall);
  };

  const getTypeBadge = (type) => {
    const types = {
        'training': 'bg-gowrax-purple text-white border-gowrax-purple',
        'match': 'bg-gowrax-neon text-white border-gowrax-neon',
        'meeting': 'bg-gray-700 text-white border-gray-500',
        'tournament': 'bg-yellow-600 text-black border-yellow-500'
    };
    return types[type] || types['meeting'];
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'present': return 'text-green-400 border-green-500/50 bg-green-500/10 hover:bg-green-500 hover:text-white';
      case 'late': return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500 hover:text-white';
      case 'absent': return 'text-red-400 border-red-500/50 bg-red-500/10 hover:bg-red-500 hover:text-white';
      case 'pending': 
      default: return 'text-gray-400 border-gray-500/50 hover:bg-gray-500 hover:text-white';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'present': return 'PRÉSENT';
      case 'late': return 'EN RETARD';
      case 'absent': return 'ABSENT';
      case 'pending': 
      default: return 'CHECK-IN';
    }
  };

  const dateObj = new Date(event.start_time);
  const isPastEvent = dateObj < new Date();
  
  // Validation : le joueur peut-il modifier son check-in ?
  const isLockedByCoach = checkin?.marked_by_coach;
  const canInteract = !isPastEvent && !isLockedByCoach;

  return (
    <div className={`relative group bg-gowrax-void/80 border ${isPastEvent ? 'border-gray-800' : 'border-gowrax-purple/50'} rounded-lg p-5 flex flex-col ${!isPastEvent ? 'hover:border-gowrax-neon shadow-[0_4px_10px_rgba(0,0,0,0.5)]' : 'shadow-none opacity-80'} transition-all`}>
      {/* Ligne lumineuse à gauche décorative */}
      {!isPastEvent && (
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-gowrax-purple group-hover:bg-gowrax-neon transition-colors shadow-[0_0_10px_rgba(111,45,189,0.8)]"></div>
      )}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-2">
        <div className="flex-1 pl-2">
            <div className="flex items-center gap-3 mb-1">
                <span className={`text-[10px] font-techMono uppercase px-2 py-0.5 rounded border ${getTypeBadge(event.event_type)}`}>
                    {event.event_type}
                </span>
                
                {/* Badge Roster */}
                {event.roster_type && event.roster_type !== 'Tous' && (
                    <span className="text-[10px] font-techMono uppercase px-2 py-0.5 rounded border bg-blue-900/30 text-blue-300 border-blue-500/50">
                        {event.roster_type}
                    </span>
                )}
                
                <h3 className="font-rajdhani text-2xl font-bold text-white tracking-widest leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{event.title}</h3>
            </div>
            <p className="text-gray-400 font-techMono text-sm">
                📅 {dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} &nbsp;|&nbsp; 
                🕒 {dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
        </div>

        <div className="flex w-full md:w-auto items-center justify-end gap-3 z-10">
            {(isStaff || isCoach) && (
              <button 
                onClick={toggleRollCall}
                className={`px-4 py-2 border font-techMono text-xs rounded transition-all ${showRollCall ? 'bg-gowrax-neon text-white border-gowrax-neon' : 'text-gowrax-neon border-gowrax-neon/50 hover:bg-gowrax-neon hover:text-white'}`}
              >
                {showRollCall ? 'FERMER APPEL' : 'VOIR APPEL'}
              </button>
            )}

            {loading ? (
              <span className="text-xs font-techMono text-gray-500">Scan...</span>
            ) : (
              <button 
                onClick={() => canInteract && setShowMenu(!showMenu)}
                disabled={!canInteract}
                className={`flex flex-col items-center justify-center px-6 py-1 border-2 font-rajdhani font-bold rounded transition-all 
                  ${canInteract ? getStatusColor(checkin?.status) : `${getStatusColor(checkin?.status)} opacity-50 cursor-not-allowed hover:bg-transparent hover:text-current`}`}
              >
                 <span className={`${!canInteract ? 'opacity-70' : ''}`}>{getStatusText(checkin?.status)}</span>
                 {!canInteract && (
                     <span className="text-[8px] font-techMono uppercase tracking-widest text-current mt-0.5">
                         {isLockedByCoach ? 'VERROUILLÉ STAFF' : 'ARCHIVÉ'}
                     </span>
                 )}
              </button>
            )}

            {/* Bouton Delete pour Staff/Coach */}
            {(isStaff || isCoach) && (
                <button onClick={() => onDelete(event.id)} title="Supprimer cet événement" className="p-2 border-2 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors font-techMono bg-black/40">
                    X
                </button>
            )}
        </div>
      </div>

      {/* DROPDOWN MENU / FORMULAIRE DE CHECK-IN */}
      {showMenu && canInteract && (
        <div className="mt-4 pt-4 border-t border-white/10 pl-2">
          <form className="flex flex-col gap-3" onSubmit={handleCheckinSubmit}>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSelectedStatus('present')} className={`flex-1 py-2 text-sm font-rajdhani font-bold rounded border ${selectedStatus === 'present' ? 'bg-green-500 text-white border-green-500' : 'bg-transparent text-green-400 border-green-500 text-opacity-50'} hover:bg-green-500/20`}>PRÉSENT</button>
              <button type="button" onClick={() => setSelectedStatus('late')} className={`flex-1 py-2 text-sm font-rajdhani font-bold rounded border ${selectedStatus === 'late' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-transparent text-yellow-400 border-yellow-500 text-opacity-50'} hover:bg-yellow-500/20`}>RETARD</button>
              <button type="button" onClick={() => setSelectedStatus('absent')} className={`flex-1 py-2 text-sm font-rajdhani font-bold rounded border ${selectedStatus === 'absent' ? 'bg-red-500 text-white border-red-500' : 'bg-transparent text-red-400 border-red-500 text-opacity-50'} hover:bg-red-500/20`}>ABSENT</button>
            </div>

            {(selectedStatus === 'late' || selectedStatus === 'absent') && (
              <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Raison / Justification (Obligatoire)..."
                className="w-full bg-black/50 border border-gray-600 rounded p-2 text-sm text-white font-poppins focus:border-gowrax-neon outline-none resize-none"
                rows="2"
                required
              />
            )}

            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowMenu(false)} className="px-4 py-1 text-xs font-techMono text-gray-400 hover:text-white">ANNULER</button>
              <button type="submit" disabled={!selectedStatus || isSubmitting} className="px-4 py-1 text-sm font-rajdhani bg-gowrax-purple text-white rounded hover:bg-gowrax-neon disabled:opacity-50 transition-colors">
                {isSubmitting ? 'ENVOI...' : 'CONFIRMER'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NOUVEAU: PANNEAU COACH ROLL-CALL */}
      {showRollCall && (isStaff || isCoach) && (
        <div className="mt-4 pt-4 border-t border-gowrax-purple/50">
          <h4 className="text-white font-rajdhani text-lg mb-4 flex items-center justify-between">
            <span>🔴 REGISTRE DES PRÉSENCES (COACH)</span>
            <button onClick={fetchRollCall} className="text-xs font-techMono text-gowrax-neon hover:text-white transition-colors">
              [ ♻️ ACTUALISER ]
            </button>
          </h4>

          {loadingRollCall ? (
            <div className="text-center py-4 text-gowrax-purple font-techMono text-sm animate-pulse">Chargement des données biométriques...</div>
          ) : rollCallData.length === 0 ? (
            <p className="text-gray-400 font-poppins text-sm italic text-center py-2">Aucun joueur n'a encore signifié sa présence.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {rollCallData.map(c => (
                <div key={c.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 bg-black/40 rounded border border-white/5 hover:border-white/20 transition-colors gap-3">
                  
                  {/* Info Joueur */}
                  <div className="flex items-center gap-3">
                    {c.profiles?.avatar_url ? (
                      <img src={c.profiles.avatar_url} alt="avatar" className="w-8 h-8 rounded-full border border-gowrax-purple/50" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gowrax-purple/20 border border-gowrax-purple flex items-center justify-center text-white font-bold text-xs">?</div>
                    )}
                    <div>
                      <p className="text-white font-rajdhani font-bold text-base">{c.profiles?.username || 'Joueur Inconnu'}</p>
                      {c.note && (
                        <p className="text-gray-400 text-xs italic">"{c.note}"</p>
                      )}
                      {c.marked_by_coach && (
                         <p className="text-gowrax-neon text-[10px] uppercase font-techMono tracking-widest mt-0.5">Forcé par le Staff</p>
                      )}
                    </div>
                  </div>

                  {/* Actions Rapides Coach */}
                  <div className="flex gap-1 w-full md:w-auto">
                    <button onClick={() => handleForceStatus(c.user_id, 'present')} className={`flex-1 md:w-auto px-3 py-1 text-xs rounded border transition-all ${c.status === 'present' ? 'bg-green-500 text-white border-green-500' : 'text-green-500 border-green-500/30 hover:bg-green-500/20'}`}>PRÉSENT</button>
                    <button onClick={() => handleForceStatus(c.user_id, 'late')} className={`flex-1 md:w-auto px-3 py-1 text-xs rounded border transition-all ${c.status === 'late' ? 'bg-yellow-500 text-white border-yellow-500' : 'text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/20'}`}>RETARD</button>
                    <button onClick={() => handleForceStatus(c.user_id, 'absent')} className={`flex-1 md:w-auto px-3 py-1 text-xs rounded border transition-all ${c.status === 'absent' ? 'bg-red-500 text-white border-red-500' : 'text-red-500 border-red-500/30 hover:bg-red-500/20'}`}>ABSENT</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
