import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getServers, createServer } from '@/api/servers'
import { getMyGames } from '@/api/explore'
import type { MyServerItem } from '@/types/api.types'
import type { GameDocument } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatItem } from '@/components/ui/StatItem'

export function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [servers, setServers] = useState<MyServerItem[]>([])
  const [serversLoading, setServersLoading] = useState(true)

  const [recentGames, setRecentGames] = useState<GameDocument[]>([])
  const [gamesLoading, setGamesLoading] = useState(true)

  const [creating, setCreating] = useState(false)
  const [newServerName, setNewServerName] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [createLoading, setCreateLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadServers = async () => {
      try {
        const res = await getServers()
        setServers(res.items)
      } catch {
        setServers([])
      } finally {
        setServersLoading(false)
      }
    }

    const loadGames = async () => {
      try {
        const res = await getMyGames(0, 5)
        setRecentGames(res.items)
      } catch {
        setRecentGames([])
      } finally {
        setGamesLoading(false)
      }
    }

    loadServers()
    loadGames()
  }, [])

  useEffect(() => {
    if (creating) inputRef.current?.focus()
  }, [creating])

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = newServerName.trim()
    if (!name) return
    setCreateError(null)
    setCreateLoading(true)
    try {
      const server = await createServer(name)
      setServers((prev) => [{ ...server, isCreator: true, isMember: true, joinedAt: server.createdAt }, ...prev])
      setNewServerName('')
      setCreating(false)
      navigate(`/servers/${server.serverId}`)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create server')
    } finally {
      setCreateLoading(false)
    }
  }

  const gameDisplayName = (doc: GameDocument) => doc.name || doc.title || 'Untitled'

  const toggleCreate = () => {
    setCreating((v) => !v)
    setCreateError(null)
    setNewServerName('')
  }

  return (
    <div>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="app-page-title">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, <strong className="font-medium text-foreground">{user?.username}</strong>.
        </p>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* My servers */}
        <div className="app-card">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <span className="text-sm font-semibold text-foreground">My servers</span>
            <Button size="sm" onClick={toggleCreate}>
              {creating ? 'Cancel' : '+ New server'}
            </Button>
          </div>

          {creating && (
            <div className="px-6 pt-4">
              <form onSubmit={handleCreateServer} className="flex gap-2 mb-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  placeholder="Server name"
                  maxLength={100}
                  className="app-input flex-1 min-w-0"
                />
                <Button type="submit" size="sm" disabled={createLoading || !newServerName.trim()}>
                  {createLoading ? 'Creating…' : 'Create'}
                </Button>
              </form>
              {createError && <p className="mb-3 text-sm text-destructive">{createError}</p>}
            </div>
          )}

          {serversLoading ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">Loading…</p>
          ) : servers.length === 0 ? (
            <EmptyState
              icon="🏰"
              title="No servers yet"
              body="Create a server or join via an invite link."
            />
          ) : (
            <div>
              {servers.map((s) => (
                <Link key={s.serverId} to={`/servers/${s.serverId}`} className="server-row">
                  <div>
                    <div className="text-sm font-medium text-primary">{s.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Created {new Date(s.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {s.isCreator && (
                    <span className="text-xs font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-primary/8 text-primary">
                      Creator
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent games */}
        <div className="app-card">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Recent games</span>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/me/games">View all</Link>
            </Button>
          </div>

          {gamesLoading ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">Loading…</p>
          ) : recentGames.length === 0 ? (
            <EmptyState
              icon="🎭"
              title="No games yet"
              body="Go to a server and add your first session."
              action={
                servers.length > 0 ? (
                  <Button size="sm" asChild>
                    <Link to={`/servers/${servers[0].serverId}`}>
                      Go to {servers[0].name} →
                    </Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div>
              {recentGames.map((doc) => (
                <Link key={doc.gameId} to={`/game/${doc.gameId}`} className="game-row">
                  <div>
                    <div className="game-row-name text-sm font-medium text-foreground">
                      {gameDisplayName(doc)}
                    </div>
                    {doc.meta?.playedOn && (
                      <div className="text-xs text-muted-foreground mt-0.5">{doc.meta.playedOn}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.winner && (
                      <span className={`game-badge game-badge-${doc.winner}`}>{doc.winner}</span>
                    )}
                    {doc.visibility === 'private' && (
                      <span className="game-badge game-badge-private">private</span>
                    )}
                  </div>
                  <div />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Your stats */}
      <div className="app-card mt-5">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <span className="text-sm font-semibold text-foreground">Your stats</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 px-6 py-5">
          <StatItem value="—" label="Games played" faint />
          <StatItem value="—" label="Win rate" faint />
          <StatItem value="—" label="Good wins" faint />
          <StatItem value="—" label="Evil wins" faint />
        </div>
      </div>

    </div>
  )
}
