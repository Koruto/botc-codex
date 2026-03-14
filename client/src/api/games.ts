import type { GameCreateBody, GameDocument, GameUpdateBody, PaginatedGamesResponse } from '@/types'
import http from './http'

export const createGame = async (serverId: string, body: GameCreateBody) => {
  try {
    const res = await http.post<GameDocument>(`/api/servers/${serverId}/games`, body)
    return res.data
  } catch (error) {
    throw error
  }
}

export const updateGame = async (serverId: string, gameId: string, body: GameUpdateBody) => {
  try {
    const res = await http.patch<GameDocument>(`/api/servers/${serverId}/games/${gameId}`, body)
    return res.data
  } catch (error) {
    throw error
  }
}

export const getServerGame = async (serverId: string, gameId: string) => {
  try {
    const res = await http.get<GameDocument>(`/api/servers/${serverId}/games/${gameId}`)
    return res.data
  } catch (error) {
    throw error
  }
}

export const getServerGameBySlug = async (serverId: string, gameSlug: string) => {
  try {
    const res = await http.get<GameDocument>(`/api/servers/${serverId}/games/by-slug/${gameSlug}`)
    return res.data
  } catch (error) {
    throw error
  }
}

export const getGameBySlug = async (slug: string) => {
  try {
    const res = await http.get<GameDocument>(`/api/games/by-slug/${slug}`)
    return res.data
  } catch (error) {
    throw error
  }
}

export type GamesSortField = 'updatedAt' | 'playedOn' | 'edition' | 'winner' | 'playerCount'
export type GamesSortOrder = 'asc' | 'desc'

export const getGames = async (
  serverId: string,
  skip = 0,
  limit = 20,
  sort: GamesSortField = 'updatedAt',
  order: GamesSortOrder = 'desc'
) => {
  try {
    const res = await http.get<PaginatedGamesResponse>(
      `/api/servers/${serverId}/games?skip=${skip}&limit=${limit}&sort=${sort}&order=${order}`
    )
    return res.data
  } catch (error) {
    throw error
  }
}

export const getGame = async (gameId: string) => {
  try {
    const res = await http.get<GameDocument>(`/api/games/${gameId}`)
    return res.data
  } catch (error) {
    throw error
  }
}

export const copyGame = async (gameId: string, serverId: string) => {
  try {
    const res = await http.post<GameDocument>(`/api/games/${gameId}/copy`, { serverId })
    return res.data
  } catch (error) {
    throw error
  }
}
