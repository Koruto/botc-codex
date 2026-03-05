import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '@/api/client'
import type { GameDocument } from '@/api/client'
import { Button } from '@/components/ui/button'

export function ServerPage() {
  const { serverId } = useParams()
  const [games, setGames] = useState<GameDocument[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!serverId) return
    api.listGames(serverId)
      .then(setGames)
      .catch(() => setGames([]))
      .finally(() => setLoading(false))
  }, [serverId])

  const displayName = (doc: GameDocument) =>
    doc.name || doc.title || 'Untitled'

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            Server: {serverId ?? 'Unknown'}
          </h1>
          <p className="text-muted-foreground">Games in this server. Admin can add or edit.</p>
        </div>
        <Button asChild>
          <Link to={`/server/${serverId}/add-game`}>Add game</Link>
        </Button>
      </div>
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-medium text-foreground">Games</h2>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : games.length === 0 ? (
          <p className="text-muted-foreground">No games yet. Add a game to get started.</p>
        ) : (
          <ul className="space-y-3">
            {games.map((doc) => (
              <li key={doc.gameId} className="flex items-center justify-between rounded border border-border p-3">
                <Link to={`/game/${doc.gameId}`} className="text-primary hover:underline">
                  {displayName(doc)}
                  {doc.meta?.playerCount ? ` — ${doc.meta.playerCount} players` : ''}
                  {doc.meta?.playedOn ? ` — ${doc.meta.playedOn}` : ''}
                </Link>
                {doc.status === 'draft' ? (
                  <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                    Preview
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
