import type { GameEvent, Player } from "@/types";

export type Game = {
  schemaVersion: string
  gameId: string
  title: string
  subtitle?: string
  meta: GameMeta
  winner: "good" | "evil"
  players: Player[]
  phases: Phase[]
}

export type GameMeta = {
  playedOn: string              // e.g. "2025-02"
  edition: string           // e.g. "bmr"
  playerCount: number
  storyteller: string
  coStorytellers?: string[]   // just names, no special role
}

export type Phase = PreGamePhase | GamePhase | GrimoireRevealPhase

export type PreGamePhase = {
  type: "pregame"
  events: GameEvent[]
}

export type GamePhase = {
  type: "day" | "night"
  phaseNumber: number
  events: GameEvent[]
  snapshot: PhaseSnapshot
}

export type GrimoireRevealPhase = {
  type: "grimoire_reveal"
  events: GameEvent[]
}

export type PhaseSnapshot = {
  alivePlayerIds: string[]
  deadPlayerIds: string[]
  ghostVotesUsed: string[]      // playerIds who spent their ghost vote
  aliveCount: number
  deadCount: number
}

