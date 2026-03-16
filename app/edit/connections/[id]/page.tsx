'use client'
import { useState, useEffect, use } from 'react' // <--- Added 'use'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type Group = { color: string; category: string; words: string[] }

export default function EditConnections({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params) // <--- Unwrap here

  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [groups, setGroups] = useState<Group[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchGame = async () => {
        // Use 'id'
        const { data, error } = await supabase.from('games').select('*').eq('id', id).single()
        if (error || !data) {
            toast.error('Could not load game')
            return router.push('/dashboard')
        }
        setTitle(data.title)
        setGroups(data.config.groups)
        setLoading(false)
    }
    fetchGame()
  }, [id, router, supabase])

  const updateGroup = (groupIndex: number, field: string, value: string, wordIndex?: number) => {
    const newGroups = [...groups]
    if (wordIndex !== undefined) {
      newGroups[groupIndex].words[wordIndex] = value
    } else {
      // @ts-ignore
      newGroups[groupIndex][field] = value
    }
    setGroups(newGroups)
  }

  const handleSave = async () => {
    if (groups.some(g => g.category === '' || g.words.some(w => w === ''))) {
        return toast.error('Please fill in all fields')
    }

    const { error } = await supabase
      .from('games')
      .update({ title, config: { groups } })
      .eq('id', id) // Use 'id'

    if (error) {
        toast.error('Failed to update game')
    } else {
        toast.success('Game saved!')
        router.push('/dashboard?tab=connections')
        router.refresh()
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>

  return (
    <div className="container mx-auto p-8 pb-20">
      <h1 className="text-2xl font-bold mb-4">Edit Connections</h1>
      <Input value={title} className="mb-8" onChange={e => setTitle(e.target.value)} />
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className={`p-4 border-l-4 ${
            group.color === 'yellow' ? 'border-yellow-400' : group.color === 'green' ? 'border-green-400' : group.color === 'blue' ? 'border-blue-400' : 'border-purple-400'
          } bg-gray-50 rounded shadow-sm`}>
            <Label className="capitalize">{group.color} Category</Label>
            <Input className="mb-2 mt-1" value={group.category} onChange={e => updateGroup(gIdx, 'category', e.target.value)} />
            <div className="grid grid-cols-2 gap-2 mt-2">
              {group.words.map((word, wIdx) => (
                <Input key={wIdx} value={word} onChange={e => updateGroup(gIdx, 'words', e.target.value, wIdx)} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-8">
        <Button variant="outline" onClick={() => router.push('/dashboard?tab=connections')}>Cancel</Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  )
}