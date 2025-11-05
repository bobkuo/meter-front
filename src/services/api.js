import axios from 'axios'

const KEY = 'serverUrl'

// 確保 URL 有協定，並移除結尾斜線
const normalize = (s) => {
  if (!s) return ''
  const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`
  return withProto.replace(/\/+$/, '')
}

const api = axios.create({
  headers: {
    'Cache-Control': 'no-cache',
  },
  baseURL: localStorage.getItem('serverUrl') || 'http://localhost:3001',
})

export const setBaseURL = (url) => {
  const base = normalize(url)
  api.defaults.baseURL = base
  localStorage.setItem(KEY, base)
}

export default api
