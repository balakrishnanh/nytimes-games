import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Saves a score to the leaderboard, keeping only the best (lowest) time per user per game.
 * - If the user has no existing score: inserts a new row.
 * - If the user has an existing score and the new time is BETTER (lower): updates it.
 * - If the existing score is already better or equal: does nothing.
 *
 * Requires a UNIQUE constraint on (game_id, user_id) in the leaderboard table.
 */
export async function saveScore(
  supabase: SupabaseClient,
  { gameId, userId, scoreSeconds }: { gameId: string; userId: string; scoreSeconds: number }
): Promise<{ saved: boolean; improved: boolean }> {
  // 1. Check for existing score
  const { data: existing } = await supabase
    .from('leaderboard')
    .select('id, score_seconds')
    .eq('game_id', gameId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    // 2a. Already has a score — only update if new score is strictly better
    if (scoreSeconds < existing.score_seconds) {
      await supabase
        .from('leaderboard')
        .update({ score_seconds: scoreSeconds })
        .eq('id', existing.id)
      return { saved: true, improved: true }
    }
    // New score is worse or equal — do nothing
    return { saved: false, improved: false }
  } else {
    // 2b. No existing score — insert fresh
    await supabase.from('leaderboard').insert({
      game_id: gameId,
      user_id: userId,
      score_seconds: scoreSeconds,
    })
    return { saved: true, improved: true }
  }
}
