'use client'
import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { saveScore } from '@/utils/saveScore'

export function ScoreSyncer() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkPendingScore = async () => {
      const pending = localStorage.getItem('pending_score')
      if (!pending) return

      const { gameId, score } = JSON.parse(pending)
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { saved, improved } = await saveScore(supabase, {
          gameId,
          userId: user.id,
          scoreSeconds: score,
        })

        // Always clear pending score and redirect
        localStorage.removeItem('pending_score')

        if (saved && improved) {
          toast.success('New best score saved!')
        } else if (!saved) {
          toast.info('You already have a better score on this game!')
        }

        router.push(`/play/${gameId}`)
      }
    }

    checkPendingScore()
  }, [])

  return null
}
