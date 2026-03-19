// app/play/[id]/page.tsx
import { createClient } from '@/utils/supabase/server'
import WordleGame from '@/components/games/WordleGame'
import ConnectionsGame from '@/components/games/ConnectionsGame'
import MiniCrosswordGame from '@/components/games/MiniCrosswordGame' 
import SpellingBeeGame from '@/components/games/SpellingBeeGame'
import GameShell from '@/components/GameShell'

export default async function PlayGame({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: game } = await supabase.from('games').select('*').eq('id', id).single()

  if (!game) return <div className="p-8 text-center">Game not found</div>

  // Track this game as "played" if the logged-in user doesn't own it
  const { data: { user } } = await supabase.auth.getUser()
  if (user && user.id !== game.user_id) {
    // 1. Maintain dashboard 'Played Games' list
    await supabase.from('played_games').upsert(
      { user_id: user.id, game_id: game.id },
      { onConflict: 'user_id,game_id' }
    )
    
    // 2. Log an individual play for metrics (Total Plays & Charts)
    await supabase.from('game_plays').insert({
      user_id: user.id,
      game_id: game.id
    })
  }

  return (
    <GameShell title={game.title} gameType={game.type} gameId={game.id}>
      
      {game.type === 'wordle' && (
          <WordleGame config={game.config} gameId={game.id} />
      )}
      
      {game.type === 'connections' && (
          <ConnectionsGame config={game.config} gameId={game.id} />
      )}

      {game.type === 'mini' && (
          <MiniCrosswordGame config={game.config} gameId={game.id} />
      )}
      
      {game.type === 'spelling-bee' && (
          <SpellingBeeGame config={game.config} gameId={game.id} />
      )}

    </GameShell>
  )
}