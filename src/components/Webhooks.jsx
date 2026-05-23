import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FiSend, FiPlus, FiAlertOctagon, FiCpu, FiMessageSquare, FiSettings, FiImage } from 'react-icons/fi';

export default function Webhooks({ session, roles }) {
  // --- VÉRIFICATION DE SÉCURITÉ ---
  const isHighCommand = roles.includes('Fondateurs') || roles.includes('Chef du Staff');

  const [webhooks, setWebhooks] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // States du formulaire
  const [selectedWebhook, setSelectedWebhook] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [customUsername, setCustomUsername] = useState('Gowrax System');
  const [customAvatar, setCustomAvatar] = useState('https://pbs.twimg.com/media/GPK8zIHaMAA7kIe.jpg'); // Logo par défaut
  
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    // Si la personne a les droits, on charge les données
    if (isHighCommand) {
      fetchData();
    }
  }, [isHighCommand]);

  const fetchData = async () => {
    setLoading(true);
    // Fetch Webhooks
    const { data: hooksData } = await supabase.from('discord_webhooks').select('*').order('name');
    if (hooksData) setWebhooks(hooksData);

    // Fetch Templates
    const { data: tplData } = await supabase.from('webhook_templates').select('*').order('name');
    if (tplData) setTemplates(tplData);
    
    setLoading(false);
  };

  const handleApplyTemplate = (e) => {
    const tplId = e.target.value;
    if (!tplId) return;
    const tpl = templates.find(t => t.id === tplId);
    if (tpl) setMessageContent(tpl.content);
    e.target.value = ''; // Reset le select
  };

  const handleSendWebhook = async (e) => {
    e.preventDefault();
    if (!selectedWebhook || !messageContent) return;

    setIsSending(true);

    const webhookObj = webhooks.find(w => w.id === selectedWebhook);
    if (!webhookObj) return;

    try {
      const response = await fetch(webhookObj.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent,
          username: customUsername || undefined,
          avatar_url: customAvatar || undefined,
        }),
      });

      if (response.ok) {
        alert('Transmission Discord réussie !');
        setMessageContent('');
      } else {
        alert('Échec de la transmission. Vérifiez l\'URL du webhook dans la base de données.');
      }
    } catch (error) {
      console.error("Erreur Webhook:", error);
      alert('Erreur réseau lors de la communication avec Discord.');
    }

    setIsSending(false);
  };

  // ==========================================
  // ECRAN D'ACCÈS REFUSÉ (Le bouclier)
  // ==========================================
  if (!isHighCommand) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in relative overflow-hidden mt-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-red-900/10 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen"></div>
          
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30 mb-8 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <FiAlertOctagon className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="font-rajdhani text-4xl md:text-5xl text-red-500 font-black tracking-wider uppercase mb-4 drop-shadow-md">
            VIOLATION D'ACCÈS
          </h1>
          <p className="font-poppins text-gray-400 mb-10 text-sm md:text-base leading-relaxed max-w-lg">
            La salle des transmissions est strictement réservée au **Haut Commandement** (Fondateurs & Chefs du Staff). Votre tentative d'accès a été consignée.
          </p>
      </div>
    );
  }

  // ==========================================
  // INTERFACE DES TRANSMISSIONS (Slow Bloom)
  // ==========================================

    // Fonction pour simuler le rendu Markdown de Discord
  const renderDiscordPreview = (text) => {
    if (!text) return <span className="text-gray-500 italic">Le message s'affichera ici...</span>;

    // 1. Remplacer les \n (textuels) par de vrais sauts de ligne
    let htmlText = text.replace(/\\n/g, '\n');

    // 2. Sécurité : Échapper les balises HTML basiques
    htmlText = htmlText.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // 3. Parsing du Markdown Discord
    htmlText = htmlText
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>') // Gras
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>') // Italique
      .replace(/__(.*?)__/g, '<span class="underline">$1</span>') // Souligné
      .replace(/~~(.*?)~~/g, '<del>$1</del>') // Barré
      .replace(/`(.*?)`/g, '<code class="bg-[#202225] text-[#dcddde] px-1.5 py-0.5 rounded text-xs font-techMono">$1</code>') // Code inline
      .replace(/(&lt;@&?[0-9]+&gt;|@everyone|@here)/g, '<span class="bg-[#5865F2]/20 text-[#c9cdfb] px-1 rounded cursor-pointer hover:bg-[#5865F2]/40 transition-colors">$1</span>'); // Mentions

    // 4. Convertir les sauts de ligne en <br/> pour l'affichage HTML
    htmlText = htmlText.replace(/\n/g, '<br/>');

    // On utilise dangerouslySetInnerHTML car on a généré du HTML propre et échappé les chevrons juste au-dessus
    return <div dangerouslySetInnerHTML={{ __html: htmlText }} />;
  };
  return (
    
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto animate-fade-in px-2 md:px-0 mb-10">
      
      {/* HEADER */}
      <div className="bg-[#1A1C2E]/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 md:p-8 flex items-center justify-between gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden">
        <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-[#B185DB]/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div>
          <h2 className="text-3xl md:text-4xl font-rockSalt text-transparent bg-clip-text bg-gradient-to-r from-[#B185DB] to-[#F7CAD0] drop-shadow-md mb-1 flex items-center gap-4">
            <FiCpu className="text-[#B185DB]" /> Transmissions
          </h2>
          <p className="text-[#F7CAD0]/80 font-techMono text-[10px] md:text-xs uppercase tracking-[0.3em]">Centre de diffusion Discord Sécurisé</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* PANNEAU DE CONTRÔLE (GAUCHE) */}
        <div className="bg-[#0D0E15]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-xl relative">
          <form onSubmit={handleSendWebhook} className="flex flex-col gap-6">
            
            {/* Choix du Webhook */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-techMono text-[#A2D2FF] uppercase tracking-widest flex items-center gap-2">
                <FiSettings /> 1. Sélectionner le Canal Cible
              </label>
              {loading ? (
                <div className="h-12 bg-white/5 animate-pulse rounded-xl border border-white/10"></div>
              ) : webhooks.length === 0 ? (
                <p className="text-xs text-red-400 font-poppins bg-red-500/10 p-3 rounded-xl border border-red-500/20">Aucun Webhook configuré dans la base de données.</p>
              ) : (
                <select 
                  required value={selectedWebhook} onChange={(e) => setSelectedWebhook(e.target.value)}
                  className="w-full bg-black/40 border border-[#A2D2FF]/30 hover:border-[#A2D2FF] rounded-xl p-3.5 text-white text-sm font-poppins outline-none transition-colors appearance-none cursor-pointer shadow-inner"
                >
                  <option value="">-- Choisir un salon Discord --</option>
                  {webhooks.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Custom Username */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-techMono text-[#F7CAD0] uppercase tracking-widest">Identité (Bot Name)</label>
                <input 
                  type="text" value={customUsername} onChange={(e) => setCustomUsername(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 focus:border-[#F7CAD0] rounded-xl p-3.5 text-white text-sm font-poppins outline-none transition-colors"
                />
              </div>
              {/* Custom Avatar */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-techMono text-[#F7CAD0] uppercase tracking-widest flex items-center gap-1"><FiImage/> Avatar (URL)</label>
                <input 
                  type="url" value={customAvatar} onChange={(e) => setCustomAvatar(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 focus:border-[#F7CAD0] rounded-xl p-3.5 text-white text-sm font-poppins outline-none transition-colors"
                />
              </div>
            </div>

            {/* Outils Rapides (Templates) */}
            <div className="flex flex-col gap-2 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
              <label className="text-[10px] font-techMono text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <FiPlus /> Injections Rapides (Templates)
              </label>
              <select 
                onChange={handleApplyTemplate} defaultValue=""
                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-gray-300 text-sm font-poppins outline-none appearance-none cursor-pointer"
              >
                <option value="">-- Charger un modèle pré-écrit --</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            {/* Zone de texte */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-techMono text-[#B185DB] uppercase tracking-widest flex items-center gap-2">
                <FiMessageSquare /> 2. Rédiger le message
              </label>
              <textarea 
                required value={messageContent} onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Message à diffuser..."
                className="w-full bg-black/40 border border-[#B185DB]/30 focus:border-[#B185DB] rounded-xl p-4 text-white text-sm font-poppins outline-none transition-colors shadow-inner resize-none min-h-[150px] custom-scrollbar"
              />
            </div>

            {/* Bouton Envoi */}
            <button 
              type="submit" disabled={isSending || !selectedWebhook || !messageContent}
              className="w-full py-4 bg-gradient-to-r from-[#B185DB] to-[#F7CAD0] text-[#1A1C2E] font-rajdhani font-bold text-lg tracking-widest uppercase rounded-xl hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 disabled:grayscale transition-all shadow-[0_0_30px_rgba(177,133,219,0.3)] flex items-center justify-center gap-3 mt-2"
            >
              {isSending ? <div className="w-5 h-5 border-2 border-[#1A1C2E] border-t-transparent rounded-full animate-spin"></div> : <FiSend className="w-5 h-5" />}
              {isSending ? 'DIFFUSION EN COURS...' : 'LANCER LA DIFFUSION'}
            </button>
          </form>
        </div>

        {/* APERÇU EN DIRECT (DROITE) */}
        <div className="bg-[#36393f] rounded-xl shadow-2xl flex flex-col overflow-hidden h-fit border border-gray-800">
          <div className="bg-[#202225] p-3 border-b border-gray-900 flex items-center gap-2">
             <span className="w-3 h-3 rounded-full bg-gray-600"></span>
             <span className="font-poppins text-xs font-bold text-gray-400">Aperçu Discord</span>
          </div>
          
          <div className="p-5 flex items-start gap-4">
            {/* Avatar Bot */}
            <img 
              src={customAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
              alt="Bot Avatar" 
              className="w-10 h-10 rounded-full object-cover shrink-0 bg-gray-800"
              onError={(e) => e.target.src = 'https://cdn.discordapp.com/embed/avatars/0.png'}
            />
            
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-poppins font-semibold text-white text-base truncate">{customUsername || 'Gowrax System'}</span>
                <span className="bg-[#5865F2] text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 uppercase">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657-1.007 3.095-2.433 3.846M12 16.5a4.5 4.5 0 01-3.846-2.433M12 7.5a4.5 4.5 0 013.846 2.433" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Bot
                </span>
                <span className="text-xs text-gray-400 font-poppins ml-1">Aujourd'hui à {new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              
              <div className="text-gray-200 font-poppins text-sm leading-relaxed break-words">
                {renderDiscordPreview(messageContent)}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}