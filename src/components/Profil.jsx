import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import GlobalObjectiveBanner from './GlobalObjectiveBanner';
import { FiMonitor, FiVideo, FiFileText, FiAward, FiSettings, FiActivity } from 'react-icons/fi';

export default function Profil({ session, setActiveTab }) {
  const [profile, setProfile] = useState(null);
  const [vods, setVods] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stats calculate (Mock for MVP unless calculated from absences)
  const [stats, setStats] = useState({ presenceRate: '95%', matches: 12 });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      
      // 1. Load Profile
      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (!profErr && profData) {
        setProfile(profData);
      }

      // 2. Load VODs containing user
      const { data: vodData } = await supabase
        .from('vods')
        .select('*')
        .contains('players_present', `["${session.user.id}"]`)
        .order('date', { ascending: false })
        .limit(3);
        
      if (vodData) setVods(vodData);

      // 3. Load Documents
      const { data: docData } = await supabase
        .from('user_documents')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (docData) setDocuments(docData);

      setLoading(false);
    }
    
    if (session?.user?.id) {
      loadData();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <span className="text-[#A2D2FF] font-techMono animate-pulse uppercase tracking-widest">
          Synchronisation Profil...
        </span>
      </div>
    );
  }

  const avatarUrl = profile?.avatar_url || session.user.user_metadata.avatar_url;
  const fullName = profile?.username || session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.email;
  const userRoles = profile?.custom_affiliations || [];

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <GlobalObjectiveBanner />
      
      {/* HEADER PROFIL */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#1A1C2E] to-[#0D0E15] border border-[#B185DB]/20 p-8 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
        {/* Background accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F7CAD0]/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#A2D2FF]/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* AVATAR */}
          <div className="relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-2 border-[#B185DB]/40 shadow-[0_0_20px_rgba(177,133,219,0.3)] shrink-0 transition-transform group-hover:scale-105">
              <img src={avatarUrl || 'https://via.placeholder.com/150'} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-3 -right-3 bg-green-500 w-6 h-6 rounded-full border-4 border-[#0D0E15] shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
          </div>

          {/* INFOS */}
          <div className="flex-1 text-center md:text-left flex flex-col justify-center h-full pt-2">
            <h1 className="font-rajdhani text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
              {fullName}
            </h1>
            <p className="text-[#A2D2FF] font-techMono text-sm uppercase tracking-widest mb-4 flex items-center md:justify-start justify-center gap-2">
              <FiMonitor className="w-4 h-4" /> Discord: {profile?.discord_id || 'Non lié'}
            </p>

            {/* RÔLES */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-6">
              {userRoles.length > 0 ? userRoles.map(role => (
                <span key={role} className="px-3 py-1 rounded-lg text-xs font-techMono font-bold bg-[#B185DB]/20 text-[#F0F2F5] border border-[#B185DB]/40 backdrop-blur-sm">
                  {role}
                </span>
              )) : (
                <span className="px-3 py-1 rounded-lg text-xs font-techMono font-bold bg-white/5 text-gray-400 border border-white/10">
                  Aucun Roster Assigné
                </span>
              )}
            </div>
            
            {/* BOUTON EVOLUTION */}
            <div className="mt-auto">
              <button 
                onClick={() => setActiveTab('evolution')}
                className="group relative inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-[#F7CAD0]/20 to-[#B185DB]/20 border border-[#F7CAD0]/40 rounded-xl hover:shadow-[0_0_20px_rgba(247,202,208,0.4)] transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                <span className="font-rockSalt text-[#F7CAD0] text-sm relative z-10">Slow Bloom</span>
                <span className="font-rajdhani font-bold text-[#F0F2F5] uppercase tracking-widest text-xs relative z-10">
                  Demande d'Évolution
                </span>
              </button>
            </div>
          </div>

          {/* STATS RAPIDES */}
          <div className="flex flex-row md:flex-col gap-4 self-center md:self-stretch mt-4 md:mt-0">
            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-4 border border-[#A2D2FF]/20 flex flex-col items-center justify-center min-w-[120px]">
              <span className="font-rockSalt text-2xl text-[#A2D2FF] mb-1">{stats.presenceRate}</span>
              <span className="font-techMono text-[10px] text-gray-400 uppercase tracking-widest">Présence</span>
            </div>
            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-4 border border-[#B185DB]/20 flex flex-col items-center justify-center min-w-[120px]">
              <span className="font-rajdhani text-3xl font-bold text-[#F0F2F5] mb-1">{stats.matches}</span>
              <span className="font-techMono text-[10px] text-gray-400 uppercase tracking-widest">Matchs Joués</span>
            </div>
          </div>
        </div>
      </div>

      {/* DEUXIÈME LIGNE : DOCUMENTS & VODS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* DOCUMENTS */}
        <div className="bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-2xl p-6 shadow-lg flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="font-rajdhani text-2xl font-bold text-white flex items-center gap-2">
              <FiFileText className="text-[#A2D2FF]" /> Mes Documents
            </h2>
            <span className="text-xs font-techMono text-gray-500 uppercase">{documents.length} FICHIERS</span>
          </div>
          
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px] scrollbar-none pr-2">
            {documents.length > 0 ? documents.map(doc => (
              <a 
                key={doc.id}
                href={doc.file_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-black/20 hover:bg-[#A2D2FF]/10 border border-transparent hover:border-[#A2D2FF]/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#A2D2FF]/10 flex items-center justify-center text-[#A2D2FF]">
                    <FiFileText />
                  </div>
                  <div>
                    <h3 className="font-poppins text-sm font-semibold text-[#F0F2F5]">{doc.title}</h3>
                    <p className="text-[10px] font-techMono text-gray-500 uppercase mt-0.5">
                      {new Date(doc.created_at).toLocaleDateString('fr-FR')} • {doc.is_public ? 'Public' : 'Privé'}
                    </p>
                  </div>
                </div>
                <div className="text-gray-400 group-hover:text-[#A2D2FF] transition-colors">
                  <FiAward />
                </div>
              </a>
            )) : (
              <div className="text-center py-8 text-gray-500 text-sm font-poppins italic">
                Aucun document ne vous a été assigné pour le moment.
              </div>
            )}
          </div>
        </div>

        {/* VODS */}
        <div className="bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-2xl p-6 shadow-lg flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="font-rajdhani text-2xl font-bold text-white flex items-center gap-2">
              <FiVideo className="text-[#F7CAD0]" /> Apparitions VOD
            </h2>
            <button onClick={() => setActiveTab('vods')} className="text-xs font-techMono text-[#F7CAD0] hover:text-white uppercase transition-colors">
              TOUT VOIR
            </button>
          </div>
          
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px] scrollbar-none pr-2">
            {vods.length > 0 ? vods.map(vod => (
              <div 
                key={vod.id}
                className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-transparent hover:border-[#F7CAD0]/30 transition-all"
              >
                <div className="flex flex-col">
                  <h3 className="font-poppins text-sm font-semibold text-[#F0F2F5]">{vod.title || vod.map}</h3>
                  <p className="text-[10px] font-techMono text-gray-500 uppercase mt-0.5">
                    {new Date(vod.date).toLocaleDateString('fr-FR')} • vs {vod.opponent}
                  </p>
                </div>
                <a href={vod.link} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-[#F7CAD0]/10 flex items-center justify-center text-[#F7CAD0] hover:bg-[#F7CAD0]/20 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4l12 6-12 6V4z"/></svg>
                </a>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500 text-sm font-poppins italic">
                Vous n'apparaissez dans aucune VOD ou la liste est privée.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* OPTIONS LÉGALES & PARAMÈTRES */}
      <div className="bg-black/20 border border-white/5 rounded-2xl p-6 mt-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-gray-400">
          <FiSettings className="w-5 h-5 text-[#B185DB]" />
          <div className="flex flex-col">
            <span className="font-poppins text-sm text-[#F0F2F5]">Confidentialité & Compte</span>
            <span className="font-techMono text-[10px] uppercase">Dernière synchro: {new Date().toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-techMono font-bold text-gray-300 transition-all border border-white/10 uppercase">
            Mettre à jour via Discord
          </button>
          <button className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-techMono font-bold text-red-400 transition-all border border-red-500/20 uppercase" onClick={() => alert("Le compte sur team.gowrax.me ne peut pas être supprimé tant que le membre est actif. Le bot Discord s'occupe des radiations automatiquement.")}>
            Désactiver Profil
          </button>
        </div>
      </div>

    </div>
  );
}
