import { Grimoire } from './Grimoire'

/** First-row grimoire stats from narrative: total players + current phase's alive and vote count. */
export interface GrimoireStats {
  totalPlayers: number
  aliveCount?: number
  voteCount?: number
}

/** Current nomination for grimoire: hands, vote icons, and execution. */
export interface GrimoireNomination {
  nominator: string
  nominee: string
  /** Player names who voted for execution (hand icon, then thumbs up when clock passes). */
  votesFor?: string[]
  votesAgainst?: string[]
  /** When true, nominee was executed (skull on their token when rotation done). */
  executed?: boolean
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
  /** When set, show big hand toward nominee and small hand toward nominator from center. */
  nomination?: GrimoireNomination
  /** Optional town square payload for "Copy Town Square JSON". */
  townSquare?: object
  /** Name of the Storyteller (for ST token). Defaults to "Storyteller". */
  storytellerName?: string
}

export function GrimoireSidebar({ currentPhaseLabel, isNight, isPreGame, grimoireStats, nomination, townSquare, storytellerName }: GrimoireSidebarProps) {
  const handleCopy = () => {
    if (townSquare) {
      navigator.clipboard.writeText(JSON.stringify(townSquare, null, 2))
    }
  }
  return (
    <aside className="game-page-aside gap-4 md:p-4 shrink-0">
      <div className="hidden md:flex shrink-0 items-start justify-between gap-3">
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
        nomination={nomination}
        storytellerName={storytellerName}
      />
    </aside>
  )
}
