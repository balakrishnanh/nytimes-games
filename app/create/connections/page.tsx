'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

type Group = { color: string; category: string; words: string[] }

export default function CreateConnections() {
  const [title, setTitle] = useState('')
  const [groups, setGroups] = useState<Group[]>([
    { color: 'yellow', category: '', words: ['', '', '', ''] },
    { color: 'green', category: '', words: ['', '', '', ''] },
    { color: 'blue', category: '', words: ['', '', '', ''] },
    { color: 'purple', category: '', words: ['', '', '', ''] },
  ])
  const supabase = createClient()
  const router = useRouter()

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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    // Basic validation
    if (groups.some(g => g.category === '' || g.words.some(w => w === ''))) {
        return toast.error('Please fill in all fields')
    }

    const { error } = await supabase.from('games').insert({
      user_id: user.id,
      type: 'connections',
      title: title || 'Untitled Connections',
      config: { groups }
    })

    if (!error) {
        toast.success('Connections game created!')
        router.push('/dashboard')
    }
  }

  return (
    <div className="container mx-auto p-8 pb-20">
      <h1 className="text-2xl font-bold mb-4">Create Connections</h1>
      <Input placeholder="Game Title" className="mb-8" onChange={e => setTitle(e.target.value)} />
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className={`p-4 border-l-4 ${
            gIdx === 0 ? 'border-yellow-400' : gIdx === 1 ? 'border-green-400' : gIdx === 2 ? 'border-blue-400' : 'border-purple-400'
          } bg-gray-50 rounded shadow-sm`}>
            <Label>Category ({group.color})</Label>
            <Input className="mb-2 mt-1" value={group.category} onChange={e => updateGroup(gIdx, 'category', e.target.value)} />
            <div className="grid grid-cols-2 gap-2 mt-2">
              {group.words.map((word, wIdx) => (
                <Input key={wIdx} placeholder={`Word ${wIdx+1}`} value={word} onChange={e => updateGroup(gIdx, 'words', e.target.value, wIdx)} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-8">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>Cancel</Button>
        <Button onClick={handleSave}>Publish Game</Button>
      </div>
    </div>
  )
}