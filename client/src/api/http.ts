import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const http = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      !originalRequest._isRetry &&
      !originalRequest.url?.startsWith('/api/auth/')
    ) {
      originalRequest._isRetry = true
      try {
        await axios.post(`${BASE_URL}/api/auth/refresh`, {}, { withCredentials: true })
        return http(originalRequest)
      } catch {
        // refresh failed — fall through
      }
    }

    const detail = error.response?.data?.detail
    throw new Error(
      typeof detail === 'string' ? detail : detail ? JSON.stringify(detail) : (error.message as string),
    )
  },
)

export default http
