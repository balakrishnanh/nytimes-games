import Link from 'next/link'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'

const games = [
    { id: 'wordle', name: 'Wordle', desc: 'Guess the 5-letter word' },
    { id: 'connections', name: 'Connections', desc: 'Group words by category' },
    { id: 'mini', name: 'Mini Crossword', desc: 'Create a mini 5x5 crossword' },
    { id: 'spelling-bee', name: 'Spelling Bee', desc: 'Find words with 7 letters' }
]

export default function CreateHub() {
    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Create a Game</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {games.map(g => (
                    <Link key={g.id} href={`/create/${g.id}`}>
                        <Card className="hover:bg-gray-50 cursor-pointer transition">
                            <CardHeader>
                                <CardTitle>{g.name}</CardTitle>
                                <p className="text-sm text-gray-500">{g.desc}</p>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}