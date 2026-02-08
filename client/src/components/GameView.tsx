import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { GameViewNarrative, GameStoryPhase } from '../types/game'
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

  const phaseLabels = narrative.timeline.beats.map(
    (b) => narrative.timeline.phaseLabels[b.phaseIndex]
  )

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const center = container.scrollTop + container.clientHeight / 2
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
  }, [])

  const scrollToPhase = useCallback((index: number) => {
    const el = phaseRefs.current[index]
    const container = scrollContainerRef.current
    if (!el || !container) return
    const target = el.offsetTop - container.clientHeight / 2 + el.offsetHeight / 2
    container.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
  }, [])

  const registerPhaseRef = useCallback((index: number, el: HTMLElement | null) => {
    phaseRefs.current[index] = el
  }, [])

  const metaString = `${narrative.meta.played} · ${narrative.meta.edition} · ${narrative.meta.playerCount} players${narrative.meta.storyteller ? ` · ST: ${narrative.meta.storyteller}` : ''}`

  const phases: GameStoryPhase[] = narrative.timeline.beats.map((b) => ({
    title: b.title,
    subtitle: b.subtitle,
    events: b.events.map((e) => ({ label: e.label, body: e.body })),
  }))

  const currentPhaseLabel = phaseLabels[activePhaseIndex] ?? ''
  const isPreGame = currentPhaseLabel === 'Pre-Game'
  const isNight = currentPhaseLabel.startsWith('Night')

  const phase = isPreGame ? 'pre-game' : isNight ? 'night' : 'day'
  const dayNight = isNight ? 'night' : isPreGame ? 'pre-game' : 'day'

  useEffect(() => {
    document.title = gameId ? `Game ${gameId} — BotC Codex` : 'BotC Codex'
    return () => {
      document.title = 'BotC Codex'
    }
  }, [gameId])

  return (
    <div
      className="game-page-root flex h-screen min-h-screen font-game-body text-game-text"
      data-day-night={dayNight}
      data-phase={phase}
    >
      {/* Day phase: blue/twilight look (visible when data-phase="day") */}
      <div className="game-page-day-layer pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div className="game-page-day-base" />
        <div
          className="game-page-day-image"
          style={{ backgroundImage: `url(${PREGAME_BG_IMAGE})` }}
        />
        <div className="game-page-day-veil" />
        <div className="game-page-day-overlay" />
      </div>
      {/* Pre-Game phase: warm/day look (visible when data-phase="pre-game") */}
      <div className="game-page-pregame-layer pointer-events-none fixed inset-0 z-1" aria-hidden>
        <div className="game-page-pregame-base" />
        <div
          className="game-page-pregame-cloud"
          style={{ backgroundImage: `url(${DAY_BG_IMAGE})` }}
        />
        <div className="game-page-pregame-veil" />
        <div className="game-page-pregame-overlay" />
      </div>
      {/* Night: single layer that fades in/out so whole scheme transitions together */}
      <div className="game-page-night-layer pointer-events-none fixed inset-0 z-1" aria-hidden>
        <div className="game-page-night-base" />
        <div
          className="game-page-night-cloud"
          style={{ backgroundImage: `url(${NIGHT_BG_IMAGE})` }}
        />
        <div className="game-page-night-veil" />
        <div className="game-page-night-overlay" />
      </div>
      <div className="game-page-paper-grain pointer-events-none fixed inset-0 z-2" aria-hidden />

      <div className="game-page-content relative z-10 flex min-h-screen w-full flex-1">
        <GameTimeline
          labels={phaseLabels}
          activeIndex={activePhaseIndex}
          onBeatClick={scrollToPhase}
        />

        <div className="flex min-h-screen flex-1 flex-col pl-14 sm:pl-[140px]">
          <nav className="fixed left-14 right-0 top-0 z-999 flex h-14 items-center border-b border-game-border-subtle bg-transparent px-6 sm:left-[140px]">
            <Link to="/" className="cursor-pointer font-game-display text-sm tracking-wide text-game-accent no-underline hover:opacity-90 hover:underline">
              BotC Codex
            </Link>
          </nav>

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="mt-14 flex-1 overflow-y-auto"
          >
            <div className="grid min-h-full grid-cols-1 md:grid-cols-[1fr_420px]">
              <GameStory
                title={narrative.title}
                subtitle={narrative.subtitle}
                meta={metaString}
                phases={phases}
                registerPhaseRef={registerPhaseRef}
              />
              <GrimoireSidebar
                currentPhaseLabel={currentPhaseLabel}
                isNight={isNight}
                isPreGame={isPreGame}
                grimoireStats={{
                  totalPlayers: narrative.meta.playerCount,
                  aliveCount: narrative.timeline.beats[activePhaseIndex]?.stats?.alive,
                  voteCount: narrative.timeline.beats[activePhaseIndex]?.stats?.voteCount,
                }}
                townSquare={narrative.townSquare}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
