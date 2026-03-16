'use client'
import Link from 'next/link'
import { ArrowLeft, Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GameProvider, useGame } from '../context/GameContext'
import { ScoreSyncer } from '@/components/ScoreSyncer'

interface GameShellProps {
  title: string
  gameType: string
  children: React.ReactNode
}

// 1. Inner Component that consumes the Context
function GameShellContent({ title, gameType, children }: GameShellProps) {
  const { seconds, isPaused, setIsPaused, gameStatus } = useGame()
  const backLink = `/dashboard?tab=${gameType}`

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Silently saves any pending guest score once user is logged in */}
      <ScoreSyncer />
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center relative z-20">
        <Link href={backLink}>
          <Button variant="ghost" className="pl-0 text-gray-500 hover:text-black gap-2">
            <ArrowLeft className="h-6 w-6" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </Link>

        {/* Timer Control */}
        <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-2">
            <span className="font-mono font-medium text-lg w-14 text-center">
                {formatTime(seconds)}
            </span>
            <button 
                onClick={() => setIsPaused(!isPaused)}
                // Disable pause if game is over
                disabled={gameStatus !== 'playing'}
                className="hover:bg-white rounded-full p-1 transition-colors disabled:opacity-50"
            >
                {isPaused ? <Play className="h-5 w-5 fill-current" /> : <Pause className="h-5 w-5 fill-current" />}
            </button>
        </div>
      </div>

      <div className="flex flex-col items-center pb-12 px-2 max-w-4xl mx-auto relative">
        <h1 className="text-4xl font-serif font-bold mb-8 text-center">{title}</h1>
        
        <div className="w-full flex justify-center relative">
            <div className={cn(
                "transition-all duration-300 w-full flex justify-center",
                isPaused && "blur-xl opacity-50 pointer-events-none select-none"
            )}>
                {children}
            </div>

            {isPaused && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center animate-in fade-in">
                    <div className="bg-white/90 shadow-2xl p-8 rounded-2xl text-center border backdrop-blur-sm">
                        <h2 className="text-2xl font-bold font-serif mb-2">Game Paused</h2>
                        <Button size="lg" onClick={() => setIsPaused(false)} className="w-full gap-2">
                            <Play className="h-4 w-4 fill-current" /> Resume
                        </Button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  )
}

// 2. Export Wrapper that provides the Context
export default function GameShell(props: GameShellProps) {
  return (
    <GameProvider>
      <GameShellContent {...props} />
    </GameProvider>
  )
}