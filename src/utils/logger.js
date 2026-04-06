import { supabase } from '../lib/supabaseClient';

/**
 * Enregistre un log système dans la base de données.
 * @param {string} level - 'info', 'warning', 'error', 'critical'
 * @param {string} action - Titre court de l'action (ex: 'LOGIN', 'CREATE_MEMBER')
 * @param {string} details - Explication détaillée (ex: 'Antoine a supprimé le membre PGM')
 * @param {string} userId - L'ID de l'utilisateur qui a fait l'action (optionnel)
 */
export const systemLog = async (level, action, details, userId = null) => {
  try {
    await supabase.from('system_logs').insert({
      level,
      action,
      details,
      user_id: userId
    });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du log:", error);
  }
};
