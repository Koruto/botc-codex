import type { GameEvent, NarrativeEvent, Player } from "@/types";

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

export type GameMeta = {
  playedOn: string              // display string, e.g. "February 2025"
  edition: string           // e.g. "bmr"
  playerCount: number
  storyteller: string
  coStorytellers?: string[]   // just names, no special role
}

export enum PhaseType {
  PREGAME = 'pregame',
  DAY = 'day',
  NIGHT = 'night',
  GRIMOIRE_REVEAL = 'grimoire_reveal',
}

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

