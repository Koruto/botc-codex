import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '@/api/client'
import type { ServerDocument } from '@/types/api.types'
import type { GameDocument, PaginatedGamesResponse } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/ui/EmptyState'
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
  const { serverId } = useParams<{ serverId: string }>()
  const { user } = useAuth()

  const [server, setServer] = useState<ServerDocument | null>(null)
  const [serverLoading, setServerLoading] = useState(true)
  const [serverError, setServerError] = useState<string | null>(null)

  const [games, setGames] = useState<GameDocument[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [gamesLoading, setGamesLoading] = useState(true)

  const [renaming, setRenaming] = useState(false)
  const [renameName, setRenameName] = useState('')
  const [renameError, setRenameError] = useState<string | null>(null)
  const [renameLoading, setRenameLoading] = useState(false)

  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!serverId) return
    setServerLoading(true)
    api
      .getServer(serverId)
      .then((s) => { setServer(s); setRenameName(s.name) })
      .catch((err) => setServerError(err instanceof Error ? err.message : 'Server not found'))
      .finally(() => setServerLoading(false))
  }, [serverId])

  useEffect(() => {
    if (!serverId) return
    setGamesLoading(true)
    api
      .listGames(serverId, skip, PAGE_SIZE)
      .then((res: PaginatedGamesResponse) => {
        setGames(res.items)
        setTotal(res.total)
      })
      .catch(() => setGames([]))
      .finally(() => setGamesLoading(false))
  }, [serverId, skip])

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serverId || !renameName.trim()) return
    setRenameError(null)
    setRenameLoading(true)
    try {
      const updated = await api.renameServer(serverId, renameName.trim())
      setServer(updated)
      setRenaming(false)
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : 'Rename failed')
    } finally {
      setRenameLoading(false)
    }
  }

  const copyInviteLink = () => {
    if (!server?.inviteCode) return
    const url = `${window.location.origin}/invite/${server.inviteCode}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const gameDisplayName = (doc: GameDocument) => doc.name || doc.title || 'Untitled'

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
          {isMember && (
            <Button size="sm" asChild>
              <Link to={`/servers/${serverId}/add-game`}>+ Add game</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="app-card mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 px-6 py-5">
          <StatItem value={total} label="Games" />
          <StatItem value="—" label="Good wins" faint />
          <StatItem value="—" label="Evil wins" faint />
          <StatItem value="—" label="Members" faint />
        </div>
      </div>

      {/* Games list */}
      <div className="app-card">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <span className="text-sm font-semibold text-foreground">Games</span>
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
              isMember ? (
                <Button size="sm" asChild>
                  <Link to={`/servers/${serverId}/add-game`}>+ Add game</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div>
            {games.map((doc) => (
              <Link key={doc.gameId} to={`/game/${doc.gameId}`} className="game-row">
                <div>
                  <div className="game-row-name text-sm font-medium text-foreground">
                    {gameDisplayName(doc)}
                  </div>
                  {(doc.meta?.playerCount || doc.meta?.playedOn) && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {[
                        doc.meta.playerCount ? `${doc.meta.playerCount} players` : null,
                        doc.meta.playedOn,
                      ].filter(Boolean).join(' · ')}
                    </div>
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
                {doc.createdAt && (
                  <div className="text-xs text-placeholder text-right tabular-nums">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </div>
                )}
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
