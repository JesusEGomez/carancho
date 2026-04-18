import { formatCurrency } from '@/lib/formatCurrency'

type CheckoutMessageItem = {
  lineTotal: number
  productName: string
  quantity: number
  unitPrice: number
}

type CheckoutMessageOrder = {
  customerEmail: string
  customerName: string
  customerPhone: string
  deliveryAddress: string
  deliveryCity: string
  deliveryNotes?: string | null
  id: number
  items: CheckoutMessageItem[]
  total: number
}

export function normalizeWhatsAppPhone(phone: string) {
  return phone.replace(/\D/g, '')
}

export function createWhatsAppUrl(args: { message: string; phone: string }) {
  const normalizedPhone = normalizeWhatsAppPhone(args.phone)
  const encodedMessage = encodeURIComponent(args.message)

  return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`
}

export function buildWhatsAppCheckoutMessage(order: CheckoutMessageOrder) {
  const money = (value: number) => formatCurrency(value).replace(/\u00A0/g, '')

  const lines = [
    `Pedido #${order.id}`,
    '',
    `Cliente: ${order.customerName}`,
    `Telefono: ${order.customerPhone}`,
    `Email: ${order.customerEmail}`,
    `Ciudad: ${order.deliveryCity}`,
    `Direccion: ${order.deliveryAddress}`,
    ...(order.deliveryNotes ? [`Notas: ${order.deliveryNotes}`] : []),
    '',
    'Productos:',
    ...order.items.map((item) => `- ${item.productName}: ${item.quantity} x ${money(item.unitPrice)} = ${money(item.lineTotal)}`),
    '',
    `Total: ${money(order.total)}`,
  ]

  return lines.join('\n')
}
