import { describe, expect, it, vi } from 'vitest'

import { syncOrderStockAfterChange, validateOrderStockBeforeChange } from '@/hooks/orderStockHooks'
import { CheckoutDomainError } from '@/lib/checkout-errors'

type FakeProduct = { id: number; name: string; status: 'published' | 'draft'; stock: number }
type FakeItem = { product: number | { id: number } | null; quantity: number | null }
type FakeOrder = { id: number; items: FakeItem[]; status: string; stockApplied?: boolean }

const CANA: FakeProduct = { id: 1, name: 'Caña', status: 'published', stock: 10 }
const REEL: FakeProduct = { id: 2, name: 'Reel', status: 'published', stock: 4 }

/** In-memory stand-in for the slice of the Payload local API the stock hooks use. */
function createFakePayload(products: FakeProduct[]) {
  const store = new Map(products.map((product) => [product.id, { ...product }]))
  const findByID = vi.fn(async ({ id }: { collection: string; id: number }) => {
    const product = store.get(id)
    return product ? { ...product } : null
  })
  const update = vi.fn(
    async ({ collection, data, id }: { collection: string; context?: unknown; data: Record<string, unknown>; id: number }) => {
      if (collection === 'products') {
        const product = store.get(id)!
        Object.assign(product, data)
        return { ...product }
      }

      return { id, ...data }
    },
  )

  return {
    payload: { findByID, update },
    productUpdates: () => update.mock.calls.filter(([args]) => args.collection === 'products').map(([args]) => args),
    orderUpdates: () => update.mock.calls.filter(([args]) => args.collection === 'orders').map(([args]) => args),
    stockOf: (id: number) => store.get(id)?.stock,
  }
}

function buildOrder(overrides: Partial<FakeOrder> = {}): FakeOrder {
  return {
    id: 7,
    items: [{ product: CANA.id, quantity: 2 }],
    status: 'confirmed',
    stockApplied: false,
    ...overrides,
  }
}

async function runAfterChange(args: {
  context?: Record<string, unknown>
  doc: FakeOrder
  operation?: 'create' | 'update'
  previousDoc?: Partial<FakeOrder>
  products?: FakeProduct[]
}) {
  const fake = createFakePayload(args.products ?? [CANA, REEL])
  const hookArgs = {
    context: args.context ?? {},
    doc: args.doc,
    operation: args.operation ?? 'update',
    previousDoc: args.previousDoc ?? {},
    req: { payload: fake.payload },
  } as unknown as Parameters<typeof syncOrderStockAfterChange>[0]

  const result = syncOrderStockAfterChange(hookArgs)

  return { fake, result }
}

async function runBeforeChange(args: {
  data: Partial<FakeOrder>
  operation?: 'create' | 'update'
  originalDoc?: Partial<FakeOrder>
  products?: FakeProduct[]
}) {
  const fake = createFakePayload(args.products ?? [CANA, REEL])
  const hookArgs = {
    data: args.data,
    operation: args.operation ?? 'update',
    originalDoc: args.originalDoc,
    req: { payload: fake.payload },
  } as unknown as Parameters<typeof validateOrderStockBeforeChange>[0]

  const result = validateOrderStockBeforeChange(hookArgs)

  return { fake, result }
}

