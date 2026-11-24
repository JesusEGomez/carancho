import { describe, expect, it, vi } from 'vitest'

import { syncOrderStockAfterChange } from '@/hooks/orderStockHooks'
import { buildOrderCancellation, buildPaymentMethodSwitch, type AdminActionOrder } from '@/lib/admin-order-actions'

const pendingOrder: AdminActionOrder = {
  items: [
    {
      cashUnitPrice: 1000,
      id: 'item-1',
      lineTotal: 1000,
      product: 1,
      productName: 'Caña',
      productSlug: 'cana',
      quantity: 1,
      transferUnitPrice: 1100,
      unitPrice: 1000,
    },
  ],
  paymentMethod: 'cash',
  paymentProvider: 'whatsapp',
  status: 'pending_whatsapp',
}

async function runStockHook(doc: Record<string, unknown>) {
  const findByID = vi.fn()
  const update = vi.fn()
  const hookArgs = {
    context: {},
    doc,
    operation: 'update',
    previousDoc: { ...pendingOrder, id: 7, stockApplied: false },
    req: { payload: { findByID, update } },
  } as unknown as Parameters<typeof syncOrderStockAfterChange>[0]

  await syncOrderStockAfterChange(hookArgs)

  return { findByID, update }
}

describe('stock is untouched by admin order actions', () => {
  it('does not read or write products when a pending WhatsApp order is cancelled', async () => {
    const doc = { ...pendingOrder, ...buildOrderCancellation(pendingOrder), id: 7, stockApplied: false }
    const { findByID, update } = await runStockHook(doc)

    expect(findByID).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
  })

  it('does not read or write products when the payment method is switched', async () => {
    const doc = { ...pendingOrder, ...buildPaymentMethodSwitch(pendingOrder, 'transfer'), id: 7, stockApplied: false }
    const { findByID, update } = await runStockHook(doc)

    expect(findByID).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
  })
})
