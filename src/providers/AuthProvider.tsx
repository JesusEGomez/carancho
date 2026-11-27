'use client'

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react'

import { useIsHydrated } from '@/hooks/store/useIsHydrated'
import { api } from '@/lib/client/api'

type AuthUser = {
  id: number
  email: string
  name: string
  role: 'admin' | 'customer'
}

type AuthContextValue = {
  isLoading: boolean
  isAuthenticated: boolean
  token: string | null
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'carancho-admin-token'
const USER_KEY = 'carancho-admin-user'

// The admin session lives in localStorage, which React reads as an external store.
const sessionListeners = new Set<() => void>()

function notifySessionListeners() {
  sessionListeners.forEach((listener) => listener())
}

function subscribeToSession(listener: () => void) {
  sessionListeners.add(listener)

  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === TOKEN_KEY || event.key === USER_KEY) {
      listener()
    }
  }

  window.addEventListener('storage', handleStorage)

  return () => {
    sessionListeners.delete(listener)
    window.removeEventListener('storage', handleStorage)
  }
}

function readStorageItem(key: string) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function getTokenSnapshot() {
  return readStorageItem(TOKEN_KEY)
}

function getStoredUserSnapshot() {
  return readStorageItem(USER_KEY)
}

function getServerSnapshot() {
  return null
}

function writeSession(token: string, user: AuthUser) {
  window.localStorage.setItem(TOKEN_KEY, token)
  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
  notifySessionListeners()
}

function writeStoredUser(user: AuthUser) {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
  notifySessionListeners()
}

function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
  notifySessionListeners()
}

function parseStoredUser(raw: string | null) {
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // The server snapshot (null) is used while hydrating, so the first client render matches the server.
  const token = useSyncExternalStore(subscribeToSession, getTokenSnapshot, getServerSnapshot)
  const storedUser = useSyncExternalStore(subscribeToSession, getStoredUserSnapshot, getServerSnapshot)
  const isHydrated = useIsHydrated()
  const user = useMemo(() => parseStoredUser(storedUser), [storedUser])
  const [validatedToken, setValidatedToken] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Loading until the stored session is read and, when there is a token, validated against the API.
  const isLoading = !isHydrated || isLoggingIn || (token !== null && token !== validatedToken)

  useEffect(() => {
    if (!token) {
      return
    }

    let ignore = false

    void api
      .get<{ user: AuthUser | null }>('/users/me', {
        headers: {
          Authorization: `JWT ${token}`,
        },
      })
      .then((response) => {
        const data = response.data
        if (!data.user) {
          throw new Error('Unauthorized')
        }
        if (ignore) {
          return
        }
        writeStoredUser(data.user)
        setValidatedToken(token)
      })
      .catch(() => {
        if (ignore) {
          return
        }
        clearSession()
      })

    return () => {
      ignore = true
    }
  }, [token])

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: Boolean(token && user),
      token,
      user,
      login: async (email, password) => {
        setIsLoggingIn(true)

        try {
          const data = (
            await api.post<{
              token?: string
              user?: AuthUser
            }>('/users/login', { email, password })
          ).data

          if (!data.token || !data.user) {
            throw new Error('No fue posible iniciar sesion')
          }

          setValidatedToken(data.token)
          writeSession(data.token, data.user)
        } finally {
          setIsLoggingIn(false)
        }
      },
      logout: async () => {
        const currentToken = window.localStorage.getItem(TOKEN_KEY)

        if (currentToken) {
          await api
            .post(
              '/users/logout',
              {},
              {
                headers: {
                  Authorization: `JWT ${currentToken}`,
                },
              },
            )
            .catch(() => undefined)
        }

        clearSession()
      },
    }),
    [isLoading, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
