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

  it('renders nothing when the product has no installment plans', () => {
    expect(render(<PaymentMethodPrices product={{ installmentPlans: null, price: 1000 }} />).container.textContent).toBe('')
    cleanup()
    expect(render(<PaymentMethodPrices product={{ installmentPlans: [], price: 1000 }} />).container.textContent).toBe('')
  })

  it('highlights the cash / transfer price and lists installment plans in order', () => {
    render(
      <PaymentMethodPrices
        product={{
          installmentPlans: [
            { installmentAmount: 2200, installments: 6 },
            { installmentAmount: 4000, installments: 3 },
          ],
          price: 10000,
        }}
      />,
    )

    expect(screen.getByText('Efectivo / Transferencia')).toBeTruthy()
    expect(screen.getByTestId('payment-method-prices').textContent).toMatch(/10\.000/)
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      expect.stringMatching(/^3 cuotas de \$\s?4\.000$/),
      expect.stringMatching(/^6 cuotas de \$\s?2\.200$/),
    ])
    expect(screen.queryByText(/Tarjeta/)).toBeNull()
  })

  it('skips invalid plans', () => {
    render(
      <PaymentMethodPrices
        product={{
          installmentPlans: [
            { installmentAmount: 4000, installments: 1 },
            { installmentAmount: 0, installments: 3 },
            { installmentAmount: 2200, installments: 6 },
          ],
          price: 10000,
        }}
      />,
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })
})

describe('ProductCard price', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows only the base price, never a card price or installments', () => {
    renderCard(buildProduct({ installmentPlans: [{ installmentAmount: 400, installments: 3 }] }))

    expect(screen.getByText(/1\.000/)).toBeTruthy()
    expect(screen.queryByText(/con tarjeta/)).toBeNull()
    expect(screen.queryByText(/cuotas/)).toBeNull()
  })
})
