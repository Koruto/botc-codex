import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { GameDocument } from '@/types'
import { Button } from '@/components/Button'
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog'
import { Download, Trash2 } from 'lucide-react'

const EDITION_LABELS: Record<string, string> = {
  tb: 'Trouble Brewing',
  bmr: 'Bad Moon Rising',
  snv: 'Sects & Violets',
  custom: 'Custom Script',
}

export function scriptLine(doc: GameDocument): string {
  const meta = doc.meta
  if (!meta) return ''
  const edition = meta.edition ? (EDITION_LABELS[meta.edition] ?? meta.edition) : ''
  const count = meta.playerCount ? `${meta.playerCount} players` : ''
  return [edition, count].filter(Boolean).join(' · ')
}

function formatGameDate(isoDate: string): string {
  const date = new Date(isoDate)
  if (isNaN(date.getTime())) return ''
  return format(date, 'do MMMM yy')
}

export interface GameCardProps {
  doc: GameDocument
  /** 'card' = landing-style card; 'row' = compact two-line table row, no "Watch the game", table hover. */
  variant?: 'card' | 'row'
  /** When false, hide server name (e.g. on Server page, Recent games, My games). */
  showServerName?: boolean
  /** Override server name (e.g. from Server page context). */
  serverNameOverride?: string | null
  /** Row only: 'author-and-visibility' = "By You · Public/Private" (text); 'script-and-time' = "Script · N players · 5d ago". */
  secondLineMode?: 'author-and-visibility' | 'script-and-time'
  /** Show "By You" / "By {username}" (used when secondLineMode is author-and-visibility). */
  showAuthor?: boolean
  /** Current user id to show "By You" when doc.createdBy matches. */
  currentUserId?: string | null
  /** Show Edit (creator only). When true and showEditAsButton, render as Button like Log out. */
  showEdit?: boolean
  /** Render Edit as a prominent button (secondary, sm) instead of link. */
  showEditAsButton?: boolean
  /** Server slug for add/edit links (e.g. /s/:serverSlug/add). */
  serverSlug?: string
  /** Show standalone privacy toggle (creator only). */
  showPrivacyToggle?: boolean
  /** Called when user changes visibility. */
  onVisibilityChange?: (visibility: 'public' | 'private') => void
  /** Show download JSON button (e.g. on server page). */
  showDownload?: boolean
  /** Called when user clicks download. */
  onDownload?: () => void
  /** Show delete button (creator only). */
  showDelete?: boolean
  /** Called when user confirms delete. */
  onDelete?: () => void | Promise<void>
}

