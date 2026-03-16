'use client'
import { useState, useRef, useEffect, use } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function EditSpellingBee({ params }: { params: Promise<{ id: string }> }) {
  // Use `use` hook to unwrap the promise
  const resolvedParams = use(params)
  const id = resolvedParams.id
  
  const [title, setTitle] = useState('')
  const [letters, setLetters] = useState<string[]>(Array(7).fill(''))
  const [centerLetterIdx, setCenterLetterIdx] = useState<number>(0)
  const [loading, setLoading] = useState(true) // Start loading while fetching data
  const [saving, setSaving] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchGame() {
      try {
        const { data, error } = await supabase
          .from('games')
          .select('title, config, user_id, type')
          .eq('id', id)
          .single()

        if (error) throw error

        // Security / validation
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || user.id !== data.user_id) {
          toast.error("You don't have permission to edit this game")
          router.push('/dashboard')
          return
        }

        if (data.type !== 'spelling-bee') {
          toast.error("This is not a Spelling Bee game")
          router.push('/dashboard')
          return
        }

        // Populate fields
        setTitle(data.title)
        if (data.config && data.config.letters) {
            setLetters(data.config.letters)
            const idx = data.config.letters.findIndex((l: string) => l === data.config.centerLetter)
            if (idx !== -1) setCenterLetterIdx(idx)
        }

      } catch (err) {
        toast.error('Failed to load game')
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchGame()
  }, [id, router, supabase])

  const handleChange = (index: number, value: string) => {
    if (value && !/^[a-zA-Z]$/.test(value)) return
    const newLetters = [...letters]
    newLetters[index] = value.toUpperCase()
    setLetters(newLetters)
    
    if (value && index < 6) {
      inputRefs.current[index + 1]?.focus()
    }
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
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 6) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 7)
    if (pasted) {
      const newLetters = [...letters]
      const uniquePasted = Array.from(new Set(pasted.split('')))
      uniquePasted.forEach((char, i) => { if (i < 7) newLetters[i] = char })
      setLetters(newLetters)
      const nextFocusIndex = Math.min(uniquePasted.length, 6)
      inputRefs.current[nextFocusIndex]?.focus()
    }
  }

  const handleSave = async () => {
    if (letters.some(l => l === '')) {
      return toast.error('Please fill in all 7 letters')
    }

    const uniqueSet = new Set(letters)
    if (uniqueSet.size !== 7) {
      return toast.error('All 7 letters must be unique')
    }

    setSaving(true)
    const centerLetter = letters[centerLetterIdx]
    const validCharsSet = new Set(letters)

    try {
      // Re-fetch dictionary and re-validate just in case they changed the letters
      const res = await fetch('https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt')
      if (!res.ok) throw new Error("Failed to load dictionary")
      const text = await res.text()
      const words = text.split(/\r?\n/)

      // Filter words based on Spelling Bee rules
      const validWords = words.filter(word => {
        const w = word.toUpperCase()
        if (w.length < 4) return false
        if (!w.includes(centerLetter)) return false
        
        for (let char of w) {
          if (!validCharsSet.has(char)) return false
        }
        return true
      })

      if (validWords.length === 0) {
        setSaving(false)
        return toast.error('No valid words found with these letters! Try a different combination.')
      }

      if (validWords.length < 10) {
         toast.warning(`Warning: Only ${validWords.length} words found. The game might be very short!`)
      }

      // Update the existing record instead of inserting a new one
      const { error } = await supabase
        .from('games')
        .update({
          title: title || 'Untitled Spelling Bee',
          config: { 
            letters, 
            centerLetter, 
            validWords 
          }
        })
        .eq('id', id)

      if (error) throw error

      toast.success('Spelling Bee updated!')
      router.push('/dashboard?tab=spelling-bee')

    } catch (err: any) {
      toast.error(err.message || 'Error occurred while saving')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-lg p-8 space-y-8 flex flex-col items-center">
      <div className="w-full space-y-2 text-center">
        <h1 className="text-3xl font-serif font-bold">Edit Spelling Bee</h1>
        <p className="text-gray-500">Update your 7 unique letters and center letter.</p>
      </div>

      <div className="w-full space-y-6">
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Game Title</label>
            <Input 
                placeholder="e.g. Weekly Challenge" 
                value={title}
                onChange={e => setTitle(e.target.value)} 
            />
        </div>

        <div className="space-y-4">
             <label className="text-sm font-medium text-gray-700 block text-center sm:text-left">
               Unique Letters
             </label>
             <div className="flex justify-center gap-2">
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
                            w-10 h-10 sm:w-14 sm:h-14 text-2xl font-bold text-center uppercase rounded-md border-2 transition-all outline-none
                            ${letter ? 'border-gray-800 bg-white' : 'border-gray-300 bg-gray-50'}
                            focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white
                        `}
                    />
                ))}
             </div>
             
             {letters.every(l => l !== '') && new Set(letters).size === 7 && (
                 <div className="mt-4 p-4 border rounded-md bg-yellow-50">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Choose the Center Letter
                    </label>
                    <div className="flex justify-center gap-2">
                        {letters.map((letter, index) => (
                             <button
                                key={index}
                                onClick={() => setCenterLetterIdx(index)}
                                className={`
                                    w-10 h-10 sm:w-12 sm:h-12 text-xl font-bold flex items-center justify-center uppercase rounded-full transition-all border-2
                                    ${centerLetterIdx === index 
                                        ? 'bg-yellow-400 border-yellow-500 text-black shadow-md scale-110' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                                    }
                                `}
                             >
                                 {letter}
                             </button>
                        ))}
                    </div>
                 </div>
             )}
        </div>

        <div className="flex justify-center gap-4 pt-6">
            <Button 
                variant="outline" 
                className="w-32" 
                onClick={() => router.push('/dashboard?tab=spelling-bee')}
                disabled={saving || loading}
            >
                Cancel
            </Button>
            <Button 
                onClick={handleSave} 
                className="w-40"
                disabled={saving || loading || letters.some(l => l === '') || new Set(letters).size !== 7}
            >
                {saving ? <Loader2 className="animate-spin" /> : 'Save Changes'}
            </Button>
        </div>
      </div>
    </div>
  )
}
