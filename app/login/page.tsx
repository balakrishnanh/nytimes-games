'use client'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'

function LoginPageInner() {
  // Mode Toggle
  const [view, setView] = useState<'login' | 'signup'>('login')
  
  // Form Fields
  const [identifier, setIdentifier] = useState('') // Used for Login (Email OR Username)
  const [email, setEmail] = useState('')           // Used for Signup
  const [username, setUsername] = useState('')     // Used for Signup
  const [password, setPassword] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    let loginEmail = identifier.trim()

    // 1. Check if input is a Username (no '@' symbol)
    if (!loginEmail.includes('@')) {
      // Look up the email associated with this username
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .ilike('username', loginEmail) // Case-insensitive lookup
        .single()

      if (error || !data?.email) {
        setIsLoading(false)
        return toast.error('Username not found')
      }
      loginEmail = data.email
    }

    // 2. Perform Login with the resolved email
    const { error } = await supabase.auth.signInWithPassword({ 
      email: loginEmail, 
      password 
    })

    if (error) {
      toast.error('Invalid credentials')
    } else {
      toast.success('Logged in successfully')
      router.push(redirectTo)
      router.refresh()
    }
    setIsLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // 1. Validate Username Uniqueness manually first
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('username')
      .ilike('username', username.trim())
      .single()

    if (existingUser) {
      setIsLoading(false)
      return toast.error('Username is already taken')
    }

    // 2. Sign Up
    const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            // This data is passed to the SQL Trigger we created
            data: { username: username.trim() } 
        }
    })
    
    setIsLoading(false)

    if (error) {
        toast.error(error.message)
    } else {
        setSignupSuccess(true)
    }
  }

  // View: Success Screen
  if (signupSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm p-8 bg-white rounded-xl shadow-lg border border-gray-100 text-center space-y-6 animate-in fade-in zoom-in-95">
          <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold text-gray-900">Check your email</h2>
            <p className="text-gray-500 text-sm">We sent a confirmation link to <span className="font-semibold">{email}</span>.</p>
          </div>
          <Button variant="outline" className="w-full" onClick={() => { setSignupSuccess(false); setView('login') }}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-8 pb-6 text-center">
            <h1 className="text-3xl font-serif font-bold text-black">NYT Maker</h1>
            <p className="text-gray-500 text-sm mt-2">
                {view === 'login' ? 'Welcome back, creator.' : 'Join to start building games.'}
            </p>
        </div>

        {/* TABS */}
        <div className="flex border-b">
            <button 
                onClick={() => setView('login')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${view === 'login' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
            >
                Log In
            </button>
            <button 
                onClick={() => setView('signup')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${view === 'signup' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
            >
                Sign Up
            </button>
        </div>

        {/* FORMS */}
        <div className="p-8 pt-6">
            {view === 'login' ? (
                /* LOGIN FORM */
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Email or Username</Label>
                        <Input 
                            placeholder="Enter username or email" 
                            value={identifier}
                            onChange={e => setIdentifier(e.target.value)}
                            className="h-10"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Password</Label>
                        <Input 
                            type="password" 
                            placeholder="••••••••" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="h-10"
                            required
                        />
                    </div>
                    <Button className="w-full h-10 font-semibold mt-4" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log In'}
                    </Button>
                </form>
            ) : (
                /* SIGNUP FORM */
                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Username</Label>
                        <Input 
                            placeholder="Pick a unique username" 
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="h-10"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input 
                            type="email"
                            placeholder="name@example.com" 
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="h-10"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Password</Label>
                        <Input 
                            type="password" 
                            placeholder="Create a password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="h-10"
                            required
                        />
                    </div>
                    <Button className="w-full h-10 font-semibold mt-4" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                    </Button>
                </form>
            )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  )
}