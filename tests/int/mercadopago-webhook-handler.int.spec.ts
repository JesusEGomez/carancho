import crypto from 'crypto'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CheckoutDomainError } from '@/lib/checkout-errors'
import { buildMercadoPagoWebhookManifest } from '@/lib/mercadopago/shared'

const paymentGet = vi.fn()
const merchantOrderGet = vi.fn()
const preferenceCreate = vi.fn()
const payloadCreate = vi.fn()
const payloadFind = vi.fn()
const payloadUpdate = vi.fn()
const buildValidatedOrderData = vi.fn()
const notify = vi.fn()
const getAdminNotifier = vi.fn()

vi.mock('server-only', () => ({}))

vi.mock('@/lib/checkout', () => ({
  buildValidatedOrderData,
  getOrderConfirmation: vi.fn(),
}))

vi.mock('@/lib/notifications', () => ({
  getAdminNotifier,
}))

vi.mock('@/lib/payload', () => ({
  getPayloadClient: async () => ({
    create: payloadCreate,
    find: payloadFind,
    update: payloadUpdate,
  }),
}))

vi.mock('mercadopago', () => ({
  MercadoPagoConfig: class {},
  MerchantOrder: class {
    get = merchantOrderGet
  },
  Payment: class {
    get = paymentGet
  },
  Preference: class {
    create = preferenceCreate
  },
}))

const SECRET = 'webhook-secret'

function buildOrder(overrides: Record<string, unknown> = {}) {
  return {
    confirmationToken: 'token-1',
    currency: 'ARS',
    customerEmail: 'buyer@example.com',
    customerName: 'Juan Perez',
    customerPhone: '+54 9 11 5555-1111',
    externalReference: 'order-1',
    id: 1,
    items: [],
    paymentProvider: 'mercadopago',
    paymentStatus: 'pending',
    status: 'pending_payment',
    total: 1000,
    ...overrides,
  }
}

function buildPayment(overrides: Record<string, unknown> = {}) {
  return {
    currency_id: 'ARS',
    external_reference: 'order-1',
    id: 555,
    status: 'approved',
    status_detail: 'accredited',
    transaction_amount: 1000,
    ...overrides,
  }
}

function signedWebhook(args: { dataId: string; type: string; signed?: boolean }) {
  const requestId = 'req-123'
  const ts = String(Date.now())
  const manifest = buildMercadoPagoWebhookManifest(args.dataId, requestId, ts)
  const v1 = crypto.createHmac('sha256', SECRET).update(manifest).digest('hex')
  const headers = new Headers(
    args.signed === false ? {} : { 'x-request-id': requestId, 'x-signature': `ts=${ts},v1=${v1}` },
  )

  return {
    body: { data: { id: args.dataId }, type: args.type },
    requestHeaders: headers,
    requestUrl: new URL(
      `https://example.com/api/payments/mercadopago/webhook?source_news=webhooks&data.id=${args.dataId}&type=${args.type}`,
    ),
  }
}

async function handle(args: Parameters<typeof signedWebhook>[0]) {
  const { handleMercadoPagoWebhook } = await import('@/lib/mercadopago/server')
  return handleMercadoPagoWebhook(signedWebhook(args))
}

