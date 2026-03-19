'use client'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trophy, Clock, Loader2 } from "lucide-react"
import { createClient } from '@/utils/supabase/client'

type LeaderboardEntry = {
  score_seconds: number
  profiles: {
    username: string
  }
}

interface LeaderboardButtonProps {
  gameId: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
}

export function LeaderboardButton({ gameId, variant = "outline", className, size = "sm" }: LeaderboardButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [scores, setScores] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      setLoading(true)
      const fetchLeaderboard = async () => {
        const { data } = await supabase
          .from('leaderboard')
          .select('score_seconds, profiles(username)')
          .eq('game_id', gameId)
          .order('score_seconds', { ascending: true })
          .limit(5)
        
        if (data) setScores(data as unknown as LeaderboardEntry[])
        setLoading(false)
      }
      fetchLeaderboard()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Trophy className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Scores</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md text-center max-h-[90vh] overflow-y-auto w-[90vw] sm:w-full">
        <DialogHeader>
            <DialogTitle className="text-2xl font-serif font-bold flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-6 h-6 text-yellow-500" /> 
                Top Results
            </DialogTitle>
        </DialogHeader>

        <div className="pt-2">
            {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-400 h-8 w-8" /></div>
            ) : scores.length === 0 ? (
                <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg">
                    <Trophy className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm italic">No scores yet. Be the first!</p>
                </div>
            ) : (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {scores.map((entry, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3">
                                <span className={`
                                    w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs
                                    ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 
                                      i === 1 ? 'bg-gray-200 text-gray-700' :
                                      i === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-200 text-gray-600'}
                                `}>
                                    {i + 1}
                                </span>
                                <span className="font-medium text-gray-900 truncate max-w-[120px]">
                                    {entry.profiles?.username || 'Anonymous'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600 font-mono font-medium bg-white px-2 py-1 rounded shadow-sm border border-gray-100">
                                <Clock className="w-3 h-3 text-gray-400" />
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
