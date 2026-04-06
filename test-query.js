import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env.local', 'utf-8').split('\n')
const url = env.find(l => l.startsWith('VITE_SUPABASE_URL')).split('=')[1]
const key = env.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY')).split('=')[1]

const supabase = createClient(url, key)

async function test() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, user_roles(roles(name))')
    .limit(3)
  console.log(data, error)
}
test()