describe('handleMercadoPagoWebhook', () => {
  beforeEach(() => {
    vi.stubEnv('MERCADOPAGO_ACCESS_TOKEN', 'test-access-token')
    vi.stubEnv('MERCADOPAGO_PUBLIC_BASE_URL', 'https://example.com')
    vi.stubEnv('MERCADOPAGO_WEBHOOK_SECRET', SECRET)
    paymentGet.mockReset()
    merchantOrderGet.mockReset()
    payloadFind.mockReset()
    payloadUpdate.mockReset()
    payloadUpdate.mockImplementation(async ({ data, id }) => ({ ...buildOrder(), ...data, id }))
    notify.mockReset()
    notify.mockResolvedValue({ delivered: true })
    getAdminNotifier.mockReset()
    getAdminNotifier.mockResolvedValue({ notify })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('processes topic_merchant_order_wh webhooks like merchant_order', async () => {
    merchantOrderGet.mockResolvedValue({
      external_reference: 'order-1',
      id: 900,
      payments: [{ id: 555, status: 'approved' }],
    })
    payloadFind.mockResolvedValue({ docs: [buildOrder()] })
    paymentGet.mockResolvedValue(buildPayment())

    const result = await handle({ dataId: '900', type: 'topic_merchant_order_wh' })

    expect(result).toEqual({ processed: true })
    expect(merchantOrderGet).toHaveBeenCalledWith({ merchantOrderId: 900 })
    expect(payloadUpdate.mock.calls[0][0].data).toMatchObject({ status: 'confirmed' })
  })

  it('acknowledges unsupported topics with 200 without calling Mercado Pago', async () => {
    const result = await handle({ dataId: '1', type: 'topic_claims_integration_wh' })

    expect(result).toMatchObject({ processed: false, reason: 'unsupported_topic', status: 200 })
    expect(paymentGet).not.toHaveBeenCalled()
    expect(merchantOrderGet).not.toHaveBeenCalled()
  })

  it('acknowledges payments from another integration (order not found) with 200', async () => {
    paymentGet.mockResolvedValue(buildPayment({ external_reference: 'other-app-ref' }))
    payloadFind.mockResolvedValue({ docs: [] })

    const result = await handle({ dataId: '555', type: 'payment' })

    expect(result).toMatchObject({ processed: false, reason: 'order_not_found', status: 200 })
  })

  it('acknowledges payments without external reference with 200', async () => {
    paymentGet.mockResolvedValue(buildPayment({ external_reference: null }))

    const result = await handle({ dataId: '555', type: 'payment' })

    expect(result).toMatchObject({ reason: 'missing_external_reference', status: 200 })
  })

  it('acknowledges merchant orders without a payment with 200', async () => {
    merchantOrderGet.mockResolvedValue({ external_reference: 'order-1', id: 900, payments: [] })
    payloadFind.mockResolvedValue({ docs: [buildOrder()] })

    const result = await handle({ dataId: '900', type: 'topic_merchant_order_wh' })

    expect(result).toMatchObject({ reason: 'missing_latest_payment', status: 200 })
  })

  it('acknowledges a mismatched payment without changing the order', async () => {
    paymentGet.mockResolvedValue(buildPayment({ transaction_amount: 1 }))
    payloadFind.mockResolvedValue({ docs: [buildOrder()] })

    const result = await handle({ dataId: '555', type: 'payment' })

    expect(result).toEqual({ processed: true })
    expect(payloadUpdate).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('needs manual review'),
      expect.objectContaining({ reason: 'amount_mismatch' }),
    )
    await vi.waitFor(() => expect(notify).toHaveBeenCalledTimes(1))
    expect(notify.mock.calls[0][0]).toMatchObject({
      orderId: 1,
      subject: expect.stringContaining('revisión manual'),
    })
  })

  it('keeps acknowledging a mismatch when the admin alert fails', async () => {
    paymentGet.mockResolvedValue(buildPayment({ transaction_amount: 1 }))
    payloadFind.mockResolvedValue({ docs: [buildOrder()] })
    getAdminNotifier.mockRejectedValue(new Error('smtp down'))

    const result = await handle({ dataId: '555', type: 'payment' })

    expect(result).toEqual({ processed: true })
    await vi.waitFor(() =>
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('mismatch alert'),
        expect.objectContaining({ orderId: 1 }),
      ),
    )
  })

  it('alerts the admin when an approved payment cannot be fulfilled for lack of stock', async () => {
    paymentGet.mockResolvedValue(buildPayment())
    payloadFind.mockResolvedValue({ docs: [buildOrder()] })
    payloadUpdate
      .mockRejectedValueOnce(new CheckoutDomainError('OUT_OF_STOCK', 'Sin stock', 409))
      .mockImplementationOnce(async ({ data, id }) => ({ ...buildOrder(), ...data, id }))

    const result = await handle({ dataId: '555', type: 'payment' })

    expect(result).toEqual({ processed: true })
    expect(payloadUpdate).toHaveBeenCalledTimes(2)
    expect(payloadUpdate.mock.calls[1][0].data).toMatchObject({ status: 'fulfillment_blocked' })
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('stock confirmation failed'),
      expect.objectContaining({ orderId: 1 }),
    )
    await vi.waitFor(() => expect(notify).toHaveBeenCalledTimes(1))
    expect(notify.mock.calls[0][0]).toMatchObject({
      message: expect.stringContaining('#555'),
      orderId: 1,
      subject: expect.stringContaining('sin stock'),
    })
  })

  it('keeps acknowledging a fulfillment_blocked payment when the admin alert fails', async () => {
    paymentGet.mockResolvedValue(buildPayment())
    payloadFind.mockResolvedValue({ docs: [buildOrder()] })
    payloadUpdate
      .mockRejectedValueOnce(new CheckoutDomainError('OUT_OF_STOCK', 'Sin stock', 409))
      .mockImplementationOnce(async ({ data, id }) => ({ ...buildOrder(), ...data, id }))
    getAdminNotifier.mockRejectedValue(new Error('smtp down'))

    const result = await handle({ dataId: '555', type: 'payment' })

    expect(result).toEqual({ processed: true })
    await vi.waitFor(() =>
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('fulfillment blocked alert'),
        expect.objectContaining({ orderId: 1 }),
      ),
    )
  })

  it('does not alert again when a redelivered webhook hits an already blocked order', async () => {
    paymentGet.mockResolvedValue(buildPayment())
    payloadFind.mockResolvedValue({
      docs: [buildOrder({ paymentStatus: 'approved', status: 'fulfillment_blocked' })],
    })
    payloadUpdate
      .mockRejectedValueOnce(new CheckoutDomainError('OUT_OF_STOCK', 'Sin stock', 409))
      .mockImplementationOnce(async ({ data, id }) => ({ ...buildOrder(), ...data, id }))

    const result = await handle({ dataId: '555', type: 'payment' })

    expect(result).toEqual({ processed: true })
    expect(payloadUpdate.mock.calls[1][0].data).toMatchObject({ status: 'fulfillment_blocked' })
    // Give a fire-and-forget alert the chance to run before asserting it never did.
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(getAdminNotifier).not.toHaveBeenCalled()
    expect(notify).not.toHaveBeenCalled()
  })

  it('acknowledges payments that Mercado Pago reports as not found with 200', async () => {
    paymentGet.mockRejectedValue({ error: 'not_found', message: 'Payment not found', status: 404 })

    const result = await handle({ dataId: '123456', type: 'payment' })

    expect(result).toMatchObject({ processed: false, reason: 'payment_not_found', status: 200 })
    expect(payloadFind).not.toHaveBeenCalled()
  })

  it('acknowledges merchant orders that Mercado Pago reports as not found with 200', async () => {
    merchantOrderGet.mockRejectedValue({ error: 'not_found', message: 'Merchant order not found', status: 404 })

    const result = await handle({ dataId: '900', type: 'topic_merchant_order_wh' })

    expect(result).toMatchObject({ processed: false, reason: 'merchant_order_not_found', status: 200 })
  })

  it('propagates transient Mercado Pago API errors so the route answers 5xx', async () => {
    paymentGet.mockRejectedValue(new Error('Mercado Pago API timeout'))

    await expect(handle({ dataId: '555', type: 'payment' })).rejects.toThrow('timeout')
  })

  it('propagates Mercado Pago 5xx errors so Mercado Pago retries', async () => {
    const serverError = { error: 'internal_error', message: 'Internal server error', status: 500 }
    merchantOrderGet.mockRejectedValue(serverError)

    await expect(handle({ dataId: '900', type: 'topic_merchant_order_wh' })).rejects.toBe(serverError)
  })

  it('answers 500 when the webhook secret is not configured', async () => {
    vi.stubEnv('MERCADOPAGO_WEBHOOK_SECRET', '')

    const result = await handle({ dataId: '555', type: 'payment' })

    expect(result).toMatchObject({ reason: 'webhook_secret_not_configured', status: 500 })
    expect(paymentGet).not.toHaveBeenCalled()
  })

  it('rejects unsigned notifications (IPN) with 401', async () => {
    const result = await handle({ dataId: '555', signed: false, type: 'payment' })

    expect(result).toMatchObject({ reason: 'missing_signature', status: 401 })
    expect(paymentGet).not.toHaveBeenCalled()
  })

  it('rejects notifications with an invalid signature with 401', async () => {
    const { handleMercadoPagoWebhook } = await import('@/lib/mercadopago/server')
    const request = signedWebhook({ dataId: '555', type: 'payment' })
    request.requestHeaders.set('x-signature', `ts=${Date.now()},v1=deadbeef`)

    const result = await handleMercadoPagoWebhook(request)

    expect(result).toMatchObject({ reason: 'invalid_signature', status: 401 })
  })
})

