'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getGridNumbers, getClueNumber, GridCell } from '@/utils/crossword'

export default function CreateMiniCrossword() {
  const [title, setTitle] = useState('')
  const [grid, setGrid] = useState<GridCell[][]>(Array(5).fill(null).map(() => Array(5).fill('')))
  const [clues, setClues] = useState<{ across: Record<string, string>, down: Record<string, string> }>({ across: {}, down: {} })
  const [mode, setMode] = useState<'fill' | 'block'>('fill')
  
  const [activeCell, setActiveCell] = useState<{r: number, c: number} | null>(null)
  const [direction, setDirection] = useState<'across' | 'down'>('across')

  const router = useRouter()
  const supabase = createClient()
  const numbers = getGridNumbers(grid)

  // --- CHANGED: Calculate BOTH active clues ---
  const activeAcrossClue = activeCell 
    ? getClueNumber(activeCell.r, activeCell.c, 'across', grid, numbers) 
    : null
  
  const activeDownClue = activeCell 
    ? getClueNumber(activeCell.r, activeCell.c, 'down', grid, numbers) 
    : null

  const toggleBlock = (r: number, c: number) => {
    const newGrid = grid.map(row => [...row])
    newGrid[r][c] = newGrid[r][c] === null ? '' : null
    setGrid(newGrid)
  }

  const handleCellClick = (r: number, c: number) => {
    if (mode === 'block') {
      toggleBlock(r, c)
    } else {
      if (activeCell?.r === r && activeCell?.c === c) {
        setDirection(prev => prev === 'across' ? 'down' : 'across')
      } else {
        setActiveCell({ r, c })
      }
    }
  }

  const handleLetterChange = (r: number, c: number, val: string) => {
    if (mode === 'block') return
    if (val && !/^[a-zA-Z]$/.test(val)) return
    
    const newGrid = grid.map(row => [...row])
    newGrid[r][c] = val.toUpperCase()
    setGrid(newGrid)
  }

  const handleSave = async () => {
    if (!title) return toast.error('Please enter a title')
    const { error } = await supabase.from('games').insert({
      title,
      type: 'mini',
      user_id: (await supabase.auth.getUser()).data.user?.id,
      config: { grid, clues }
    })
    if (error) toast.error(error.message)
    else {
      toast.success('Mini Crossword Created!')
      router.push('/dashboard')
    }
  }

  // Helper for clue styling
  const getClueStyle = (num: number, type: 'across' | 'down') => {
    if (type === 'across') {
        if (activeAcrossClue === num) {
            return direction === 'across' ? "bg-yellow-200 border-yellow-400" : "bg-blue-100"
        }
    } else {
        if (activeDownClue === num) {
            return direction === 'down' ? "bg-yellow-200 border-yellow-400" : "bg-blue-100"
        }
    }
    return ""
  }

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif font-bold">Create Mini Crossword</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>Cancel</Button>
          <Button onClick={handleSave}>Publish Game</Button>
        </div>
      </div>
      
      <div className="flex gap-4 mb-6">
        <Input placeholder="Puzzle Title" value={title} onChange={e => setTitle(e.target.value)} className="max-w-md" />
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button onClick={() => setMode('fill')} className={cn("px-4 py-2 rounded text-sm font-medium", mode === 'fill' ? "bg-white shadow" : "text-gray-500")}>Type Letters</button>
          <button onClick={() => setMode('block')} className={cn("px-4 py-2 rounded text-sm font-medium", mode === 'block' ? "bg-black text-white shadow" : "text-gray-500")}>Place Blocks</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* GRID EDITOR */}
        <div>
          <div className="grid grid-cols-5 gap-0 border-2 border-black w-fit bg-black select-none shadow-lg">
            {grid.map((row, r) => (
              row.map((cell, c) => {
                const num = numbers[`${r}-${c}`]
                const isSelected = activeCell?.r === r && activeCell?.c === c
                
                return (
                  <div 
                    key={`${r}-${c}`} 
                    className={cn(
                      "w-14 h-14 relative border border-gray-300 flex items-center justify-center cursor-pointer",
                      cell === null ? "bg-black" : "bg-white",
                      isSelected && cell !== null && "bg-yellow-200"
                    )}
                    onClick={() => handleCellClick(r, c)}
                  >
                    {num && cell !== null && <span className="absolute top-0.5 left-0.5 text-[10px] font-bold leading-none select-none">{num}</span>}
                    {cell !== null && (
                      <input 
                        className="w-full h-full text-center text-2xl font-bold uppercase bg-transparent outline-none p-0 cursor-pointer"
                        value={cell}
                        onChange={(e) => handleLetterChange(r, c, e.target.value)}
                        disabled={mode === 'block'} 
                      />
                    )}
                    {mode === 'block' && <div className="absolute inset-0 z-10" />}
                  </div>
                )
              })
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">
             {mode === 'fill' ? 'Click cells to type. Click again to switch direction.' : 'Click to toggle black squares.'}
          </p>
        </div>

        {/* CLUES EDITOR */}
        <div className="grid grid-cols-2 gap-6 h-[500px] overflow-y-auto">
           {/* ACROSS */}
           <div className="space-y-3">
             <h3 className="font-bold border-b pb-2 sticky top-0 bg-white z-10">Across</h3>
             {Object.entries(numbers).sort((a,b) => a[1] - b[1]).map(([key, num]) => {
               const [r, c] = key.split('-').map(Number)
               const isAcross = (c === 0 || grid[r][c - 1] === null) && (c + 1 < 5 && grid[r][c + 1] !== null)
               if (!isAcross) return null

               return (
                  <div key={`a-${num}`} className={cn("flex items-center gap-2 p-2 rounded transition-colors border border-transparent", getClueStyle(num, 'across'))}>
                    <span className="font-bold w-6 text-right">{num}</span>
                    <Input 
                      placeholder="Clue..." 
                      value={clues.across[num] || ''}
                      onChange={e => setClues(prev => ({...prev, across: {...prev.across, [num]: e.target.value}}))}
                      className="bg-white"
                    />
                  </div>
               )
             })}
           </div>

           {/* DOWN */}
           <div className="space-y-3">
             <h3 className="font-bold border-b pb-2 sticky top-0 bg-white z-10">Down</h3>
             {Object.entries(numbers).sort((a,b) => a[1] - b[1]).map(([key, num]) => {
               const [r, c] = key.split('-').map(Number)
               const isDown = (r === 0 || grid[r - 1][c] === null) && (r + 1 < 5 && grid[r + 1][c] !== null)
               if (!isDown) return null

               return (
                  <div key={`d-${num}`} className={cn("flex items-center gap-2 p-2 rounded transition-colors border border-transparent", getClueStyle(num, 'down'))}>
                    <span className="font-bold w-6 text-right">{num}</span>
                    <Input 
                      placeholder="Clue..." 
                      value={clues.down[num] || ''}
                      onChange={e => setClues(prev => ({...prev, down: {...prev.down, [num]: e.target.value}}))}
                      className="bg-white"
                    />
                  </div>
               )
             })}
           </div>
        </div>
      </div>
    </div>
  )
}