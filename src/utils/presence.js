import { supabase } from '../lib/supabaseClient';

// Instance unique (Singleton) du channel de tracking
let globalPresenceChannel = null;

export const getPresenceChannel = () => {
  if (!globalPresenceChannel) {
    globalPresenceChannel = supabase.channel('online-users');
  }
  return globalPresenceChannel;
};
