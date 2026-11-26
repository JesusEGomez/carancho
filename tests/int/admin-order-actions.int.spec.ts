import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('payload', () => ({
  addDataAndFileToRequest: vi.fn(async () => undefined),
}))

import {
  AdminOrderActionError,
  buildOrderCancellation,
  buildPaymentMethodSwitch,
  type AdminActionOrder,
  type AdminOrderStatus,
} from '@/lib/admin-order-actions'
import { cancelOrderEndpoint, switchOrderPaymentMethodEndpoint } from '@/endpoints/orderAdminActions'

function buildOrder(overrides: Partial<AdminActionOrder> = {}): AdminActionOrder {
  return {
    items: [
      {
        id: 'item-1',
        lineTotal: 2000,
        product: 1,
        productName: 'Caña',
        productSlug: 'cana',
        quantity: 2,
        unitPrice: 1000,
      },
      {
        id: 'item-2',
        lineTotal: 500,
        product: { id: 2 },
        productName: 'Reel',
        productSlug: 'reel',
        quantity: 1,
        unitPrice: 500,
      },
    ],
    paymentMethod: 'cash',
    paymentProvider: 'whatsapp',
    status: 'pending_whatsapp',
    ...overrides,
  }
}

const otherStatuses: AdminOrderStatus[] = ['draft', 'pending_payment', 'confirmed', 'fulfillment_blocked', 'cancelled']

describe('buildPaymentMethodSwitch', () => {
  it('only records the new method and never touches items or totals', () => {
    expect(buildPaymentMethodSwitch(buildOrder(), 'transfer')).toEqual({ paymentMethod: 'transfer' })
  })

  it('switches back to cash', () => {
    expect(buildPaymentMethodSwitch(buildOrder({ paymentMethod: 'transfer' }), 'cash')).toEqual({ paymentMethod: 'cash' })
  })

  it.each(otherStatuses)('rejects orders with status %s', (status) => {
    expect(() => buildPaymentMethodSwitch(buildOrder({ status }), 'transfer')).toThrow(AdminOrderActionError)
  })

  it('rejects Mercado Pago orders', () => {
    expect(() => buildPaymentMethodSwitch(buildOrder({ paymentProvider: 'mercadopago' }), 'transfer')).toThrow(
      AdminOrderActionError,
    )
  })
})

describe('buildOrderCancellation', () => {
  it('cancels a pending WhatsApp order', () => {
    expect(buildOrderCancellation(buildOrder())).toEqual({ paymentStatus: 'cancelled', status: 'cancelled' })
  })

  it.each(otherStatuses)('rejects orders with status %s', (status) => {
    expect(() => buildOrderCancellation(buildOrder({ status }))).toThrow(AdminOrderActionError)
  })

  it('rejects Mercado Pago orders even while pending', () => {
    expect(() =>
      buildOrderCancellation(buildOrder({ paymentProvider: 'mercadopago', status: 'pending_payment' })),
    ).toThrow(AdminOrderActionError)
  })
})

describe('order admin endpoints', () => {
  const findByID = vi.fn()
  const update = vi.fn()

  function buildRequest(user: { role: string } | null, data?: unknown) {
    return {
      data,
      payload: { findByID, update },
      routeParams: { id: '7' },
      user,
    } as unknown as Parameters<typeof cancelOrderEndpoint.handler>[0]
  }

  beforeEach(() => {
    findByID.mockReset()
    update.mockReset()
    findByID.mockResolvedValue(buildOrder())
    update.mockImplementation(async ({ data }) => ({ docs: [{ id: 7, ...data }], errors: [] }))
  })

  it('rejects anonymous and non-admin users', async () => {
    const anonymous = await cancelOrderEndpoint.handler(buildRequest(null))
    const customer = await cancelOrderEndpoint.handler(buildRequest({ role: 'customer' }))

    expect(anonymous.status).toBe(401)
    expect(customer.status).toBe(403)
    expect(findByID).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
  })

  it('cancels a pending WhatsApp order for admins', async () => {
    const response = await cancelOrderEndpoint.handler(buildRequest({ role: 'admin' }))

    expect(response.status).toBe(200)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { paymentStatus: 'cancelled', status: 'cancelled' },
        where: {
          and: [
            { id: { equals: 7 } },
            { status: { equals: 'pending_whatsapp' } },
            { paymentProvider: { equals: 'whatsapp' } },
          ],
        },
      }),
    )
  })

  it('answers 409 when the order changed status after it was read', async () => {
    // The order still looked pending when read, but another admin confirmed it before the write.
    update.mockResolvedValue({ docs: [], errors: [] })

    const cancelResponse = await cancelOrderEndpoint.handler(buildRequest({ role: 'admin' }))
    const switchResponse = await switchOrderPaymentMethodEndpoint.handler(
      buildRequest({ role: 'admin' }, { paymentMethod: 'transfer' }),
    )

    expect(cancelResponse.status).toBe(409)
    expect(switchResponse.status).toBe(409)
  })

  it('never writes stock fields when cancelling or switching', async () => {
    await cancelOrderEndpoint.handler(buildRequest({ role: 'admin' }))
    await switchOrderPaymentMethodEndpoint.handler(buildRequest({ role: 'admin' }, { paymentMethod: 'transfer' }))

    for (const [args] of update.mock.calls) {
      expect(args.collection).toBe('orders')
      expect(args.data).not.toHaveProperty('stockApplied')
      expect(args.data.status ?? 'cancelled').not.toBe('confirmed')
    }
  })

  it('answers 409 and does not update a cancelled order', async () => {
    findByID.mockResolvedValue(buildOrder({ status: 'cancelled' }))

    const cancelResponse = await cancelOrderEndpoint.handler(buildRequest({ role: 'admin' }))
    const switchResponse = await switchOrderPaymentMethodEndpoint.handler(
      buildRequest({ role: 'admin' }, { paymentMethod: 'transfer' }),
    )

    expect(cancelResponse.status).toBe(409)
    expect(switchResponse.status).toBe(409)
    expect(update).not.toHaveBeenCalled()
  })

  it('switches the payment method with a valid body', async () => {
    const response = await switchOrderPaymentMethodEndpoint.handler(
      buildRequest({ role: 'admin' }, { paymentMethod: 'transfer' }),
    )

    expect(response.status).toBe(200)
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: { paymentMethod: 'transfer' } }))
  })

  it('rejects card as a WhatsApp payment method', async () => {
    const response = await switchOrderPaymentMethodEndpoint.handler(
      buildRequest({ role: 'admin' }, { paymentMethod: 'card' }),
    )

    expect(response.status).toBe(400)
    expect(update).not.toHaveBeenCalled()
  })

  it('answers 404 for unknown orders', async () => {
    findByID.mockResolvedValue(null)

    const response = await cancelOrderEndpoint.handler(buildRequest({ role: 'admin' }))

    expect(response.status).toBe(404)
  })
})
