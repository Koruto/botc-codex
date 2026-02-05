import { useParams, Link } from 'react-router-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Grimoire, type GrimoirePlayer } from '../components'
import gameNarrative from '../data/wizard-game-narrative.json'

type NominationEvent = {
  type: 'nomination'
  label: string
  body: string
  nominator: string
  nominee: string
  /** When nominee is not a player (e.g. Storyteller), display label at center. */
  nomineeLabel?: string
  /** When true, show ST badge for external nominee. Defaults to true when nominee not in players. */
  nomineeIsStoryteller?: boolean
  votesFor: string[]
  votesAgainst: string[]
  executed: boolean
}
type NarrativeEvent = { label: string; body: string } | NominationEvent
function isNominationEvent(e: NarrativeEvent): e is NominationEvent {
  return 'type' in e && e.type === 'nomination'
}
type NarrativeBeat = {
  phaseIndex: number
  title: string
  subtitle: string
  events: NarrativeEvent[]
}
type NarrativePlayer = { name: string; role: string; pronouns?: string; deathAtBeat: number | null }
type GameNarrative = {
  gameId: string
  title: string
  subtitle: string
  meta: { played: string; edition: string; playerCount: number; storyteller?: string }
  goodWins: boolean
  townSquare: { bluffs: string[]; edition: object; roles: string; fabled: object[]; players: object[] }
  players: NarrativePlayer[]
  timeline: { phaseLabels: string[]; beats: NarrativeBeat[] }
}

const narrative = gameNarrative as GameNarrative
/** Fixed phase labels (Pre-Game, Night 1, Day 1, …); user content is title/subtitle/events only. */
const PROGRESS_LABELS = narrative.timeline.beats.map(
  (b) => narrative.timeline.phaseLabels[b.phaseIndex]
)

/** Capitalize role id for display (e.g. "lunatic" -> "Lunatic"). */
function roleDisplayName(roleId: string): string {
  return roleId.charAt(0).toUpperCase() + roleId.slice(1).toLowerCase()
}

/** Players in seating order from narrative. deadAtBeat = beat index when they die (story timeline). */
const PLAYERS: (GrimoirePlayer & { role: string })[] = narrative.players.map(
  (p: NarrativePlayer) => ({
    name: p.name,
    role: roleDisplayName(p.role),
    ...(p.deathAtBeat != null && { deadAtBeat: p.deathAtBeat }),
  })
)

