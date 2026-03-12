import type { FromJsonResponse, ProcessGrimoireResponse } from '@/types/townSquare.types'
import http from './http'

export const processGrimoire = async (file: File) => {
  try {
    const form = new FormData()
    form.append('file', file)
    const res = await http.post<ProcessGrimoireResponse>('/api/grimoire/process', form)
    return res.data
  } catch (error) {
    throw error
  }
}

export const parseGrimoireJson = async (body: Record<string, unknown>, format?: 'minimal' | 'townsquare') => {
  try {
    const path = format
      ? `/api/grimoire/from-json?format=${encodeURIComponent(format)}`
      : '/api/grimoire/from-json'
    const res = await http.post<FromJsonResponse>(path, body)
    return res.data
  } catch (error) {
    throw error
  }
}
