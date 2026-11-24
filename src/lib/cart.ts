import { getUnitPrice, type PaymentMethod } from '@/lib/pricing'

export type CartProductSnapshot = {
  cardPrice?: number | null
  featuredImageAlt?: string | null
  featuredImageUrl?: string | null
  id: number
  name: string
  price: number
  slug: string
  stock: number
  transferPrice?: number | null
}

export type CartLine = {
  product: CartProductSnapshot
  quantity: number
}

export type FreshProductPrice = {
  cardPrice?: number | null
  id: number
  price: number
  stock: number
  transferPrice?: number | null
}

/**
 * Replaces the price and stock snapshots saved when each item was added with current values,
 * so carts saved before alternative prices existed still show the right per-method totals.
 * Items missing from `fresh` (unpublished or deleted) are kept and rejected by the server at checkout.
 */
export function applyFreshPrices(items: CartLine[], fresh: FreshProductPrice[]): CartLine[] {
  const freshById = new Map(fresh.map((product) => [product.id, product]))

  return items.map((item) => {
    const current = freshById.get(item.product.id)

    if (!current) {
      return item
    }

    return {
      ...item,
      product: {
        ...item.product,
        cardPrice: current.cardPrice ?? null,
        price: current.price,
        stock: current.stock,
        transferPrice: current.transferPrice ?? null,
      },
    }
  })
}

/** Display-only estimate from the cart snapshot; the server recomputes every price from the database. */
export function getCartTotal(items: CartLine[], method: PaymentMethod) {
  return items.reduce((sum, item) => sum + getUnitPrice(item.product, method) * item.quantity, 0)
}

export function getCartTotals(items: CartLine[]): Record<PaymentMethod, number> {
  return {
    card: getCartTotal(items, 'card'),
    cash: getCartTotal(items, 'cash'),
    transfer: getCartTotal(items, 'transfer'),
  }
}
