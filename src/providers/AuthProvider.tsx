'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY)
    const storedUser = window.localStorage.getItem(USER_KEY)

    setToken(storedToken)

    if (!storedUser) {
      if (!storedToken) {
        setIsLoading(false)
      }
      return
    }

    try {
      setUser(JSON.parse(storedUser) as AuthUser)
    } catch {
      window.localStorage.removeItem(USER_KEY)
      setUser(null)
    }

    if (!storedToken) {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }

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
        setUser(data.user)
        window.localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      })
      .catch(() => {
        window.localStorage.removeItem(TOKEN_KEY)
        window.localStorage.removeItem(USER_KEY)
        setToken(null)
        setUser(null)
        setIsLoading(false)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [token])

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: Boolean(token && user),
      token,
      user,
      login: async (email, password) => {
        setIsLoading(true)

        const data = (
          await api.post<{
          token?: string
          user?: AuthUser
        }>('/users/login', { email, password })
        ).data

        if (!data.token || !data.user) {
          setIsLoading(false)
          throw new Error('No fue posible iniciar sesion')
        }

        window.localStorage.setItem(TOKEN_KEY, data.token)
        window.localStorage.setItem(USER_KEY, JSON.stringify(data.user))
        setToken(data.token)
        setUser(data.user)
        setIsLoading(false)
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

        window.localStorage.removeItem(TOKEN_KEY)
        window.localStorage.removeItem(USER_KEY)
        setToken(null)
        setUser(null)
        setIsLoading(false)
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
