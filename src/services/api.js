import axios from 'axios'
import { ref } from 'vue'

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
  baseURL: localStorage.getItem('serverUrl') || '',
})

const baseURLRef = ref(api.defaults.baseURL || '')

const setBaseURL = (url) => {
  const base = normalize(url)
  api.defaults.baseURL = base
  baseURLRef.value = base
  localStorage.setItem(KEY, base)
}

export default api
export { baseURLRef, setBaseURL }
