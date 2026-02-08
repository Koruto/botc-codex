import { Grimoire } from './Grimoire'

/** First-row grimoire stats from narrative: total players + current phase's alive and vote count. */
export interface GrimoireStats {
  totalPlayers: number
  aliveCount?: number
  voteCount?: number
}

interface GrimoireSidebarProps {
  /** Current phase label (e.g. "Night 1", "Day 1"). */
  currentPhaseLabel: string
  /** When true, grimoire shows night (tokens); when false, day (lives). Pre-Game uses day view. */
  isNight: boolean
  /** When true, show day view (no spoilers) with bluish token styling. */
  isPreGame?: boolean
  /** First-row stats from narrative (per-phase stats in timeline.beats[].stats). */
  grimoireStats?: GrimoireStats
  /** Optional town square payload for "Copy Town Square JSON". */
  townSquare?: object
}

export function GrimoireSidebar({ currentPhaseLabel, isNight, isPreGame, grimoireStats, townSquare }: GrimoireSidebarProps) {
  const handleCopy = () => {
    if (townSquare) {
      navigator.clipboard.writeText(JSON.stringify(townSquare, null, 2))
    }
  }

  return (
    <aside className="sticky top-0 self-start flex flex-col gap-4 overflow-y-auto p-4 shrink-0">
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-game-text-muted">
            Current phase
          </p>
          <p className="mt-0.5 font-game-display text-lg text-game-text">
            {currentPhaseLabel}
          </p>
        </div>
        {townSquare && (
          <button
            type="button"
            className="text-game-accent text-sm hover:underline whitespace-nowrap"
            onClick={handleCopy}
          >
            Copy Town Square JSON
          </button>
        )}
      </div>

      <Grimoire
        isDay={!isNight}
        isPreGame={isPreGame}
        totalPlayers={grimoireStats?.totalPlayers}
        aliveCount={grimoireStats?.aliveCount}
        voteCount={grimoireStats?.voteCount}
      />
    </aside>
  )
}
