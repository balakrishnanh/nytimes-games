'use client'
import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { GameResultModal } from '@/components/GameResultModal'
import { createClient } from '@/utils/supabase/client'
import { useGame } from '../../context/GameContext'
import { saveScore } from '@/utils/saveScore'

type WordItem = { text: string; groupColor: string }
type Group = { color: string; category: string; words: string[] }

const DIFFICULTY_ORDER = ['yellow', 'green', 'blue', 'purple']

export default function ConnectionsGame({ config, gameId }: { config: any, gameId: string }) {
  // 1. Use Global Context instead of local state for status/timer
  const { gameStatus, setGameStatus, seconds, user } = useGame()
  
  const [words, setWords] = useState<WordItem[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [solvedGroups, setSolvedGroups] = useState<Group[]>([])
  const [lives, setLives] = useState(4)
  const [showModal, setShowModal] = useState(false)
  
  // Local state just for the reveal animation, independent of game over status
  const [isRevealing, setIsRevealing] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    const allWords = config.groups.flatMap((g: any) => 
      g.words.map((w: string) => ({ text: w, groupColor: g.color }))
    )
    setWords(allWords.sort(() => Math.random() - 0.5))
  }, [config])

    // 2. Leaderboard Save Logic
    const saveGameScore = useCallback(async () => {
    if (user) {
      const { improved } = await saveScore(supabase, {
        gameId,
        userId: user.id,
        scoreSeconds: seconds,
      })
      if (improved) toast.success('New best score saved!')
    } 
    else {
      localStorage.setItem('pending_score', JSON.stringify({
        gameId,
        score: seconds,
        timestamp: Date.now()
      }))
    }
  }, [gameId, seconds, supabase, user])

  const toggleSelect = (word: string) => {
    // Disable interaction if game is over OR if we are currently animating the reveal
    if (gameStatus !== 'playing' || isRevealing) return
    if (selected.includes(word)) setSelected(selected.filter(s => s !== word))
    else if (selected.length < 4) setSelected([...selected, word])
  }

  const revealRemainingGroups = async () => {
    setIsRevealing(true)
    setGameStatus('lost') // Stop timer immediately
    setSelected([]) 

    const solvedColors = solvedGroups.map(g => g.color)
    const remainingGroups: Group[] = config.groups.filter((g: Group) => !solvedColors.includes(g.color))

    remainingGroups.sort((a, b) => {
        return DIFFICULTY_ORDER.indexOf(a.color) - DIFFICULTY_ORDER.indexOf(b.color)
    })

    for (const group of remainingGroups) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setWords(prev => prev.filter(w => !group.words.includes(w.text)))
        setSolvedGroups(prev => [...prev, group])
    }

    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRevealing(false)
    setShowModal(true)
  }

  const handleSubmit = () => {
    if (selected.length !== 4) return

    const firstWordGroup = words.find(w => w.text === selected[0])?.groupColor
    const isMatch = selected.every(s => words.find(w => w.text === s)?.groupColor === firstWordGroup)

    if (isMatch) {
      const groupInfo = config.groups.find((g: any) => g.color === firstWordGroup)
      setSolvedGroups([...solvedGroups, groupInfo])
      setWords(words.filter(w => !selected.includes(w.text)))
      setSelected([])
      
      // WIN CONDITION
      if (solvedGroups.length + 1 === 4) {
        setGameStatus('won') // Stop timer
        saveGameScore()      // Save score (best-only)
        setTimeout(() => setShowModal(true), 1500)
      } else {
        toast.success(`Found ${groupInfo.category}!`)
      }

    } else {
      const newLives = lives - 1
      setLives(newLives)
      setSelected([])
      
      // LOSS CONDITION
      if (newLives === 0) {
        toast.error('Out of mistakes!')
        revealRemainingGroups()
      } else {
        toast.error('Incorrect group')
      }
    }
  }

  return (
    <div className="max-w-2xl w-full px-4">
      <GameResultModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isWin={gameStatus === 'won'}
        gameType="connections"
        gameId={gameId}
      />

      <div className="space-y-2 mb-4 w-full">
        {solvedGroups.map((g, i) => (
          <div key={g.color} className={`p-4 rounded-lg font-bold text-center uppercase shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 ${
            g.color === 'yellow' ? 'bg-yellow-200 text-yellow-900' : 
            g.color === 'green' ? 'bg-green-200 text-green-900' : 
            g.color === 'blue' ? 'bg-blue-200 text-blue-900' : 'bg-purple-200 text-purple-900'
          }`}>
            <div className="text-lg tracking-wide">{g.category}</div>
            <div className="text-sm font-normal opacity-90">{g.words.join(', ')}</div>
          </div>
        ))}
      </div>

      <div className={cn(
            "grid grid-cols-4 gap-2 mb-8 transition-opacity duration-500", 
            isRevealing ? "opacity-50 pointer-events-none" : ""
      )}>
        {words.map((w) => (
          <button
            key={w.text}
            onClick={() => toggleSelect(w.text)}
            disabled={gameStatus !== 'playing' || isRevealing}
            className={cn(
              "h-20 bg-gray-100 rounded-lg font-bold uppercase text-xs md:text-sm transition-all duration-200 break-words p-1 hover:bg-gray-200",
              selected.includes(w.text) && "bg-gray-800 text-white scale-95 shadow-inner",
              (gameStatus !== 'playing' || isRevealing) && "cursor-default"
            )}
          >
            {w.text}
          </button>
        ))}
      </div>

      {!isRevealing && gameStatus === 'playing' && (
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
            <div className="flex gap-2 text-sm font-medium">Mistakes remaining: 
                <span className="flex gap-1">
                    {Array(lives).fill('●').map((c, i) => <span key={i} className="text-gray-800">{c}</span>)}
                </span>
            </div>
            <div className="flex gap-4">
                <Button variant="outline" onClick={() => setSelected([])} className="w-32">Deselect All</Button>
                <Button onClick={handleSubmit} disabled={selected.length !== 4} className="w-32">Submit</Button>
            </div>
        </div>
      )}
      
      {isRevealing && (
          <div className="text-center text-gray-500 italic animate-pulse">
              Revealing answers...
          </div>
      )}
    </div>
  )
}