import type { WhatsAppPaymentMethod } from '@/lib/checkout-schema'

export type AdminOrderStatus =
  | 'draft'
  | 'pending_payment'
  | 'pending_whatsapp'
  | 'confirmed'
  | 'fulfillment_blocked'
  | 'cancelled'

export type AdminActionOrderItem = {
  id?: string | null
  lineTotal: number
  product: number | { id: number }
  productName: string
  productSlug: string
  quantity: number
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
 * Cash and transfer charge the same price, so switching only records the new method:
 * items and totals stay exactly as they were stored at checkout time.
 */
export function buildPaymentMethodSwitch(order: AdminActionOrder, paymentMethod: WhatsAppPaymentMethod) {
  assertPendingWhatsAppOrder(order, 'cambiar el medio de pago de')

  return { paymentMethod }
}

/** Mercado Pago orders are never cancelled here: they need a refund through Mercado Pago. */
export function buildOrderCancellation(order: AdminActionOrder) {
  assertPendingWhatsAppOrder(order, 'cancelar')

  return {
    paymentStatus: 'cancelled' as const,
    status: 'cancelled' as const,
  }
}
