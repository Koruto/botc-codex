import type { GameCreateBody, GameDocument, GameUpdateBody } from '@/types'
import type { FromJsonResponse, ProcessGrimoireResponse } from '@/types/townSquare.types'
import type {
  ExploreResponse,
  InviteInfo,
  MyServerItem,
  PaginatedGamesResponse,
  ServerDocument,
  UserPublicGamesResponse,
  UserPublicResponse,
} from '@/types/api.types'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type RequestBody = FormData | Record<string, unknown> | unknown[] | unknown

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: RequestBody
  _isRetry?: boolean
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, _isRetry, ...rest } = options

  const headers: Record<string, string> = { ...(rest.headers as Record<string, string>) }
  if (body !== undefined && body !== null && typeof body === 'object' && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  const fetchBody: BodyInit | undefined =
    body === undefined || body === null
      ? undefined
      : body instanceof FormData
        ? body
        : JSON.stringify(body)

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
    body: fetchBody,
    credentials: 'include',
  })

  // Auto-refresh on 401 (access token expired) — try once, then give up
  if (res.status === 401 && !_isRetry && !path.startsWith('/api/auth/')) {
    const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    if (refreshRes.ok) {
      return request<T>(path, { ...options, _isRetry: true })
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail))
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

export type {
  GameDocument,
  ServerDocument,
  UserPublicResponse,
  PaginatedGamesResponse,
  InviteInfo,
  MyServerItem,
  ExploreResponse,
  UserPublicGamesResponse,
}

export const api = {
  // -------------------------------------------------------------------------
  // Grimoire processing
  // -------------------------------------------------------------------------

  processGrimoire: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<ProcessGrimoireResponse>('/api/grimoire/process', { method: 'POST', body: form })
  },

  fromJson: (body: Record<string, unknown>, format?: 'minimal' | 'townsquare') => {
    const path = format ? `/api/grimoire/from-json?format=${encodeURIComponent(format)}` : '/api/grimoire/from-json'
    return request<FromJsonResponse>(path, { method: 'POST', body })
  },

  // -------------------------------------------------------------------------
  // Auth
  // -------------------------------------------------------------------------

  signup: (username: string, password: string) =>
    request<UserPublicResponse>('/api/auth/signup', { method: 'POST', body: { username, password } }),

  login: (username: string, password: string) =>
    request<UserPublicResponse>('/api/auth/login', { method: 'POST', body: { username, password } }),

  logout: () =>
    request<void>('/api/auth/logout', { method: 'POST' }),

  getMe: () =>
    request<UserPublicResponse>('/api/auth/me'),

  // -------------------------------------------------------------------------
  // Servers
  // -------------------------------------------------------------------------

  createServer: (name: string) =>
    request<ServerDocument>('/api/servers', { method: 'POST', body: { name } }),

  getServer: (serverId: string) =>
    request<ServerDocument>('/api/servers/' + serverId),

  renameServer: (serverId: string, name: string) =>
    request<ServerDocument>('/api/servers/' + serverId, { method: 'PATCH', body: { name } }),

  myServers: (skip = 0, limit = 20) =>
    request<{ total: number; skip: number; limit: number; items: MyServerItem[] }>(
      `/api/me/servers?skip=${skip}&limit=${limit}`
    ),

  getInvite: (inviteCode: string) =>
    request<InviteInfo>('/api/invite/' + inviteCode),

  joinServer: (inviteCode: string) =>
    request<{ serverId: string; alreadyMember: boolean }>(
      '/api/invite/' + inviteCode + '/join',
      { method: 'POST' }
    ),

  // -------------------------------------------------------------------------
  // Games
  // -------------------------------------------------------------------------

  createGame: (serverId: string, body: GameCreateBody) =>
    request<GameDocument>(`/api/servers/${serverId}/games`, { method: 'POST', body }),

  updateGame: (serverId: string, gameId: string, body: GameUpdateBody) =>
    request<GameDocument>(`/api/servers/${serverId}/games/${gameId}`, { method: 'PATCH', body }),

  getGame: (serverId: string, gameId: string) =>
    request<GameDocument>(`/api/servers/${serverId}/games/${gameId}`),

  listGames: (serverId: string, skip = 0, limit = 20) =>
    request<PaginatedGamesResponse>(`/api/servers/${serverId}/games?skip=${skip}&limit=${limit}`),

  getGameById: (gameId: string) =>
    request<GameDocument>(`/api/games/${gameId}`),

  copyGame: (gameId: string, serverId: string) =>
    request<GameDocument>(`/api/games/${gameId}/copy`, { method: 'POST', body: { serverId } }),

  // -------------------------------------------------------------------------
  // Explore + user public pages
  // -------------------------------------------------------------------------

  explore: (limit = 20) =>
    request<ExploreResponse>(`/api/explore?limit=${limit}`),

  myGames: (skip = 0, limit = 20) =>
    request<PaginatedGamesResponse>(`/api/me/games?skip=${skip}&limit=${limit}`),

  userPublicGames: (username: string, skip = 0, limit = 20) =>
    request<UserPublicGamesResponse>(`/api/users/${username}/games?skip=${skip}&limit=${limit}`),
}
