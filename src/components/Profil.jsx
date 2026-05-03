import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import GlobalObjectiveBanner from './GlobalObjectiveBanner';
import { FiMonitor, FiVideo, FiFileText, FiSettings, FiLink, FiCheck, FiX, FiActivity, FiClock, FiAlertTriangle, FiEdit2, FiDownload } from 'react-icons/fi';

export default function Profil({ session, setActiveTab, isStaff, isCoach }) {
  const [profile, setProfile] = useState(null);
  const [vods, setVods] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- STATS RÉELLES ---
  const [stats, setStats] = useState({ 
    total: 0, 
    present: 0, 
    late: 0, 
    absent: 0, 
    presenceRate: 100,
    validAbsences: 0 
  });

  // --- TRACKER EDIT ---
  const [isEditingTracker, setIsEditingTracker] = useState(false);
  const [trackerInput, setTrackerInput] = useState('');
  const [isSavingTracker, setIsSavingTracker] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      
      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (!profErr && profData) {
        setProfile(profData);
        setTrackerInput(profData.tracker_url || '');
      }

      let vodQuery = supabase.from('vods').select('*').order('date', { ascending: false }).limit(4);
      if (isStaff || isCoach) {
         vodQuery = vodQuery.eq('reviewed_by', session.user.id);
      } else {
         vodQuery = vodQuery.contains('players_present', `["${session.user.id}"]`);
      }
      const { data: vodData } = await vodQuery;
      if (vodData) setVods(vodData);

      // Charger les Documents (Publics + Personnels)
      const { data: docData } = await supabase
        .from('user_documents')
        .select('*')
        .or(`is_public.eq.true,user_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false });
      if (docData) setDocuments(docData);

      const { data: checkinData } = await supabase
        .from('checkins')
        .select('status')
        .eq('user_id', session.user.id);

      const { data: absencesData } = await supabase
        .from('absences')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('status', 'valide');

      if (checkinData) {
        const total = checkinData.length;
        const present = checkinData.filter(c => c.status === 'present').length;
        const late = checkinData.filter(c => c.status === 'late').length;
        const absent = checkinData.filter(c => c.status === 'absent').length;
        const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

        setStats({
            total,
            present,
            late,
            absent,
            presenceRate: rate,
            validAbsences: absencesData ? absencesData.length : 0
        });
      }

      setLoading(false);
    }
    
    if (session?.user?.id) {
      loadData();
    }
  }, [session, isStaff, isCoach]);

  // FONCTION POUR OUVRIR UN DOCUMENT SÉCURISÉ
  const handleDownload = async (filePath) => {
    // On génère une URL signée valable 60 secondes pour le téléchargement
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 60);

    if (error) {
      console.error("Erreur d'accès au document:", error.message);
      alert("Impossible de récupérer le fichier. Vérifiez vos accès.");
      return;
    }

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  const handleSaveTracker = async () => {
    setIsSavingTracker(true);
    const { error } = await supabase
      .from('profiles')
      .update({ tracker_url: trackerInput })
      .eq('id', session.user.id);

    if (!error) {
      setProfile(prev => ({ ...prev, tracker_url: trackerInput }));
      setIsEditingTracker(false);
    }
    setIsSavingTracker(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
        <div className="w-16 h-16 border-4 border-[#B185DB] border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(177,133,219,0.5)]"></div>
        <span className="text-[#A2D2FF] font-techMono text-xs animate-pulse uppercase tracking-[0.3em]">
          Extraction Biométrique...
        </span>
      </div>
    );
  }

  const avatarUrl = profile?.avatar_url || session.user.user_metadata.avatar_url;
  const fullName = profile?.username || session.user.user_metadata.full_name || session.user.email;
  const userRoles = profile?.custom_affiliations || [];

  return (
    <div className="animate-fade-in flex flex-col gap-8 w-full max-w-[1400px] mx-auto px-2 md:px-0">
      <GlobalObjectiveBanner isStaff={isStaff} isCoach={isCoach} />
      
      {/* HEADER PROFIL */}
      <div className="relative overflow-hidden rounded-[2rem] bg-[#1A1C2E]/60 backdrop-blur-2xl border border-white/10 p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#B185DB]/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-[#B185DB]/20 transition-colors duration-700"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#A2D2FF]/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-stretch gap-10">
          <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-36 h-36 md:w-44 md:h-44 rounded-3xl overflow-hidden border border-[#F0F2F5]/20 shadow-[0_0_30px_rgba(177,133,219,0.2)] shrink-0 transition-transform duration-500 hover:scale-105 hover:rotate-1">
                  <img src={avatarUrl || 'https://via.placeholder.com/150'} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-7 h-7 rounded-full border-4 border-[#1A1C2E] shadow-[0_0_15px_rgba(34,197,94,0.6)]"></div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-[200px]">
                {userRoles.length > 0 ? userRoles.map(role => (
                  <span key={role} className="px-3 py-1 rounded-lg text-[10px] font-techMono uppercase tracking-widest bg-[#B185DB]/20 text-[#B185DB] border border-[#B185DB]/30 shadow-inner">
                    {role}
                  </span>
                )) : (
                  <span className="px-3 py-1 rounded-lg text-[10px] font-techMono uppercase tracking-widest bg-white/5 text-gray-400 border border-white/10">
                    Opérateur
                  </span>
                )}
              </div>
          </div>

          <div className="flex-1 text-center lg:text-left flex flex-col justify-center w-full min-w-0">
            <h1 className="font-rajdhani text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-wider drop-shadow-md mb-3 truncate">
              {fullName}
            </h1>
            <div className="flex flex-col md:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
                <span className="text-[#A2D2FF] font-techMono text-xs uppercase tracking-widest flex items-center gap-2 bg-[#A2D2FF]/10 px-3 py-1.5 rounded-lg border border-[#A2D2FF]/20 shrink-0">
                  <FiMonitor className="w-4 h-4" /> {profile?.discord_id || 'ID INCONNU'}
                </span>

                <div className="relative w-full md:w-auto max-w-sm">
                   {isEditingTracker ? (
                      <div className="flex items-center gap-2 animate-fade-in w-full">
                         <input 
                            type="text" value={trackerInput} onChange={(e) => setTrackerInput(e.target.value)}
                            placeholder="https://tracker.gg/valorant/..."
                            className="bg-black/50 border border-[#F7CAD0]/50 rounded-lg px-3 py-1.5 text-xs font-poppins text-white w-full md:w-64 outline-none focus:shadow-[0_0_10px_rgba(247,202,208,0.3)] transition-shadow"
                         />
                         <button onClick={handleSaveTracker} disabled={isSavingTracker} className="p-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500 hover:text-white transition-colors shrink-0"><FiCheck /></button>
                         <button onClick={() => setIsEditingTracker(false)} className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors shrink-0"><FiX /></button>
                      </div>
                   ) : profile?.tracker_url ? (
                      <div className="flex items-center gap-2 group/tracker justify-center lg:justify-start w-full">
                          <a href={profile.tracker_url} target="_blank" rel="noreferrer" className="text-[#F7CAD0] font-techMono text-xs tracking-wide flex items-center gap-2 bg-[#F7CAD0]/10 px-3 py-1.5 rounded-lg border border-[#F7CAD0]/20 hover:bg-[#F7CAD0] hover:text-[#1A1C2E] transition-all truncate" title={profile.tracker_url}>
                            <FiLink className="w-4 h-4 shrink-0" /> 
                            <span className="truncate">{profile.tracker_url.replace(/^https?:\/\/(www\.)?/, '')}</span>
                          </a>
                          <button onClick={() => setIsEditingTracker(true)} className="p-1.5 text-gray-500 hover:text-white opacity-0 group-hover/tracker:opacity-100 transition-opacity bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg shrink-0"><FiEdit2 className="w-3.5 h-3.5" /></button>
                      </div>
                   ) : (
                      <button onClick={() => setIsEditingTracker(true)} className="text-gray-400 font-techMono text-xs uppercase tracking-widest flex items-center justify-center lg:justify-start gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 transition-all border-dashed w-full md:w-auto">
                        + Lier Tracker.gg
                      </button>
                   )}
                </div>
            </div>
            
            <div className="mt-auto flex justify-center lg:justify-start">
              <button onClick={() => setActiveTab('evolution')} className="group relative inline-flex items-center justify-center gap-4 px-8 py-4 bg-gradient-to-r from-[#B185DB]/10 to-[#F7CAD0]/10 border border-[#F7CAD0]/30 rounded-2xl hover:shadow-[0_0_30px_rgba(247,202,208,0.3)] transition-all overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#B185DB] to-[#F7CAD0] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                <span className="font-rockSalt text-[#F7CAD0] group-hover:text-[#1A1C2E] text-sm md:text-base relative z-10 transition-colors">Slow Bloom</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/30 group-hover:bg-[#1A1C2E]/50 relative z-10"></span>
                <span className="font-rajdhani font-bold text-white group-hover:text-[#1A1C2E] uppercase tracking-[0.2em] text-sm relative z-10 transition-colors">Dossier d'Évolution</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-4 w-full lg:w-auto h-full justify-center shrink-0">
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col items-center justify-center min-w-[160px] flex-1 relative overflow-hidden group/stat">
              <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#A2D2FF] to-[#B185DB] transition-all" style={{ width: `${stats.presenceRate}%` }}></div>
              <span className="font-rajdhani font-black text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-br from-white to-[#A2D2FF] mb-1">{stats.presenceRate}%</span>
              <span className="font-techMono text-[10px] text-[#A2D2FF]/70 uppercase tracking-[0.2em] flex items-center gap-1.5"><FiActivity /> Présence Globale</span>
            </div>

            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-center min-w-[160px] flex-1 shadow-inner gap-2">
                <div className="flex justify-between items-center text-xs font-techMono">
                   <span className="text-gray-400 flex items-center gap-1.5"><FiCheck className="text-green-400"/> Présents</span>
                   <span className="text-white font-bold">{stats.present}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-techMono">
                   <span className="text-gray-400 flex items-center gap-1.5"><FiClock className="text-yellow-400"/> Retards</span>
                   <span className="text-white font-bold">{stats.late}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-techMono border-t border-white/5 pt-2">
                   <span className="text-gray-400 flex items-center gap-1.5"><FiAlertTriangle className="text-red-400"/> Absences</span>
                   <div className="flex items-center gap-1">
                      <span className="text-white font-bold">{stats.absent}</span>
                      {stats.validAbsences > 0 && <span className="text-[9px] text-green-400 bg-green-500/10 px-1 rounded" title="Absences justifiées">(-{stats.validAbsences})</span>}
                   </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* DOCUMENTS CLIQUEABLES */}
        <div className="bg-[#1A1C2E]/40 border border-white/10 backdrop-blur-md rounded-[2rem] p-8 shadow-xl flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="font-rajdhani text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#A2D2FF]/10 flex items-center justify-center border border-[#A2D2FF]/30"><FiFileText className="text-[#A2D2FF]" /></div>
              Documents
            </h2>
            <span className="text-[10px] font-techMono text-gray-500 uppercase tracking-widest">{documents.length} FICHIERS</span>
          </div>
          
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[350px] custom-scrollbar pr-2">
            {documents.length > 0 ? documents.map(doc => (
              <button 
                key={doc.id}
                onClick={() => handleDownload(doc.file_path)}
                className="flex items-center justify-between p-4 rounded-xl bg-black/20 hover:bg-white/5 border border-white/5 hover:border-[#A2D2FF]/40 transition-all group w-full text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-1.5 h-8 rounded-full ${doc.is_public ? 'bg-gray-600' : 'bg-[#A2D2FF]'}`}></div>
                  <div>
                    <h3 className="font-rajdhani font-bold text-lg text-white group-hover:text-[#A2D2FF] transition-colors">{doc.title}</h3>
                    <p className="text-[10px] font-techMono text-gray-500 uppercase mt-1 flex items-center gap-2">
                      {new Date(doc.created_at).toLocaleDateString('fr-FR')} 
                      <span className={`px-2 py-0.5 rounded border ${doc.is_public ? 'bg-white/5 text-gray-400 border-white/10' : 'bg-[#A2D2FF]/10 text-[#A2D2FF] border-[#A2D2FF]/30'}`}>
                         {doc.is_public ? 'Global' : 'Personnel'}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="text-gray-600 group-hover:text-[#A2D2FF] transition-colors bg-white/5 p-2 rounded-lg group-hover:bg-[#A2D2FF]/10">
                  <FiDownload className="w-5 h-5" />
                </div>
              </button>
            )) : (
              <div className="text-center py-12 flex flex-col items-center opacity-50">
                <FiFileText className="w-10 h-10 text-gray-500 mb-3" />
                <p className="text-sm font-poppins text-gray-400">Aucun document ne vous a été assigné.</p>
              </div>
            )}
          </div>
        </div>

        {/* VODS */}
        <div className="bg-[#1A1C2E]/40 border border-white/10 backdrop-blur-md rounded-[2rem] p-8 shadow-xl flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="font-rajdhani text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F7CAD0]/10 flex items-center justify-center border border-[#F7CAD0]/30"><FiVideo className="text-[#F7CAD0]" /></div>
              {isStaff || isCoach ? 'VODs Analysées' : 'Apparitions VOD'}
            </h2>
            <button onClick={() => setActiveTab('vods')} className="text-[10px] font-techMono text-[#F7CAD0] hover:text-white uppercase tracking-widest border border-[#F7CAD0]/30 px-3 py-1.5 rounded-lg hover:bg-[#F7CAD0]/20 transition-all">Ouvrir le Hub</button>
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[350px] custom-scrollbar pr-2">
            {vods.length > 0 ? vods.map(vod => (
              <div key={vod.id} className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5 hover:border-[#F7CAD0]/40 transition-all group">
                <div className="flex flex-col">
                  <h3 className="font-rajdhani font-bold text-lg text-white group-hover:text-[#F7CAD0] transition-colors">{vod.title || vod.map}</h3>
                  <p className="text-[10px] font-techMono text-gray-500 uppercase mt-1">{new Date(vod.date).toLocaleDateString('fr-FR')} • VS {vod.opponent || 'Inconnu'}</p>
                </div>
                <a href={vod.link} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-[#F7CAD0]/5 border border-[#F7CAD0]/20 flex items-center justify-center text-[#F7CAD0] hover:bg-[#F7CAD0] hover:text-[#1A1C2E] transition-all shadow-sm"><svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4l12 6-12 6V4z"/></svg></a>
              </div>
            )) : (
              <div className="text-center py-12 flex flex-col items-center opacity-50">
                <FiVideo className="w-10 h-10 text-gray-500 mb-3" />
                <p className="text-sm font-poppins text-gray-400">{isStaff || isCoach ? "Vous n'avez review aucune VOD." : "Vous n'apparaissez dans aucune VOD classifiée."}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OPTIONS LÉGALES */}
      <div className="bg-[#1A1C2E]/80 backdrop-blur-md border border-white/5 rounded-[1.5rem] p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-black/40 border border-[#B185DB]/30 flex items-center justify-center shadow-inner"><FiSettings className="w-5 h-5 text-[#B185DB]" /></div>
          <div className="flex flex-col text-center lg:text-left">
            <span className="font-rajdhani font-bold text-xl text-white tracking-wide">Confidentialité & Compte</span>
            <span className="font-techMono text-[10px] text-gray-500 uppercase tracking-widest mt-1">Dernière synchro: {new Date().toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <button className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-techMono font-bold text-gray-300 transition-all border border-white/10 uppercase tracking-widest">Synchro Discord</button>
          <button className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-xs font-techMono font-bold text-red-400 hover:text-white transition-all border border-red-500/30 uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.1)]" onClick={() => alert("Le compte sur l'interface GOWRAX ne peut pas être supprimé manuellement tant que vos accréditations Discord sont actives.")}>Désactiver Profil</button>
        </div>
      </div>
    </div>
  );
}