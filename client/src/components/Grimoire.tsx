import { useEffect, useState } from 'react'
import { Hand } from 'lucide-react'

export interface GrimoirePlayer {
  name: string
  /** Beat index at which this player dies (inclusive). Omit or null = never dead in this game. */
  deadAtBeat?: number | null
}

export interface GrimoireNomination {
  nominatorIndex: number
  /** -1 if nominee is not in the circle (e.g. Storyteller). */
  nomineeIndex: number
  /** When nomineeIndex === -1, optional label to show (e.g. "Storyteller", "Starlow"). */
  nomineeLabel?: string
  /** When true and nominee not in circle, show ST badge. */
  nomineeIsStoryteller?: boolean
  votesFor: number[]
  votesAgainst: number[]
  executed: boolean
}

interface GrimoireProps {
  players: GrimoirePlayer[]
  currentBeatIndex: number
  totalBeats?: number
  goodWins?: boolean
  size?: number
  /** When set, runs nomination animation: clock from center to nominator→nominee, full circle, then vote highlights, then nominee marked. */
  nomination?: GrimoireNomination
}

function polarToPercent(
  index: number,
  total: number,
  rPercent: number
): { x: number; y: number } {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2
  return {
    x: 50 + rPercent * Math.cos(angle),
    y: 50 + rPercent * Math.sin(angle),
  }
}

