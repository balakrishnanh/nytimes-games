'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { RefreshCw, Delete } from 'lucide-react'
import { GameResultModal } from '@/components/GameResultModal'
import { useGame } from '@/context/GameContext'
import { saveScore } from '@/utils/saveScore'

// Game config shape
interface SpellingBeeConfig {
  letters: string[]
  centerLetter: string
  validWords: string[]
}

interface SpellingBeeProps {
  config: SpellingBeeConfig
  gameId: string
}

export default function SpellingBeeGame({ config, gameId }: SpellingBeeProps) {
  // We exclude the center letter from outer letters for shuffling
  const initialOuter = config.letters.filter(l => l !== config.centerLetter)
  const [outerLetters, setOuterLetters] = useState(initialOuter)
  const [currentGuess, setCurrentGuess] = useState('')
  const [foundWords, setFoundWords] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  
  // GameContext for timer and user
  const { seconds, setSeconds, setGameStatus, gameStatus, user } = useGame()

  // Create a ref for mapping the letters
  const validLettersSet = new Set(config.letters)
  const validWordsSet = new Set(config.validWords.map(w => w.toUpperCase()))

  const supabase = createClient()
  const [isRestored, setIsRestored] = useState(false)

  // Load progress
  useEffect(() => {
    const cached = sessionStorage.getItem(`nyt_spellingbee_${gameId}`)
    if (cached) {
        try {
            const parsed = JSON.parse(cached)
            setFoundWords(parsed.foundWords || [])
            setScore(parsed.score || 0)
            if (parsed.seconds) setSeconds(parsed.seconds)
            if (parsed.gameStatus) setGameStatus(parsed.gameStatus)
            
            if (parsed.gameStatus && parsed.gameStatus !== 'playing') {
                setTimeout(() => setShowModal(true), 800)
            }
        } catch (e) {
            console.error(e)
        }
    }
    setIsRestored(true)
  }, [gameId, setSeconds, setGameStatus])

  // Save progress
  useEffect(() => {
     if (!isRestored) return
     if (foundWords.length > 0 || gameStatus !== 'playing') {
         sessionStorage.setItem(`nyt_spellingbee_${gameId}`, JSON.stringify({ 
             foundWords, 
             score,
             seconds,
             gameStatus
         }))
     }
  }, [foundWords, score, seconds, gameStatus, gameId, isRestored])

  const showPopup = (msg: string) => {
      setMessage(msg)
      setTimeout(() => setMessage(null), 1500)
  }

  const shuffle = () => {
      const arr = [...outerLetters]
      for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]]
      }
      setOuterLetters(arr)
  }

  const handleChar = useCallback((char: string) => {
      if (currentGuess.length < 19) {
         setCurrentGuess(prev => prev + char)
      }
  }, [currentGuess])

  const handleDelete = useCallback(() => {
      setCurrentGuess(prev => prev.slice(0, -1))
  }, [])

  const handleEnter = useCallback(async () => {
      const guess = currentGuess.toUpperCase()
      if (guess.length === 0) return

      if (guess.length < 4) {
          showPopup("Too short")
          setCurrentGuess('')
          return
      }

      if (!guess.includes(config.centerLetter)) {
          showPopup("Missing center letter")
          setCurrentGuess('')
          return
      }

      for (const char of guess) {
          if (!validLettersSet.has(char)) {
              showPopup("Bad letters")
              setCurrentGuess('')
              return
          }
      }

      if (foundWords.includes(guess)) {
          showPopup("Already found")
          setCurrentGuess('')
          return
      }

      if (!validWordsSet.has(guess)) {
          showPopup("Not in word list")
          setCurrentGuess('')
          return
      }

      // Valid word! Calculate score
      let pts = 0
      if (guess.length === 4) pts = 1
      else pts = guess.length

      const isPangram = new Set(guess).size === 7
      if (isPangram) {
          pts += 7
          showPopup("Pangram!")
      } else {
          showPopup(`+${pts}`) // Or 'Awesome', 'Good', etc.
      }

      const newFoundWords = [guess, ...foundWords]
      const newScore = score + pts
      setScore(newScore)
      setFoundWords(newFoundWords)
      setCurrentGuess('')

      // WIN CONDITION: all words found
      if (newFoundWords.length === config.validWords.length) {
        setGameStatus('won')
        if (user) {
          const { improved } = await saveScore(supabase, {
            gameId,
            userId: user.id,
            scoreSeconds: seconds,
          })
          if (improved) toast.success('New best score saved!')
        } else {
          localStorage.setItem('pending_score', JSON.stringify({
            gameId,
            score: seconds,
            timestamp: Date.now()
          }))
        }
        setTimeout(() => setShowModal(true), 800)
      }

  }, [currentGuess, config.centerLetter, config.validWords.length, foundWords, score, seconds, user, supabase, gameId, setGameStatus, validLettersSet, validWordsSet])

  // Keyboard support
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Enter') {
              handleEnter()
          } else if (e.key === 'Backspace') {
              handleDelete()
          } else if (/^[a-zA-Z]$/.test(e.key)) {
              handleChar(e.key.toUpperCase())
          }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleChar, handleDelete, handleEnter])

  // Calculate hex positions
  // Pointy topped hexes. 6 outer hexes at angles starting from top (270 degrees)
  // 6 pieces -> 270, 330, 30, 90, 150, 210
  const outerAngles = [270, 330, 30, 90, 150, 210]
  const radius = 105 // distance from center

  return (
    <div className="flex flex-col md:flex-row w-full max-w-5xl mx-auto min-h-[600px] bg-white text-black font-sans items-center md:items-start justify-center p-4 gap-12">
      <GameResultModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isWin={true}
        gameType="spelling-bee"
        gameId={gameId}
      />
        
        {/* Play Area */}
        <div className="flex flex-col items-center w-full md:w-1/2 mt-12 relative">
            
            {/* Ephemeral Message */}
            <div className="h-8 mb-4">
                 {message && (
                     <div className="bg-black text-white px-4 py-2 rounded-md font-bold text-sm animate-in fade-in zoom-in duration-100">
                         {message}
                     </div>
                 )}
            </div>

            {/* Current Guess Display */}
            <div className="text-3xl font-bold uppercase tracking-widest h-12 mb-8 flex items-center justify-center min-w-[200px]">
                {currentGuess.split('').map((char, i) => (
                    <span key={i} className={char === config.centerLetter ? 'text-yellow-500' : (validLettersSet.has(char) ? 'text-black' : 'text-gray-300')}>
                        {char}
                    </span>
                ))}
                {/* Custom cursor blinking */}
                <span className="w-1 h-8 bg-yellow-400 animate-pulse ml-1" style={{ animationDuration: '1s' }} />
            </div>

            {/* Hexagon Grid */}
            <div className="relative w-[320px] h-[320px] flex items-center justify-center select-none">
                {/* Center Hex */}
                <HexLink 
                    char={config.centerLetter} 
                    isCenter={true} 
                    onClick={() => handleChar(config.centerLetter)}
                    style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
                />

                {/* Outer Hexes */}
                {outerLetters.map((char, idx) => {
                    const angleRad = (outerAngles[idx] * Math.PI) / 180
                    const dx = Math.cos(angleRad) * radius
                    const dy = Math.sin(angleRad) * radius
                    
                    return (
                        <HexLink 
                            key={`outer-${idx}`}
                            char={char}
                            isCenter={false}
                            onClick={() => handleChar(char)}
                            style={{ 
                                left: `calc(50% + ${dx}px)`, 
                                top: `calc(50% + ${dy}px)`, 
                                transform: 'translate(-50%, -50%)' 
                            }}
                        />
                    )
                })}
            </div>

            {/* Controls */}
            <div className="flex gap-4 mt-8">
                <Button variant="outline" className="h-14 px-6 rounded-full text-lg border-gray-300 hover:bg-gray-100" onClick={handleDelete}>Delete</Button>
                <Button variant="outline" className="h-14 w-14 rounded-full border-gray-300 hover:bg-gray-100 flex items-center justify-center p-0" onClick={shuffle}>
                    <RefreshCw className="w-6 h-6" />
                </Button>
                <Button variant="outline" className="h-14 px-6 rounded-full text-lg border-gray-300 hover:bg-gray-100" onClick={handleEnter}>Enter</Button>
            </div>
        </div>

        {/* Score and Word List Sidebar */}
        <div className="w-full md:w-96 border rounded-xl p-6 bg-white shadow-sm flex flex-col h-[600px]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div className="font-bold text-lg flex items-center gap-2">
                    Level <span className="bg-yellow-400 w-8 h-8 rounded-full flex items-center justify-center text-sm">{score}</span>
                </div>
                {/* Ranking bar placeholder. NYT uses dots. */}
                <div className="flex-1 flex justify-between items-center ml-4 px-2 hidden sm:flex">
                     {[0,1,2,3,4,5,6,7,8].map(i => (
                         <div key={i} className={`w-2 h-2 rounded-full ${score > i * 10 ? 'bg-yellow-400' : 'bg-gray-200'}`} />
                     ))}
                </div>
            </div>

            <h3 className="text-gray-600 mb-4 pb-2 border-b text-sm">You have found {foundWords.length} word{foundWords.length !== 1 && 's'}</h3>
            
            <div className="flex-1 overflow-y-auto">
                 <div className="flex flex-col gap-1">
                     {foundWords.map((word, idx) => (
                         <div key={idx} className={`capitalize text-lg py-1 ${new Set(word).size === 7 ? 'font-bold flex items-center justify-between' : ''}`}>
                             {word.toLowerCase()}
                             {new Set(word).size === 7 && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full uppercase tracking-widest">Pangram</span>}
                         </div>
                     ))}
                 </div>
            </div>
        </div>
        
    </div>
  )
}

// Hexagon SVG helper component
function HexLink({ char, isCenter, onClick, style }: { char: string, isCenter: boolean, onClick: () => void, style: React.CSSProperties }) {
    return (
        <div 
            className="absolute cursor-pointer active:scale-95 transition-transform"
            style={{ ...style, width: 100, height: 100 }}
            onClick={onClick}
        >
            <svg viewBox="0 0 100 100" className="drop-shadow-sm overflow-visible">
                <polygon 
                    points="50 3, 90.5 26.5, 90.5 73.5, 50 97, 9.5 73.5, 9.5 26.5" 
                    fill={isCenter ? "#fcd34d" : "#e5e7eb"} // yellow-400 or gray-200
                    className="hover:opacity-80 transition-opacity"
                />
                <text 
                    x="50" 
                    y="52" 
                    textAnchor="middle" 
                    dominantBaseline="central"
                    className="text-3xl font-bold fill-black font-sans"
                >
                    {char}
                </text>
            </svg>
        </div>
    )
}
