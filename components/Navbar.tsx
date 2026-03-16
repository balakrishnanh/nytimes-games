import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import AuthButtons from './AuthButtons'

export default async function Navbar() {
  const supabase = createClient()
  const { data: { user } } = await (await supabase).auth.getUser()

  return (
    <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-black text-white flex items-center justify-center font-serif font-bold text-xl rounded">
              N
            </div>
            <span className="text-xl font-serif font-bold tracking-tight">NYT Game Maker</span>
          </Link>

          {/* Auth Section */}
          <AuthButtons user={user} />
        </div>
      </div>
    </nav>
  )
}