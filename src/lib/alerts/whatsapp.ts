import { formatCurrency } from '@/lib/formatCurrency'
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from '@/lib/pricing'

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
  paymentMethod?: PaymentMethod | null
  total: number
}

const ARGENTINA_COUNTRY_CODE = '54'
const ARGENTINA_MOBILE_PREFIX = '9'
const ARGENTINA_NATIONAL_NUMBER_LENGTH = 10

const stripTrunkZero = (value: string) => value.replace(/^0/, '')

const toArgentineMobile = (nationalNumber: string) =>
  ARGENTINA_COUNTRY_CODE + ARGENTINA_MOBILE_PREFIX + nationalNumber

/**
 * Normalizes a phone number into the international format wa.me expects.
 *
 * Assumes Argentina for numbers without a country code: a 10-digit national number
 * (optionally with the trunk "0") gets the "549" mobile prefix. Numbers that already
 * carry "549" are kept, and "54" without the mobile "9" gets it inserted.
 * Any other input (other countries, the local "15" mobile prefix) is returned as digits.
 */
export function normalizeWhatsAppPhone(phone: string) {
  const digits = phone.replace(/\D/g, '').replace(/^00/, '')

  if (digits.startsWith(ARGENTINA_COUNTRY_CODE + ARGENTINA_MOBILE_PREFIX)) {
    return digits
  }

  const withoutCountryCode = digits.startsWith(ARGENTINA_COUNTRY_CODE)
    ? stripTrunkZero(digits.slice(ARGENTINA_COUNTRY_CODE.length))
    : null

  if (withoutCountryCode?.length === ARGENTINA_NATIONAL_NUMBER_LENGTH) {
    return toArgentineMobile(withoutCountryCode)
  }

  const nationalNumber = stripTrunkZero(digits)

  if (nationalNumber.length === ARGENTINA_NATIONAL_NUMBER_LENGTH) {
    return toArgentineMobile(nationalNumber)
  }

  return digits
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
    ...(order.paymentMethod ? [`Medio de pago: ${PAYMENT_METHOD_LABELS[order.paymentMethod]}`] : []),
    `Total: ${money(order.total)}`,
  ]

  return lines.join('\n')
}
