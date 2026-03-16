'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Delete } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GameResultModal } from '@/components/GameResultModal'
import { useGame } from '../../context/GameContext'
import { saveScore } from '@/utils/saveScore'

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
]

export default function WordleGame({ config, gameId }: { config: any, gameId: string }) {
  // Use Global Context for Status & Timer
  const { gameStatus, setGameStatus, seconds, user } = useGame()
  
  const [guesses, setGuesses] = useState<string[]>([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [pressedKey, setPressedKey] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  
  const target = config.targetWord
  const supabase = createClient()

  // --- Leaderboard Logic ---
  const saveGameScore = useCallback(async () => {
    // 1. Authenticated User: Save directly to DB
    if (user) {
      const { improved } = await saveScore(supabase, {
        gameId,
        userId: user.id,
        scoreSeconds: seconds,
      })
      if (improved) toast.success('New best score saved!')
    }
    // 2. Guest User: Save to LocalStorage
    else {
      localStorage.setItem('pending_score', JSON.stringify({
        gameId,
        score: seconds,
        timestamp: Date.now()
      }))
    }
  }, [gameId, seconds, supabase, user])

  // --- Keyboard Visuals ---
  const getKeyStyles = useCallback(() => {
    const styles: Record<string, string> = {}
    guesses.forEach((guess) => {
      guess.split('').forEach((letter, i) => {
        if (target[i] === letter) {
          styles[letter] = 'bg-green-500 text-white border-green-600'
        } else if (target.includes(letter) && styles[letter] !== 'bg-green-500 text-white border-green-600') {
          styles[letter] = 'bg-yellow-500 text-white border-yellow-600'
        } else if (!target.includes(letter)) {
          styles[letter] = 'bg-gray-600 text-white border-gray-700'
        }
      })
    })
    return styles
  }, [guesses, target])

  const keyStyles = getKeyStyles()

  // --- Input Logic ---
  const handleInput = useCallback((key: string) => {
    // Only allow input if the game is actively playing
    if (gameStatus !== 'playing') return

    if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1))
    } else if (key === 'ENTER') {
      if (currentGuess.length !== 5) {
        toast.error('Not enough letters')
        return
      }
      
      const newGuesses = [...guesses, currentGuess]
      setGuesses(newGuesses)
      setCurrentGuess('')

      // WIN CONDITION
      if (currentGuess === target) {
        setGameStatus('won')
        saveGameScore()
        setTimeout(() => setShowModal(true), 1500)
      } 
      // LOSS CONDITION
      else if (newGuesses.length >= 6) {
        setGameStatus('lost')
        setTimeout(() => setShowModal(true), 1500)
      }
    } else if (/^[A-Z]$/.test(key)) {
      if (currentGuess.length < 5) {
        setCurrentGuess(prev => prev + key)
      }
    }
  }, [currentGuess, guesses, target, gameStatus, saveScore, setGameStatus])

  // --- Physical Keyboard Listener ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase()
      let mappedKey = key
      if (key === 'ENTER') mappedKey = 'ENTER'
      else if (key === 'BACKSPACE') mappedKey = 'BACKSPACE'
      else if (!/^[A-Z]$/.test(key)) return

      setPressedKey(mappedKey)
      handleInput(mappedKey)
      setTimeout(() => setPressedKey(null), 150)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleInput])

  // --- Grid Coloring Algorithm ---
  const getRowColors = (guess: string) => {
    const result = new Array(5).fill('bg-gray-500 border-gray-500')
    const guessArr = guess.split('')
    const targetArr = target.split('')
    
    // Count letter frequency in target
    const letterCounts: Record<string, number> = {}
    for (const char of targetArr) letterCounts[char] = (letterCounts[char] || 0) + 1

    // Pass 1: Green (Correct Position)
    guessArr.forEach((char, i) => {
      if (char === targetArr[i]) {
        result[i] = 'bg-green-500 border-green-500'
        letterCounts[char]--
      }
    })

    // Pass 2: Yellow (Wrong Position)
    guessArr.forEach((char, i) => {
      if (result[i] !== 'bg-green-500 border-green-500' && letterCounts[char] > 0) {
        result[i] = 'bg-yellow-500 border-yellow-500'
        letterCounts[char]--
      }
    })
    return result
  }

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto px-2">
      {/* Result Modal */}
      <GameResultModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        isWin={gameStatus === 'won'} 
        answer={target}
        gameType="wordle" 
        gameId={gameId} // <-- Added this
      />

      {/* Game Grid */}
      <div className="mb-8 space-y-2">
        {/* Past Guesses */}
        {guesses.map((guess, i) => {
          const colors = getRowColors(guess)
          return (
            <div key={i} className="flex gap-2">
              {guess.split('').map((char, j) => (
                <div key={j} className={`w-14 h-14 flex items-center justify-center font-bold text-2xl uppercase text-white border-2 rounded ${colors[j]}`}>
                  {char}
                </div>
              ))}
            </div>
          )
        })}

        {/* Current Active Row */}
        {guesses.length < 6 && gameStatus === 'playing' && (
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => {
              const char = currentGuess[i] || ''
              return (
                <div key={i} className={`w-14 h-14 flex items-center justify-center font-bold text-2xl uppercase border-2 rounded ${char ? 'border-gray-800 animate-pulse-once' : 'border-gray-200'}`}>
                  {char}
                </div>
              )
            })}
          </div>
        )}

        {/* Empty Future Rows */}
        {/* We calculate how many empty rows to show. If playing, subtract 1 for the active row. */}
        {[...Array(Math.max(0, 6 - guesses.length - (gameStatus === 'playing' ? 1 : 0)))].map((_, i) => (
          <div key={`empty-${i}`} className="flex gap-2 opacity-30">
            {[...Array(5)].map((_, j) => (
              <div key={j} className="w-14 h-14 border-2 border-gray-200 rounded"></div>
            ))}
          </div>
        ))}
      </div>

      {/* Virtual Keyboard */}
      <div className="w-full space-y-2">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1.5">
            {row.map((key) => {
              const isSpecial = key.length > 1
              const statusStyle = keyStyles[key] || 'bg-gray-200 hover:bg-gray-300 text-black'
              const isPressed = pressedKey === key
              return (
                <button
                  key={key}
                  onClick={(e) => { 
                      handleInput(key)
                      e.currentTarget.blur() // Remove focus so "Enter" doesn't re-trigger
                  }}
                  tabIndex={-1} // Remove from tab order
                  className={cn(
                    "flex items-center justify-center rounded font-bold text-sm transition-all duration-75 select-none",
                    isSpecial ? "px-3 sm:px-4 py-4 text-xs" : "w-8 sm:w-10 h-14 text-lg",
                    statusStyle,
                    isPressed && "scale-95 brightness-90 shadow-inner"
                  )}
                >
                  {key === 'BACKSPACE' ? <Delete className="w-6 h-6" /> : key === 'ENTER' ? 'ENTER' : key}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}