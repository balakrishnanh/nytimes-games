'use client'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { GameResultModal } from '@/components/GameResultModal'
import { useGame } from '@/context/GameContext'
import { getGridNumbers, getClueNumber, GridCell, GRID_SIZE } from '@/utils/crossword'
import { saveScore } from '@/utils/saveScore'

export default function MiniCrosswordGame({ config, gameId }: { config: any, gameId: string }) {
  const { gameStatus, setGameStatus, seconds, setSeconds, user } = useGame()
  
  const [userGrid, setUserGrid] = useState<GridCell[][]>(
    config.grid.map((row: any[]) => row.map(cell => cell === null ? null : ''))
  )
  const [lockedCells, setLockedCells] = useState<boolean[][]>(
    Array(GRID_SIZE).fill(false).map(() => Array(GRID_SIZE).fill(false))
  )
  // NEW: Track which cells are explicitly marked "Wrong"
  const [wrongCells, setWrongCells] = useState<boolean[][]>(
    Array(GRID_SIZE).fill(false).map(() => Array(GRID_SIZE).fill(false))
  )
  
  const [activeCell, setActiveCell] = useState<{r: number, c: number}>({r: 0, c: 0})
  const [direction, setDirection] = useState<'across' | 'down'>('across')
  const [showModal, setShowModal] = useState(false)
  const [isRestored, setIsRestored] = useState(false)
  
  const supabase = createClient()
  
  // --- State Persistence ---
  useEffect(() => {
    const savedState = sessionStorage.getItem(`nyt_minicrossword_${gameId}`)
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState)
            if (parsed.userGrid && parsed.userGrid.length === GRID_SIZE) {
               setUserGrid(parsed.userGrid)
               if (parsed.lockedCells) setLockedCells(parsed.lockedCells)
               if (parsed.wrongCells) setWrongCells(parsed.wrongCells)
               if (parsed.seconds) setSeconds(parsed.seconds)
               if (parsed.gameStatus) setGameStatus(parsed.gameStatus)
               
               if (parsed.gameStatus && parsed.gameStatus !== 'playing') {
                   setTimeout(() => setShowModal(true), 800)
               }
            }
        } catch(e) { console.error(e) }
    }
    setIsRestored(true)
  }, [gameId, setSeconds, setGameStatus])

  useEffect(() => {
     if (!isRestored) return
     // Save if any cell is filled or status isn't playing
     const hasFilled = userGrid.some(row => row.some(cell => cell !== '' && cell !== null))
     if (hasFilled || gameStatus !== 'playing') {
         sessionStorage.setItem(`nyt_minicrossword_${gameId}`, JSON.stringify({
            userGrid,
            lockedCells,
            wrongCells,
            seconds,
            gameStatus
         }))
     }
  }, [userGrid, lockedCells, wrongCells, seconds, gameStatus, gameId, isRestored])
  
  const inputRefs = useRef<(HTMLInputElement | null)[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
  )

  const numbers = getGridNumbers(config.grid)
  
  const activeAcrossClue = getClueNumber(activeCell.r, activeCell.c, 'across', config.grid, numbers)
  const activeDownClue = getClueNumber(activeCell.r, activeCell.c, 'down', config.grid, numbers)

  // --- NAVIGATION ---
  const moveFocus = (r: number, c: number) => {
    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && config.grid[r][c] !== null) {
      setActiveCell({ r, c })
      inputRefs.current[r][c]?.focus()
    }
  }

  const handleCellClick = (r: number, c: number) => {
    if (config.grid[r][c] === null) return
    if (activeCell.r === r && activeCell.c === c) {
      setDirection(prev => prev === 'across' ? 'down' : 'across')
    } else {
      setActiveCell({ r, c })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, r: number, c: number) => {
    if (gameStatus !== 'playing') return

    // Clear wrong state on interaction
    if (wrongCells[r][c]) {
        const newWrong = [...wrongCells.map(row => [...row])]
        newWrong[r][c] = false
        setWrongCells(newWrong)
    }

    if (e.key === 'ArrowRight') moveFocus(r, c + 1)
    else if (e.key === 'ArrowLeft') moveFocus(r, c - 1)
    else if (e.key === 'ArrowDown') moveFocus(r + 1, c)
    else if (e.key === 'ArrowUp') moveFocus(r - 1, c)
    else if (e.key === ' ') {
      e.preventDefault()
      setDirection(prev => prev === 'across' ? 'down' : 'across')
    }
    else if (e.key === 'Backspace') {
      if (userGrid[r][c] === '' && !lockedCells[r][c]) {
         const prevR = direction === 'across' ? r : r - 1
         const prevC = direction === 'across' ? c - 1 : c
         if (prevR >= 0 && prevC >= 0 && config.grid[prevR][prevC] !== null) {
             moveFocus(prevR, prevC)
             if (!lockedCells[prevR][prevC]) {
                 const newGrid = [...userGrid.map(row => [...row])]
                 newGrid[prevR][prevC] = ''
                 setUserGrid(newGrid)
                 // Also clear wrong for prev cell if we delete it
                 if (wrongCells[prevR][prevC]) {
                    const newWrong = [...wrongCells.map(row => [...row])]
                    newWrong[prevR][prevC] = false
                    setWrongCells(newWrong)
                 }
             }
         }
      } else if (!lockedCells[r][c]) {
         const newGrid = [...userGrid.map(row => [...row])]
         newGrid[r][c] = ''
         setUserGrid(newGrid)
      }
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, r: number, c: number) => {
    const val = e.target.value.slice(-1)
    if (!/^[a-zA-Z]$/.test(val) && val !== '') return
    
    // 1. Clear "Wrong" state since user is editing it
    if (wrongCells[r][c]) {
        const newWrong = [...wrongCells.map(row => [...row])]
        newWrong[r][c] = false
        setWrongCells(newWrong)
    }

    // 2. Update Grid
    if (!lockedCells[r][c]) {
        const newGrid = [...userGrid.map(row => [...row])]
        newGrid[r][c] = val.toUpperCase()
        setUserGrid(newGrid)
    }

    // 3. Auto Advance
    if (val) {
        if (direction === 'across') {
             if (c + 1 < GRID_SIZE && config.grid[r][c+1] !== null) moveFocus(r, c + 1)
        } else {
             if (r + 1 < GRID_SIZE && config.grid[r+1][c] !== null) moveFocus(r + 1, c)
        }
    }
  }

  const handleCheck = async () => {
    let isComplete = true
    let hasErrors = false
    const newLocked = [...lockedCells.map(r => [...r])]
    const newWrong = Array(GRID_SIZE).fill(false).map(() => Array(GRID_SIZE).fill(false)) // Reset wrongs
    
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (config.grid[r][c] === null) continue
            
            const userLetter = userGrid[r][c]
            const correctLetter = config.grid[r][c]

            if (userLetter === correctLetter) {
                newLocked[r][c] = true
            } else if (userLetter !== '') {
                // If filled but not correct, mark as WRONG
                newWrong[r][c] = true
                hasErrors = true
                isComplete = false
            } else {
                // Empty cells are just incomplete, not "wrong"
                isComplete = false
            }
        }
    }

    setLockedCells(newLocked)
    setWrongCells(newWrong) // Apply red shading
    
    if (isComplete && !hasErrors) {
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
        setShowModal(true)
    } else if (hasErrors) {
        toast.error("Found errors")
    } else {
        toast.info("Keep going!")
    }
  }

  // --- RENDER ---
  return (
    <div className="flex flex-col md:flex-row gap-8 items-start justify-center w-full max-w-5xl mx-auto px-4">
      <GameResultModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        isWin={gameStatus === 'won'} 
        gameType="mini"
        gameId={gameId}
      />

      {/* GRID */}
      <div className="flex flex-col items-center gap-4">
        <div className="grid grid-cols-5 gap-0 border-2 border-black bg-black w-fit shadow-lg select-none">
          {userGrid.map((row, r) => (
            row.map((cell, c) => {
              const isBlock = config.grid[r][c] === null
              const isSelected = activeCell.r === r && activeCell.c === c
              const isLocked = lockedCells[r][c]
              const isWrong = wrongCells[r][c] // Check if wrong
              const num = numbers[`${r}-${c}`]
              
              const cellAcross = getClueNumber(r, c, 'across', config.grid, numbers)
              const cellDown = getClueNumber(r, c, 'down', config.grid, numbers)
              
              const isActiveWord = !isBlock && (
                  (direction === 'across' && cellAcross === activeAcrossClue) || 
                  (direction === 'down' && cellDown === activeDownClue)
              )

              if (isBlock) return <div key={`${r}-${c}`} className="w-12 h-12 md:w-16 md:h-16 bg-black" />

              return (
                <div 
                  key={`${r}-${c}`} 
                  className={cn(
                    "w-12 h-12 md:w-16 md:h-16 relative border border-gray-300 flex items-center justify-center cursor-pointer transition-colors",
                    // PRIORITIES: Wrong > Locked > Selected > ActiveWord > Default
                    isWrong ? "bg-red-100" : (isLocked ? "bg-blue-50" : "bg-white"),
                    isActiveWord && !isSelected && !isLocked && !isWrong && "bg-blue-100",
                    isSelected && !isWrong && "bg-yellow-200"
                  )}
                  onClick={() => handleCellClick(r, c)}
                >
                  {num && <span className="absolute top-0.5 left-0.5 text-[8px] md:text-[10px] font-bold leading-none select-none">{num}</span>}
                  
                  <input
                    ref={el => { inputRefs.current[r][c] = el }}
                    className={cn(
                        "w-full h-full text-center text-xl md:text-3xl font-bold uppercase bg-transparent outline-none p-0 caret-transparent cursor-pointer",
                        isWrong ? "text-red-600 font-extrabold" : (isLocked ? "text-blue-600" : "text-black")
                    )}
                    value={cell as string}
                    onChange={(e) => handleInput(e, r, c)}
                    onKeyDown={(e) => handleKeyDown(e, r, c)}
                    disabled={isLocked || gameStatus !== 'playing'}
                    autoComplete="off"
                  />
                  {/* Optional Corner mark for correct */}
                  {isLocked && <div className="absolute top-0 right-0 w-0 h-0 border-t-[8px] border-r-[8px] border-t-transparent border-r-blue-500 opacity-50" />}
                </div>
              )
            })
          ))}
        </div>
        
        <div className="flex gap-4 w-full">
            <Button className="w-full py-6 text-lg" onClick={handleCheck} disabled={gameStatus !== 'playing'}>
                Check Puzzle
            </Button>
        </div>
      </div>

      {/* CLUES */}
      <div className="flex-1 w-full flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <h3 className="font-bold border-b-2 border-black mb-2 text-lg">ACROSS</h3>
          <ul className="space-y-1 text-sm md:text-base">
            {Object.entries(config.clues.across || {}).map(([num, text]) => (
              <li key={`a-${num}`} className={cn(
                  "p-2 rounded cursor-pointer flex gap-2 transition-colors",
                  activeAcrossClue === Number(num) 
                    ? (direction === 'across' ? "bg-yellow-200 font-bold" : "bg-blue-100")
                    : "hover:bg-gray-100"
              )}>
                <span className="font-bold">{num}</span>
                <span>{text as string}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold border-b-2 border-black mb-2 text-lg">DOWN</h3>
          <ul className="space-y-1 text-sm md:text-base">
            {Object.entries(config.clues.down || {}).map(([num, text]) => (
              <li key={`d-${num}`} className={cn(
                  "p-2 rounded cursor-pointer flex gap-2 transition-colors",
                  activeDownClue === Number(num) 
                    ? (direction === 'down' ? "bg-yellow-200 font-bold" : "bg-blue-100")
                    : "hover:bg-gray-100"
              )}>
                <span className="font-bold">{num}</span>
                <span>{text as string}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}