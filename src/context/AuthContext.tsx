import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError } from '../lib/api'

export type Role = 'SUPER_ADMIN' | 'INSTITUTION_ADMIN' | 'LEADER' | 'MISSIONARY' | 'FAMILY'

export interface UserRoleContext {
  id: string
  role: Role
  status: 'ACTIVE' | 'INACTIVE'
  institutionId: string | null
  institutionName: string | null
}

export interface AuthUser {
  id: string
  email: string
  fullName: string
  preferredName: string | null
  roles: UserRoleContext[]
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  activeRole: UserRoleContext | null
  setActiveRole: (role: UserRoleContext) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeRole, setActiveRoleState] = useState<UserRoleContext | null>(null)

  const applyUser = useCallback((nextUser: AuthUser | null) => {
    setUser(nextUser)
    setActiveRoleState(nextUser?.roles[0] ?? null)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const { user: me } = await api.get<{ user: AuthUser }>('/auth/me')
      applyUser(me)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        applyUser(null)
      } else {
        throw error
      }
    } finally {
      setLoading(false)
    }
  }, [applyUser])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(
    async (email: string, password: string) => {
      const { user: loggedUser } = await api.post<{ user: AuthUser }>('/auth/login', {
        email,
        password,
      })
      applyUser(loggedUser)
    },
    [applyUser],
  )

  const logout = useCallback(async () => {
    await api.post('/auth/logout')
    applyUser(null)
  }, [applyUser])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      activeRole,
      setActiveRole: setActiveRoleState,
      login,
      logout,
      refresh,
    }),
    [user, loading, activeRole, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return ctx
}
