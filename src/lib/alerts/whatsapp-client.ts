'use client'

import { createWhatsAppUrl } from '@/lib/alerts/whatsapp'

export type WhatsAppTabHandle = {
  close: () => void
  redirect: (url: string) => void
}

export function createWhatsAppTabHandle(): WhatsAppTabHandle | null {
  const popup = window.open('', '_blank')

  if (!popup) {
    return null
  }

  popup.opener = null

  return {
    close: () => {
      if (!popup.closed) {
        popup.close()
      }
    },
    redirect: (url: string) => {
      popup.location.href = url
      popup.focus?.()
    },
  }
}

export function openWhatsAppLink(args: { message?: string; phone?: string; url?: string }) {
  const url = args.url ?? (args.phone && args.message ? createWhatsAppUrl({ message: args.message, phone: args.phone }) : null)

  if (!url) {
    throw new Error('WhatsApp URL is required')
  }

  const popup = window.open(url, '_blank')
  if (popup) {
    popup.opener = null
  }
}
