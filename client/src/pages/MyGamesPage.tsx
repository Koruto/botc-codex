import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import type { GameDocument, PaginatedGamesResponse } from '@/types'

const PAGE_SIZE = 20

export function MyGamesPage() {
  const [games, setGames] = useState<GameDocument[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api
      .myGames(skip, PAGE_SIZE)
      .then((res: PaginatedGamesResponse) => {
        setGames(res.items)
        setTotal(res.total)
      })
      .catch(() => setGames([]))
      .finally(() => setLoading(false))
  }, [skip])

  const gameDisplayName = (doc: GameDocument) => doc.name || doc.title || 'Untitled'
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-primary">My games</h1>
        <p className="text-muted-foreground">All games you've created, public and private.</p>
      </div>

      <section className="rounded-lg border border-border bg-card p-6">
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : games.length === 0 ? (
          <p className="text-muted-foreground">No games yet. Join a server and add your first game.</p>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{total} {total === 1 ? 'game' : 'games'}</p>
            <ul className="space-y-3">
              {games.map((doc) => (
                <li
                  key={doc.gameId}
                  className="flex items-center justify-between rounded border border-border px-3 py-2.5"
                >
                  <div>
                    <Link to={`/game/${doc.gameId}`} className="text-sm text-primary hover:underline">
                      {gameDisplayName(doc)}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {doc.meta?.playedOn ? `${doc.meta.playedOn} · ` : ''}
                      {doc.meta?.playerCount ? `${doc.meta.playerCount} players · ` : ''}
                      <Link to={`/servers/${doc.serverId}`} className="hover:underline">
                        server
                      </Link>
                    </p>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      doc.visibility === 'public'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {doc.visibility}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
              disabled={skip === 0}
              className="rounded px-2 py-1 hover:bg-muted disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setSkip(skip + PAGE_SIZE)}
              disabled={skip + PAGE_SIZE >= total}
              className="rounded px-2 py-1 hover:bg-muted disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
