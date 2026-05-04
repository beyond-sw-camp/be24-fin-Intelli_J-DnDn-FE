import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => {
    const body = response.data

    // 백엔드 BaseResponse 구조: { code, data, message, success }
    if (body && typeof body === 'object' && 'success' in body) {
      if (body.success === false) {
        return Promise.reject(new Error(body.message || '요청이 실패했습니다.'))
      }
      // data 필드 반환 (없으면 body 전체)
      if (body.data !== undefined) return body.data
      if (body.result !== undefined) return body.result
    }

    return body
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      '서버와의 통신 중 오류가 발생했습니다.'
    return Promise.reject(new Error(message))
  },
)

export default api
