import { z } from 'zod'

export const cartItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(99),
})

export const checkoutFormSchema = z.object({
  customerEmail: z.string().trim().email('Ingresá un email válido'),
  customerName: z.string().trim().min(3, 'Ingresá tu nombre completo'),
  customerPhone: z.string().trim().min(6, 'Ingresá un teléfono válido'),
  deliveryAddress: z.string().trim().min(8, 'Ingresá una dirección válida'),
  deliveryCity: z.string().trim().min(2, 'Ingresá una ciudad'),
  deliveryNotes: z.string().trim().max(300, 'Las notas no pueden superar 300 caracteres').optional().or(z.literal('')),
})

export const createOrderRequestSchema = z.object({
  customer: checkoutFormSchema,
  items: z.array(cartItemSchema).min(1, 'El carrito no puede estar vacío'),
})

export type CartItem = z.infer<typeof cartItemSchema>
export type CheckoutFormData = z.infer<typeof checkoutFormSchema>
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>
export type CreateOrderResponse = {
  confirmationToken: string
  orderId: number
}
