import type { UserPublicResponse } from '@/types'
import http from './http'

export const signup = async (username: string, password: string): Promise<UserPublicResponse> => {
  try {
    const res = await http.post<UserPublicResponse>('/api/auth/signup', { username, password })
    return res.data
  } catch (error) {
    throw error
  }
}

export const login = async (username: string, password: string): Promise<UserPublicResponse> => {
  try {
    const res = await http.post<UserPublicResponse>('/api/auth/login', { username, password })
    return res.data
  } catch (error) {
    throw error
  }
}

export const logout = async (): Promise<void> => {
  try {
    await http.post('/api/auth/logout')
  } catch (error) {
    throw error
  }
}

export const getMe = async (): Promise<UserPublicResponse> => {
  try {
    const res = await http.get<UserPublicResponse>('/api/auth/me')
    return res.data
  } catch (error) {
    throw error
  }
}
