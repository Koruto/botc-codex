import http from './http'

export type FeedbackBody = {
  type: 'bug' | 'feature' | 'general'
  title: string
  message: string
}

export type FeedbackResponse = {
  id: string
  message: string
}

export const createFeedback = async (body: FeedbackBody) => {
  try {
    const res = await http.post<FeedbackResponse>('/api/feedback', body)
    return res.data
  } catch (error) {
    throw error
  }
}
