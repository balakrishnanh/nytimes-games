'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { User } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

export default function AuthButtons({ user }: { user: User | null }) {
  const router = useRouter()
  const supabase = createClient()
  // Local state for instant UI updates
  const [currentUser, setCurrentUser] = useState<User | null>(user)

  // Sync local state whenever the server prop changes (e.g. on mount or refresh)
  useEffect(() => {
    setCurrentUser(user)
  }, [user])

  const handleLogout = async () => {
    // 1. Optimistically update UI immediately
    setCurrentUser(null) 
    
    // 2. Perform actual logout
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      toast.error('Error logging out')
      // Revert state if error (optional, but good practice)
      setCurrentUser(user) 
    } else {
      toast.success('Logged out')
      router.refresh() // Sync server components
      router.push('/login')
    }
  }

  // Render Logged In State
  if (currentUser) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 hidden sm:block">
            {currentUser.email}
        </span>
        <Link href="/dashboard">
            <Button variant="outline">Dashboard</Button>
        </Link>
        <Button onClick={handleLogout} variant="ghost">Log Out</Button>
      </div>
    )
  }

  // Render Logged Out State
  return (
    <div className="flex gap-4">
      <Link href="/login">
        <Button variant="ghost">Log In</Button>
      </Link>
      <Link href="/login">
        <Button>Get Started</Button>
      </Link>
    </div>
  )
}