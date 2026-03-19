'use client'

import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function SetNicknamePage() {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [nicknameError, setNicknameError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if the user is logged in, and if they already have a username
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      if (profile?.username && profile.username.trim() !== '') {
        // They already have a username, go to dashboard
        router.push('/dashboard')
      } else {
        setIsInitializing(false)
      }
    }

    checkUser()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim()) {
      return toast.error('Please enter a nickname')
    }

    setIsLoading(true)

    // 1. Check uniqueness
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('username')
      .ilike('username', username.trim())
      .single()

    if (existingUser) {
      setIsLoading(false)
      setNicknameError('Nickname is already taken. Please choose another one.')
      return
    }

    // 2. Update profile
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setIsLoading(false)
      return toast.error('Session expired. Please log in again.')
    }

    const { error } = await supabase
      .from('profiles')
      .update({ username: username.trim() })
      .eq('id', user.id)

    if (error) {
      setIsLoading(false)
      return toast.error(error.message)
    }

    toast.success('Nickname set successfully!')
    router.push('/dashboard')
    router.refresh()
  }

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-serif font-bold text-black mb-2">Welcome!</h1>
          <p className="text-gray-500 text-sm">
            Please choose a nickname to complete your profile before you start creating games.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nickname</Label>
            <Input 
              placeholder="Pick a unique nickname" 
              value={username}
              onChange={e => {
                setUsername(e.target.value)
                setNicknameError(null)
              }}
              className={`h-10 ${nicknameError ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
              required
              autoFocus
            />
            {nicknameError && (
              <p className="text-sm font-medium text-red-500 animate-in slide-in-from-top-1 fade-in duration-200">
                {nicknameError}
              </p>
            )}
          </div>
          <Button className="w-full h-10 font-semibold mt-4" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete Profile'}
          </Button>
        </form>
      </div>
    </div>
  )
}
