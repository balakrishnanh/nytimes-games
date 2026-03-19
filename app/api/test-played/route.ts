import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const publicClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const serverClient = await createClient()

  const { data: publicData, error: publicError } = await publicClient.from('played_games').select('*').limit(5)
  const { data: serverData, error: serverError } = await serverClient.from('played_games').select('*').limit(5)

  return NextResponse.json({
    publicData,
    publicError,
    serverData,
    serverError
  })
}
