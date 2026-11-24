export const PAYMENT_METHODS = ['cash', 'transfer', 'card'] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: 'Tarjeta',
  cash: 'Efectivo',
  transfer: 'Transferencia',
}

export type PricedProduct = {
  cardPrice?: number | string | null
  price: number
  transferPrice?: number | string | null
}

/** Returns the alternative price as a number, or null when the field is unset (null, undefined, empty or not finite). */
export function normalizeOptionalPrice(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

/**
 * `price` is the cash price. Transfer and card fall back to it when their own price is unset.
 */
export function getUnitPrice(product: PricedProduct, method: PaymentMethod): number {
  if (method === 'card') {
    return normalizeOptionalPrice(product.cardPrice) ?? product.price
  }

  if (method === 'transfer') {
    return normalizeOptionalPrice(product.transferPrice) ?? product.price
  }

  return product.price
}

/** Methods whose price is explicitly set, always led by cash. Empty when no alternative price exists. */
export function getConfiguredPaymentPrices(product: PricedProduct) {
  const transferPrice = normalizeOptionalPrice(product.transferPrice)
  const cardPrice = normalizeOptionalPrice(product.cardPrice)

  if (transferPrice === null && cardPrice === null) {
    return []
  }

  return [
    { method: 'cash' as const, price: product.price },
    ...(transferPrice !== null ? [{ method: 'transfer' as const, price: transferPrice }] : []),
    ...(cardPrice !== null ? [{ method: 'card' as const, price: cardPrice }] : []),
  ]
}

/** Whole-number discount percentage of `price` against `compareAtPrice`, or null when there is no real discount. */
export function getDiscountPercentage(price: number, compareAtPrice: number | null | undefined): number | null {
  if (!compareAtPrice || !Number.isFinite(compareAtPrice) || compareAtPrice <= price || compareAtPrice <= 0) {
    return null
  }

  const percentage = Math.round(((compareAtPrice - price) / compareAtPrice) * 100)

  return percentage > 0 ? percentage : null
}

/**
 * Payload field validator: an alternative price is optional, but when set it can never undercut the cash price.
 */
export function validateAlternativePrice(value: unknown, cashPrice: unknown): true | string {
  const normalized = normalizeOptionalPrice(value as number | string | null | undefined)

  if (normalized === null) {
    return true
  }

  if (normalized < 0) {
    return 'El precio debe ser mayor o igual a 0'
  }

  const cash = normalizeOptionalPrice(cashPrice as number | string | null | undefined)

  if (cash !== null && normalized < cash) {
    return 'El precio no puede ser menor al precio efectivo'
  }

  return true
}
