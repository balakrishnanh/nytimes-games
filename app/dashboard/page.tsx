import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import GameCardActions from '@/components/GameCardActions'
import PlayedGameCardActions from '@/components/PlayedGameCardActions'
import { ShareButton } from '@/components/ShareButton'
import { LeaderboardButton } from '@/components/LeaderboardButton'
import { MetricsButton } from '@/components/MetricsButton'
import { Clock, User } from 'lucide-react'

// Maps game type slug → human-readable label & colour
const GAME_TYPE_META: Record<string, { label: string; color: string }> = {
  wordle:       { label: 'Wordle',       color: 'bg-emerald-100 text-emerald-800' },
  connections:  { label: 'Connections',  color: 'bg-purple-100  text-purple-800'  },
  mini:         { label: 'Mini',         color: 'bg-sky-100     text-sky-800'     },
  'spelling-bee': { label: 'Spelling Bee', color: 'bg-yellow-100 text-yellow-800' },
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // --- My Games ---
  const { data: games } = await supabase
    .from('games')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // --- Played Games (games by others that this user has played) ---
  const { data: playedRows, error: playedError } = await supabase
    .from('played_games')
    .select(`
      id,
      played_at,
      games (
        id,
        title,
        type,
        created_at,
        user_id
      )
    `)
    .eq('user_id', user.id)
    .order('played_at', { ascending: false })

  if (playedError) {
    console.error('Played games query failed:', playedError)
  }

  // Extract the unique creator IDs to fetch their usernames safely
  const validPlayedRows = (playedRows ?? []).filter((r: any) => r.games)
  const creatorIds = Array.from(new Set(validPlayedRows.map((r: any) => r.games.user_id)))

  let profilesMap: Record<string, string> = {}
  if (creatorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', creatorIds)
    
    profiles?.forEach(p => {
      profilesMap[p.id] = p.username
    })
  }

  // Flatten and filter out any rows where the user now owns the game
  const playedGames = validPlayedRows
    .map((row: any) => ({
      playedGameRowId: row.id,
      playedAt: row.played_at,
      ...(row.games as any),
      creatorUsername: profilesMap[(row.games as any).user_id] ?? 'Unknown',
    }))
    .filter((g: any) => g.user_id !== user.id)

  const gameTypes = ['wordle', 'connections', 'mini', 'spelling-bee']
  const defaultTab = tab || 'wordle'

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Your Dashboard</h1>
        <Link href="/create"><Button>+ Create New Game</Button></Link>
      </div>

      {/* ── My Games ── */}
      <Tabs defaultValue={defaultTab}>
        <TabsList>
          {gameTypes.map(t => (
            <TabsTrigger key={t} value={t} className="capitalize">
              {t === 'spelling-bee' ? 'Spelling Bee' : t}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <div className="h-6 w-full" />

        {gameTypes.map(type => (
          <TabsContent key={type} value={type} className="!mt-0 grid grid-cols-1 md:grid-cols-3 gap-6">
            {games?.filter(g => g.type === type).map(game => (
              <Card key={game.id} className="flex flex-col group hover:border-gray-400 transition-colors">
                <CardHeader>
                  <CardTitle className="truncate">{game.title}</CardTitle>
                  <CardDescription>
                    {new Date(game.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </CardDescription>
                </CardHeader>
                
                <CardFooter className="mt-auto flex flex-wrap items-center gap-2 pt-4 border-t bg-gray-50/50">
                  {/* Play Button */}
                  <Link href={`/play/${game.id}`} className="flex-1 min-w-[80px]">
                    <Button variant="secondary" className="w-full shadow-sm hover:bg-white border font-medium">
                      Play
                    </Button>
                  </Link>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Leaderboard and Share */}
                    <div className="flex items-center gap-1.5 hidden sm:flex">
                      <MetricsButton gameId={game.id} variant="outline" className="bg-white" />
                      <ShareButton gameId={game.id} variant="outline" className="bg-white" />
                    </div>
                    <div className="flex items-center gap-1.5 sm:hidden">
                      <MetricsButton gameId={game.id} variant="outline" className="bg-white px-2" />
                      <ShareButton gameId={game.id} variant="outline" className="bg-white px-2" />
                    </div>

                    {/* Edit / Delete Actions */}
                    <GameCardActions 
                      gameId={game.id} 
                      gameTitle={game.title} 
                      gameType={game.type} 
                    />
                  </div>
                </CardFooter>
              </Card>
            ))}
            
            {/* Empty State */}
            {games?.filter(g => g.type === type).length === 0 && (
                <div className="col-span-1 md:col-span-3 text-center py-12 text-gray-400 border-2 border-dashed rounded-xl bg-gray-50/50">
                  <p className="mb-2">No {type} games created yet.</p>
                  <Link href={`/create/${type}`}>
                    <Button variant="link" className="text-blue-600">Create one now &rarr;</Button>
                  </Link>
                </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* ── Played Games ── */}
      <div className="mt-12 pt-10 border-t">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Played Games</h2>
          <p className="text-sm text-gray-500 mt-1">Games created by others that you&apos;ve played.</p>
        </div>

        {playedGames.length === 0 ? (
          <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-xl bg-gray-50/50">
            <p className="mb-1">No played games yet.</p>
            <p className="text-sm">When someone shares a game with you, it'll appear here after you play it.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {playedGames.map((game: any) => {
              const meta = GAME_TYPE_META[game.type] ?? { label: game.type, color: 'bg-gray-100 text-gray-700' }
              return (
                <Card key={game.playedGameRowId} className="flex flex-col group hover:border-gray-400 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="truncate text-base leading-snug">{game.title}</CardTitle>
                      <Badge variant="outline" className={`shrink-0 text-xs font-medium border-0 ${meta.color}`}>
                        {meta.label}
                      </Badge>
                    </div>

                    <div className="flex flex-col gap-1 mt-1">
                      {/* Creator */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        <span>by <span className="font-medium text-gray-700">@{game.creatorUsername}</span></span>
                      </div>
                      {/* Created date */}
                      <CardDescription className="text-xs">
                        Created {new Date(game.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </CardDescription>
                      {/* Last played */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>Last played {new Date(game.playedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardFooter className="mt-auto flex flex-wrap items-center gap-2 pt-4 border-t bg-gray-50/50">
                    {/* Play */}
                    <Link href={`/play/${game.id}`} className="flex-1 min-w-[80px]">
                      <Button variant="secondary" className="w-full shadow-sm hover:bg-white border font-medium">
                        Play
                      </Button>
                    </Link>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Leaderboard and Share */}
                      <div className="flex items-center gap-1.5 hidden sm:flex">
                        <LeaderboardButton gameId={game.id} variant="outline" className="bg-white" />
                        <ShareButton gameId={game.id} variant="outline" className="bg-white" />
                      </div>
                      <div className="flex items-center gap-1.5 sm:hidden">
                        <LeaderboardButton gameId={game.id} variant="outline" className="bg-white px-2" />
                        <ShareButton gameId={game.id} variant="outline" className="bg-white px-2" />
                      </div>

                      {/* Remove from list */}
                      <PlayedGameCardActions
                        playedGameId={game.playedGameRowId}
                        gameTitle={game.title}
                      />
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}