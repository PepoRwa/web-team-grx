import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
const main = async () => {
  const { data, error } = await supabase.from('user_roles').select('user_id, roles(name)').limit(5)
  console.log("data:", JSON.stringify(data, null, 2))
  console.log("error:", error)
}
main()
