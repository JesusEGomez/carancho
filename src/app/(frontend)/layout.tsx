import React from 'react'
import './globals.css'

import { QueryProvider } from '@/providers/QueryProvider'

export const metadata = {
  description: 'Carancho Pesca Deportiva: pesca, camping, nautica y hogar.',
  title: 'Carancho Pesca Deportiva',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html data-scroll-behavior="smooth" lang="es">
      <body className="min-h-screen bg-brand-cream">
        <QueryProvider>
          <main>{children}</main>
        </QueryProvider>
      </body>
    </html>
  )
}
