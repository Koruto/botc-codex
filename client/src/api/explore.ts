import type { ExploreResponse, PaginatedGamesResponse, UserPublicGamesResponse } from '@/types'
import http from './http'

export const getPublicGames = async (limit = 20) => {
  try {
    const res = await http.get<ExploreResponse>(`/api/explore?limit=${limit}`)
    return res.data
  } catch (error) {
    throw error
  }
}

export const getMyGames = async (skip = 0, limit = 20) => {
  try {
    const res = await http.get<PaginatedGamesResponse>(`/api/me/games?skip=${skip}&limit=${limit}`)
    return res.data
  } catch (error) {
    throw error
  }
}

export const getUserGames = async (username: string, skip = 0, limit = 20) => {
  try {
    const res = await http.get<UserPublicGamesResponse>(`/api/users/${username}/games?skip=${skip}&limit=${limit}`)
    return res.data
  } catch (error) {
    throw error
  }
}
