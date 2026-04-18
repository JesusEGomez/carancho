export const CHECKOUT_ERROR_CODES = {
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  PAYMENT_UNAVAILABLE: 'PAYMENT_UNAVAILABLE',
  PRODUCT_UNAVAILABLE: 'PRODUCT_UNAVAILABLE',
  WHATSAPP_UNAVAILABLE: 'WHATSAPP_UNAVAILABLE',
} as const

export type CheckoutErrorCode = (typeof CHECKOUT_ERROR_CODES)[keyof typeof CHECKOUT_ERROR_CODES]

export class CheckoutDomainError extends Error {
  code: CheckoutErrorCode
  meta?: Record<string, string>
  status: number

  constructor(code: CheckoutErrorCode, message: string, status = 400, meta?: Record<string, string>) {
    super(message)
    this.code = code
    this.meta = meta
    this.name = 'CheckoutDomainError'
    this.status = status
  }
}

export function createOutOfStockError(productName: string) {
  return new CheckoutDomainError(
    CHECKOUT_ERROR_CODES.OUT_OF_STOCK,
    `No hay stock suficiente para ${productName}.`,
    409,
    {
      productName,
    },
  )
}

export function createUnavailableProductError(productLabel: string) {
  return new CheckoutDomainError(
    CHECKOUT_ERROR_CODES.PRODUCT_UNAVAILABLE,
    `El producto ${productLabel} no está disponible para confirmar la orden.`,
    409,
    {
      productName: productLabel,
    },
  )
}

export function createPaymentUnavailableError() {
  return new CheckoutDomainError(
    CHECKOUT_ERROR_CODES.PAYMENT_UNAVAILABLE,
    'El medio de pago no está disponible en este momento. Intentá nuevamente en unos minutos.',
    503,
  )
}

export function createWhatsAppUnavailableError() {
  return new CheckoutDomainError(
    CHECKOUT_ERROR_CODES.WHATSAPP_UNAVAILABLE,
    'WhatsApp no está disponible en este momento. Verificá el teléfono de la tienda o intentá nuevamente más tarde.',
    503,
  )
}
