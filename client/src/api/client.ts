import type { GameCreateBody, GameDocument, GameUpdateBody } from '@/types'
import type { FromJsonResponse, ProcessGrimoireResponse } from '@/types/townSquare.types'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type RequestBody = FormData | Record<string, unknown> | unknown[] | unknown

type RequestOptions = Omit<RequestInit, 'body'> & { body?: RequestBody }

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, ...rest } = options
  const headers: HeadersInit = {
    ...(rest.headers as HeadersInit),
  }
  if (body !== undefined && body !== null && typeof body === 'object' && !(body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json'
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
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail))
  }
  return res.json() as Promise<T>
}

export type { GameDocument } from '@/types'

export const api = {
  processGrimoire: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<ProcessGrimoireResponse>('/api/grimoire/process', { method: 'POST', body: form })
  },
  /** Send any pasted JSON; server normalizes to Town Square (and optional meta). Use format to force minimal/townsquare. */
  fromJson: (body: Record<string, unknown>, format?: 'minimal' | 'townsquare') => {
    const path = format ? `/api/grimoire/from-json?format=${encodeURIComponent(format)}` : '/api/grimoire/from-json'
    return request<FromJsonResponse>(path, { method: 'POST', body })
  },

  createGame: (serverId: string, body: GameCreateBody) =>
    request<GameDocument>(`/api/servers/${serverId}/games`, { method: 'POST', body }),

  updateGame: (serverId: string, gameId: string, body: GameUpdateBody) =>
    request<GameDocument>(`/api/servers/${serverId}/games/${gameId}`, { method: 'PATCH', body }),

  getGame: (serverId: string, gameId: string) =>
    request<GameDocument>(`/api/servers/${serverId}/games/${gameId}`),

  listGames: (serverId: string, status?: string) => {
    const q = status ? `?status=${encodeURIComponent(status)}` : ''
    return request<GameDocument[]>(`/api/servers/${serverId}/games${q}`)
  },

  getGameById: (gameId: string) =>
    request<GameDocument>(`/api/games/${gameId}`),
}
