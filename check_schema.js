const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: lb, error: lbError } = await supabase.from('leaderboard').select('*').limit(1);
  if (lbError) console.error(lbError);
  console.log('leaderboard columns:', lb && lb.length > 0 ? Object.keys(lb[0]) : lb);
  
  const { data: pg, error: pgError } = await supabase.from('played_games').select('*').limit(1);
  if (pgError) console.error(pgError);
  console.log('played_games columns:', pg && pg.length > 0 ? Object.keys(pg[0]) : pg);
}

check().catch(console.error);
