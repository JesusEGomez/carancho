import { beforeEach, describe, expect, it, vi } from 'vitest'

const payloadFind = vi.fn()

vi.mock('@/lib/payload', () => ({
  getPayloadClient: async () => ({
    find: payloadFind,
  }),
}))

import { buildValidatedOrderData } from '@/lib/checkout'
import type { CreateOrderRequest } from '@/lib/checkout-schema'

const customer: CreateOrderRequest['customer'] = {
  customerEmail: 'ana@example.com',
  customerName: 'Ana Perez',
  customerPhone: '1155551111',
  deliveryAddress: 'Av. Siempre Viva 123',
  deliveryCity: 'Buenos Aires',
  deliveryNotes: '',
}

const products = [
  { cardPrice: 1300, id: 1, name: 'Caña', price: 1000, slug: 'cana', status: 'published', stock: 10, transferPrice: 1100 },
  { cardPrice: null, id: 2, name: 'Reel', price: 500, slug: 'reel', status: 'published', stock: 10, transferPrice: null },
]

// The client price is deliberately absent: only ids and quantities reach the server.
const input: CreateOrderRequest = {
  customer,
  items: [
    { productId: 1, quantity: 2 },
    { productId: 2, quantity: 1 },
  ],
}

describe('buildValidatedOrderData pricing', () => {
  beforeEach(() => {
    payloadFind.mockReset()
    payloadFind.mockResolvedValue({ docs: products })
  })

  it.each([
    ['cash', 1000, 500, 2500],
    ['transfer', 1100, 500, 2700],
    ['card', 1300, 500, 3100],
  ] as const)('prices a mixed cart for %s', async (method, firstUnit, secondUnit, total) => {
    const order = await buildValidatedOrderData(input, method)

    expect(order.paymentMethod).toBe(method)
    expect(order.items.map((item) => item.unitPrice)).toEqual([firstUnit, secondUnit])
    expect(order.items.map((item) => item.lineTotal)).toEqual([firstUnit * 2, secondUnit])
    expect(order.subtotal).toBe(total)
    expect(order.total).toBe(total)
  })

  it('stores cash and transfer snapshots on every item', async () => {
    const order = await buildValidatedOrderData(input, 'card')

    expect(order.items.map((item) => [item.cashUnitPrice, item.transferUnitPrice])).toEqual([
      [1000, 1100],
      [500, 500],
    ])
  })

  it('merges repeated cart lines before pricing', async () => {
    const order = await buildValidatedOrderData(
      {
        customer,
        items: [
          { productId: 1, quantity: 1 },
          { productId: 1, quantity: 2 },
        ],
      },
      'transfer',
    )

    expect(order.items).toHaveLength(1)
    expect(order.items[0]).toMatchObject({ lineTotal: 3300, quantity: 3, unitPrice: 1100 })
  })
})
