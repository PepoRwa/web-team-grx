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

  // États pour le Panel Coach (Roll-call)
  const [showRollCall, setShowRollCall] = useState(false);
  const [rollCallData, setRollCallData] = useState([]);
  const [loadingRollCall, setLoadingRollCall] = useState(false);
  const [profilesList, setProfilesList] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');

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

    if (checkin?.marked_by_coach) {
      alert("Un coach a verrouillé ta présence/absence définitivement. Tu ne peux plus la modifier.");
      return;
    }
    
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

    if (isStaff || isCoach) {
      const { data: pData } = await supabase.from('profiles').select('id, username').order('username', { ascending: true });
      if (pData) setProfilesList(pData);
    }

    setLoadingRollCall(false);
  };

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
      setRollCallData(prev => prev.map(c => c.user_id === userId ? data : c));
      
      await supabase.from('notifications').insert({
        user_id: userId,
        discord_id: data.profiles?.discord_id || null,
        type: 'personal',
        title: '🔒 Présence Forcée par le Staff',
        message: `Ton statut pour l'évènement [${event.title}] a été forcé sur **${newStatus}** par l'administration/coach.\n⚠️ Tu ne peux plus le modifier.`
      });
    } else if (!data) {
       fetchRollCall();
    }
  };

  const toggleRollCall = () => {
    if (!showRollCall) {
      fetchRollCall();
    }
    setShowRollCall(!showRollCall);
  };

  // --- ADAPTATION DES COULEURS PREMIUM ---
  const getTypeBadge = (type) => {
    const types = {
        'training': 'bg-[#B185DB]/10 text-[#B185DB] border-[#B185DB]/30',
        'match': 'bg-[#F7CAD0]/10 text-[#F7CAD0] border-[#F7CAD0]/30',
        'meeting': 'bg-[#A2D2FF]/10 text-[#A2D2FF] border-[#A2D2FF]/30',
        'tournament': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
    };
    return types[type] || types['meeting'];
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'present': return 'text-green-400 border-green-500/30 bg-green-500/10 hover:bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.15)]';
      case 'late': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.15)]';
      case 'absent': return 'text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]';
      case 'pending': 
      default: return 'text-[#A2D2FF] border-[#A2D2FF]/30 bg-[#A2D2FF]/5 hover:bg-[#A2D2FF]/10';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'present': return 'PRÉSENT';
      case 'late': return 'EN RETARD';
      case 'absent': return 'ABSENT';
      case 'pending': 
      default: return 'S\'IDENTIFIER';
    }
  };

  const dateObj = new Date(event.start_time);
  const isPastEvent = dateObj < new Date();
  
  const isLockedByCoach = checkin?.marked_by_coach;
  const canInteract = !isPastEvent && !isLockedByCoach;

  return (
    <div className={`relative group bg-[#0D0E15]/60 backdrop-blur-md border ${isPastEvent ? 'border-white/5 opacity-70' : 'border-white/10 hover:border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)]'} rounded-2xl p-5 md:p-6 flex flex-col transition-all duration-300`}>
      
      {/* Ligne décorative en dégradé à gauche */}
      {!isPastEvent && (
          <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl bg-gradient-to-b from-[#A2D2FF] via-[#B185DB] to-[#F7CAD0] opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
      )}
      
      <div className="flex flex-col md:flex-row gap-4 md:gap-5 items-start md:items-center justify-between">
        
        {/* INFOS GAUCHE */}
        <div className="flex-1 pl-2 md:pl-3 w-full">
            <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
                <span className={`text-[9px] md:text-[10px] font-techMono uppercase px-2.5 py-1 rounded-md border ${getTypeBadge(event.event_type)}`}>
                    {event.event_type}
                </span>
                
                {/* Badge Roster Premium */}
                {event.roster_type && event.roster_type !== 'Tous' && (
                    <span className="text-[9px] md:text-[10px] font-techMono uppercase px-2.5 py-1 rounded-md border bg-white/5 text-gray-300 border-white/10">
                        Cible : {event.roster_type}
                    </span>
                )}
            </div>
            <h3 className="font-rajdhani text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-widest leading-tight drop-shadow-md mb-2">{event.title}</h3>
            <p className="text-gray-400 font-techMono text-xs md:text-sm flex items-center gap-2">
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#B185DB] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <span className="truncate">{dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                <span className="text-gray-600">|</span> 
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#B185DB] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
        </div>

        {/* ACTIONS DROITE (Responsive) */}
        <div className="flex flex-wrap md:flex-nowrap w-full md:w-auto items-stretch md:items-center justify-between md:justify-end gap-2 md:gap-3 z-10 pt-3 md:pt-0 mt-2 md:mt-0 border-t border-white/5 md:border-transparent">
            {(isStaff || isCoach) && (
              <button 
                onClick={toggleRollCall}
                className={`flex-1 md:flex-none whitespace-nowrap px-3 md:px-5 py-2.5 md:py-2.5 border font-techMono text-[10px] md:text-xs tracking-widest rounded-xl transition-all flex items-center justify-center ${showRollCall ? 'bg-[#A2D2FF] text-[#1A1C2E] font-bold border-[#A2D2FF] shadow-[0_0_15px_rgba(162,210,255,0.4)]' : 'bg-white/5 text-[#A2D2FF] border-[#A2D2FF]/30 hover:bg-[#A2D2FF]/10'}`}
              >
                {showRollCall ? 'FERMER APPEL' : 'VOIR L\'APPEL'}
              </button>
            )}

            {loading ? (
              <div className="flex-1 md:w-28 flex justify-center py-2"><div className="w-5 h-5 border-2 border-[#B185DB] border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
              <button 
                onClick={() => canInteract && setShowMenu(!showMenu)}
                disabled={!canInteract}
                className={`flex-1 md:flex-none flex flex-col items-center justify-center px-4 md:px-8 py-2 md:py-2.5 border font-rajdhani font-bold text-sm md:text-lg tracking-wider rounded-xl transition-all whitespace-nowrap
                  ${canInteract ? getStatusColor(checkin?.status) : `${getStatusColor(checkin?.status)} opacity-60 cursor-not-allowed`}`}
              >
                 <span>{getStatusText(checkin?.status)}</span>
                 {!canInteract && (
                     <span className="text-[8px] md:text-[9px] font-techMono uppercase tracking-widest text-current mt-0.5 opacity-80">
                         {isLockedByCoach ? 'VERROUILLÉ STAFF' : 'ARCHIVÉ'}
                     </span>
                 )}
              </button>
            )}

            {/* Bouton Delete pour Staff/Coach */}
            {(isStaff || isCoach) && (
                <button onClick={() => onDelete(event.id)} title="Supprimer cet événement" className="shrink-0 p-2.5 md:p-3 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-colors bg-white/5 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] flex items-center justify-center">
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            )}
        </div>
      </div>

      {/* ================= MENU DE CHECK-IN JOUEUR ================= */}
      {showMenu && canInteract && (
        <div className="mt-4 md:mt-6 pt-4 md:pt-5 border-t border-white/5 pl-2 md:pl-3 animate-fade-in">
          <form className="flex flex-col gap-3 md:gap-4" onSubmit={handleCheckinSubmit}>
            <div className="flex flex-wrap sm:flex-nowrap gap-2 md:gap-3">
              <button type="button" onClick={() => setSelectedStatus('present')} className={`flex-1 py-2.5 md:py-3 text-xs md:text-sm font-rajdhani font-bold tracking-widest rounded-xl border transition-all ${selectedStatus === 'present' ? 'bg-green-500 text-white border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-green-500/5 text-green-400 border-green-500/30 hover:bg-green-500/10'}`}>PRÉSENT</button>
              <button type="button" onClick={() => setSelectedStatus('late')} className={`flex-1 py-2.5 md:py-3 text-xs md:text-sm font-rajdhani font-bold tracking-widest rounded-xl border transition-all ${selectedStatus === 'late' ? 'bg-yellow-500 text-white border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-yellow-500/5 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10'}`}>RETARD</button>
              <button type="button" onClick={() => setSelectedStatus('absent')} className={`flex-1 py-2.5 md:py-3 text-xs md:text-sm font-rajdhani font-bold tracking-widest rounded-xl border transition-all ${selectedStatus === 'absent' ? 'bg-red-500 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-red-500/5 text-red-400 border-red-500/30 hover:bg-red-500/10'}`}>ABSENT</button>
            </div>

            {(selectedStatus === 'late' || selectedStatus === 'absent') && (
              <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Veuillez justifier votre absence ou retard..."
                className="w-full bg-black/40 border border-white/10 hover:border-white/20 rounded-xl p-3 md:p-4 text-xs md:text-sm text-white font-poppins focus:border-[#F7CAD0] outline-none resize-none transition-colors shadow-inner"
                rows="2"
                required
              />
            )}

            <div className="flex justify-end gap-2 md:gap-3 mt-1 md:mt-2">
              <button type="button" onClick={() => setShowMenu(false)} className="px-4 py-2 text-[10px] md:text-xs font-techMono text-gray-400 hover:text-white transition-colors">ANNULER</button>
              <button type="submit" disabled={!selectedStatus || isSubmitting} className="px-6 md:px-8 py-2 md:py-2.5 text-xs md:text-sm font-rajdhani font-bold tracking-widest bg-gradient-to-r from-[#B185DB] to-[#F7CAD0] text-[#1A1C2E] rounded-xl hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-[0_0_15px_rgba(247,202,208,0.3)]">
                {isSubmitting ? 'ENVOI...' : 'CONFIRMER'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= PANNEAU COACH (ROLL-CALL) ================= */}
      {showRollCall && (isStaff || isCoach) && (
        <div className="mt-5 md:mt-6 pt-4 md:pt-5 border-t border-[#A2D2FF]/20 animate-fade-in bg-[#1A1C2E]/40 -mx-5 -mb-5 md:-mx-6 md:-mb-6 p-5 md:p-6 rounded-b-2xl">
          <h4 className="text-[#A2D2FF] font-rajdhani text-lg md:text-xl font-bold mb-4 flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              REGISTRE DES PRÉSENCES
            </span>
            <button onClick={fetchRollCall} className="text-[10px] md:text-xs font-techMono text-gray-400 hover:text-white transition-colors flex items-center gap-1 border border-white/10 bg-white/5 px-2.5 md:px-3 py-1.5 rounded-lg shrink-0">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              ACTUALISER
            </button>
          </h4>

          {loadingRollCall ? (
            <div className="flex justify-center py-6"><div className="w-5 h-5 md:w-6 md:h-6 border-2 border-[#A2D2FF] border-t-transparent rounded-full animate-spin"></div></div>
          ) : (
            <div className="grid grid-cols-1 gap-2 md:gap-3">
              {rollCallData.length === 0 && (
                 <p className="text-gray-500 font-poppins text-xs md:text-sm italic text-center py-4 bg-black/20 rounded-xl border border-white/5">Aucun agent n'a encore signifié sa présence.</p>
              )}
              {rollCallData.map(c => (
                <div key={c.user_id || c.id} className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-3 md:p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/10 transition-colors gap-3 md:gap-4">
                  
                  {/* Info Joueur */}
                  <div className="flex items-center gap-3 md:gap-4 w-full lg:w-auto">
                    {c.profiles?.avatar_url ? (
                      <img src={c.profiles.avatar_url} alt="avatar" className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/20 object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#1A1C2E] to-[#6F2DBD] border border-white/10 flex items-center justify-center text-white font-bold text-xs md:text-sm shadow-inner shrink-0">?</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-rajdhani font-bold text-base md:text-lg leading-tight truncate">{c.profiles?.username || 'Agent Inconnu'}</p>
                      {c.note && (
                        <p className="text-gray-400 text-[10px] md:text-xs font-poppins italic mt-0.5 md:mt-1 border-l-2 border-white/10 pl-2 truncate">"{c.note}"</p>
                      )}
                      {c.marked_by_coach && (
                         <span className="inline-block bg-[#A2D2FF]/10 text-[#A2D2FF] border border-[#A2D2FF]/30 px-1.5 py-0.5 rounded text-[8px] md:text-[9px] uppercase font-techMono tracking-widest mt-1">Verrouillé Staff</span>
                      )}
                    </div>
                  </div>

                  {/* Actions Rapides Coach */}
                  <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full lg:w-auto mt-1 lg:mt-0">
                    <button onClick={() => handleForceStatus(c.user_id, 'present')} className={`flex-1 lg:w-auto px-2 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-techMono tracking-widest rounded-lg border transition-all ${c.status === 'present' ? 'bg-green-500 text-white border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-black/40 text-green-500 border-green-500/30 hover:bg-green-500/20'}`}>PRÉSENT</button>
                    <button onClick={() => handleForceStatus(c.user_id, 'late')} className={`flex-1 lg:w-auto px-2 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-techMono tracking-widest rounded-lg border transition-all ${c.status === 'late' ? 'bg-yellow-500 text-white border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-black/40 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/20'}`}>RETARD</button>
                    <button onClick={() => handleForceStatus(c.user_id, 'absent')} className={`flex-1 lg:w-auto px-2 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-techMono tracking-widest rounded-lg border transition-all ${c.status === 'absent' ? 'bg-red-500 text-white border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-black/40 text-red-500 border-red-500/30 hover:bg-red-500/20'}`}>ABSENT</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AJOUT MANUEL PAR LE COACH */}
          {!loadingRollCall && profilesList.length > 0 && (
            <div className="mt-4 md:mt-5 pt-4 md:pt-5 flex flex-col sm:flex-row gap-2 md:gap-3 border-t border-white/5">
               <select 
                 className="flex-1 bg-black/40 border border-white/10 rounded-xl text-xs md:text-sm text-gray-300 p-2.5 md:p-3 font-poppins outline-none focus:border-[#A2D2FF] transition-colors appearance-none truncate"
                 value={selectedProfileId}
                 onChange={e => setSelectedProfileId(e.target.value)}
               >
                 <option value="">-- Ajouter un agent au registre --</option>
                 {profilesList.map(p => {
                    const isAlreadyIn = rollCallData.some(rc => rc.user_id === p.id);
                    if (isAlreadyIn) return null;
                    return <option key={p.id} value={p.id}>{p.username}</option>
                 })}
               </select>
               <button 
                 onClick={() => {
                   if (!selectedProfileId) return;
                   handleForceStatus(selectedProfileId, 'present');
                   setSelectedProfileId('');
                 }}
                 disabled={!selectedProfileId}
                 className="bg-white/10 text-white border border-white/20 px-4 md:px-6 py-2.5 md:py-3 font-rajdhani font-bold text-xs md:text-sm tracking-widest rounded-xl hover:bg-white/20 hover:border-[#A2D2FF] transition-all disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
               >
                 + FORCER PRÉSENCE
               </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}