'use client'

import axios from 'axios'

const TOKEN_KEY = 'carancho-admin-token'

export class ApiError extends Error {
  code?: string
  meta?: Record<string, string>
  status?: number

  constructor(message: string, options?: { code?: string; meta?: Record<string, string>; status?: number }) {
    super(message)
    this.name = 'ApiError'
    this.code = options?.code
    this.meta = options?.meta
    this.status = options?.status
  }
}

type ErrorShape = {
  code?: string
  errors?: { message?: string }[]
  meta?: Record<string, string>
  message?: string
}

function getToken() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(TOKEN_KEY)
}

function extractErrorMessage(error: unknown) {
  if (axios.isAxiosError<ErrorShape>(error)) {
    return error.response?.data?.errors?.[0]?.message ?? error.response?.data?.message ?? error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Request failed'
}

export const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = getToken()
  const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData

  config.headers.set('Accept', 'application/json')

  if (!isFormData) {
    config.headers.set('Content-Type', 'application/json')
  }

  if (token) {
    config.headers.set('Authorization', `JWT ${token}`)
  }

  return config
})

api.interceptors.response.use((response) => response, async (error) => {
  if (axios.isAxiosError<ErrorShape>(error)) {
    return Promise.reject(
      new ApiError(extractErrorMessage(error), {
        code: error.response?.data?.code,
        meta: error.response?.data?.meta,
        status: error.response?.status,
      }),
    )
  }

  if (error instanceof Error) {
    return Promise.reject(new ApiError(error.message))
  }

  return Promise.reject(new ApiError('Request failed'))
})
