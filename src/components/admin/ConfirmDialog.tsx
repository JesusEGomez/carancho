'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'

type ConfirmDialogProps = {
  cancelLabel: string
  children: ReactNode
  confirmLabel: string
  isConfirming?: boolean
  onCancel: () => void
  onConfirm: () => void
  open: boolean
  title: string
  tone?: 'default' | 'danger'
}

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

/** Focus target when the element that opened the dialog was removed meanwhile. */
function getFallbackFocusTarget() {
  const heading = document.querySelector<HTMLElement>('main h1, h1')

  if (heading && !heading.hasAttribute('tabindex')) {
    heading.setAttribute('tabindex', '-1')
  }

  return heading ?? document.body
}

/**
 * Accessible confirmation modal (alertdialog): focuses the safe action on open, traps Tab,
 * closes on Escape or backdrop click unless the action is running, locks page scroll and
 * returns focus to the element that opened it.
 */
export function ConfirmDialog({
  cancelLabel,
  children,
  confirmLabel,
  isConfirming = false,
  onCancel,
  onConfirm,
  open,
  title,
  tone = 'default',
}: ConfirmDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const onCancelRef = useRef(onCancel)
  const isConfirmingRef = useRef(isConfirming)

  useEffect(() => {
    onCancelRef.current = onCancel
    isConfirmingRef.current = isConfirming
  }, [isConfirming, onCancel])

  const requestClose = () => {
    if (!isConfirmingRef.current) {
      onCancelRef.current()
    }
  }

  useEffect(() => {
    if (!open) {
      return
    }

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cancelButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()

        if (!isConfirmingRef.current) {
          onCancelRef.current()
        }

        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return
      }

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (!first || !last) {
        return
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow

      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus()
      } else {
        getFallbackFocusTarget().focus()
      }
    }
  }, [open])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4" onClick={requestClose}>
      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-lg rounded-[28px] border border-[#e9edf5] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.25)]"
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="alertdialog"
      >
        <h2 className="text-2xl font-black text-brand-ink" id={titleId}>
          {title}
        </h2>
        <div className="mt-4 space-y-3 text-sm text-slate-600" id={descriptionId}>
          {children}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            className="rounded-full border border-slate-200 px-5 py-3 text-sm font-black text-brand-ink disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isConfirming}
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={`rounded-full px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50 ${
              tone === 'danger' ? 'bg-red-600' : 'bg-brand-orange'
            }`}
            disabled={isConfirming}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
