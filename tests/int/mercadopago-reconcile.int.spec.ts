import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getOrderConfirmation = vi.fn()
const paymentGet = vi.fn()
const merchantOrderGet = vi.fn()
const payloadUpdate = vi.fn()
const notify = vi.fn()
const getAdminNotifier = vi.fn()

vi.mock('server-only', () => ({}))

vi.mock('@/lib/checkout', () => ({
  buildValidatedOrderData: vi.fn(),
  getOrderConfirmation,
}))

vi.mock('@/lib/payload', () => ({
  getPayloadClient: async () => ({
    update: payloadUpdate,
  }),
}))

vi.mock('@/lib/notifications', () => ({
  getAdminNotifier,
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
    create = vi.fn()
  },
}))

function buildOrder(overrides: Record<string, unknown> = {}) {
  return {
    confirmationToken: 'token-expensive',
    currency: 'ARS',
    externalReference: 'order-expensive',
    id: 2,
    paymentProvider: 'mercadopago',
    paymentStatus: 'pending',
    status: 'pending_payment',
    total: 150000,
    ...overrides,
  }
}

function buildPayment(overrides: Record<string, unknown> = {}) {
  return {
    currency_id: 'ARS',
    external_reference: 'order-expensive',
    id: 777,
    status: 'approved',
    status_detail: 'accredited',
    transaction_amount: 150000,
    ...overrides,
  }
}

async function reconcile() {
  const { reconcileMercadoPagoOrder } = await import('@/lib/mercadopago/server')

  return reconcileMercadoPagoOrder({
    orderId: 2,
    paymentId: '777',
    token: 'token-expensive',
  })
}

