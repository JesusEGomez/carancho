import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const payloadCreate = vi.fn()
const payloadFind = vi.fn()
const payloadUpdate = vi.fn()
const preferenceCreate = vi.fn()

vi.mock('server-only', () => ({}))

vi.mock('@/lib/notifications', () => ({
  getAdminNotifier: vi.fn(),
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
  MerchantOrder: class {},
  Payment: class {},
  Preference: class {
    create = preferenceCreate
  },
}))

const customer = {
  customerEmail: 'ana@example.com',
  customerName: 'Ana Perez',
  customerPhone: '1155551111',
  deliveryAddress: 'Av. Siempre Viva 123',
  deliveryCity: 'Buenos Aires',
  deliveryNotes: '',
}

const CANA = { cardPrice: 1300, id: 1, name: 'Caña', price: 1000, slug: 'cana', status: 'published', stock: 5, transferPrice: 1100 }
const REEL = { cardPrice: null, id: 2, name: 'Reel', price: 500, slug: 'reel', status: 'published', stock: 2, transferPrice: null }

function postRaw(body: string) {
  return import('@/app/api/checkout/create/route').then(({ POST }) =>
    POST(
      new Request('https://example.com/api/checkout/create', {
        body,
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }),
    ),
  )
}

function post(body: unknown) {
  return postRaw(JSON.stringify(body))
}

describe('POST /api/checkout/create', () => {
  beforeEach(() => {
    vi.stubEnv('MERCADOPAGO_ACCESS_TOKEN', 'test-access-token')
    vi.stubEnv('MERCADOPAGO_PUBLIC_BASE_URL', 'https://example.com')
    payloadFind.mockReset()
    payloadFind.mockImplementation(async ({ where }) => ({
      docs: [CANA, REEL].filter((product) => where.id.in.includes(product.id)),
    }))
    payloadCreate.mockReset()
    payloadCreate.mockImplementation(async ({ data }) => ({ ...data, id: 42 }))
    payloadUpdate.mockReset()
    payloadUpdate.mockImplementation(async ({ data, id }) => ({ ...data, id }))
    preferenceCreate.mockReset()
    preferenceCreate.mockResolvedValue({ id: 'pref-1', init_point: 'https://mp.example/checkout' })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('answers 400 for a body that is not valid JSON', async () => {
    const response = await postRaw('{"customer":')

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: 'Invalid JSON body' })
    expect(payloadFind).not.toHaveBeenCalled()
  })

  it('answers 400 for an empty cart', async () => {
    const response = await post({ customer, items: [] })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: 'El carrito no puede estar vacío' })
    expect(payloadFind).not.toHaveBeenCalled()
  })

  it.each([
    ['zero', 0],
    ['negative', -1],
    ['non-integer', 1.5],
    ['above the per-line limit', 100],
    ['not a number', 'two'],
  ])('answers 400 for a %s quantity', async (_label, quantity) => {
    const response = await post({ customer, items: [{ productId: CANA.id, quantity }] })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: expect.any(String) })
    expect(payloadFind).not.toHaveBeenCalled()
    expect(payloadCreate).not.toHaveBeenCalled()
  })

  it.each([
    ['an unknown product id', [{ productId: 999, quantity: 1 }], undefined, 'PRODUCT_UNAVAILABLE', '999'],
    [
      'an unpublished product',
      [{ productId: CANA.id, quantity: 1 }],
      [{ ...CANA, status: 'draft' }],
      'PRODUCT_UNAVAILABLE',
      'Caña',
    ],
    ['insufficient stock', [{ productId: REEL.id, quantity: REEL.stock + 1 }], undefined, 'OUT_OF_STOCK', 'Reel'],
    [
      'insufficient stock across repeated lines',
      [
        { productId: REEL.id, quantity: 1 },
        { productId: REEL.id, quantity: 2 },
      ],
      undefined,
      'OUT_OF_STOCK',
      'Reel',
    ],
  ])('answers 409 for %s without creating an order', async (_label, items, docs, code, productName) => {
    if (docs) {
      payloadFind.mockResolvedValue({ docs })
    }

    const response = await post({ customer, items })

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      code,
      message: expect.any(String),
      meta: { productName },
    })
    expect(payloadCreate).not.toHaveBeenCalled()
    expect(preferenceCreate).not.toHaveBeenCalled()
  })

  it('accepts a quantity equal to the stock', async () => {
    const response = await post({ customer, items: [{ productId: REEL.id, quantity: REEL.stock }] })

    expect(response.status).toBe(201)
    expect(payloadCreate).toHaveBeenCalledTimes(1)
  })

  it('prices the order from the database and ignores client-sent prices, totals and state', async () => {
    const response = await post({
      customer,
      items: [
        { lineTotal: 1, price: 1, productId: CANA.id, quantity: 2, unitPrice: 1 },
        { lineTotal: 1, price: 1, productId: REEL.id, quantity: 1, unitPrice: 1 },
      ],
      paymentMethod: 'cash',
      paymentStatus: 'approved',
      status: 'confirmed',
      stockApplied: true,
      subtotal: 1,
      total: 1,
    })

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toMatchObject({
      initPoint: 'https://mp.example/checkout',
      orderId: 42,
      preferenceId: 'pref-1',
    })

    // Mercado Pago charges the card price; REEL has no card price and falls back to cash.
    const { data } = payloadCreate.mock.calls[0][0]
    expect(data).toMatchObject({
      paymentMethod: 'card',
      paymentProvider: 'mercadopago',
      paymentStatus: 'pending',
      status: 'pending_payment',
      subtotal: 3100,
      total: 3100,
    })
    expect(data).not.toHaveProperty('stockApplied')
    expect(data.items).toEqual([
      expect.objectContaining({ lineTotal: 2600, product: CANA.id, quantity: 2, unitPrice: 1300 }),
      expect.objectContaining({ lineTotal: 500, product: REEL.id, quantity: 1, unitPrice: 500 }),
    ])

    const preferenceItems = preferenceCreate.mock.calls[0][0].body.items
    expect(preferenceItems.map((item: { unit_price: number }) => item.unit_price)).toEqual([1300, 500])
    expect(payloadUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { providerPreferenceId: 'pref-1' }, id: 42 }),
    )
  })

  it('answers 503 without creating an order when Mercado Pago is not configured', async () => {
    vi.stubEnv('MERCADOPAGO_ACCESS_TOKEN', '')

    const response = await post({ customer, items: [{ productId: CANA.id, quantity: 1 }] })

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({ code: 'PAYMENT_UNAVAILABLE' })
    expect(payloadCreate).not.toHaveBeenCalled()
  })

  it('answers 503 when the Mercado Pago preference comes back without a checkout link', async () => {
    preferenceCreate.mockResolvedValue({ id: 'pref-1' })

    const response = await post({ customer, items: [{ productId: CANA.id, quantity: 1 }] })

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({ code: 'PAYMENT_UNAVAILABLE' })
  })

  it('answers 500 with a generic message on an unexpected failure', async () => {
    preferenceCreate.mockRejectedValue(new Error('socket hang up'))

    const response = await post({ customer, items: [{ productId: CANA.id, quantity: 1 }] })

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ message: 'No se pudo iniciar el pago.' })
  })
})
