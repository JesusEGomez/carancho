import React from 'react'
import type { Metadata } from 'next'
import './globals.css'

import { CartProvider } from '@/providers/CartProvider'
import { QueryProvider } from '@/providers/QueryProvider'
import { ToastProvider } from '@/providers/ToastProvider'
import { getSiteUrl } from '@/lib/seo'

export const metadata: Metadata = {
  description: 'Carancho Outdoors: pesca, camping, nautica y hogar.',
  icons: {
    icon: '/images/brand/carancho-logo.svg',
    shortcut: '/images/brand/carancho-logo.svg',
    apple: '/images/brand/carancho-logo-sinfondo (2).png',
  },
  metadataBase: new URL(getSiteUrl()),
  openGraph: {
    description: 'Equipamiento para pesca, camping, náutica y hogar.',
    images: ['/images/heroes/carancho-home-hero-7.jpeg'],
    locale: 'es_AR',
    siteName: 'Carancho Outdoors',
    title: 'Carancho Outdoors',
    type: 'website',
  },
  title: {
    default: 'Carancho Outdoors',
    template: '%s | Carancho Outdoors',
  },
  twitter: {
    card: 'summary_large_image',
    description: 'Equipamiento para pesca, camping, náutica y hogar.',
    images: ['/images/heroes/carancho-home-hero-7.jpeg'],
    title: 'Carancho Outdoors',
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html data-scroll-behavior="smooth" lang="es">
      <body className="min-h-screen overflow-x-hidden bg-brand-cream">
        <QueryProvider>
          <ToastProvider>
            <CartProvider>
              <main>{children}</main>
            </CartProvider>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
