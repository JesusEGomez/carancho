import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: 'Carrito',
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children
}