export function GameCard({
  doc,
  variant = 'card',
  showServerName = true,
  serverNameOverride,
  secondLineMode = 'author-and-visibility',
  showAuthor = false,
  currentUserId,
  showEdit = false,
  showEditAsButton = false,
  serverSlug,
  showPrivacyToggle = false,
  onVisibilityChange,
  showDownload = false,
  onDownload,
  showDelete = false,
  onDelete,
}: GameCardProps) {
  const serverName = showServerName ? (serverNameOverride ?? doc.serverName ?? null) : null
  const headline = doc.title || doc.name || 'Untitled'
  const description = doc.subtitle ?? ''
  const winner = doc.winner
  const outcomeLabel = winner === 'evil' ? 'Evil wins' : winner === 'good' ? 'Good wins' : null
  const script = scriptLine(doc)
  const isYou = currentUserId && doc.createdBy === currentUserId
  const authorLabel = showAuthor ? (isYou ? 'By You' : doc.createdByUsername ? `By ${doc.createdByUsername}` : null) : null
  const playedOn = doc.meta?.playedOn?.trim()
  const timeLabel = playedOn
    ? formatGameDate(playedOn)
    : (doc.updatedAt ? formatGameDate(doc.updatedAt) : doc.createdAt ? formatGameDate(doc.createdAt) : '')

  if (variant === 'row') {
    const gameUrl = doc.slug ? `/game/${doc.slug}` : `/game/${doc.gameId}`
    const secondLineLeft =
      secondLineMode === 'author-and-visibility'
        ? authorLabel
          ? [authorLabel, doc.visibility === 'private' ? 'Private' : 'Public'].join(' · ')
          : null
        : [script, timeLabel].filter(Boolean).join(' · ')
    const visibilityColor =
      doc.visibility === 'private'
        ? 'text-muted-foreground'
        : 'text-primary/90'

    return (
      <div className="game-list-row group flex items-stretch gap-4 border-b border-border py-5 px-6 transition-colors hover:bg-muted last:border-b-0">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Link to={gameUrl} className="flex items-center gap-2">
            {serverName && (
              <span className="font-app-display shrink-0 text-[0.58rem] uppercase tracking-[0.12em] text-muted-foreground/50">
                {serverName}
              </span>
            )}
            <span className="game-row-name font-app-display text-sm font-medium text-foreground">
              {headline}
            </span>
          </Link>
          <Link to={gameUrl} className="flex items-center gap-x-1.5 text-xs text-muted-foreground">
            {secondLineMode === 'author-and-visibility' && authorLabel ? (
              <>
                <span>{authorLabel}</span>
                <span className="text-border">·</span>
                <span className={visibilityColor}>{doc.visibility === 'private' ? 'Private' : 'Public'}</span>
              </>
            ) : (
              <span>{secondLineLeft}</span>
            )}
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {outcomeLabel && (
            <span className={cn('game-badge', winner === 'evil' ? 'game-badge-evil' : 'game-badge-good')}>
              {outcomeLabel}
            </span>
          )}
          {showPrivacyToggle && onVisibilityChange && (
            <select
              value={doc.visibility}
              onChange={(e) => onVisibilityChange(e.target.value as 'public' | 'private')}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="text-xs rounded border border-border bg-background px-2 py-1.5 text-muted-foreground focus:border-primary focus:outline-none"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          )}
          {showEdit && serverSlug &&
            (showEditAsButton ? (
              <Button variant="secondary" size="sm" asChild>
                <Link to={doc.slug ? `/s/${serverSlug}/games/${doc.slug}/edit` : `/s/${serverSlug}/add?edit=${doc.gameId}`}>Edit</Link>
              </Button>
            ) : (
              <Link
                to={doc.slug ? `/s/${serverSlug}/games/${doc.slug}/edit` : `/s/${serverSlug}/add?edit=${doc.gameId}`}
                className="text-xs text-primary hover:underline"
              >
                Edit
              </Link>
            ))}
          {showDownload && onDownload && (
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onDownload() }}
              title="Download JSON"
              aria-label="Download JSON"
            >
              <Download className="size-4" />
            </Button>
          )}
          {showDelete && onDelete && (
            <DeleteConfirmationDialog
              title="Delete game"
              description="This will permanently remove this game. This action cannot be undone."
              confirmLabel="Delete"
              onConfirm={onDelete}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
                title="Delete game"
                aria-label="Delete game"
              >
                <Trash2 className="size-4" />
              </Button>
            </DeleteConfirmationDialog>
          )}
        </div>
      </div>
    )
  }

  const cardGameUrl = doc.slug ? `/game/${doc.slug}` : `/game/${doc.gameId}`
  return (
    <Link
      to={cardGameUrl}
      className="group relative block overflow-hidden bg-card p-8 transition-colors hover:bg-muted/50"
    >
      <div
        aria-hidden
        className="absolute left-0 right-0 top-0 h-px origin-center scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
        style={{ background: 'linear-gradient(90deg, transparent, var(--primary), transparent)' }}
      />

      <div className="mb-4 flex items-center justify-between gap-2">
        {serverName && (
          <span className="font-app-display text-[0.58rem] uppercase tracking-[0.12em] text-muted-foreground/50">
            {serverName}
          </span>
        )}
        <div className="flex shrink-0 items-center gap-2">
          {outcomeLabel && (
            <span className={cn('game-badge', winner === 'evil' ? 'game-badge-evil' : 'game-badge-good')}>
              {outcomeLabel}
            </span>
          )}
          {doc.visibility === 'private' && (
            <span className="game-badge game-badge-private">private</span>
          )}
        </div>
      </div>

      <div className="font-app-display mb-2 text-[1.02rem] font-semibold leading-[1.3] text-foreground">
        {headline}
      </div>
      {description && (
        <p className="mb-6 text-[0.82rem] leading-[1.62] text-muted-foreground line-clamp-2">
          {description}
        </p>
      )}
      {!description && (showAuthor && authorLabel || showEdit || showPrivacyToggle) && <div className="mb-4" />}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {script && (
            <span className="text-[0.62rem] italic text-muted-foreground/50">{script}</span>
          )}
          {authorLabel && (
            <span className="text-[0.62rem] text-muted-foreground/50">{authorLabel}</span>
          )}
          {showEdit && serverSlug && (
            <Link
              to={doc.slug ? `/s/${serverSlug}/games/${doc.slug}/edit` : `/s/${serverSlug}/add?edit=${doc.gameId}`}
              className="text-[0.7rem] text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Edit
            </Link>
          )}
          {showPrivacyToggle && onVisibilityChange && (
            <select
              value={doc.visibility}
              onChange={(e) => {
                e.stopPropagation()
                onVisibilityChange(e.target.value as 'public' | 'private')
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-[0.7rem] rounded border border-border bg-background px-2 py-0.5 text-muted-foreground focus:border-primary focus:outline-none"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          )}
        </div>
        <span className="text-[0.7rem] text-primary transition-colors group-hover:text-primary-hover">
          Watch the game →
        </span>
      </div>
    </Link>
  )
}
