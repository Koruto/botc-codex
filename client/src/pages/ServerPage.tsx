import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '@/api/client'
import type { GameDocument } from '@/api/client'

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
          <h1 className="text-2xl font-bold text-amber-500">
            Server: {serverId ?? 'Unknown'}
          </h1>
          <p className="text-stone-400">Games in this server. Admin can add or edit.</p>
        </div>
        <Link
          to={`/server/${serverId}/add-game`}
          className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-amber-500"
        >
          Add game
        </Link>
      </div>
      <section className="rounded-lg border border-stone-700 bg-stone-900/50 p-6">
        <h2 className="mb-4 text-lg font-medium text-stone-200">Games</h2>
        {loading ? (
          <p className="text-stone-500">Loading…</p>
        ) : games.length === 0 ? (
          <p className="text-stone-500">No games yet. Add a game to get started.</p>
        ) : (
          <ul className="space-y-3">
            {games.map((doc) => (
              <li key={doc.gameId} className="flex items-center justify-between rounded border border-stone-700 p-3">
                <Link to={`/game/${doc.gameId}`} className="text-amber-400 hover:underline">
                  {displayName(doc)}
                  {doc.meta?.playerCount ? ` — ${doc.meta.playerCount} players` : ''}
                  {doc.meta?.playedOn ? ` — ${doc.meta.playedOn}` : ''}
                </Link>
                {doc.status === 'draft' ? (
                  <span className="rounded bg-amber-900/60 px-2 py-0.5 text-xs font-medium text-amber-300">
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
