'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

interface PlayedGameCardActionsProps {
  playedGameId: string   // row id in the played_games table
  gameTitle: string
}

export default function PlayedGameCardActions({ playedGameId, gameTitle }: PlayedGameCardActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRemove = async () => {
    setIsRemoving(true)
    const { error } = await supabase
      .from('played_games')
      .delete()
      .eq('id', playedGameId)
    setIsRemoving(false)

    if (error) {
      toast.error('Failed to remove game')
    } else {
      setIsOpen(false)
      toast.success('Removed from your played games')
      router.refresh()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          size="icon"
          className="h-8 w-8 bg-red-50 text-red-600 hover:bg-red-100 border-red-200 shadow-none"
          title="Remove from played games"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Game?</DialogTitle>
          <DialogDescription>
            Remove <span className="font-bold text-black">"{gameTitle}"</span> from your played games list? You can always play it again via its share link.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleRemove} disabled={isRemoving}>
            {isRemoving ? 'Removing...' : 'Remove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
