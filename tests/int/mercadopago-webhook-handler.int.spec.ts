import crypto from 'crypto'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
})
