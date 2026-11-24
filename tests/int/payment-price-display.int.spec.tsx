import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; className?: string; href: string }) => (
    <a className={className} href={href}>
      {children}
    </a>
  ),
}))

import { PaymentMethodPrices } from '@/components/store/PaymentMethodPrices'
import { ProductCard } from '@/components/store/ProductCard'
import type { ProductWithRelations } from '@/lib/store'
import { CartProvider } from '@/providers/CartProvider'
import { ToastProvider } from '@/providers/ToastProvider'

function buildProduct(overrides: Partial<ProductWithRelations> = {}) {
  return {
    category: { id: 1, name: 'Pesca', slug: 'pesca' },
    description: 'Descripción',
    featuredImage: { alt: 'Caña', id: 1, url: '/cana.jpg' },
    id: 1,
    name: 'Caña telescópica',
    price: 1000,
    shortDescription: 'Caña liviana',
    slug: 'cana',
    status: 'published',
    stock: 5,
    ...overrides,
  } as ProductWithRelations
}

function renderCard(product: ProductWithRelations) {
  return render(
    <ToastProvider>
      <CartProvider>
        <ProductCard product={product} />
      </CartProvider>
    </ToastProvider>,
  )
}

describe('PaymentMethodPrices', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders no cards when no alternative price is set', () => {
    const { container } = render(<PaymentMethodPrices product={{ cardPrice: null, price: 1000, transferPrice: null }} />)

    expect(container.textContent).toBe('')
  })

  it('shows Efectivo plus only the alternative prices that are set', () => {
    render(<PaymentMethodPrices product={{ cardPrice: 1300, price: 1000, transferPrice: null }} />)

    const cards = screen.getAllByRole('listitem')
    expect(cards).toHaveLength(2)
    expect(cards[0].textContent).toMatch(/Efectivo.*1\.000/)
    expect(cards[1].textContent).toMatch(/Tarjeta.*1\.300/)
    expect(screen.queryByText('Transferencia')).toBeNull()
  })

  it('shows all three methods when both alternatives are set', () => {
    render(<PaymentMethodPrices product={{ cardPrice: 1300, price: 1000, transferPrice: 1100 }} />)

    expect(screen.getAllByRole('listitem').map((card) => card.textContent)).toEqual([
      expect.stringMatching(/Efectivo/),
      expect.stringMatching(/Transferencia.*1\.100/),
      expect.stringMatching(/Tarjeta.*1\.300/),
    ])
  })
})

describe('ProductCard card price line', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows "con tarjeta" when the card price is set', () => {
    renderCard(buildProduct({ cardPrice: 1300 }))

    expect(screen.getByText(/1\.300 con tarjeta/)).toBeTruthy()
  })

  it('hides the line when the card price is not set', () => {
    renderCard(buildProduct({ cardPrice: null, transferPrice: 1100 }))

    expect(screen.queryByText(/con tarjeta/)).toBeNull()
  })
})
