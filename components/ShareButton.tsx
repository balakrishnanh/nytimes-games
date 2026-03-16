'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Check } from 'lucide-react'
import { toast } from 'sonner'

export function ShareButton({ gameId, title, variant = "outline", className }: { gameId: string, title?: string, variant?: any, className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    // Construct the full URL based on current window location
    const url = `${window.location.origin}/play/${gameId}`
    
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy link')
    }
  }

  return (
    <Button variant={variant} size="sm" onClick={handleShare} className={className}>
      {copied ? <Check className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
      {copied ? "Copied" : "Share"}
    </Button>
  )
}