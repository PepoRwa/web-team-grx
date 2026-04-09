import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const file = fs.readFileSync('src/lib/supabaseClient.js', 'utf8');
const urlMatch = file.match(/createClient\((['"`])(.*?)\1,\s*(['"`])(.*?)\1\)/);

if (urlMatch) {
  const supabase = createClient(urlMatch[2], urlMatch[4]);
  supabase.rpc('get_schema').then(console.log).catch(console.error);
  
  // Just fetch one event
  supabase.from('events').select('*').limit(1).then(({data, error}) => {
    if(error) console.error(error);
    else console.log(data);
  });
} else {
  console.log("Could not parse supabaseClient.js");
}