export function Grimoire({
  players,
  currentBeatIndex,
  totalBeats = 0,
  goodWins = true,
  size = 280,
  nomination,
}: GrimoireProps) {
  const isLastBeat = totalBeats > 0 && currentBeatIndex >= totalBeats - 1
  const showOutcome = isLastBeat

  /** Step 0 = clock hands draw, 1 = hand icons show (right after hands), 2 = minute hand rotates (voters turn golden as it passes), 3 = circle done, red outline on nominee. */
  const [nominationStep, setNominationStep] = useState(-1)
  /** Minute hand rotation in degrees (0 → 360). Voters turn golden when hand passes their angle. */
  const [minuteHandRotation, setMinuteHandRotation] = useState(0)

  useEffect(() => {
    if (!nomination || nomination.nominatorIndex < 0) {
      setNominationStep(-1)
      setMinuteHandRotation(0)
      return
    }
    setNominationStep(0)
    setMinuteHandRotation(0)
    const t1 = setTimeout(() => setNominationStep(1), 1600)
    const t2 = setTimeout(() => setNominationStep(2), 2200)
    const t3 = setTimeout(() => setNominationStep(3), 4500)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [nomination?.nominatorIndex, nomination?.nomineeIndex])

  /** When step 2, animate minute hand rotation 0 → 360; step 3 when done. */
  useEffect(() => {
    if (nominationStep !== 2) return
    const start = performance.now()
    const duration = 2200
    let rafId: number
    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      setMinuteHandRotation(t * 360)
      if (t < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [nominationStep])

  const r = 36
  const center = { x: 50, y: 50 }
  const isExternalNominee = nomination && nomination.nomineeIndex < 0

  /** Hour hand (shorter): to nominator. Minute hand: to nominee (or to nominator when external). */
  const hourHandLength = 18
  const minuteHandLength = 31
  const nominatorPosShort =
    nomination && nomination.nominatorIndex >= 0
      ? polarToPercent(nomination.nominatorIndex, players.length, hourHandLength)
      : null
  const nomineePos =
    nomination && nomination.nomineeIndex >= 0
      ? polarToPercent(nomination.nomineeIndex, players.length, minuteHandLength)
      : null
  /** External: single hand from center pointing to nominator (then rotates around center). */
  const nominatorPosLong =
    nomination && nomination.nominatorIndex >= 0
      ? polarToPercent(nomination.nominatorIndex, players.length, minuteHandLength)
      : null

  /** In-circle: hour center→nominator, minute center→nominee. External: one hand center→nominator only. */
  const hourHandPath =
    !isExternalNominee &&
    nominatorPosShort &&
    `M ${center.x} ${center.y} L ${nominatorPosShort.x} ${nominatorPosShort.y}`
  const minuteHandPath =
    nomineePos &&
    `M ${center.x} ${center.y} L ${nomineePos.x} ${nomineePos.y}`
  const externalHandPath =
    isExternalNominee &&
    nominatorPosLong &&
    `M ${center.x} ${center.y} L ${nominatorPosLong.x} ${nominatorPosLong.y}`

  /** Start angle for sweep: nominee (in-circle) or nominator (external = hand points at them). */
  const nomineeAngleDegNorm =
    nomination && nomination.nominatorIndex >= 0
      ? (((nomination.nomineeIndex >= 0 ? nomination.nomineeIndex : nomination.nominatorIndex) / players.length) * 360 - 90 + 360) % 360
      : 0

  /** Has the minute hand swept past this voter's angle? */
  const handHasPassedVoter = (voterIndex: number) => {
    if (!nomination || nominationStep < 2) return false
    if (minuteHandRotation >= 360) return true
    const voterAngleDeg =
      ((voterIndex / players.length) * 360 - 90 + 360) % 360
    const relative = (voterAngleDeg - nomineeAngleDegNorm + 360) % 360
    return relative < minuteHandRotation
  }

  return (
    <div className="my-4 flex min-h-0 flex-1 flex-col items-center justify-center">
      <div
        className="relative flex shrink-0 items-center justify-center rounded-full border-2 border-game-border bg-game-bg-secondary"
        style={{ width: `min(${size}px, 100%)`, aspectRatio: '1' }}
        aria-label="Grimoire: players in seating order"
      >
        {/* Center: winner at end of game */}
        {showOutcome && (
          <div
            className="absolute inset-0 flex items-center justify-center text-center font-game-display text-sm font-semibold"
            aria-live="polite"
          >
            <span
              className={
                goodWins ? 'text-game-good-win' : 'text-game-evil'
              }
            >
              {goodWins ? 'Good wins' : 'Evil wins'}
            </span>
          </div>
        )}

        {/* Nomination: in-circle = center clock; external = clock from nominator, ST badge at center. */}
        {nomination && nominationStep >= 0 && (
          <svg
            className="absolute inset-0 h-full w-full rounded-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            style={{ pointerEvents: 'none' }}
          >
            {/* In-circle: hour hand center → nominator */}
            {hourHandPath && (
              <path
                d={hourHandPath}
                pathLength={1}
                fill="none"
                stroke="var(--color-game-text-muted)"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeDasharray="1"
                strokeDashoffset={nominationStep === 0 ? '1' : '0'}
                style={{
                  animation:
                    nominationStep === 0
                      ? 'grimoire-clock-draw 0.7s ease-out forwards'
                      : 'none',
                }}
              />
            )}
            {/* In-circle: minute hand from center to nominee, rotates around center */}
            {minuteHandPath && !isExternalNominee && (
              <g transform={`rotate(${minuteHandRotation} 50 50)`}>
                <path
                  d={minuteHandPath}
                  pathLength={1}
                  fill="none"
                  stroke="var(--color-game-accent)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeDasharray="1"
                  strokeDashoffset={nominationStep === 0 ? '1' : '0'}
                  style={{
                    animation:
                      nominationStep === 0
                        ? 'grimoire-minute-draw 0.8s 0.5s ease-out forwards'
                        : 'none',
                  }}
                />
              </g>
            )}
            {/* External (e.g. ST): single hand from center to nominator, rotates around center */}
            {externalHandPath && (
              <g transform={`rotate(${minuteHandRotation} 50 50)`}>
                <path
                  d={externalHandPath}
                  pathLength={1}
                  fill="none"
                  stroke="var(--color-game-accent)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeDasharray="1"
                  strokeDashoffset={nominationStep === 0 ? '1' : '0'}
                  style={{
                    animation:
                      nominationStep === 0
                        ? 'grimoire-minute-draw 0.8s ease-out forwards'
                        : 'none',
                  }}
                />
              </g>
            )}
          </svg>
        )}

        {/* External nominee (e.g. Storyteller): badge at center; red outline when circle done */}
        {nomination && isExternalNominee && nominationStep >= 0 && (
          <div
            className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-lg border-2 px-2 py-1 ${
              nominationStep === 3
                ? 'border-game-danger bg-game-bg-elevated/90'
                : 'border-game-border bg-game-bg-secondary/90'
            }`}
            aria-label={nomination.nomineeLabel ?? 'Storyteller'}
          >
            <span className="font-game-ui text-[10px] font-semibold uppercase tracking-wider text-game-text-muted">
              {nomination.nomineeIsStoryteller !== false ? 'ST' : ''}
            </span>
            {nomination.nomineeLabel && (
              <span className="max-w-[64px] truncate text-center text-xs text-game-text">
                {nomination.nomineeLabel}
              </span>
            )}
          </div>
        )}

        {players.map((player, i) => {
          const deadAtBeat = player.deadAtBeat ?? Infinity
          const isDead = currentBeatIndex >= deadAtBeat
          const isNomineeThisBeat = nomination && nomination.nomineeIndex === i
          const isDeadDisplay =
            isDead && !isNomineeThisBeat
          const angle = (i / players.length) * 2 * Math.PI - Math.PI / 2
          const x = 50 + r * Math.cos(angle)
          const y = 50 + r * Math.sin(angle)

          const votedFor = nomination && nomination.votesFor.includes(i)
          const passed = handHasPassedVoter(i)
          const showHandAndGreen =
            nomination && votedFor && nominationStep >= 1 && !passed
          const showGolden =
            nomination && votedFor && nominationStep >= 2 && passed
          const showNomineeRed = nomination && nominationStep === 3 && isNomineeThisBeat
          const handDelayMs =
            nomination && votedFor && nomination.nominatorIndex >= 0
              ? ((i * 97 + (i % 3) * 173 + (nomination.nominatorIndex + 1) * 31) % 520)
              : 0

          return (
            <div
              key={player.name}
              className="absolute flex flex-col items-center transition-all duration-300"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              aria-label={`${player.name}, ${isDeadDisplay ? 'dead' : 'alive'}`}
            >
              <span
                className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
                  isDeadDisplay
                    ? 'border-game-border bg-game-bg-elevated opacity-70'
                    : 'border-game-good bg-game-bg'
                } ${showGolden ? 'grimoire-voted-golden' : ''} ${
                  showNomineeRed ? 'grimoire-nominee-red' : ''
                }`}
                aria-hidden
              >
                {showHandAndGreen && (
                  <span
                    className="grimoire-hand-appear absolute inset-0 flex items-center justify-center rounded-full bg-game-good/30 text-game-good"
                    style={{ animationDelay: `${handDelayMs}ms` }}
                  >
                    <Hand className="h-4 w-4 shrink-0" strokeWidth={2} />
                  </span>
                )}
              </span>
              <span
                className={`mt-1 max-w-[72px] truncate text-center text-xs ${
                  isDeadDisplay ? 'text-game-text-muted' : 'text-game-text'
                }`}
                title={player.name}
              >
                {player.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
