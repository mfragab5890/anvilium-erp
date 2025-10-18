import React, { createContext, useContext, useMemo, useState } from 'react'

type Role = { code: string; name_en?: string; name_ar?: string }
type User = {
  id: number; email: string; first_name?: string; last_name?: string;
  is_active?: boolean; role?: Role; permissions?: string[]; 
  role_code?: string;
}
type Module = { code: string; name_en?: string; name_ar?: string }

type AuthState = {
  token: string | null
  user: User | null
  modules: Module[]
  setAuth: (token: string, user: User, modules: Module[]) => void
  clearAuth: () => void
}

const AuthCtx = createContext<AuthState | null>(null)

function sanitizeToken(raw: string | null) {
  if (!raw) return null
  const t = raw.trim()
  if (!t || t === 'null' || t === 'undefined') return null
  return t
}

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => sanitizeToken(localStorage.getItem('token')))
  const [user, setUser] = useState<User | null>(null)
  const [modules, setModules] = useState<Module[]>([])

  const setAuth = (t: string, u: User, m: Module[]) => {
    const clean = sanitizeToken(t)
    if (clean) localStorage.setItem('token', clean)
    setToken(clean); setUser(u); setModules(m || [])
  }

  const clearAuth = () => {
    localStorage.removeItem('token')
    setToken(null); setUser(null); setModules([])
  }

  const value = useMemo(() => ({ token, user, modules, setAuth, clearAuth }), [token, user, modules])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
