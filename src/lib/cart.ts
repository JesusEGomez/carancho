import { getLineTotal, sumMoney } from '@/lib/pricing'

export type CartProductSnapshot = {
  featuredImageAlt?: string | null
  featuredImageUrl?: string | null
  id: number
  name: string
  price: number
  slug: string
  stock: number
}

export type CartLine = {
  product: CartProductSnapshot
  quantity: number
}

export type FreshProductPrice = {
  id: number
  price: number
  stock: number
}

/**
 * Replaces the price and stock snapshots saved when each item was added with current values,
 * so a cart saved before a price change still shows the current total.
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
        price: current.price,
        stock: current.stock,
      },
    }
  })
}

/**
 * Display-only estimate from the cart snapshot; the server recomputes every price from the database.
 * Every payment method charges `price`, so there is a single total.
 */
export function getCartTotal(items: CartLine[]) {
  return sumMoney(items.map((item) => getLineTotal(item.product.price, item.quantity)))
}
