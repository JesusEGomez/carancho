'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

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
  const initialToken = typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN_KEY)
  const [token, setToken] = useState<string | null>(initialToken)
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') {
      return null
    }

    const storedUser = window.localStorage.getItem(USER_KEY)

    if (!storedUser) {
      return null
    }

    try {
      return JSON.parse(storedUser) as AuthUser
    } catch {
      window.localStorage.removeItem(USER_KEY)
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(Boolean(initialToken))

  useEffect(() => {
    if (!token) {
      return
    }

    void fetch('/api/users/me', {
      headers: {
        Authorization: `JWT ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Unauthorized')
        }

        const data = (await response.json()) as { user: AuthUser | null }

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

        const response = await fetch('/api/users/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })

        const data = (await response.json()) as {
          errors?: { message?: string }[]
          token?: string
          user?: AuthUser
        }

        if (!response.ok || !data.token || !data.user) {
          const message = data.errors?.[0]?.message ?? 'No fue posible iniciar sesion'
          setIsLoading(false)
          throw new Error(message)
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
          await fetch('/api/users/logout', {
            method: 'POST',
            headers: {
              Authorization: `JWT ${currentToken}`,
            },
          }).catch(() => undefined)
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