describe('reconcileMercadoPagoOrder', () => {
  beforeEach(() => {
    vi.stubEnv('MERCADOPAGO_ACCESS_TOKEN', 'test-access-token')
    vi.stubEnv('MERCADOPAGO_PUBLIC_BASE_URL', 'https://example.com')
    getOrderConfirmation.mockReset()
    paymentGet.mockReset()
    merchantOrderGet.mockReset()
    payloadUpdate.mockReset()
    payloadUpdate.mockImplementation(async ({ data, id }) => ({ ...buildOrder(), ...data, id }))
    notify.mockReset()
    notify.mockResolvedValue({ delivered: true })
    getAdminNotifier.mockReset()
    getAdminNotifier.mockResolvedValue({ notify })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('confirms the order when the payment belongs to it', async () => {
    getOrderConfirmation.mockResolvedValue(buildOrder())
    paymentGet.mockResolvedValue(buildPayment())

    const result = await reconcile()

    expect(payloadUpdate).toHaveBeenCalledTimes(1)
    expect(payloadUpdate.mock.calls[0][0].data).toMatchObject({
      paymentStatus: 'approved',
      providerPaymentId: '777',
      status: 'confirmed',
    })
    expect(result?.status).toBe('confirmed')
  })

  it('tolerates float rounding when comparing the paid amount', async () => {
    getOrderConfirmation.mockResolvedValue(buildOrder({ total: 1999.9 }))
    paymentGet.mockResolvedValue(buildPayment({ transaction_amount: 1999.8999999999999 }))

    await reconcile()

    expect(payloadUpdate).toHaveBeenCalledTimes(1)
  })

  it('ignores an approved payment from another order (cheap order payment replay)', async () => {
    const order = buildOrder()
    getOrderConfirmation.mockResolvedValue(order)
    paymentGet.mockResolvedValue(
      buildPayment({ external_reference: 'order-cheap', transaction_amount: 100 }),
    )

    const result = await reconcile()

    expect(payloadUpdate).not.toHaveBeenCalled()
    expect(result).toBe(order)
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('does not belong to the order'),
      expect.objectContaining({
        orderExternalReference: 'order-expensive',
        orderId: 2,
        orderTotal: 150000,
        paymentAmount: 100,
        paymentCurrency: 'ARS',
        paymentExternalReference: 'order-cheap',
        paymentId: '777',
        reason: 'external_reference_mismatch',
      }),
    )
    // The public status route must not be able to trigger admin emails.
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(getAdminNotifier).not.toHaveBeenCalled()
    expect(notify).not.toHaveBeenCalled()
  })

  it('returns the order unchanged when Mercado Pago does not know the payment id', async () => {
    const order = buildOrder()
    getOrderConfirmation.mockResolvedValue(order)
    paymentGet.mockRejectedValue({ error: 'not_found', message: 'Payment not found', status: 404 })

    const result = await reconcile()

    expect(result).toBe(order)
    expect(payloadUpdate).not.toHaveBeenCalled()
  })

  it('returns the order unchanged when Mercado Pago does not know the merchant order id', async () => {
    const order = buildOrder()
    getOrderConfirmation.mockResolvedValue(order)
    merchantOrderGet.mockRejectedValue({ error: 'not_found', status: 404 })
    const { reconcileMercadoPagoOrder } = await import('@/lib/mercadopago/server')

    const result = await reconcileMercadoPagoOrder({
      merchantOrderId: '900',
      orderId: 2,
      token: 'token-expensive',
    })

    expect(result).toBe(order)
    expect(paymentGet).not.toHaveBeenCalled()
    expect(payloadUpdate).not.toHaveBeenCalled()
  })

  it('returns the order unchanged when the merchant order payment is not found', async () => {
    const order = buildOrder()
    getOrderConfirmation.mockResolvedValue(order)
    merchantOrderGet.mockResolvedValue({ id: 900, payments: [{ id: 777, status: 'approved' }] })
    paymentGet.mockRejectedValue({ error: 'not_found', status: 404 })
    const { reconcileMercadoPagoOrder } = await import('@/lib/mercadopago/server')

    const result = await reconcileMercadoPagoOrder({
      merchantOrderId: '900',
      orderId: 2,
      token: 'token-expensive',
    })

    expect(result).toBe(order)
    expect(payloadUpdate).not.toHaveBeenCalled()
  })

  it('still rejects on non-404 Mercado Pago errors', async () => {
    getOrderConfirmation.mockResolvedValue(buildOrder())
    const serverError = { error: 'internal_error', status: 500 }
    paymentGet.mockRejectedValue(serverError)

    await expect(reconcile()).rejects.toBe(serverError)
  })

  it('returns the order unchanged when the return url carries payment_id=null', async () => {
    const order = buildOrder()
    getOrderConfirmation.mockResolvedValue(order)
    const { reconcileMercadoPagoOrder } = await import('@/lib/mercadopago/server')

    const result = await reconcileMercadoPagoOrder({
      merchantOrderId: 'null',
      orderId: 2,
      paymentId: 'null',
      token: 'token-expensive',
    })

    expect(paymentGet).not.toHaveBeenCalled()
    expect(payloadUpdate).not.toHaveBeenCalled()
    expect(result).toBe(order)
  })

  it('ignores a payment whose amount does not match the order total', async () => {
    const order = buildOrder()
    getOrderConfirmation.mockResolvedValue(order)
    paymentGet.mockResolvedValue(buildPayment({ transaction_amount: 100 }))

    const result = await reconcile()

    expect(payloadUpdate).not.toHaveBeenCalled()
    expect(result).toBe(order)
    expect(console.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ reason: 'amount_mismatch' }),
    )
  })

  it('ignores a payment in a different currency', async () => {
    const order = buildOrder()
    getOrderConfirmation.mockResolvedValue(order)
    paymentGet.mockResolvedValue(buildPayment({ currency_id: 'USD' }))

    const result = await reconcile()

    expect(payloadUpdate).not.toHaveBeenCalled()
    expect(result).toBe(order)
    expect(console.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ reason: 'currency_mismatch' }),
    )
  })

  it('ignores Mercado Pago payments for orders created through another provider', async () => {
    const order = buildOrder({ paymentProvider: 'whatsapp' })
    getOrderConfirmation.mockResolvedValue(order)
    paymentGet.mockResolvedValue(buildPayment())

    const result = await reconcile()

    expect(payloadUpdate).not.toHaveBeenCalled()
    expect(result).toBe(order)
    expect(console.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ reason: 'order_not_mercadopago' }),
    )
  })
})
