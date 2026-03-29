'use client'

import axios from 'axios'

const TOKEN_KEY = 'carancho-admin-token'

type ErrorShape = {
  errors?: { message?: string }[]
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

api.interceptors.response.use(
  (response) => response,
  async (error) => Promise.reject(new Error(extractErrorMessage(error))),
)
