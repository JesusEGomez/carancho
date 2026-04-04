import React from 'react'
import './globals.css'

import { CartProvider } from '@/providers/CartProvider'
import { QueryProvider } from '@/providers/QueryProvider'
import { ToastProvider } from '@/providers/ToastProvider'

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