describe('syncOrderStockAfterChange', () => {
  it.each([
    ['create', undefined, undefined],
    ['update', 'pending_payment', false],
    ['update', 'pending_whatsapp', false],
    ['update', 'fulfillment_blocked', false],
    ['update', 'cancelled', false],
    ['update', 'draft', false],
  ] as const)(
    'decrements stock once when an order becomes confirmed (%s from %s)',
    async (operation, previousStatus, previousStockApplied) => {
      const { fake, result } = await runAfterChange({
        doc: buildOrder(),
        operation,
        previousDoc: previousStatus ? { status: previousStatus, stockApplied: previousStockApplied } : {},
      })

      await expect(result).resolves.toMatchObject({ id: 7 })
      expect(fake.stockOf(CANA.id)).toBe(8)
      expect(fake.productUpdates()).toHaveLength(1)
      expect(fake.orderUpdates()).toEqual([
        expect.objectContaining({ context: { skipStockSync: true }, data: { stockApplied: true }, id: 7 }),
      ])
    },
  )

  it.each(['draft', 'pending_payment', 'pending_whatsapp', 'fulfillment_blocked', 'cancelled'])(
    'leaves stock untouched when the order status is %s',
    async (status) => {
      const { fake, result } = await runAfterChange({
        doc: buildOrder({ status }),
        previousDoc: { status: 'pending_payment', stockApplied: false },
      })

      await result
      expect(fake.payload.findByID).not.toHaveBeenCalled()
      expect(fake.payload.update).not.toHaveBeenCalled()
    },
  )

  it.each([
    ['a replayed confirmation of a stock-applied order', { status: 'confirmed', stockApplied: true }, true, {}],
    ['a doc that already carries stockApplied', { status: 'pending_payment', stockApplied: false }, true, {}],
    ['the internal stockApplied write-back', { status: 'confirmed', stockApplied: false }, false, { skipStockSync: true }],
  ] as const)('does not decrement twice for %s', async (_label, previousDoc, stockApplied, context) => {
    const { fake, result } = await runAfterChange({
      context,
      doc: buildOrder({ stockApplied }),
      previousDoc,
    })

    await result
    expect(fake.stockOf(CANA.id)).toBe(CANA.stock)
    expect(fake.payload.update).not.toHaveBeenCalled()
  })

  it('decrements every product of a multi-item order, merging repeated lines', async () => {
    const { fake, result } = await runAfterChange({
      doc: buildOrder({
        items: [
          { product: CANA.id, quantity: 2 },
          { product: { id: REEL.id }, quantity: 1 },
          { product: CANA.id, quantity: 3 },
        ],
      }),
      previousDoc: { status: 'pending_payment', stockApplied: false },
    })

    await result
    expect(fake.stockOf(CANA.id)).toBe(5)
    expect(fake.stockOf(REEL.id)).toBe(3)
    expect(fake.productUpdates()).toHaveLength(2)
  })

  it('ignores lines without a product or with a non-positive quantity', async () => {
    const { fake, result } = await runAfterChange({
      doc: buildOrder({
        items: [
          { product: null, quantity: 5 },
          { product: REEL.id, quantity: 0 },
          { product: REEL.id, quantity: null },
          { product: CANA.id, quantity: 1 },
        ],
      }),
      previousDoc: { status: 'pending_payment', stockApplied: false },
    })

    await result
    expect(fake.stockOf(CANA.id)).toBe(9)
    expect(fake.stockOf(REEL.id)).toBe(REEL.stock)
  })

  it('allows a quantity equal to the stock and leaves it at 0', async () => {
    const { fake, result } = await runAfterChange({
      doc: buildOrder({ items: [{ product: REEL.id, quantity: REEL.stock }] }),
      previousDoc: { status: 'pending_payment', stockApplied: false },
    })

    await result
    expect(fake.stockOf(REEL.id)).toBe(0)
  })

  it('rejects a confirmation that exceeds the stock without touching products or the order', async () => {
    const { fake, result } = await runAfterChange({
      doc: buildOrder({ items: [{ product: REEL.id, quantity: REEL.stock + 1 }] }),
      previousDoc: { status: 'pending_payment', stockApplied: false },
    })

    await expect(result).rejects.toMatchObject({ code: 'OUT_OF_STOCK', meta: { productName: 'Reel' }, status: 409 })
    await expect(result).rejects.toBeInstanceOf(CheckoutDomainError)
    expect(fake.stockOf(REEL.id)).toBe(REEL.stock)
    expect(fake.payload.update).not.toHaveBeenCalled()
  })

  // Known bug: stock is not restored on cancel/refund — see review 2026-11-27
  // BUG (reported, not fixed): nothing restores stock when a stock-applied order is
  // cancelled, refunded or charged back. syncOrderStockAfterChange only handles the
  // transition into `confirmed`, and Mercado Pago refunds/chargebacks move a confirmed
  // order to `cancelled` (see mapMercadoPagoPayment), so the units stay deducted.
  // Flip these to `it` once restocking is implemented.
  it.fails.each([
    ['cancelled by the admin', { status: 'cancelled' }],
    ['refunded in Mercado Pago', { paymentStatus: 'refunded', status: 'cancelled' }],
    ['charged back in Mercado Pago', { paymentStatus: 'charged_back', status: 'cancelled' }],
  ] as const)('restores stock when a stock-applied order is %s', async (_label, change) => {
    const { fake, result } = await runAfterChange({
      doc: { ...buildOrder({ stockApplied: true }), ...change },
      previousDoc: { status: 'confirmed', stockApplied: true },
      products: [{ ...CANA, stock: 8 }],
    })

    await result
    expect(fake.stockOf(CANA.id)).toBe(10)
  })
})

