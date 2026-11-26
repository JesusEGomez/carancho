import { randomUUID } from 'crypto'

import { createOutOfStockError, createUnavailableProductError } from '@/lib/checkout-errors'
import { getPayloadClient } from '@/lib/payload'
import type { CartItem, CreateOrderRequest } from '@/lib/checkout-schema'
import { getLineTotal, sumMoney, type PaymentMethod } from '@/lib/pricing'

type ProductRecord = {
  id: number
  name: string
  slug: string
  price: number
  status: 'published' | 'draft'
  stock: number
}

function mergeCartItems(items: CartItem[]) {
  const merged = new Map<number, number>()

  for (const item of items) {
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity)
  }

  return Array.from(merged.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }))
}

/**
 * Prices always come from the database: the client only sends product ids and quantities.
 * Every payment method charges `price`; `paymentMethod` only records how the customer pays.
 */
export async function buildValidatedOrderData(input: CreateOrderRequest, paymentMethod: PaymentMethod) {
  const payload = await getPayloadClient()
  const items = mergeCartItems(input.items)
  const productIds = items.map((item) => item.productId)
  const productsResult = await payload.find({
    collection: 'products',
    depth: 0,
    limit: productIds.length || 1,
    overrideAccess: false,
    where: {
      id: {
        in: productIds,
      },
    },
  })

  const productsById = new Map<number, ProductRecord>(
    productsResult.docs.map((product) => [
      product.id,
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        status: product.status,
        stock: product.stock,
      },
    ]),
  )

  const orderItems = items.map((item) => {
    const product = productsById.get(item.productId)

    if (!product) {
      throw createUnavailableProductError(String(item.productId))
    }

    if (product.status !== 'published') {
      throw createUnavailableProductError(product.name)
    }

    if (product.stock < item.quantity) {
      throw createOutOfStockError(product.name)
    }

    const unitPrice = product.price

    return {
      lineTotal: getLineTotal(unitPrice, item.quantity),
      product: product.id,
      productName: product.name,
      productSlug: product.slug,
      quantity: item.quantity,
      unitPrice,
    }
  })

  const subtotal = sumMoney(orderItems.map((item) => item.lineTotal))

  return {
    confirmationToken: randomUUID(),
    currency: 'ARS',
    customerEmail: input.customer.customerEmail,
    customerName: input.customer.customerName,
    customerPhone: input.customer.customerPhone,
    deliveryAddress: input.customer.deliveryAddress,
    deliveryCity: input.customer.deliveryCity,
    deliveryNotes: input.customer.deliveryNotes || undefined,
    items: orderItems,
    paymentMethod,
    status: 'pending_payment' as const,
    subtotal,
    total: subtotal,
  }
}

export async function getOrderConfirmation(orderId: number, confirmationToken: string) {
  const payload = await getPayloadClient()
  // A missing order must look exactly like a wrong token so ids cannot be enumerated.
  const order = await payload.findByID({
    collection: 'orders',
    depth: 1,
    disableErrors: true,
    id: orderId,
  })

  if (!order || order.confirmationToken !== confirmationToken) {
    return null
  }

  return order
}
