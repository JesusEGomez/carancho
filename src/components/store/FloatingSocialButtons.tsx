'use client'

import Link from 'next/link'

import { normalizeWhatsAppPhone } from '@/lib/alerts/whatsapp'
import { useStoreContact } from '@/hooks/store/useStoreContact'

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19.05 4.94A9.8 9.8 0 0 0 12.1 2C6.68 2 2.28 6.4 2.28 11.82c0 1.74.46 3.44 1.32 4.93L2 22l5.42-1.56a9.78 9.78 0 0 0 4.68 1.2h.01c5.42 0 9.82-4.4 9.82-9.82 0-2.62-1.02-5.08-2.88-6.88Zm-6.95 15.03h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.22.93.95-3.14-.2-.32a8.16 8.16 0 0 1-1.28-4.3c0-4.52 3.68-8.2 8.22-8.2 2.2 0 4.26.86 5.8 2.4a8.13 8.13 0 0 1 2.4 5.8c0 4.52-3.68 8.2-8.18 8.2Zm4.5-6.14c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1-.37-1.9-1.18-.7-.62-1.18-1.38-1.32-1.62-.14-.24-.01-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.4-.54-.4h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 1.98s.86 2.28.98 2.44c.12.16 1.68 2.56 4.08 3.58.57.24 1.02.38 1.38.48.58.18 1.1.16 1.52.1.46-.06 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5Zm8.9 1.35a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 6.6A5.4 5.4 0 1 1 6.6 12 5.4 5.4 0 0 1 12 6.6Zm0 1.8A3.6 3.6 0 1 0 15.6 12 3.6 3.6 0 0 0 12 8.4Z" />
    </svg>
  )
}

export function FloatingSocialButtons() {
  const storeContactQuery = useStoreContact()
  const phone = storeContactQuery.data?.phone?.trim() ?? ''
  const instagramUrl = storeContactQuery.data?.instagramUrl?.trim() ?? ''
  const whatsappHref = phone ? `https://wa.me/${normalizeWhatsAppPhone(phone)}` : null
  const instagramHref = instagramUrl || null

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3 sm:bottom-6 sm:right-6">
      {whatsappHref ? (
        <Link
          aria-label="Abrir WhatsApp"
          className="flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_18px_34px_rgba(37,211,102,0.34)] transition-transform duration-200 hover:-translate-y-0.5"
          href={whatsappHref}
          rel="noreferrer"
          target="_blank"
        >
          <WhatsAppIcon />
        </Link>
      ) : null}

      {instagramHref ? (
        <Link
          aria-label="Abrir Instagram"
          className="flex h-13 w-13 items-center justify-center rounded-full bg-[linear-gradient(135deg,#833AB4_0%,#E1306C_52%,#FCAF45_100%)] text-white shadow-[0_18px_34px_rgba(225,48,108,0.3)] transition-transform duration-200 hover:-translate-y-0.5"
          href={instagramHref}
          rel="noreferrer"
          target="_blank"
        >
          <InstagramIcon />
        </Link>
      ) : null}
    </div>
  )
}
