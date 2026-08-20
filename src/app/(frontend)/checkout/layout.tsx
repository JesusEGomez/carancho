import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: 'Finalizar compra',
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children
}
