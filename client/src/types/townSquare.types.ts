/** Town Square (Clocktower Online) Load State JSON - from API or paste */

export type TownSquarePlayer = {
  name: string
  id: string
  role: string
  reminders: string[]
  isVoteless: boolean
  isDead: boolean
  pronouns: string
}

export type TownSquareGameState = {
  bluffs: string[]
  edition: { id: string; [key: string]: unknown }
  roles: string
  fabled: unknown[]
  players: TownSquarePlayer[]
}

export type ProcessGrimoireResponse = {
  townSquare: TownSquareGameState
}

/** Meta returned when server normalizes from minimal/external JSON (edition, playerCount). */
export type FromJsonMeta = {
  playedOn?: string
  edition?: string
  playerCount?: number
  storyteller?: string
  coStorytellers?: string[]
}

export type FromJsonResponse = {
  townSquare: TownSquareGameState
  /** Present when server could derive meta (e.g. from minimal format); use to prefill Meta step. */
  meta?: FromJsonMeta
}
