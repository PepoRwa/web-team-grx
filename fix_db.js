import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
(async () => {
  const { data } = await supabase.from('discord_cache').select('*').limit(2);
  console.log(JSON.stringify(data, null, 2));
})();
