import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: Request,
  props: { params: Promise<{ gameId: string }> }
) {
  const params = await props.params
  const gameId = params.gameId
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is the creator
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('user_id')
    .eq('id', gameId)
    .single()

  if (gameError || !game || game.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden: Only the creator can view full metrics.' }, { status: 403 })
  }

  // Total Plays
  const { count: totalPlays } = await supabase
    .from('game_plays')
    .select('*', { count: 'exact', head: true })
    .eq('game_id', gameId)

  // Unique players
  const { data: players } = await supabase
    .from('game_plays')
    .select('user_id')
    .eq('game_id', gameId)
  
  const uniquePlayers = new Set(players?.map(p => p.user_id)).size

  // Times
  const { data: times } = await supabase
    .from('leaderboard')
    .select('score_seconds')
    .eq('game_id', gameId)

  let avgTime = 0
  let fastestTime = 0
  let slowestTime = 0

  if (times && times.length > 0) {
    const scores = times.map(t => t.score_seconds)
    avgTime = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    fastestTime = Math.min(...scores)
    slowestTime = Math.max(...scores)
  }

  // Leaderboard (Top 10)
  const { data: leaderboard } = await supabase
    .from('leaderboard')
    .select('score_seconds, profiles(username)')
    .eq('game_id', gameId)
    .order('score_seconds', { ascending: true })
    .limit(10)

  // Daily Plays (Last 14 days)
  const { data: allPlays } = await supabase
    .from('game_plays')
    .select('played_at')
    .eq('game_id', gameId)

  const dailyPlays: Record<string, number> = {}
  // Initialize last 14 days with 0
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    dailyPlays[dateStr] = 0
  }

  if (allPlays) {
    allPlays.forEach(p => {
      // p.played_at is like '2023-10-01T12:00:00Z'
      const dateStr = new Date(p.played_at).toISOString().split('T')[0]
      if (dailyPlays[dateStr] !== undefined) {
        dailyPlays[dateStr]++
      }
    })
  }

  const chartData = Object.entries(dailyPlays).map(([date, plays]) => {
    // format date as 'MMM D' (e.g., 'Oct 1')
    const d = new Date(date)
    const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    return { date: formattedDate, plays }
  })

  return NextResponse.json({
    totalPlays: totalPlays || 0,
    uniquePlayers,
    avgTime,
    fastestTime,
    slowestTime,
    leaderboard: leaderboard || [],
    chartData
  })
}