describe('createMercadoPagoCheckout', () => {
  beforeEach(() => {
    vi.stubEnv('MERCADOPAGO_ACCESS_TOKEN', 'test-access-token')
    vi.stubEnv('MERCADOPAGO_PUBLIC_BASE_URL', 'https://example.com/')
    buildValidatedOrderData.mockReset()
    buildValidatedOrderData.mockResolvedValue({})
    payloadCreate.mockReset()
    payloadCreate.mockResolvedValue(buildOrder())
    payloadUpdate.mockReset()
    preferenceCreate.mockReset()
    preferenceCreate.mockResolvedValue({ id: 'pref-1', init_point: 'https://mp.example/checkout' })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('requests only Webhooks and sends the national phone number', async () => {
    const { createMercadoPagoCheckout } = await import('@/lib/mercadopago/server')

    await createMercadoPagoCheckout({} as Parameters<typeof createMercadoPagoCheckout>[0])

    const body = preferenceCreate.mock.calls[0][0].body
    expect(body.notification_url).toBe(
      'https://example.com/api/payments/mercadopago/webhook?source_news=webhooks',
    )
    expect(body.payer.phone).toEqual({ number: '1155551111' })
  })

  it('always prices Mercado Pago orders with the card price', async () => {
    const { createMercadoPagoCheckout } = await import('@/lib/mercadopago/server')

    await createMercadoPagoCheckout({} as Parameters<typeof createMercadoPagoCheckout>[0])

    expect(buildValidatedOrderData).toHaveBeenCalledWith({}, 'card')
  })
})

function stubWebhookEnvironment() {
  vi.stubEnv('MERCADOPAGO_ACCESS_TOKEN', 'test-access-token')
  vi.stubEnv('MERCADOPAGO_PUBLIC_BASE_URL', 'https://example.com')
  vi.stubEnv('MERCADOPAGO_WEBHOOK_SECRET', SECRET)
  paymentGet.mockReset()
  merchantOrderGet.mockReset()
  payloadFind.mockReset()
  payloadUpdate.mockReset()
  notify.mockReset()
  notify.mockResolvedValue({ delivered: true })
  getAdminNotifier.mockReset()
  getAdminNotifier.mockResolvedValue({ notify })
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
}

describe('Mercado Pago payment status matrix', () => {
  beforeEach(() => {
    stubWebhookEnvironment()
    payloadUpdate.mockImplementation(async ({ data, id }) => ({ ...buildOrder(), ...data, id }))
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  type Expected = { paymentStatus: string; status: string } | 'no_update'

  it.each<[string, string, string, Expected]>([
    // Unpaid orders follow Mercado Pago.
    ['pending_payment', 'pending', 'approved', { paymentStatus: 'approved', status: 'confirmed' }],
    ['pending_payment', 'pending', 'pending', { paymentStatus: 'pending', status: 'pending_payment' }],
    ['pending_payment', 'pending', 'in_process', { paymentStatus: 'pending', status: 'pending_payment' }],
    ['pending_payment', 'pending', 'rejected', { paymentStatus: 'rejected', status: 'cancelled' }],
    ['pending_payment', 'pending', 'cancelled', { paymentStatus: 'cancelled', status: 'cancelled' }],
    // A new approved attempt after a rejected one confirms the order.
    ['cancelled', 'rejected', 'approved', { paymentStatus: 'approved', status: 'confirmed' }],
    // Late or stale notifications never downgrade a paid order.
    ['confirmed', 'approved', 'pending', 'no_update'],
    ['confirmed', 'approved', 'in_process', 'no_update'],
    ['confirmed', 'approved', 'in_mediation', 'no_update'],
    ['confirmed', 'approved', 'rejected', 'no_update'],
    ['confirmed', 'approved', 'cancelled', 'no_update'],
    ['fulfillment_blocked', 'approved', 'pending', 'no_update'],
    // Genuine post-approval states do move a paid order.
    ['confirmed', 'approved', 'refunded', { paymentStatus: 'refunded', status: 'cancelled' }],
    ['confirmed', 'approved', 'charged_back', { paymentStatus: 'charged_back', status: 'cancelled' }],
    ['fulfillment_blocked', 'approved', 'refunded', { paymentStatus: 'refunded', status: 'cancelled' }],
    // A redelivered approval rewrites the same state (side effects are covered below).
    ['confirmed', 'approved', 'approved', { paymentStatus: 'approved', status: 'confirmed' }],
  ])('order %s/%s + payment %s', async (orderStatus, orderPaymentStatus, incoming, expected) => {
    paymentGet.mockResolvedValue(buildPayment({ status: incoming, status_detail: null }))
    payloadFind.mockResolvedValue({ docs: [buildOrder({ paymentStatus: orderPaymentStatus, status: orderStatus })] })

    const result = await handle({ dataId: '555', type: 'payment' })

    expect(result).toEqual({ processed: true })

    if (expected === 'no_update') {
      expect(payloadUpdate).not.toHaveBeenCalled()
      return
    }

    expect(payloadUpdate).toHaveBeenCalledTimes(1)
    expect(payloadUpdate.mock.calls[0][0]).toMatchObject({
      collection: 'orders',
      data: { ...expected, providerPaymentId: '555', providerRawStatus: incoming },
      id: 1,
    })
  })
})

type StoredOrder = ReturnType<typeof buildOrder> & { stockApplied?: boolean }
type StoredProduct = { id: number; name: string; status: 'published'; stock: number }
type FakeUpdateArgs = { collection: string; context?: Record<string, unknown>; data: Record<string, unknown>; id: number }

/**
 * Minimal stand-in for Payload's update pipeline on orders: runs the real order hooks
 * (beforeChange stock check, afterChange stock sync and admin alert) against in-memory
 * state and rolls everything back when a hook throws, like a database transaction.
 *
 * Limits:
 * - Serial only: calls never interleave, so it cannot expose concurrency or lost-update races.
 * - The rollback is hand-written (order + product stock snapshot), not a real transaction.
 * - The doc shape is approximated: `data` is shallow-merged over the stored order, without
 *   Payload's field hooks, validation, defaults or relationship population.
 */
async function createStatefulPayload(initialOrder: StoredOrder, initialProducts: StoredProduct[]) {
  // Imported lazily: a static import would evaluate the hoisted @/lib/notifications mock
  // before its backing vi.fn() is initialised.
  const { notifyAdminAfterOrderChange } = await import('@/hooks/orderNotificationHooks')
  const { syncOrderStockAfterChange, validateOrderStockBeforeChange } = await import('@/hooks/orderStockHooks')
  let order: Record<string, unknown> = { ...initialOrder }
  const products = new Map(initialProducts.map((product) => [product.id, { ...product }]))

  const fakePayload = {
    findByID: async ({ id }: { id: number }) => {
      const product = products.get(id)
      return product ? { ...product } : null
    },
    update: async (args: FakeUpdateArgs): Promise<Record<string, unknown>> => {
      if (args.collection === 'products') {
        Object.assign(products.get(args.id)!, args.data)
        return { ...products.get(args.id) }
      }

      const previousDoc = { ...order }
      const stockSnapshot = new Map([...products].map(([id, stored]) => [id, stored.stock]))
      const context = args.context ?? {}
      const req = { payload: fakePayload }

      try {
        const data = await validateOrderStockBeforeChange({
          context,
          data: { ...args.data },
          operation: 'update',
          originalDoc: previousDoc,
          req,
        } as unknown as Parameters<typeof validateOrderStockBeforeChange>[0])
        order = { ...previousDoc, ...data }

        for (const hook of [syncOrderStockAfterChange, notifyAdminAfterOrderChange]) {
          await hook({
            context,
            doc: { ...order },
            operation: 'update',
            previousDoc,
            req,
          } as unknown as Parameters<typeof hook>[0])
        }
      } catch (error) {
        order = previousDoc
        for (const [id, stock] of stockSnapshot) {
          products.get(id)!.stock = stock
        }
        throw error
      }

      return { ...order }
    },
  }

  return {
    currentOrder: () => ({ ...order }),
    stockOf: (id: number) => products.get(id)?.stock,
    update: fakePayload.update,
  }
}

describe('Mercado Pago webhook side effects', () => {
  const product = { id: 1, name: 'Caña', status: 'published' as const, stock: 5 }
  let state: Awaited<ReturnType<typeof createStatefulPayload>>

  async function useOrderWithQuantity(quantity: number) {
    state = await createStatefulPayload(buildOrder({ items: [{ product: 1, quantity }], stockApplied: false }), [product])
    payloadUpdate.mockImplementation(state.update)
    payloadFind.mockImplementation(async () => ({ docs: [state.currentOrder()] }))
  }

  beforeEach(async () => {
    stubWebhookEnvironment()
    await useOrderWithQuantity(2)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  function purchaseAlerts() {
    return notify.mock.calls.filter(([alert]) => String(alert.message).startsWith('Nueva compra confirmada'))
  }

  async function deliver(status: string) {
    paymentGet.mockResolvedValue(buildPayment({ status }))
    return handle({ dataId: '555', type: 'payment' })
  }

  it('applies stock and the admin alert once when the approval is delivered twice', async () => {
    await expect(deliver('approved')).resolves.toEqual({ processed: true })
    await expect(deliver('approved')).resolves.toEqual({ processed: true })

    expect(state.currentOrder()).toMatchObject({ paymentStatus: 'approved', status: 'confirmed', stockApplied: true })
    expect(state.stockOf(1)).toBe(3)
    expect(purchaseAlerts()).toHaveLength(1)
  })

  it('keeps a confirmed order and its stock when a late pending notification arrives', async () => {
    await deliver('pending')
    await deliver('approved')
    await deliver('in_process')

    expect(state.currentOrder()).toMatchObject({ paymentStatus: 'approved', status: 'confirmed' })
    expect(state.stockOf(1)).toBe(3)
    expect(purchaseAlerts()).toHaveLength(1)
  })

  it('blocks fulfillment without touching stock when the approval exceeds the stock', async () => {
    await useOrderWithQuantity(6)

    await deliver('approved')

    expect(state.currentOrder()).toMatchObject({ paymentStatus: 'approved', status: 'fulfillment_blocked' })
    expect(state.stockOf(1)).toBe(5)
    expect(purchaseAlerts()).toHaveLength(0)
  })

  it.each(['refunded', 'charged_back'])('cancels a confirmed order when its payment is %s', async (status) => {
    await deliver('approved')
    await deliver(status)

    expect(state.currentOrder()).toMatchObject({ paymentStatus: status, status: 'cancelled', stockApplied: false })
    expect(purchaseAlerts()).toHaveLength(1)
  })

  it.each(['refunded', 'charged_back'])('restores stock when an approved payment is %s', async (status) => {
    await deliver('approved')
    await deliver(status)

    expect(state.stockOf(1)).toBe(5)
  })

  it.each(['refunded', 'charged_back'])('restores stock only once when the %s notification is redelivered', async (status) => {
    await deliver('approved')
    await deliver(status)
    await deliver(status)

    expect(state.currentOrder()).toMatchObject({ status: 'cancelled', stockApplied: false })
    expect(state.stockOf(1)).toBe(5)
  })
})
