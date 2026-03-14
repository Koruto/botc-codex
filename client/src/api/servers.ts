import type { InviteInfo, MyServerItem, PaginatedResponse, ServerDocument } from '@/types'
import http from './http'

export const createServer = async (name: string) => {
  try {
    const res = await http.post<ServerDocument>('/api/servers', { name })
    return res.data
  } catch (error) {
    throw error
  }
}

export const getServer = async (serverId: string) => {
  try {
    const res = await http.get<ServerDocument>(`/api/servers/${serverId}`)
    return res.data
  } catch (error) {
    throw error
  }
}

export const getServerBySlug = async (slug: string) => {
  try {
    const res = await http.get<ServerDocument>(`/api/servers/by-slug/${slug}`)
    return res.data
  } catch (error) {
    throw error
  }
}

export const updateServer = async (serverId: string, name: string) => {
  try {
    const res = await http.patch<ServerDocument>(`/api/servers/${serverId}`, { name })
    return res.data
  } catch (error) {
    throw error
  }
}

export const getServers = async (skip = 0, limit = 20) => {
  try {
    const res = await http.get<PaginatedResponse<MyServerItem>>(`/api/me/servers?skip=${skip}&limit=${limit}`)
    return res.data
  } catch (error) {
    throw error
  }
}

export const getInvite = async (inviteCode: string) => {
  try {
    const res = await http.get<InviteInfo>(`/api/invite/${inviteCode}`)
    return res.data
  } catch (error) {
    throw error
  }
}

export const joinServer = async (inviteCode: string) => {
  try {
    const res = await http.post<{
      serverId: string
      serverSlug: string | null
      alreadyMember: boolean
    }>(`/api/invite/${inviteCode}/join`)
    return res.data
  } catch (error) {
    throw error
  }
}
