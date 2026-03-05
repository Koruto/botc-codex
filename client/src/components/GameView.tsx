import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { DerivedGame, ExecutionEvent, NarrativeEvent, NarrativePhase, NominationEvent } from '@/types'
import { PhaseType } from '@/types'
import { DAY_BG_IMAGE, NIGHT_BG_IMAGE, PREGAME_BG_IMAGE, STORYTELLER_ID } from '@/utils/constants'
import { phaseLabel } from '@/utils/phaseUtils'
import { GameTimeline } from './GameTimeline'
import { GameStory } from './GameStory'
import { GrimoireSidebar } from './GrimoireSidebar'

interface GameViewProps {
  game: DerivedGame
  gameId?: string
}

export function GameView({ game, gameId }: GameViewProps) {
  const [activePhaseIndex, setActivePhaseIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const phaseRefs = useRef<(HTMLElement | null)[]>([])

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    document.title = gameId ? `Game ${gameId} — BotC Codex` : 'BotC Codex'
    return () => { document.title = 'BotC Codex' }
  }, [gameId])

  const nameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const player of game.players) map.set(player.id, player.name)
    map.set(STORYTELLER_ID, game.meta.storyteller)
    return map
  }, [game.players, game.meta.storyteller])

  const phaseLabels = useMemo(
    () => game.phases.map((phase, i) => phaseLabel(phase, i)),
    [game.phases]
  )

  const storyPhases = useMemo((): NarrativePhase[] => {
    return game.phases.map((phase, phaseIndex) => {
      const title = phase.title ?? phaseLabels[phaseIndex] ?? ''
      const subtitle = phase.subtitle ?? ''
      const events = phase.events.filter((e): e is NarrativeEvent => e.type === 'narrative')
      return { type: phase.type, phaseNumber: phase.phaseNumber, title, subtitle, events }
    })
  }, [game.phases, phaseLabels])

  const deathAtPhase = useMemo(() => {
    const map = new Map<string, number>()
    game.phases.forEach((phase, phaseIndex) => {
      for (const id of phase.snapshot.deadPlayerIds) {
        if (!map.has(id)) map.set(id, phaseIndex)
      }
    })
    return map
  }, [game.phases])

  const narrativePlayers = useMemo(
    () => game.players.map((player) => ({ name: player.name, deathAtPhase: deathAtPhase.get(player.id) ?? null })),
    [game.players, deathAtPhase]
  )

  const currentPlayers = useMemo(() => {
    const players = game.players.map((player) => ({ id: player.id, name: player.name, role: player.roleId }))
    for (let i = 0; i <= activePhaseIndex; i++) {
      const phase = game.phases[i]
      if (!phase) continue
      for (const event of phase.events) {
        if (event.type === 'role_change') {
          const idx = game.players.findIndex((player) => player.id === event.playerId)
          if (idx !== -1) players[idx].role = event.newRoleId
        }
      }
    }
    return players
  }, [game, activePhaseIndex])

  const currentPhase = game.phases[activePhaseIndex]
  const phaseType = currentPhase?.type ?? PhaseType.PREGAME
  const isDay = phaseType === PhaseType.DAY
  const isPreGame = phaseType === PhaseType.PREGAME
  const isNight = phaseType === PhaseType.NIGHT || phaseType === PhaseType.GRIMOIRE_REVEAL
  const currentPhaseLabel = phaseLabels[activePhaseIndex] ?? ''
  const dayNight = isDay ? 'day' : isPreGame ? 'pre-game' : 'night'

  const snapshot = currentPhase?.snapshot
  const voteCount = snapshot?.voteCount

  const activeNomination = useMemo(() => {
    if (!currentPhase?.events?.length) return null
    const events = currentPhase.events
    const lastNom = [...events].reverse().find((e): e is NominationEvent => e.type === 'nomination')
    if (!lastNom) return null
    const nomIndex = events.indexOf(lastNom)
    const chainedExecution = events.find(
      (e): e is ExecutionEvent =>
        e.type === 'execution' && e.chainedToIndex === nomIndex,
    )
    const executed = chainedExecution ? !chainedExecution.prevented : lastNom.passed
    return {
      nominator: nameById.get(lastNom.nominatorId) ?? lastNom.nominatorId,
      nominee: nameById.get(lastNom.nomineeId) ?? lastNom.nomineeId,
      votesFor: (lastNom.votesFor ?? []).map((id) => nameById.get(id) ?? id),
      votesAgainst: (lastNom.votesAgainst ?? []).map((id) => nameById.get(id) ?? id),
      executed,
    }
  }, [currentPhase, nameById])

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
      handleScroll()
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

  const metaString = `${game.meta.playedOn} · ${game.meta.edition} · ${game.meta.playerCount} players · ST: ${game.meta.storyteller}`

  const townSquare = useMemo(
    () => ({ players: game.players.map((player) => ({ name: player.name, role: player.roleId })) }),
    [game.players]
  )

  const grimoireSidebar = (
    <GrimoireSidebar
      currentPhaseLabel={currentPhaseLabel}
      isNight={isNight}
      isPreGame={isPreGame}
      grimoireStats={{
        totalPlayers: game.meta.playerCount,
        aliveCount: snapshot?.aliveCount,
        voteCount,
      }}
      ghostVotesUsedIds={snapshot?.ghostVotesUsed ?? []}
      nomination={activeNomination ?? undefined}
      townSquare={townSquare}
      storytellerName={game.meta.storyteller}
      currentPhaseIndex={activePhaseIndex}
      narrativePlayers={narrativePlayers}
      players={currentPlayers}
    />
  )

  return (
    <div
      className={`game-page-root font-game-body text-game-text ${isMobile ? 'flex h-screen overflow-hidden' : 'min-h-screen'}`}
      data-day-night={dayNight}
      data-phase={phaseType === PhaseType.PREGAME ? 'pre-game' : phaseType}
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
        <GameTimeline phaseLabels={phaseLabels} isMobile={isMobile} activeIndex={activePhaseIndex} onPhaseClick={scrollToPhase} />

        <div className={`flex flex-col pl-14 sm:pl-[140px] ${isMobile ? 'h-full overflow-hidden' : 'min-h-screen md:pr-[420px] lg:pr-[480px] xl:pr-[550px] 2xl:pr-[600px]'}`}>
          <nav className="fixed left-14 right-0 top-0 z-999 flex h-14 items-center border-b border-game-border-subtle bg-transparent px-6 sm:left-[140px] backdrop-blur-md">
            <Link to="/" className="cursor-pointer font-game-display text-sm tracking-wide text-game-accent no-underline hover:opacity-90 hover:underline drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
              BotC Codex
            </Link>
            <div className="ml-auto flex items-center gap-4">
              <span className="font-game-display text-xs uppercase tracking-widest text-game-text-secondary drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] sm:text-sm">
                {currentPhaseLabel}
              </span>
            </div>
          </nav>

          <div className={`mt-14 flex flex-col ${isMobile ? 'flex-1 overflow-hidden min-h-0' : 'flex-1'}`}>
            <div
              ref={scrollContainerRef}
              onScroll={isMobile ? handleScroll : undefined}
              className={`flex-1 ${isMobile ? 'overflow-y-auto scrollbar-hide' : ''}`}
            >
              <div className={`flex flex-col ${isMobile ? '' : 'min-h-full'}`}>
                <GameStory
                  title={game.title}
                  subtitle={game.subtitle ?? ''}
                  meta={metaString}
                  phases={storyPhases}
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
