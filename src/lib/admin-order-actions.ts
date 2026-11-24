import type { WhatsAppPaymentMethod } from '@/lib/checkout-schema'

export type AdminOrderStatus =
  | 'draft'
  | 'pending_payment'
  | 'pending_whatsapp'
  | 'confirmed'
  | 'fulfillment_blocked'
  | 'cancelled'

export type AdminActionOrderItem = {
  cashUnitPrice?: number | null
  id?: string | null
  lineTotal: number
  product: number | { id: number }
  productName: string
  productSlug: string
  quantity: number
  transferUnitPrice?: number | null
  unitPrice: number
}

export type AdminActionOrder = {
  items?: AdminActionOrderItem[] | null
  paymentMethod?: 'cash' | 'transfer' | 'card' | null
  paymentProvider?: 'mercadopago' | 'whatsapp' | null
  status: AdminOrderStatus
}

export class AdminOrderActionError extends Error {
  status: number

  constructor(message: string, status = 409) {
    super(message)
    this.name = 'AdminOrderActionError'
    this.status = status
  }
}

/** Only WhatsApp orders still waiting for manual confirmation can be edited from the admin. */
function assertPendingWhatsAppOrder(order: AdminActionOrder, action: string) {
  if (order.status !== 'pending_whatsapp' || order.paymentProvider !== 'whatsapp') {
    throw new AdminOrderActionError(`Solo se puede ${action} una orden pendiente por WhatsApp.`)
  }
}

/**
 * Reprices a pending WhatsApp order from the snapshots stored at checkout time,
 * never from current product prices, so a later price change cannot leak into it.
 */
export function buildPaymentMethodSwitch(order: AdminActionOrder, paymentMethod: WhatsAppPaymentMethod) {
  assertPendingWhatsAppOrder(order, 'cambiar el medio de pago de')

  const items = (order.items ?? []).map((item) => {
    const snapshot = paymentMethod === 'cash' ? item.cashUnitPrice : item.transferUnitPrice

    if (typeof snapshot !== 'number' || !Number.isFinite(snapshot)) {
      throw new AdminOrderActionError(
        'La orden no tiene registrados los precios por medio de pago, no se puede recalcular.',
        422,
      )
    }

    return {
      ...item,
      product: typeof item.product === 'number' ? item.product : item.product.id,
      lineTotal: snapshot * item.quantity,
      unitPrice: snapshot,
    }
  })

  if (items.length === 0) {
    throw new AdminOrderActionError('La orden no tiene productos.', 422)
  }

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)

  return {
    items,
    paymentMethod,
    subtotal,
    total: subtotal,
  }
}

/** Mercado Pago orders are never cancelled here: they need a refund through Mercado Pago. */
export function buildOrderCancellation(order: AdminActionOrder) {
  assertPendingWhatsAppOrder(order, 'cancelar')

  return {
    paymentStatus: 'cancelled' as const,
    status: 'cancelled' as const,
  }
}
