import type { GameDocument } from './game.types'

// ----- Auth -----

export type UserPublicResponse = {
  userId: string
  username: string
  createdAt: string
}

// ----- Servers -----

export type ServerDocument = {
  serverId: string
  name: string
  createdBy: string
  createdAt: string
  inviteCode: string
  isMember?: boolean
  isCreator?: boolean
  joinedAt?: string
}

/** Returned by GET /api/invite/:inviteCode (safe fields only — no inviteCode exposed). */
export type InviteInfo = {
  serverId: string
  name: string
  createdAt: string
}

/** Item returned in GET /api/me/servers — includes membership metadata. */
export type MyServerItem = ServerDocument & {
  joinedAt: string
  isCreator: boolean
  isMember: true
}

// ----- Pagination -----

export type PaginatedResponse<T> = {
  total: number
  skip: number
  limit: number
  items: T[]
}

export type PaginatedGamesResponse = PaginatedResponse<GameDocument>

export type ExploreResponse = {
  items: GameDocument[]
}

export type UserPublicGamesResponse = PaginatedResponse<GameDocument> & {
  username: string
}
