import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function run() {
  const { data, error } = await supabase
    .from('played_games')
    .select(`
      id,
      played_at,
      games (
        id,
        title,
        type,
        created_at,
        user_id,
        profiles ( username )
      )
    `)
  console.log('Query Data:', JSON.stringify(data, null, 2))
  console.log('Query Error:', error)

  const { data: rawGames, error: rawGamesErr } = await supabase.from('played_games').select('*')
  console.log('Raw played_games Data:', rawGames)
  console.log('Raw played_games Error:', rawGamesErr)
}

run()
