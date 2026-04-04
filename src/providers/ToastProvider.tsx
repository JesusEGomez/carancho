'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

type ToastTone = 'error' | 'info' | 'success'

type Toast = {
  id: number
  message: string
  tone: ToastTone
}

type ToastContextValue = {
  showError: (message: string) => void
  showInfo: (message: string) => void
  showSuccess: (message: string) => void
  showToast: (message: string, tone?: ToastTone) => void
}

const TOAST_DURATION_MS = 2600

const ToastContext = createContext<ToastContextValue | null>(null)

const toneClasses: Record<ToastTone, string> = {
  error: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-slate-200 bg-white text-brand-ink',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000)

    setToasts((current) => [...current, { id, message, tone }].slice(-3))

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, TOAST_DURATION_MS)
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({
      showError: (message) => showToast(message, 'error'),
      showInfo: (message) => showToast(message, 'info'),
      showSuccess: (message) => showToast(message, 'success'),
      showToast,
    }),
    [showToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div aria-atomic="true" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex justify-center px-4">
        <div className="flex w-full max-w-md flex-col gap-3">
          {toasts.map((toast) => (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-bold shadow-[0_18px_36px_rgba(15,23,42,0.14)] backdrop-blur-sm transition-all duration-200 ${toneClasses[toast.tone]}`}
              key={toast.id}
              role="status"
            >
              {toast.message}
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }

  return context
}
