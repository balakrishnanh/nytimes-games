'use client'
import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { useRouter, usePathname } from 'next/navigation'
import { saveScore } from '@/utils/saveScore'

export function ScoreSyncer() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkPendingScore = async () => {
      const pending = localStorage.getItem('pending_score')
      if (!pending) return

      try {
        const { gameId, score } = JSON.parse(pending)
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const { saved, improved } = await saveScore(supabase, {
            gameId,
            userId: user.id,
            scoreSeconds: score,
          })

          // Always clear pending score
          localStorage.removeItem('pending_score')

          if (saved && improved) {
            toast.success('Your pending guest score has been saved to the leaderboard!')
          } else if (!saved) {
            toast.info('You already have a better score on this game!')
          }

          // If NOT already on the play page for this game, redirect there to show results
          if (pathname !== `/play/${gameId}`) {
            router.push(`/play/${gameId}`)
          } else {
            // Already on the page, force refresh to update UI/Server components
            router.refresh()
          }
        }
      } catch (e) {
        console.error("Error syncing pending score", e)
      }
    }

    checkPendingScore()
  }, [pathname, router, supabase.auth])

  return null
}
