import type { CartLine } from '@/lib/cart'
import type { CheckoutFormData, CreateOrderRequest } from '@/lib/checkout-schema'

export function buildCreateOrderRequest(items: CartLine[], customer: CheckoutFormData): CreateOrderRequest {
  return {
    customer,
    items: items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    })),
  }
}
