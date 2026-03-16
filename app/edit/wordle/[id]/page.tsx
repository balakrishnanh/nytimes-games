'use client'
import { useState, useRef, useEffect, use } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function EditWordle({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params using React.use()
  const { id } = use(params)

  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [letters, setLetters] = useState<string[]>(['', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const supabase = createClient()

  // FETCH EXISTING DATA
  useEffect(() => {
    const fetchGame = async () => {
        // Use 'id' directly (not params.id)
        const { data, error } = await supabase.from('games').select('*').eq('id', id).single()
        
        if (error || !data) {
            toast.error('Could not load game')
            router.push('/dashboard')
            return
        }
        setTitle(data.title)
        setLetters(data.config.targetWord.split(''))
        setLoading(false)
    }
    fetchGame()
  }, [id, router, supabase]) // Depend on 'id'

  const handleChange = (index: number, value: string) => {
    if (value && !/^[a-zA-Z]$/.test(value)) return
    const newLetters = [...letters]
    newLetters[index] = value.toUpperCase()
    setLetters(newLetters)
    if (value && index < 4) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!letters[index] && index > 0) {
        const newLetters = [...letters]
        newLetters[index - 1] = ''
        setLetters(newLetters)
        inputRefs.current[index - 1]?.focus()
      } else {
        const newLetters = [...letters]
        newLetters[index] = ''
        setLetters(newLetters)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault(); inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 4) {
        e.preventDefault(); inputRefs.current[index + 1]?.focus()
    }
  }

const handleSave = async () => {
    // 1. Check the array directly for empty slots
    if (letters.some(l => l === '')) {
        return toast.error('Please fill in all 5 letters')
    }

    const targetWord = letters.join('')
    
    // 2. Double check length just to be safe
    if (targetWord.length !== 5) {
        return toast.error('Word must be 5 letters')
    }

    const { error } = await supabase
      .from('games')
      .update({
        title,
        config: { targetWord }
      })
      .eq('id', id)

    if (error) {
        toast.error('Failed to update game')
    } else {
        toast.success('Game saved!')
        router.push('/dashboard?tab=wordle')
        router.refresh()
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>

  return (
    <div className="container mx-auto max-w-lg p-8 space-y-8 flex flex-col items-center">
      <h1 className="text-3xl font-serif font-bold">Edit Wordle</h1>
      
      <div className="w-full space-y-6">
        <div className="space-y-2">
            <label className="text-sm font-medium">Game Title</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div className="space-y-2">
             <label className="text-sm font-medium block text-center sm:text-left">Target Word</label>
             <div className="flex justify-center gap-2 sm:gap-4">
                {letters.map((letter, index) => (
                    <input
                        key={index}
                        ref={el => { inputRefs.current[index] = el }}
                        type="text"
                        maxLength={1}
                        value={letter}
                        onChange={e => handleChange(index, e.target.value)}
                        onKeyDown={e => handleKeyDown(index, e)}
                        className={`w-14 h-14 sm:w-16 sm:h-16 text-3xl font-bold text-center uppercase rounded-md border-2 outline-none
                            ${letter ? 'border-gray-800 bg-white' : 'border-gray-300 bg-gray-50'}
                            focus:border-blue-500`}
                    />
                ))}
             </div>
        </div>

        <div className="flex justify-center gap-4 pt-6">
            <Button variant="outline" className="w-32" onClick={() => router.push('/dashboard?tab=wordle')}>Cancel</Button>
            <Button onClick={handleSave} className="w-40">Save Changes</Button>
        </div>
      </div>
    </div>
  )
}