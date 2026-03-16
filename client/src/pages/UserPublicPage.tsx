import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getMyGames, getUserGames } from '@/api/explore'
import { useAuth } from '@/context/AuthContext'
import type { GameDocument } from '@/types'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { GameCard } from '@/components/GameCard'

const PAGE_SIZE = 20

type VisibilityFilter = 'all' | 'public' | 'private'

export function UserPublicPage() {
  const { username: routeUsername } = useParams<{ username: string }>()
  const { user } = useAuth()

  const isOwnProfile = !!user && routeUsername?.toLowerCase() === user.username.toLowerCase()
  const displayName = routeUsername ? routeUsername.charAt(0).toUpperCase() + routeUsername.slice(1) : ''

  const [games, setGames] = useState<GameDocument[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<VisibilityFilter>('all')

  useEffect(() => {
    const load = async () => {
      if (!routeUsername) return
      setLoading(true)
      setError(null)
      try {
        if (isOwnProfile) {
          const res = await getMyGames(skip, PAGE_SIZE)
          setGames(res.items)
          setTotal(res.total)
        } else {
          const res = await getUserGames(routeUsername, skip, PAGE_SIZE)
          setGames(res.items)
          setTotal(res.total)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'User not found')
        setGames([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [routeUsername, isOwnProfile, skip])

  const filtered =
    !isOwnProfile || filter === 'all'
      ? games
      : games.filter((g) => g.visibility === filter)

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1

  const FILTERS: { key: VisibilityFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'public', label: 'Public' },
    { key: 'private', label: 'Private' },
  ]

  if (error) {
    return (
      <div>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="app-page-title">
            {isOwnProfile ? 'My games' : `${displayName}'s games`}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isOwnProfile
              ? "All games you've logged, across all servers."
              : 'All games logged by this user.'}
          </p>
        </div>
        {isOwnProfile && (
          <div className="mt-1 shrink-0">
            <Button size="sm" asChild>
              <Link to="/add-game">+ Add game</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Visibility filter (owner only) */}
      {isOwnProfile && (
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
      )}

      {/* Games list */}
      <div className="app-card">
        {loading ? (
          <p className="px-6 py-4 text-sm text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📖"
            title={isOwnProfile ? 'No games logged yet' : 'No games found'}
            body={
              isOwnProfile
                ? 'Join or create a server, then add your first game to start building your archive.'
                : 'This user has no games visible here.'
            }
          />
        ) : (
          <div>
            {filtered.map((doc) => (
              <GameCard
                key={doc.gameId}
                variant="row"
                doc={doc}
                showServerName={false}
                secondLineMode="script-and-time"
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <button
              type="button"
              onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
              disabled={skip === 0 || loading}
              className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              ← Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setSkip(skip + PAGE_SIZE)}
              disabled={skip + PAGE_SIZE >= total || loading}
              className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
