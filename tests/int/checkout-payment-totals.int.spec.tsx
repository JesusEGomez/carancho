import React from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { fetchProductPrices } = vi.hoisted(() => ({
  fetchProductPrices: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/services/store/productPricesApi', () => ({
  fetchProductPrices,
}))

import { CheckoutPageClient } from '@/components/store/CheckoutPageClient'
import { CartProvider } from '@/providers/CartProvider'
import { ToastProvider } from '@/providers/ToastProvider'

const CART_STORAGE_KEY = 'carancho-store-cart'

function renderCheckout() {
  return render(
    <ToastProvider>
      <CartProvider>
        <CheckoutPageClient />
      </CartProvider>
    </ToastProvider>,
  )
}

function storeCart(product: Record<string, unknown>, quantity: number) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([{ product, quantity }]))
}

const money = (value: string) => new RegExp(value.replace('.', '\.'))

describe('CheckoutPageClient payment totals', () => {
  beforeEach(() => {
    window.localStorage.clear()
    fetchProductPrices.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows the total of each payment option', async () => {
    storeCart({ cardPrice: 1300, id: 1, name: 'Caña', price: 1000, slug: 'cana', stock: 5, transferPrice: 1100 }, 2)
    fetchProductPrices.mockResolvedValue([{ cardPrice: 1300, id: 1, price: 1000, stock: 5, transferPrice: 1100 }])

    renderCheckout()

    expect((await screen.findByTestId('checkout-total-card')).textContent).toMatch(money('2.600'))
    expect(screen.getByTestId('checkout-total-cash').textContent).toMatch(money('2.000'))
    expect(screen.getByTestId('checkout-total-transfer').textContent).toMatch(money('2.200'))
    expect(screen.getByRole('radio', { name: /Efectivo/ })).toBeTruthy()
    expect(screen.getByRole('radio', { name: /Transferencia/ })).toBeTruthy()
  })

  it('refreshes an old cart snapshot so Mercado Pago shows the current card total', async () => {
    // Saved before alternative prices existed: only the cash price is in the snapshot.
    storeCart({ id: 1, name: 'Caña', price: 1000, slug: 'cana', stock: 5 }, 1)
    fetchProductPrices.mockResolvedValue([{ cardPrice: 1300, id: 1, price: 1000, stock: 5, transferPrice: null }])

    renderCheckout()

    await waitFor(() => expect(screen.getByTestId('checkout-total-card').textContent).toMatch(money('1.300')))
    expect(fetchProductPrices).toHaveBeenCalledWith([1])
    expect(screen.getByTestId('checkout-total-transfer').textContent).toMatch(money('1.000'))
  })
})
