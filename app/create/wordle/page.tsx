'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function CreateWordle() {
  const [title, setTitle] = useState('')
  const [letters, setLetters] = useState<string[]>(['', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const supabase = createClient()

  // Handle typing a letter
  const handleChange = (index: number, value: string) => {
    if (value && !/^[a-zA-Z]$/.test(value)) return
    const newLetters = [...letters]
    newLetters[index] = value.toUpperCase()
    setLetters(newLetters)
    
    // Auto-advance focus
    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle navigation
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
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 4) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5)
    if (pasted) {
      const newLetters = [...letters]
      pasted.split('').forEach((char, i) => { if (i < 5) newLetters[i] = char })
      setLetters(newLetters)
      const nextFocusIndex = Math.min(pasted.length, 4)
      inputRefs.current[nextFocusIndex]?.focus()
    }
  }

  const handleSave = async () => {
    // FIX: Check the array for empty strings BEFORE joining
    if (letters.some(l => l === '')) {
        return toast.error('Please fill in all 5 letters')
    }

    const targetWord = letters.join('')
    
    // Safety check on length
    if (targetWord.length !== 5) {
        return toast.error('Word must be 5 letters')
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        setLoading(false)
        return toast.error('You must be logged in')
    }

    const { error } = await supabase.from('games').insert({
      user_id: user.id,
      type: 'wordle',
      title: title || 'Untitled Wordle',
      config: { targetWord }
    })

    if (error) {
        toast.error(error.message)
        setLoading(false)
    } else {
        toast.success('Wordle created!')
        router.push('/dashboard')
    }
  }

  return (
    <div className="container mx-auto max-w-lg p-8 space-y-8 flex flex-col items-center">
      <div className="w-full space-y-2 text-center">
        <h1 className="text-3xl font-serif font-bold">Create Wordle</h1>
        <p className="text-gray-500">Set the secret 5-letter word for your players.</p>
      </div>

      <div className="w-full space-y-6">
        {/* Title Input */}
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Game Title</label>
            <Input 
                placeholder="e.g. For Mom's Birthday" 
                value={title}
                onChange={e => setTitle(e.target.value)} 
            />
        </div>

        {/* Interactive Grid Input */}
        <div className="space-y-2">
             <label className="text-sm font-medium text-gray-700 block text-center sm:text-left">Target Word</label>
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
                        onPaste={handlePaste}
                        className={`
                            w-14 h-14 sm:w-16 sm:h-16 text-3xl font-bold text-center uppercase rounded-md border-2 transition-all outline-none
                            ${letter ? 'border-gray-800 bg-white' : 'border-gray-300 bg-gray-50'}
                            focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white
                        `}
                    />
                ))}
             </div>
             <p className="text-xs text-center text-gray-400 mt-2">
                 Tip: You can paste a 5-letter word directly.
             </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-4 pt-6">
            <Button 
                variant="outline" 
                className="w-32" 
                onClick={() => router.back()}
                disabled={loading}
            >
                Cancel
            </Button>
            <Button 
                onClick={handleSave} 
                className="w-40"
                disabled={loading}
            >
                {loading ? <Loader2 className="animate-spin" /> : 'Create Game'}
            </Button>
        </div>
      </div>
    </div>
  )
}