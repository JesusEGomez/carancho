import { describe, expect, it } from 'vitest'

import { applyFreshPrices, getCartTotals, type CartLine } from '@/lib/cart'

const items: CartLine[] = [
  { product: { id: 1, name: 'Caña', price: 1000, slug: 'cana', stock: 5 }, quantity: 2 },
  { product: { id: 2, name: 'Reel', price: 500, slug: 'reel', stock: 5 }, quantity: 1 },
]

describe('cart prices', () => {
  it('replaces stale snapshots with fresh server prices', () => {
    const refreshed = applyFreshPrices(items, [{ cardPrice: 1300, id: 1, price: 1050, stock: 3, transferPrice: 1100 }])

    expect(refreshed[0].product).toMatchObject({ cardPrice: 1300, price: 1050, stock: 3, transferPrice: 1100 })
    expect(refreshed[1]).toBe(items[1])
    expect(getCartTotals(refreshed)).toEqual({ card: 3100, cash: 2600, transfer: 2700 })
  })
})
