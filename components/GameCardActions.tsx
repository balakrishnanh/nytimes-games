'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { Pencil, Trash2 } from 'lucide-react'

interface GameCardActionsProps {
  gameId: string
  gameTitle: string
  gameType: string
}

export default function GameCardActions({ gameId, gameTitle, gameType }: GameCardActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setIsDeleting(true)
    const { error } = await supabase.from('games').delete().eq('id', gameId)
    setIsDeleting(false)

    if (error) {
      toast.error('Failed to delete game')
    } else {
      setIsOpen(false)
      toast.success('Game deleted')
      router.refresh() // Refreshes the dashboard list immediately
    }
  }

  return (
    <div className="flex gap-2">
      {/* EDIT BUTTON */}
      <Link href={`/edit/${gameType}/${gameId}`}>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
      </Link>

      {/* DELETE MODAL */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" size="icon" className="h-8 w-8 bg-red-50 text-red-600 hover:bg-red-100 border-red-200 shadow-none">
            <Trash2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Game?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-bold text-black">"{gameTitle}"</span>? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}