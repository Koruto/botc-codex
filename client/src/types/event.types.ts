export type GameEvent =
  | NarrativeEvent
  | NominationEvent
  | ExecutionEvent
  | DeathEvent
  | AbilityEvent
  | GhostVoteEvent
  | GhostVoteRestoredEvent
  | TravellerJoinEvent
  | TravellerLeaveEvent
  | RoleChangeEvent

export type NarrativeEvent = {
  type: "narrative"
  label: string
  body: string
}

export type NominationEvent = {
  type: "nomination"
  nominatorId: string         // player ID
  nomineeId: string           // player ID or "__storyteller__"
  votesFor: string[]          // player IDs
  votesAgainst: string[]
  passed: boolean
  tiebreak?: boolean
}

export type ExecutionEvent = {
  type: "execution"
  playerId: string
  prevented?: boolean
  reason?: string             // e.g. "Mayor bounced"
}

export type DeathEvent = {
  type: "death"
  playerId: string
  cause: "night_kill" | "ability" | "execution" | "other"
  sourcePlayerId?: string     // who caused it
  sourceRoleId?: string       // which role caused it
  reason?: string             // freeform note
}

export type AbilityEvent = {
  type: "ability"
  playerId: string
  roleId: string
  targets?: string[]          // player IDs
  isPublic: boolean
  result?: string
}

export type GhostVoteEvent = {
  type: "ghost_vote"
  playerId: string
}

export type GhostVoteRestoredEvent = {
  type: "ghost_vote_restored"
  playerId: string
  sourceRoleId?: string
}

export type TravellerJoinEvent = {
  type: "traveller_join"
  playerId: string
}

export type TravellerLeaveEvent = {
  type: "traveller_leave"
  playerId: string
  reason?: string
}

export type RoleChangeEvent = {
  type: "role_change"
  playerId: string
  oldRoleId: string   // optional; may be omitted in source data
  newRoleId: string
  reason?: string      // e.g. "Pit-Hag changed role"
}