describe('validateOrderStockBeforeChange', () => {
  it('lets a confirmation through when the quantity equals the stock', async () => {
    const data = buildOrder({ items: [{ product: REEL.id, quantity: REEL.stock }] })
    const { fake, result } = await runBeforeChange({
      data,
      originalDoc: { status: 'pending_payment', stockApplied: false },
    })

    await expect(result).resolves.toBe(data)
    expect(fake.payload.findByID).toHaveBeenCalledTimes(1)
    expect(fake.payload.update).not.toHaveBeenCalled()
  })

  it.each([
    [
      'insufficient stock',
      [{ product: REEL.id, quantity: REEL.stock + 1 }],
      [CANA, REEL],
      { code: 'OUT_OF_STOCK', meta: { productName: 'Reel' } },
    ],
    [
      'insufficient stock across merged lines',
      [
        { product: REEL.id, quantity: 3 },
        { product: REEL.id, quantity: 2 },
      ],
      [CANA, REEL],
      { code: 'OUT_OF_STOCK', meta: { productName: 'Reel' } },
    ],
    [
      'an unpublished product',
      [{ product: CANA.id, quantity: 1 }],
      [{ ...CANA, status: 'draft' as const }],
      { code: 'PRODUCT_UNAVAILABLE' },
    ],
    ['a deleted product', [{ product: 99, quantity: 1 }], [CANA], { code: 'PRODUCT_UNAVAILABLE' }],
  ])('rejects a confirmation with %s', async (_label, items, products, expected) => {
    const { result } = await runBeforeChange({
      data: buildOrder({ items }),
      originalDoc: { status: 'pending_payment', stockApplied: false },
      products,
    })

    await expect(result).rejects.toMatchObject({ ...expected, status: 409 })
  })

  it.each([
    ['a non-confirmed status', { status: 'pending_payment' }, { status: 'draft' }],
    ['data that already carries stockApplied', { stockApplied: true }, { status: 'pending_payment' }],
    ['a replay of a stock-applied confirmed order', {}, { status: 'confirmed', stockApplied: true }],
    // Partial updates (e.g. the Mercado Pago webhook only sends status fields) carry no
    // items here; the afterChange hook re-checks stock against the full document.
    ['a partial update without items', { items: undefined }, { status: 'pending_payment' }],
  ] as const)('skips the stock check for %s', async (_label, change, originalDoc) => {
    const { fake, result } = await runBeforeChange({
      data: { ...buildOrder({ items: [{ product: REEL.id, quantity: 999 }] }), ...change },
      originalDoc,
    })

    await expect(result).resolves.toBeDefined()
    expect(fake.payload.findByID).not.toHaveBeenCalled()
  })
})
