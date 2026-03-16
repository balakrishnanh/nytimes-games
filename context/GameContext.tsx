'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface GameContextType {
  seconds: number
  isPaused: boolean
  setIsPaused: (val: boolean) => void
  gameStatus: 'playing' | 'won' | 'lost'
  setGameStatus: (status: 'playing' | 'won' | 'lost') => void
  user: any | null
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [seconds, setSeconds] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing')
  const [user, setUser] = useState<any | null>(null) 
  const supabase = createClient()

  useEffect(() => {
    
    let interval: NodeJS.Timeout
    // Only count time if playing AND not paused
    if (!isPaused && gameStatus === 'playing') {
      interval = setInterval(() => setSeconds(s => s + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [isPaused, gameStatus])

  useEffect(() => {
    // Check user on load
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  return (
    <GameContext.Provider value={{ seconds, isPaused, setIsPaused, gameStatus, setGameStatus, user }}>
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) throw new Error('useGame must be used within GameProvider')
  return context
}