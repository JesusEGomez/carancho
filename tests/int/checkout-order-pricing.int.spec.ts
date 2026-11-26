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
  { id: 1, name: 'Caña', price: 1000, slug: 'cana', status: 'published', stock: 10 },
  { id: 2, name: 'Reel', price: 500, slug: 'reel', status: 'published', stock: 10 },
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

  it.each(['cash', 'transfer', 'card'] as const)('charges the base price for %s', async (method) => {
    const order = await buildValidatedOrderData(input, method)

    expect(order.paymentMethod).toBe(method)
    expect(order.items.map((item) => item.unitPrice)).toEqual([1000, 500])
    expect(order.items.map((item) => item.lineTotal)).toEqual([2000, 500])
    expect(order.subtotal).toBe(2500)
    expect(order.total).toBe(2500)
  })

  it('stores no per-method price snapshots on items', async () => {
    const order = await buildValidatedOrderData(input, 'cash')

    for (const item of order.items) {
      expect(item).not.toHaveProperty('cashUnitPrice')
      expect(item).not.toHaveProperty('transferUnitPrice')
    }
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
    expect(order.items[0]).toMatchObject({ lineTotal: 3000, quantity: 3, unitPrice: 1000 })
  })
})
