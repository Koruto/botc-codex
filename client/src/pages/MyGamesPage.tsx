import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyGames } from '@/api/explore'
import type { GameDocument } from '@/types'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/ui/EmptyState'

const PAGE_SIZE = 20

type VisibilityFilter = 'all' | 'public' | 'private'

const EDITION_LABELS: Record<string, string> = {
  tb: 'Trouble Brewing',
  bmr: 'Bad Moon Rising',
  snv: 'Sects & Violets',
  custom: 'Custom Script',
}

export function MyGamesPage() {
  const [games, setGames] = useState<GameDocument[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<VisibilityFilter>('all')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await getMyGames(skip, PAGE_SIZE)
        setGames(res.items)
        setTotal(res.total)
      } catch {
        setGames([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [skip])

  const filtered = filter === 'all' ? games : games.filter((g) => g.visibility === filter)
  const gameDisplayName = (doc: GameDocument) => doc.name || doc.title || 'Untitled'
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1

  const FILTERS: { key: VisibilityFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'public', label: 'Public' },
    { key: 'private', label: 'Private' },
  ]

  return (
    <div>

      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="app-page-title">My games</h1>
          <p className="mt-1 text-sm text-muted-foreground">All games you've logged, across all servers.</p>
        </div>
        <div className="mt-1 shrink-0">
          <Button size="sm" asChild>
            <Link to="/add-game">+ Add game</Link>
          </Button>
        </div>
      </div>

      {/* Visibility filter */}
      <div className="mb-5 flex items-center gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={
              filter === key
                ? 'rounded-full px-3.5 py-1.5 text-xs font-semibold bg-foreground text-background transition-colors'
                : 'rounded-full px-3.5 py-1.5 text-xs font-medium border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors'
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Games list */}
      <div className="app-card">
        {loading ? (
          <p className="px-6 py-4 text-sm text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📖"
            title="No games logged yet"
            body={
              total === 0
                ? 'Join or create a server, then add your first game to start building your archive.'
                : filter !== 'all'
                  ? `No ${filter} games found.`
                  : 'No games found.'
            }
            action={
              total === 0 ? (
                <Button size="sm" asChild>
                  <Link to="/add-game">+ Log your first game</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div>
            {filtered.map((doc) => (
              <Link key={doc.gameId} to={`/game/${doc.gameId}`} className="game-row">
                <div>
                  <div className="game-row-name text-sm font-medium text-foreground">
                    {gameDisplayName(doc)}
                  </div>
                  {(doc.meta?.edition || doc.meta?.playerCount || doc.meta?.playedOn || doc.serverId) && (
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                      {doc.meta?.edition && (
                        <span>{EDITION_LABELS[doc.meta.edition] ?? doc.meta.edition}</span>
                      )}
                      {doc.meta?.playerCount && (
                        <><span className="text-border">·</span><span>{doc.meta.playerCount} players</span></>
                      )}
                      {doc.meta?.playedOn && (
                        <><span className="text-border">·</span><span>{doc.meta.playedOn}</span></>
                      )}
                      {doc.serverId && (
                        <>
                          <span className="text-border">·</span>
                          <Link
                            to={`/servers/${doc.serverId}`}
                            className="text-muted-foreground hover:text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Server
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {doc.winner && (
                    <span className={`game-badge game-badge-${doc.winner}`}>{doc.winner} wins</span>
                  )}
                </div>
                <div className="text-xs text-placeholder text-right tabular-nums">
                  {doc.visibility === 'private' ? (
                    <span className="game-badge game-badge-private">Private</span>
                  ) : (
                    <span className="text-muted-foreground">Public</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
              disabled={skip === 0}
            >
              ← Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSkip(skip + PAGE_SIZE)}
              disabled={skip + PAGE_SIZE >= total}
            >
              Next →
            </Button>
          </div>
        )}
      </div>

    </div>
  )
}
