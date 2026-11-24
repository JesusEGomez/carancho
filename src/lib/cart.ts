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
