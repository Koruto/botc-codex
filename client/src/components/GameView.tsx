import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { GameViewNarrative, GameStoryPhase, NominationEvent, TimelineEvent } from '../types/game'

function isNominationEvent(e: TimelineEvent): e is NominationEvent {
  return 'type' in e && e.type === 'nomination'
}

function getNominationFromBeat(beat: { events?: TimelineEvent[] } | undefined): NominationEvent | null {
  if (!beat?.events?.length) return null
  const nominationEvents = beat.events.filter(isNominationEvent)
  const last = nominationEvents[nominationEvents.length - 1]
  return last ?? null
}
import { GameTimeline } from './GameTimeline'
import { GameStory } from './GameStory'
import { GrimoireSidebar } from './GrimoireSidebar'
import cloud7 from '../../assets/cloud-7.jpg'
import cloud2 from '../../assets/cloud-2.jpg'
import day2 from '../../assets/day-2.jpg'

const DAY_BG_IMAGE = day2
const PREGAME_BG_IMAGE = cloud7
const NIGHT_BG_IMAGE = cloud2

interface GameViewProps {
  narrative: GameViewNarrative
  gameId?: string
}

export function GameView({ narrative, gameId }: GameViewProps) {
  const [activePhaseIndex, setActivePhaseIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const phaseRefs = useRef<(HTMLElement | null)[]>([])

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const phaseLabels = useMemo(
    () => narrative.timeline.beats.map((b) => narrative.timeline.phaseLabels[b.phaseIndex]),
    [narrative.timeline.beats, narrative.timeline.phaseLabels]
  )

  const shorthandLabels = useMemo(() => {
    const counts: Record<string, number> = { Night: 0, Day: 0 }
    return narrative.timeline.beats.map((b) => {
      const label = narrative.timeline.phaseLabels[b.phaseIndex]
      if (label === 'Pre-Game') return 'PG'
      if (label.startsWith('Night')) {
        counts.Night++
        return `N${counts.Night}`
      }
      if (label.startsWith('Day')) {
        counts.Day++
        return `D${counts.Day}`
      }
      return label.substring(0, 2).toUpperCase()
    })
  }, [narrative.timeline.beats, narrative.timeline.phaseLabels])

  const handleScroll = useCallback(() => {
    let center = 0
    if (isMobile) {
      const container = scrollContainerRef.current
      if (!container) return
      center = container.scrollTop + container.clientHeight / 2
    } else {
      center = window.scrollY + window.innerHeight / 2
    }

    for (let i = 0; i < phaseRefs.current.length; i++) {
      const el = phaseRefs.current[i]
      if (!el) continue
      const top = el.offsetTop
      const bottom = top + el.offsetHeight
      if (center >= top && center < bottom) {
        setActivePhaseIndex(i)
        break
      }
    }
  }, [isMobile])

  useEffect(() => {
    if (!isMobile) {
      window.addEventListener('scroll', handleScroll, { passive: true })
      handleScroll() // Initial check
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [isMobile, handleScroll])

  const scrollToPhase = useCallback(
    (index: number) => {
      const el = phaseRefs.current[index]
      if (!el) return

      if (isMobile) {
        const container = scrollContainerRef.current
        if (!container) return
        const target = el.offsetTop - container.clientHeight / 2 + el.offsetHeight / 2
        container.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
      } else {
        const target = el.offsetTop - window.innerHeight / 2 + el.offsetHeight / 2
        window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
      }
    },
    [isMobile]
  )

  const registerPhaseRef = useCallback((index: number, el: HTMLElement | null) => {
    phaseRefs.current[index] = el
  }, [])

  const metaString = `${narrative.meta.played} · ${narrative.meta.edition} · ${narrative.meta.playerCount} players${narrative.meta.storyteller ? ` · ST: ${narrative.meta.storyteller}` : ''}`

  const phases: GameStoryPhase[] = narrative.timeline.beats.map((b) => ({
    title: b.title,
    subtitle: b.subtitle,
    events: b.events.map((e) => ({ label: e.label, body: e.body })),
  }))

  const currentBeat = narrative.timeline.beats[activePhaseIndex]
  const activeNomination = useMemo(() => getNominationFromBeat(currentBeat), [currentBeat])

  const currentPhaseLabel = phaseLabels[activePhaseIndex] ?? ''
  const isPreGame = currentPhaseLabel === 'Pre-Game'
  const preGameForGrimoire = isPreGame
  const isNight = currentPhaseLabel.startsWith('Night') || currentPhaseLabel === 'Grimoire Reveal'

  const phase = isPreGame ? 'pre-game' : isNight ? 'night' : 'day'
  const dayNight = isNight ? 'night' : isPreGame ? 'pre-game' : 'day'

  useEffect(() => {
    document.title = gameId ? `Game ${gameId} — BotC Codex` : 'BotC Codex'
    return () => {
      document.title = 'BotC Codex'
    }
  }, [gameId])

  const grimoireSidebar = (
    <GrimoireSidebar
      currentPhaseLabel={currentPhaseLabel}
      isNight={isNight}
      isPreGame={preGameForGrimoire}
      grimoireStats={{
        totalPlayers: narrative.meta.playerCount,
        aliveCount: narrative.timeline.beats[activePhaseIndex]?.stats?.alive,
        voteCount: narrative.timeline.beats[activePhaseIndex]?.stats?.voteCount,
      }}
      nomination={activeNomination ? { nominator: activeNomination.nominator, nominee: activeNomination.nominee, votesFor: activeNomination.votesFor, votesAgainst: activeNomination.votesAgainst, executed: activeNomination.executed } : undefined}
      townSquare={narrative.townSquare}
      storytellerName={narrative.meta.storyteller}
    />
  )

  return (
    <div
      className={`game-page-root font-game-body text-game-text ${isMobile ? 'flex h-screen overflow-hidden' : 'min-h-screen'}`}
      data-day-night={dayNight}
      data-phase={phase}
    >
      <div className="game-page-day-layer pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div className="game-page-day-base" />
        <div className="game-page-day-image" style={{ backgroundImage: `url(${PREGAME_BG_IMAGE})` }} />
        <div className="game-page-day-veil" />
        <div className="game-page-day-overlay" />
      </div>
      <div className="game-page-pregame-layer pointer-events-none fixed inset-0 z-1" aria-hidden>
        <div className="game-page-pregame-base" />
        <div className="game-page-pregame-cloud" style={{ backgroundImage: `url(${DAY_BG_IMAGE})` }} />
        <div className="game-page-pregame-veil" />
        <div className="game-page-pregame-overlay" />
      </div>
      <div className="game-page-night-layer pointer-events-none fixed inset-0 z-1" aria-hidden>
        <div className="game-page-night-base" />
        <div className="game-page-night-cloud" style={{ backgroundImage: `url(${NIGHT_BG_IMAGE})` }} />
        <div className="game-page-night-veil" />
        <div className="game-page-night-overlay" />
      </div>
      <div className="game-page-paper-grain pointer-events-none fixed inset-0 z-2" aria-hidden />

      <div className={`game-page-content relative z-10 w-full ${isMobile ? 'flex h-full flex-col' : 'min-h-screen flex-col md:block'}`}>
        <GameTimeline labels={isMobile ? shorthandLabels : phaseLabels} activeIndex={activePhaseIndex} onBeatClick={scrollToPhase} />

        <div className={`flex flex-col pl-14 sm:pl-[140px] ${isMobile ? 'h-full overflow-hidden' : 'min-h-screen md:pr-[420px] lg:pr-[480px] xl:pr-[550px] 2xl:pr-[600px]'}`}>
          <nav className="fixed left-14 right-0 top-0 z-999 flex h-14 items-center border-b border-game-border-subtle bg-transparent px-6 sm:left-[140px] backdrop-blur-md">
            <Link
              to="/"
              className="cursor-pointer font-game-display text-sm tracking-wide text-game-accent no-underline hover:opacity-90 hover:underline drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]"
            >
              BotC Codex
            </Link>
            <div className="ml-auto flex items-center gap-4">
              <span className="font-game-display text-xs uppercase tracking-widest text-game-text-secondary drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] sm:text-sm">
                {currentPhaseLabel}
              </span>
            </div>
          </nav>

          <div className={`mt-14 flex flex-col ${isMobile ? 'flex-1 overflow-hidden' : 'flex-1'}`}>
            <div
              ref={scrollContainerRef}
              onScroll={isMobile ? handleScroll : undefined}
              className={`flex-1 ${isMobile ? 'overflow-y-auto scrollbar-hide' : ''}`}
            >
              <div className={`flex flex-col ${isMobile ? 'min-h-full' : 'min-h-full'}`}>
                <GameStory
                  title={narrative.title}
                  subtitle={narrative.subtitle}
                  meta={metaString}
                  phases={phases}
                  registerPhaseRef={registerPhaseRef}
                />
              </div>
            </div>

            {isMobile && grimoireSidebar}
          </div>
        </div>
        {!isMobile && grimoireSidebar}
      </div>
    </div>
  )
}
