import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getServerBySlug, updateServer } from '@/api/servers'
import { getGames, getServerGameBySlug, getServerGame, updateGame, deleteGame, type GamesSortField, type GamesSortOrder } from '@/api/games'
import type { ServerDocument } from '@/types/api.types'
import type { GameDocument } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { GameCard } from '@/components/GameCard'
import { StatItem } from '@/components/ui/StatItem'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

const PAGE_SIZE = 20

export function ServerPage() {
  const { serverSlug } = useParams<{ serverSlug: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const gameSavedSlug = searchParams.get('gameSaved')

  const [server, setServer] = useState<ServerDocument | null>(null)
  const [serverLoading, setServerLoading] = useState(true)
  const [serverError, setServerError] = useState<string | null>(null)

  const [games, setGames] = useState<GameDocument[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [gamesSort, setGamesSort] = useState<GamesSortField>('playedOn')
  const [gamesOrder, setGamesOrder] = useState<GamesSortOrder>('desc')
  const [gamesLoading, setGamesLoading] = useState(true)

  // All games fetched once for stats (win counts etc.)
  const [statsGames, setStatsGames] = useState<GameDocument[]>([])

  const [renaming, setRenaming] = useState(false)
  const [renameName, setRenameName] = useState('')
  const [renameError, setRenameError] = useState<string | null>(null)
  const [renameLoading, setRenameLoading] = useState(false)

  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const sortParam = searchParams.get('sort') as GamesSortField | null
    const orderParam = searchParams.get('order') as GamesSortOrder | null
    const pageParam = parseInt(searchParams.get('page') ?? '1', 10)

    const initialSort: GamesSortField = sortParam && ['playedOn', 'updatedAt', 'edition', 'winner', 'playerCount'].includes(sortParam)
      ? sortParam
      : 'playedOn'
    const initialOrder: GamesSortOrder = orderParam === 'asc' || orderParam === 'desc' ? orderParam : 'desc'
    const initialPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1

    setGamesSort(initialSort)
    setGamesOrder(initialOrder)
    setSkip((initialPage - 1) * PAGE_SIZE)

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('sort', initialSort)
      next.set('order', initialOrder)
      if (initialPage > 1) {
        next.set('page', String(initialPage))
      } else {
        next.delete('page')
      }
      return next
    }, { replace: true })
  }, [])

  useEffect(() => {
    if (!serverSlug) return
    const load = async () => {
      setServerLoading(true)
      try {
        const s = await getServerBySlug(serverSlug)
        setServer(s)
        setRenameName(s.name)
      } catch (err) {
        setServerError(err instanceof Error ? err.message : 'Server not found')
      } finally {
        setServerLoading(false)
      }
    }
    load()
  }, [serverSlug])

  useEffect(() => {
    if (!server?.serverId) return
    const load = async () => {
      setGamesLoading(true)
      try {
        const res = await getGames(server.serverId, skip, PAGE_SIZE, gamesSort, gamesOrder)
        setGames(res.items)
        setTotal(res.total)
      } catch {
        setGames([])
      } finally {
        setGamesLoading(false)
      }
    }
    load()
  }, [server?.serverId, skip, gamesSort, gamesOrder])

  useEffect(() => {
    if (!server?.serverId || total === 0) return
    const limit = Math.min(total, 500)
    getGames(server.serverId, 0, limit, 'playedOn', 'desc')
      .then((res) => setStatsGames(res.items))
      .catch(() => { })
  }, [server?.serverId, total])

  useEffect(() => {
    if (!gameSavedSlug) return
    const slug = gameSavedSlug
    toast.success('Game saved', {
      action: {
        label: 'View game',
        onClick: () => navigate(`/game/${slug}`),
      },
      duration: 6000,
    })
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('gameSaved')
      return next
    }, { replace: true })
  }, [gameSavedSlug])

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!server?.serverId || !renameName.trim()) return
    setRenameError(null)
    setRenameLoading(true)
    try {
      const updated = await updateServer(server.serverId, renameName.trim())
      setServer(updated)
      setRenaming(false)
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : 'Rename failed')
    } finally {
      setRenameLoading(false)
    }
  }

  const copyInviteLink = async () => {
    if (!server?.inviteCode) return
    const url = `${window.location.origin}/invite/${server.inviteCode}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleVisibilityChange = useCallback(
    async (gameId: string, visibility: 'public' | 'private') => {
      if (!server?.serverId) return
      try {
        await updateGame(server.serverId, gameId, { visibility })
        setGames((prev) =>
          prev.map((g) => (g.gameId === gameId ? { ...g, visibility } : g))
        )
        toast(visibility === 'private' ? 'Changed to private' : 'Changed to public')
      } catch {
        // list will refresh on next load
      }
    },
    [server?.serverId]
  )

  const handleDownloadGame = useCallback(
    async (doc: GameDocument) => {
      if (!server?.serverId) return
      try {
        const full =
          doc.slug
            ? await getServerGameBySlug(server.serverId, doc.slug)
            : await getServerGame(server.serverId, doc.gameId)
        const exportData = {
          townSquare: full.townSquare,
          meta: full.meta,
          phases: full.phases,
          title: full.title,
          subtitle: full.subtitle,
          name: full.name,
        }
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `game-${full.slug || full.gameId}.json`
        a.click()
        URL.revokeObjectURL(url)
      } catch {
        toast.error('Failed to download game')
      }
    },
    [server?.serverId]
  )

  const handleDeleteGame = useCallback(
    async (gameId: string) => {
      if (!server?.serverId) return
      try {
        await deleteGame(server.serverId, gameId)
        setGames((prev) => prev.filter((g) => g.gameId !== gameId))
        setTotal((prev) => Math.max(0, prev - 1))
        toast.success('Game deleted')
      } catch {
        toast.error('Failed to delete game')
      }
    },
    [server?.serverId]
  )

  const goodWins = useMemo(() => statsGames.filter((g) => g.winner === 'good').length, [statsGames])
  const evilWins = useMemo(() => statsGames.filter((g) => g.winner === 'evil').length, [statsGames])

  if (serverLoading) {
    return <p className="py-8 text-sm text-muted-foreground">Loading…</p>
  }

  if (serverError || !server) {
    return (
      <div className="py-8">
        <p className="text-sm text-destructive">{serverError ?? 'Server not found.'}</p>
      </div>
    )
  }

  const isCreator = user?.userId === server.createdBy
  const isMember = server.isMember ?? false
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1

  return (
    <div>

      <Breadcrumb className="mb-5">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{server.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          {renaming ? (
            <form onSubmit={handleRename} className="flex items-center gap-2">
              <input
                type="text"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                maxLength={100}
                autoFocus
                className="app-input font-app-display text-3xl italic font-semibold"
              />
              <Button type="submit" size="sm" disabled={renameLoading}>
                {renameLoading ? 'Saving…' : 'Save'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => { setRenaming(false); setRenameName(server.name); setRenameError(null) }}
              >
                Cancel
              </Button>
            </form>
          ) : (
            <div className="flex items-baseline gap-2">
              <h1 className="app-page-title italic">{server.name}</h1>
              {isCreator && (
                <button
                  type="button"
                  onClick={() => setRenaming(true)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-0 bg-transparent"
                >
                  ✎ Rename
                </button>
              )}
            </div>
          )}
          {renameError && <p className="mt-1 text-sm text-destructive">{renameError}</p>}
          <p className="text-sm text-muted-foreground mt-1">
            {total} {total === 1 ? 'game' : 'games'}
            {isCreator ? ' · Creator' : isMember ? ' · Member' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-1 shrink-0">
          {isMember && server.inviteCode && (
            <Button variant="secondary" size="sm" onClick={copyInviteLink}>
              {copied ? 'Copied!' : 'Copy invite link'}
            </Button>
          )}
          {isMember && server.slug && (
            <Button size="sm" asChild>
              <Link to={`/s/${server.slug}/add`}>+ Add game</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="app-card mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 px-6 py-5">
          <StatItem value={total} label="Games" />
          <StatItem value={statsGames.length > 0 ? goodWins : '—'} label="Good wins" faint={statsGames.length === 0} />
          <StatItem value={statsGames.length > 0 ? evilWins : '—'} label="Evil wins" faint={statsGames.length === 0} />
          <StatItem value="—" label="Members" faint />
        </div>
      </div>

      {/* Games list */}
      <div className="app-card">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 border-b border-border">
          <span className="text-sm font-semibold text-foreground">Games</span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground" htmlFor="games-sort">
              Sort:
            </label>
            <select
              id="games-sort"
              value={`${gamesSort}-${gamesOrder}`}
              onChange={(e) => {
                const [s, o] = e.target.value.split('-') as [GamesSortField, GamesSortOrder]
                setGamesSort(s)
                setGamesOrder(o)
                setSkip(0)
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev)
                  next.set('sort', s)
                  next.set('order', o)
                  next.delete('page')
                  return next
                }, { replace: true })
              }}
              className="rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="playedOn-desc">Date played (newest)</option>
              <option value="playedOn-asc">Date played (oldest)</option>
              <option value="updatedAt-desc">Last updated</option>
              <option value="updatedAt-asc">Last updated (oldest)</option>
              <option value="edition-asc">Script (A–Z)</option>
              <option value="edition-desc">Script (Z–A)</option>
              <option value="winner-asc">Winner</option>
              <option value="playerCount-desc">Players (most)</option>
              <option value="playerCount-asc">Players (fewest)</option>
            </select>
          </div>
        </div>

        {gamesLoading ? (
          <p className="px-6 py-4 text-sm text-muted-foreground">Loading…</p>
        ) : games.length === 0 ? (
          <EmptyState
            icon="📖"
            title="No games yet"
            body={
              isMember
                ? "Add your first game to start building your server's archive."
                : 'No public games in this server yet.'
            }
            action={
              isMember && server.slug ? (
                <Button size="sm" asChild>
                  <Link to={`/s/${server.slug}/add`}>+ Add game</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div>
            {games.map((doc) => {
              const isGameCreator = user?.userId === doc.createdBy
              return (
                <GameCard
                  key={doc.gameId}
                  variant="row"
                  doc={doc}
                  showServerName={false}
                  secondLineMode="script-and-time"
                  currentUserId={user?.userId}
                  showEdit={isGameCreator}
                  showEditAsButton={isGameCreator}
                  serverSlug={server.slug ?? undefined}
                  showPrivacyToggle={isGameCreator}
                  onVisibilityChange={(visibility) =>
                    handleVisibilityChange(doc.gameId, visibility)
                  }
                  showDownload={isMember}
                  onDownload={() => handleDownloadGame(doc)}
                  showDelete={isGameCreator}
                  onDelete={() => handleDeleteGame(doc.gameId)}
                />
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSkip((prev) => {
                  const newSkip = Math.max(0, prev - PAGE_SIZE)
                  const newPage = Math.floor(newSkip / PAGE_SIZE) + 1
                  setSearchParams((prevParams) => {
                    const next = new URLSearchParams(prevParams)
                    if (newPage > 1) {
                      next.set('page', String(newPage))
                    } else {
                      next.delete('page')
                    }
                    return next
                  }, { replace: true })
                  return newSkip
                })
              }}
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
              onClick={() => {
                setSkip((prev) => {
                  const newSkip = prev + PAGE_SIZE
                  const newPage = Math.floor(newSkip / PAGE_SIZE) + 1
                  setSearchParams((prevParams) => {
                    const next = new URLSearchParams(prevParams)
                    if (newPage > 1) {
                      next.set('page', String(newPage))
                    } else {
                      next.delete('page')
                    }
                    return next
                  }, { replace: true })
                  return newSkip
                })
              }}
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
