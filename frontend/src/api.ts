// src/api.ts
import axios from 'axios'
import i18n from './i18n'
import { ServerErrorBus } from './utils/serverErrorBus' // <= add this

// If you already have real overlay togglers, hook them here:
const beginLoading = () => {}
const endLoading = () => {}

// Keep a small counter so we don't flicker the loader with concurrent calls
let inflight = 0
const inc = () => { if (inflight++ === 0) beginLoading() }
const dec = () => { if (inflight > 0 && --inflight === 0) endLoading() }

function getToken(): string | null {
  const t = localStorage.getItem('token')
  if (!t || t === 'null' || t === 'undefined') return null
  return t
}

const api = axios.create({
  baseURL: import.meta.env?.VITE_API_BASE || '/api',
  timeout: 30000,
  withCredentials: true,
})

// Debug logging in development
if (import.meta.env?.DEV) {
  console.log('🔗 API Base URL:', api.defaults.baseURL)
}

api.interceptors.request.use(
  (cfg) => {
    inc()
    // Debug logging in development
    if (import.meta.env?.DEV) {
      console.log('🚀 API Request:', cfg.method?.toUpperCase(), (cfg.baseURL || '') + (cfg.url || ''))
    }
    // auth
    const token = getToken()
    if (token) {
      cfg.headers = cfg.headers || {}
      cfg.headers.Authorization = `Bearer ${token}`
    }
    // i18n
    const lang = i18n?.language || 'en'
    cfg.headers = cfg.headers || {}
    cfg.headers['Accept-Language'] = lang
    return cfg
  },
  (err) => {
    dec()
    return Promise.reject(err)
  }
)

api.interceptors.response.use(
  (res) => {
    dec()
    return res
  },
  (err) => {
    dec()

    const status = err?.response?.status ?? 0
    const cfg = err?.config || {}
    const pathname = typeof window !== 'undefined' ? window.location.pathname : ''

    // 500+ → open “Report issue” modal (dedupe per request)
    if (status >= 500 && !(cfg as any).__reported500) {
      ;(cfg as any).__reported500 = true
      ServerErrorBus.emit({
        url: cfg.url || '',
        method: String(cfg.method || 'GET').toUpperCase(),
        status,
        requestData: safeData(cfg.data),
        responseData: err?.response?.data,
        headers: cfg.headers,
      })
    }

    // auth fail → bounce to login (avoid loops on /login)
    if ((status === 401 || status === 422) && pathname !== '/login') {
      localStorage.removeItem('token')
      try { window.location.href = '/login' } catch {}
    }

    return Promise.reject(err)
  }
)

function safeData(data: any) {
  // redact sensitive keys from request copy shown in the modal
  try {
    const obj = typeof data === 'string' ? JSON.parse(data) : data
    if (obj && typeof obj === 'object') {
      const clone: any = { ...obj }
      ;['password', 'pwd', 'secret', 'token', 'access_token'].forEach(k => {
        if (k in clone) clone[k] = '***'
      })
      return clone
    }
  } catch {}
  return data
}

export default api
