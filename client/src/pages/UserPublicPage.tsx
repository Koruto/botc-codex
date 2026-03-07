import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '@/api/client'
import type { GameDocument, UserPublicGamesResponse } from '@/types'

const PAGE_SIZE = 20

export function UserPublicPage() {
  const { username } = useParams<{ username: string }>()

  const [resolvedUsername, setResolvedUsername] = useState<string | null>(null)
  const [games, setGames] = useState<GameDocument[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!username) return
    setLoading(true)
    api
      .userPublicGames(username, skip, PAGE_SIZE)
      .then((res: UserPublicGamesResponse) => {
        setResolvedUsername(res.username)
        setGames(res.items)
        setTotal(res.total)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'User not found'))
      .finally(() => setLoading(false))
  }, [username, skip])

  const gameDisplayName = (doc: GameDocument) => doc.name || doc.title || 'Untitled'
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1

  if (loading && !resolvedUsername) {
    return <p className="text-muted-foreground">Loading…</p>
  }

  if (error) {
    return (
      <div>
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-primary">{resolvedUsername}</h1>
        <p className="text-muted-foreground">
          {total} public {total === 1 ? 'game' : 'games'}
        </p>
      </div>

      <section className="rounded-lg border border-border bg-card p-6">
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : games.length === 0 ? (
          <p className="text-muted-foreground">No public games yet.</p>
        ) : (
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
                    {doc.meta?.playedOn ? `${doc.meta.playedOn}` : ''}
                    {doc.meta?.playerCount ? ` · ${doc.meta.playerCount} players` : ''}
                  </p>
                </div>
                <Link
                  to={`/servers/${doc.serverId}`}
                  className="text-xs text-muted-foreground hover:text-primary hover:underline"
                >
                  server
                </Link>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
              disabled={skip === 0 || loading}
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
              disabled={skip + PAGE_SIZE >= total || loading}
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
