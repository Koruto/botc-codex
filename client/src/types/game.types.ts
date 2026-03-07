import type { GameEvent, NarrativeEvent, Player } from "@/types"
import type { CustomScript, RoleInfo } from "./grimoire.types"
import type { TownSquareGameState } from "./townSquare.types"

// ----- API document & request bodies (match backend schemas.py JSON) -----

/** Stored game document from API. Matches backend GameDocument. */
export type GameDocument = {
  gameId: string
  serverId: string
  status: string
  updatedAt: string
  name?: string | null
  townSquare?: TownSquareGameState | null
  meta?: GameMeta | null
  phases?: GamePhase[] | null
  title?: string | null
  subtitle?: string | null
  winner?: string | null
}

/** Request body for POST /api/servers/{id}/games. Matches backend GameCreateBody. */
export type GameCreateBody = {
  name?: string | null
  townSquare?: TownSquareGameState | null
  meta?: GameMeta | null
  phases?: GamePhase[] | null
  title?: string | null
  subtitle?: string | null
}

/** Request body for PATCH /api/servers/{id}/games/{id}. Matches backend GameUpdateBody. */
export type GameUpdateBody = Partial<GameCreateBody> & {
  winner?: string | null
  status?: string | null
}

// ----- Game (derived view) -----

export type Game = {
  schemaVersion: string
  gameId: string
  title: string
  subtitle?: string
  meta: GameMeta
  winner: "good" | "evil"
  players: Player[]
  phases: GamePhase[]
}

export type DerivedGame = Omit<Game, 'phases'> & {
  generatedAt: string
  phases: DerivedGamePhase[]
}

export type EditionId = 'bmr' | 'snv' | 'tb' | 'custom'

export type GameMeta = {
  playedOn: string              // display string, e.g. "February 2025"
  edition: EditionId            // "bmr" | "snv" | "luf" | "custom"
  playerCount: number
  storyteller: string
  coStorytellers?: string[]      // just names, no special role
  script?: CustomScript
  customRoles?: RoleInfo[]
}

export const PhaseType = {
  PREGAME: 'pregame',
  DAY: 'day',
  NIGHT: 'night',
  GRIMOIRE_REVEAL: 'grimoire_reveal',
} as const

export type PhaseType = (typeof PhaseType)[keyof typeof PhaseType]

export type GamePhase = {
  type: PhaseType
  phaseNumber?: number
  title: string
  subtitle: string
  events: GameEvent[]
}

export type NarrativePhase = Omit<GamePhase, 'events'> & {
  events: NarrativeEvent[]
}

export type DerivedGamePhase = GamePhase & {
  snapshot: PhaseSnapshot
}

export type PhaseSnapshot = {
  alivePlayerIds: string[]
  deadPlayerIds: string[]
  ghostVotesUsed: string[]      // playerIds who spent their ghost vote
  aliveCount: number
  deadCount: number
  voteCount: number
}

