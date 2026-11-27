import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, PayloadRequest } from 'payload'

import { createOutOfStockError, createUnavailableProductError } from '@/lib/checkout-errors'

type OrderItemInput = {
  product?: number | { id: number } | null
  quantity?: number | null
}

function getProductId(product: OrderItemInput['product']) {
  if (typeof product === 'number') {
    return product
  }

  if (product && typeof product === 'object' && 'id' in product && typeof product.id === 'number') {
    return product.id
  }

  return null
}

/** Sums the quantities per product, skipping lines without a product or a positive quantity. */
function mergeOrderItems(items: OrderItemInput[]) {
  const mergedItems = new Map<number, number>()

  for (const item of items) {
    const productId = getProductId(item.product)
    const quantity = item.quantity ?? 0

    if (!productId || quantity <= 0) {
      continue
    }

    mergedItems.set(productId, (mergedItems.get(productId) ?? 0) + quantity)
  }

  return mergedItems
}

function shouldSyncStock(status: unknown, stockApplied: unknown) {
  return status === 'confirmed' && stockApplied !== true
}

function shouldRestoreStock(status: unknown, stockApplied: unknown) {
  return status === 'cancelled' && stockApplied === true
}

async function setStockApplied(req: PayloadRequest, orderId: number, stockApplied: boolean) {
  await req.payload.update({
    collection: 'orders',
    id: orderId,
    context: {
      skipStockSync: true,
    },
    data: {
      stockApplied,
    },
    req,
  })
}

export const validateOrderStockBeforeChange: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!shouldSyncStock(data.status, data.stockApplied) || !Array.isArray(data.items) || data.items.length === 0) {
    return data
  }

  const isSameConfirmedOrder =
    operation === 'update' && originalDoc?.status === 'confirmed' && originalDoc?.stockApplied === true

  if (isSameConfirmedOrder) {
    return data
  }

  for (const [productId, quantity] of mergeOrderItems(data.items as OrderItemInput[]).entries()) {
    const product = await req.payload.findByID({
      collection: 'products',
      depth: 0,
      id: productId,
      req,
    })

    if (!product || product.status !== 'published') {
      throw createUnavailableProductError(String(productId))
    }

    if (product.stock < quantity) {
      throw createOutOfStockError(product.name)
    }
  }

  return data
}

/**
 * Puts the units of a cancelled order back. `stockApplied` is the idempotency guard:
 * it is cleared in the same transaction, so a replayed cancel, refund or chargeback
 * finds it false and restocks nothing.
 */
async function restoreOrderStock(req: PayloadRequest, orderId: number, items: OrderItemInput[]) {
  for (const [productId, quantity] of mergeOrderItems(items).entries()) {
    const product = await req.payload.findByID({
      collection: 'products',
      depth: 0,
      disableErrors: true,
      id: productId,
      req,
    })

    // A product deleted after the sale has no stock to restore; failing here would
    // roll back the cancellation itself.
    if (!product) {
      continue
    }

    await req.payload.update({
      collection: 'products',
      id: productId,
      data: {
        stock: product.stock + quantity,
      },
      req,
    })
  }

  await setStockApplied(req, orderId, false)
}

export const syncOrderStockAfterChange: CollectionAfterChangeHook = async ({
  context,
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (context.skipStockSync || !Array.isArray(doc.items) || doc.items.length === 0) {
    return doc
  }

  if (shouldRestoreStock(doc.status, doc.stockApplied)) {
    await restoreOrderStock(req, doc.id, doc.items as OrderItemInput[])
    return { ...doc, stockApplied: false }
  }

  if (!shouldSyncStock(doc.status, doc.stockApplied)) {
    return doc
  }

  const wasAlreadyConfirmed = operation === 'update' && previousDoc?.status === 'confirmed' && previousDoc?.stockApplied === true

  if (wasAlreadyConfirmed) {
    return doc
  }

  for (const [productId, quantity] of mergeOrderItems(doc.items as OrderItemInput[]).entries()) {
    const product = await req.payload.findByID({
      collection: 'products',
      depth: 0,
      id: productId,
      req,
    })

    if (product.stock < quantity) {
      throw createOutOfStockError(product.name)
    }

    await req.payload.update({
      collection: 'products',
      id: productId,
      data: {
        stock: product.stock - quantity,
      },
      req,
    })
  }

  await setStockApplied(req, doc.id, true)

  return doc
}
