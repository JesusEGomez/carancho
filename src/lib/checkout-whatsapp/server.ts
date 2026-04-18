import 'server-only'

import { buildWhatsAppCheckoutMessage, createWhatsAppUrl } from '@/lib/alerts/whatsapp'
import { buildValidatedOrderData } from '@/lib/checkout'
import { createWhatsAppUnavailableError } from '@/lib/checkout-errors'
import type { CreateOrderRequest, CreateWhatsAppOrderResponse } from '@/lib/checkout-schema'
import { getPayloadClient } from '@/lib/payload'

export async function createWhatsAppCheckout(input: CreateOrderRequest): Promise<CreateWhatsAppOrderResponse> {
  const payload = await getPayloadClient()
  const orderData = await buildValidatedOrderData(input)
  const contacts = await payload.find({
    collection: 'store-contacts',
    depth: 0,
    limit: 1,
    overrideAccess: false,
  })
  const adminPhone = contacts.docs[0]?.phone?.trim() ?? ''

  if (!adminPhone) {
    throw createWhatsAppUnavailableError()
  }

  const order = await payload.create({
    collection: 'orders',
    data: {
      ...orderData,
      paymentProvider: 'whatsapp',
      paymentStatus: 'pending',
      status: 'pending_whatsapp',
    },
  })

  const whatsappUrl = createWhatsAppUrl({
    message: buildWhatsAppCheckoutMessage(order),
    phone: adminPhone,
  })

  return {
    confirmationToken: order.confirmationToken,
    orderId: order.id,
    whatsappUrl,
  }
}
