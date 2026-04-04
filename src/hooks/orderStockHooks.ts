import type { CollectionAfterChangeHook, CollectionBeforeChangeHook } from 'payload'

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

function shouldSyncStock(status: unknown, stockApplied: unknown) {
  return status === 'confirmed' && stockApplied !== true
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

  const mergedItems = new Map<number, number>()

  for (const item of data.items as OrderItemInput[]) {
    const productId = getProductId(item.product)
    const quantity = item.quantity ?? 0

    if (!productId || quantity <= 0) {
      continue
    }

    mergedItems.set(productId, (mergedItems.get(productId) ?? 0) + quantity)
  }

  for (const [productId, quantity] of mergedItems.entries()) {
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

export const syncOrderStockAfterChange: CollectionAfterChangeHook = async ({
  context,
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (context.skipStockSync || !shouldSyncStock(doc.status, doc.stockApplied) || !Array.isArray(doc.items) || doc.items.length === 0) {
    return doc
  }

  const wasAlreadyConfirmed = operation === 'update' && previousDoc?.status === 'confirmed' && previousDoc?.stockApplied === true

  if (wasAlreadyConfirmed) {
    return doc
  }

  const mergedItems = new Map<number, number>()

  for (const item of doc.items as OrderItemInput[]) {
    const productId = getProductId(item.product)
    const quantity = item.quantity ?? 0

    if (!productId || quantity <= 0) {
      continue
    }

    mergedItems.set(productId, (mergedItems.get(productId) ?? 0) + quantity)
  }

  for (const [productId, quantity] of mergedItems.entries()) {
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

  await req.payload.update({
    collection: 'orders',
    id: doc.id,
    context: {
      skipStockSync: true,
    },
    data: {
      stockApplied: true,
    },
    req,
  })

  return doc
}