export function GamePage() {
  const { gameId } = useParams()
  const [activeBeatIndex, setActiveBeatIndex] = useState(0)
  const [visibleBeats, setVisibleBeats] = useState<Set<number>>(new Set([0]))
  const [isAtBottom, setIsAtBottom] = useState(false)
  const [pov, setPov] = useState('Omniscient')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const beatRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    document.title = gameId
      ? `Game ${gameId} — BotC Codex`
      : 'BotC Codex'
    return () => {
      document.title = 'BotC Codex'
    }
  }, [gameId])

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const center = container.scrollTop + container.clientHeight / 2
    for (let i = 0; i < beatRefs.current.length; i++) {
      const el = beatRefs.current[i]
      if (!el) continue
      const top = el.offsetTop
      const bottom = top + el.offsetHeight
      if (center >= top && center < bottom) {
        setActiveBeatIndex(i)
        break
      }
    }
    const scrollBottom = container.scrollTop + container.clientHeight
    const atBottom = container.scrollHeight - scrollBottom < 24
    setIsAtBottom(atBottom)
  }, [])

  const scrollToBeat = useCallback((index: number) => {
    const el = beatRefs.current[index]
    const container = scrollContainerRef.current
    if (!el || !container) return
    const target =
      el.offsetTop - container.clientHeight / 2 + el.offsetHeight / 2
    container.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const beats = beatRefs.current.filter(Boolean) as HTMLElement[]
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const index = beatRefs.current.indexOf(entry.target as HTMLElement)
          if (index === -1) return
          setVisibleBeats((prev) => new Set(prev).add(index))
        })
      },
      { threshold: 0.2, root: scrollContainerRef.current }
    )
    const container = scrollContainerRef.current
    if (container) beats.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const povOptions = ['Omniscient', 'Alice', 'Bob', 'Carol']

  const beatBase =
    'mb-20 transition-all duration-500 ease-out opacity-0 translate-y-6'
  const beatVisible = 'opacity-100 translate-y-0'
  const eventBlock =
    'border-l-2 border-game-border-subtle pl-5 py-3 my-4 first:mt-0 last:mb-0'
  const eventLabel =
    'font-game-ui text-[11px] font-medium uppercase tracking-widest text-game-text-muted mb-1'
  const eventBody =
    'text-game-text-secondary leading-[1.75] [&_strong]:font-semibold [&_strong]:text-game-text'

  /** Nomination for current beat (for Grimoire animation); resolved to player indices. */
  const currentBeat = narrative.timeline.beats[activeBeatIndex]
  const nominationEvent = currentBeat?.events?.find(isNominationEvent) as NominationEvent | undefined
  const playerNames = narrative.players.map((p) => p.name)
  const nameToIndex = (name: string) => playerNames.indexOf(name)
  const nomineeIndex = nominationEvent ? nameToIndex(nominationEvent.nominee) : -2
  const nominationState =
    nominationEvent && nominationEvent.nominator != null
      ? {
        nominatorIndex: nameToIndex(nominationEvent.nominator),
        nomineeIndex,
        ...(nomineeIndex < 0 && {
          nomineeLabel: nominationEvent.nomineeLabel ?? nominationEvent.nominee,
          nomineeIsStoryteller: nominationEvent.nomineeIsStoryteller ?? true,
        }),
        votesFor: (nominationEvent.votesFor || []).map(nameToIndex).filter((i) => i >= 0),
        votesAgainst: (nominationEvent.votesAgainst || []).map(nameToIndex).filter((i) => i >= 0),
        executed: nominationEvent.executed ?? false,
      }
      : undefined

  return (
    <div className="flex h-screen min-h-screen font-game-body bg-game-bg text-game-text">
      <div
        className="pointer-events-none fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(146,64,14,0.04),transparent_60%)]"
        aria-hidden
      />

      {/* Left: vertical timeline, full viewport height */}
      <aside
        className="fixed left-0 top-0 z-1000 flex h-screen w-[140px] flex-col border-r border-game-border-subtle bg-game-bg"
        aria-label="Timeline"
      >
        <div className="relative flex h-full flex-col justify-between py-8">
          {/* Vertical line through dots */}
          <div
            className="absolute left-5 top-8 bottom-8 w-px bg-game-border"
            aria-hidden
          />
          {PROGRESS_LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => scrollToBeat(i)}
              aria-label={`Jump to ${label}`}
              aria-current={i === activeBeatIndex ? 'true' : undefined}
              className="relative z-10 flex items-center gap-3 px-4 py-1 text-left transition-colors hover:opacity-90"
            >
              <span
                className={`flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full transition-colors ${i === activeBeatIndex
                  ? 'bg-game-text'
                  : 'border-2 border-game-border bg-transparent'
                  }`}
              />
              <span
                className={`font-game-ui text-xs ${i === activeBeatIndex ? 'font-medium text-game-text' : 'text-game-text-muted'
                  }`}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main content: right of timeline */}
      <div className="flex min-h-screen flex-1 flex-col pl-[140px]">
        <nav className="fixed left-[140px] right-0 top-0 z-999 flex h-14 items-center border-b border-game-border-subtle bg-game-bg px-6 md:px-10">
          <Link
            to="/"
            className="font-game-display text-sm tracking-wide text-game-accent no-underline hover:opacity-90"
          >
            BotC Codex
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-6 font-game-ui text-sm text-game-text-secondary">
            <button type="button" className="hover:text-game-text hover:underline">
              Share
            </button>
            <button type="button" className="hover:text-game-text hover:underline">
              Export
            </button>
          </div>
        </nav>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="mt-14 flex-1 overflow-y-auto"
        >
          <div className="grid min-h-full grid-cols-1 lg:grid-cols-[1fr_340px]">
            <div className="mx-auto max-w-[720px] px-6 py-12 lg:px-12 lg:py-16 lg:pb-32">
              <header className="mb-16 animate-[game-fade-in-up_0.8s_ease_0.2s_forwards] opacity-0">
                <h1 className="font-game-display text-3xl font-semibold tracking-tight text-game-text md:text-4xl">
                  {narrative.title}
                </h1>
                <p className="mt-3 font-game-ui text-lg leading-relaxed text-game-text-secondary">
                  {narrative.subtitle}
                </p>
                <p className="mt-4 font-game-ui text-sm text-game-text-muted">
                  {narrative.meta.played} · {narrative.meta.edition} · {narrative.meta.playerCount} players
                  {narrative.meta.storyteller ? ` · ST: ${narrative.meta.storyteller}` : ''}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 font-game-ui text-sm text-game-text-muted">
                  <span>View as:</span>
                  {povOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPov(option)}
                      className={`${pov === option ? 'font-medium text-game-accent' : 'hover:text-game-text'
                        }`}
                    >
                      {option === 'Omniscient' ? 'Omniscient' : option}
                    </button>
                  ))}
                </div>
              </header>

              {narrative.timeline.beats.map((beat, i) => (
                <section
                  key={`${narrative.timeline.phaseLabels[beat.phaseIndex]}-${i}`}
                  ref={(el) => { beatRefs.current[i] = el }}
                  className={`${beatBase} ${visibleBeats.has(i) ? beatVisible : ''}`}
                >
                  <h2 className="font-game-display text-xl font-semibold text-game-text md:text-2xl">
                    {beat.title}
                  </h2>
                  <p className="mt-1 text-sm text-game-text-muted">
                    {beat.subtitle}
                  </p>
                  {beat.events.map((event) => {
                    const borderClass =
                      i === 0 ? 'border-l-game-accent' : i === 1 ? 'border-l-game-good' : i === 2 || i === 4 ? 'border-l-game-accent' : 'border-l-game-danger'
                    return (
                      <div key={event.label} className={`${eventBlock} ${borderClass}`}>
                        <div className={eventLabel}>{event.label}</div>
                        <p className={eventBody}>{event.body}</p>
                      </div>
                    )
                  })}
                </section>
              ))}
            </div>

            <aside className="sticky top-0 flex h-full w-full flex-col overflow-hidden border-l border-game-border-subtle bg-game-bg px-6 py-6 font-game-ui lg:max-h-[calc(100vh-3.5rem)] lg:self-start lg:px-8">
              <p className="shrink-0 text-[11px] font-medium uppercase tracking-widest text-game-text-muted">
                Current beat
              </p>
              <p className="mt-0.5 shrink-0 font-game-display text-lg text-game-text">
                {PROGRESS_LABELS[activeBeatIndex]}
              </p>

              <Grimoire
                players={PLAYERS}
                currentBeatIndex={activeBeatIndex}
                totalBeats={PROGRESS_LABELS.length}
                goodWins={narrative.goodWins}
                nomination={nominationState}
              />

              {/* Always in layout so no sidebar scroll; visible only when main content is at bottom */}
              <div
                className={`shrink-0 border-t border-game-border-subtle pt-4 text-sm transition-opacity duration-300 ${isAtBottom ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
              >
                <button
                  type="button"
                  className="text-game-accent hover:underline"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify(narrative.townSquare, null, 2)
                    )
                  }}
                >
                  Copy Town Square JSON
                </button>
                <span className="mx-2 text-game-text-muted">·</span>
                <button
                  type="button"
                  className="text-game-text-secondary hover:text-game-text hover:underline"
                >
                  Share
                </button>
                <span className="mx-2 text-game-text-muted">·</span>
                <button
                  type="button"
                  className="text-game-text-secondary hover:text-game-text hover:underline"
                >
                  Download
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
