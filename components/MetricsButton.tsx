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
import { BarChart2, Users, Play, Clock, Trophy, Loader2, Gauge } from "lucide-react"
import { SparklineBarChart } from './SparklineBarChart'

type LeaderboardEntry = {
  score_seconds: number
  profiles: {
    username: string
  }
}

type MetricsData = {
  totalPlays: number
  uniquePlayers: number
  avgTime: number
  fastestTime: number
  slowestTime: number
  leaderboard: LeaderboardEntry[]
  chartData: { date: string; plays: number }[]
}

interface MetricsButtonProps {
  gameId: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
}

export function MetricsButton({ gameId, variant = "outline", className, size = "sm" }: MetricsButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const formatTime = (totalSeconds: number) => {
    if (!totalSeconds) return '--:--'
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      setLoading(true)
      setError(null)
      fetch(`/api/games/${gameId}/metrics`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to load metrics. Ensure you are the game creator.')
          return res.json()
        })
        .then(data => {
          if (data.error) throw new Error(data.error)
          setMetrics(data)
          setLoading(false)
        })
        .catch(err => {
          setError(err.message)
          setLoading(false)
        })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <BarChart2 className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Metrics</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl text-center max-h-[90vh] overflow-y-auto w-[90vw] sm:w-full">
        <DialogHeader>
            <DialogTitle className="text-2xl font-serif font-bold flex items-center justify-center gap-2 mb-2">
                <BarChart2 className="w-6 h-6 text-blue-500" /> 
                Game Metrics
            </DialogTitle>
        </DialogHeader>

        <div className="pt-2 text-left">
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-400 h-8 w-8" /></div>
            ) : error ? (
                <div className="py-8 text-center text-red-500 bg-red-50 rounded-lg">
                    <p>{error}</p>
                </div>
            ) : !metrics ? (
                <div className="py-8 text-center text-gray-500">No data available.</div>
            ) : (
                <div className="space-y-6">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-white border p-4 rounded-lg shadow-sm flex flex-col items-center justify-center text-center">
                            <Play className="w-5 h-5 text-blue-500 mb-1" />
                            <div className="text-2xl font-bold">{metrics.totalPlays}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mt-1">Total Plays</div>
                        </div>
                        <div className="bg-white border p-4 rounded-lg shadow-sm flex flex-col items-center justify-center text-center">
                            <Users className="w-5 h-5 text-green-500 mb-1" />
                            <div className="text-2xl font-bold">{metrics.uniquePlayers}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mt-1">Players</div>
                        </div>
                        <div className="bg-white border p-4 rounded-lg shadow-sm flex flex-col items-center justify-center text-center">
                            <Gauge className="w-5 h-5 text-purple-500 mb-1" />
                            <div className="text-2xl font-bold font-mono">{formatTime(metrics.avgTime)}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mt-1">Avg Time</div>
                        </div>
                        <div className="bg-white border p-4 rounded-lg shadow-sm flex flex-col items-center justify-center text-center">
                            <Clock className="w-5 h-5 text-orange-500 mb-1" />
                            <div className="text-2xl font-bold font-mono">{formatTime(metrics.fastestTime)}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mt-1">Fastest</div>
                        </div>
                    </div>

                    <SparklineBarChart data={metrics.chartData} />

                    {/* Leaderboard */}
                    <div>
                        <h3 className="font-serif font-bold text-lg mb-3 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-500" /> Leaderboard
                        </h3>
                        {metrics.leaderboard.length === 0 ? (
                            <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
                                <p className="text-sm italic">No scores yet. Be the first!</p>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-lg p-2 sm:p-4 space-y-2 sm:space-y-3 border border-gray-100 shadow-sm">
                                {metrics.leaderboard.map((entry, i) => (
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
                                            <span className="font-medium text-gray-900 truncate max-w-[150px] sm:max-w-[200px]">
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
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
