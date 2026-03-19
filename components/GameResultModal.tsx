'use client'
import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Trophy, Frown, Loader2, Clock } from "lucide-react"
import { createClient } from '@/utils/supabase/client'
import { ShareButton } from '@/components/ShareButton'
import { saveScore } from '@/utils/saveScore'

interface GameResultModalProps {
  isOpen: boolean
  onClose: () => void
  isWin: boolean
  answer?: string
  gameType: string
  gameId: string
}

type LeaderboardEntry = {
  score_seconds: number
  profiles: {
    username: string
  }
}

export function GameResultModal({ isOpen, onClose, isWin, answer, gameType, gameId }: GameResultModalProps) {
  const [scores, setScores] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [guestScore, setGuestScore] = useState<number | null>(null)
  
  const supabase = createClient()

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    if (isOpen) {
      const updateAndFetch = async () => {
        setLoading(true)
        
        // 1. Check Auth & Sync Pending Score
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        setUser(currentUser)
        console.log("Modal User Check:", currentUser ? "Logged In" : "Guest")

        // 2. Check Guest Score from LocalStorage
        const pending = localStorage.getItem('pending_score')
        let currentGuestScore = null

        if (pending) {
          try {
              const parsed = JSON.parse(pending)
              console.log("Found Pending Score:", parsed)
              
              if (parsed.gameId === gameId) {
                  currentGuestScore = parsed.score
                  
                  // if logged in, sync it now!
                  if (currentUser) {
                      console.log("Syncing pending score for logged in user...")
                      await saveScore(supabase, {
                          gameId,
                          userId: currentUser.id,
                          scoreSeconds: parsed.score
                      })
                      localStorage.removeItem('pending_score')
                      currentGuestScore = null // No longer a guest score
                  }
              }
          } catch (e) {
              console.error("Error parsing/syncing pending score", e)
          }
        }
        
        setGuestScore(currentGuestScore)

        // 3. Fetch Leaderboard
        const { data } = await supabase
          .from('leaderboard')
          .select('score_seconds, profiles(username)')
          .eq('game_id', gameId)
          .order('score_seconds', { ascending: true })
          .limit(5)
        
        // @ts-ignore
        if (data) setScores(data)
        setLoading(false)
      }

      updateAndFetch()
    }
  }, [isOpen, gameId, supabase])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto rounded-full bg-gray-100 p-3 mb-4 w-fit">
            {isWin ? <Trophy className="h-8 w-8 text-yellow-500" /> : <Frown className="h-8 w-8 text-gray-500" />}
          </div>
          <DialogTitle className="text-2xl font-serif font-bold text-center">
            {isWin ? "Fantastic!" : "Game Over"}
          </DialogTitle>
          <DialogDescription className="text-center pt-2 text-lg">
            {isWin ? (
              "You solved the puzzle!"
            ) : (
              <>
                {gameType === 'wordle' && (
                   <span>The correct word was <span className="font-bold text-black uppercase">{answer}</span></span>
                )}
                {gameType === 'connections' && (
                   <span>You ran out of mistakes! View the board to see the groups.</span>
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-6">
          
          {/* GUEST PROMPT FIX: 
            Check if guestScore is NOT null (instead of just truthy) to handle 0s correctly.
            Ensure 'isWin' is true. 
            Ensure 'user' is null.
          */}
          {isWin && !user && guestScore !== null && (
             <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-2 animate-in slide-in-from-top-2">
                <p className="text-sm text-blue-900 mb-3">
                   Sign in to save your time of <span className="font-bold">{formatTime(guestScore)}</span>!
                </p>
                <Link href={`/login?redirect=/play/${gameId}`}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Log In to Save Score</Button>
                </Link>
             </div>
          )}

          <Link href={`/dashboard?tab=${gameType}`} className="w-full">
            <Button className="w-full text-md py-6" variant={!user && isWin ? "outline" : "default"}>
                Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1 py-6">
                View Board
            </Button>
            <ShareButton gameId={gameId} className="px-6 py-6" />
          </div>
        </div>

        <div className="mt-8 border-t pt-6">
            <h3 className="font-serif font-bold text-lg mb-4 flex items-center justify-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" /> 
                Top Results
            </h3>
            
            {loading ? (
                <div className="flex justify-center py-4"><Loader2 className="animate-spin text-gray-400" /></div>
            ) : scores.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No scores yet. Be the first!</p>
            ) : (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {scores.map((entry, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3">
                                <span className={`
                                    w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs
                                    ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 
                                      i === 1 ? 'bg-gray-200 text-gray-700' :
                                      i === 2 ? 'bg-orange-100 text-orange-800' : 'text-gray-500'}
                                `}>
                                    {i + 1}
                                </span>
                                <span className="font-medium text-gray-900 truncate max-w-[120px]">
                                    {entry.profiles?.username || 'Anonymous'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600 font-mono">
                                <Clock className="w-3 h-3" />
                                {formatTime(entry.score_seconds)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

      </DialogContent>
    </Dialog>
  )
}