import crypto from 'crypto'

import type { PreferenceRequest, PreferenceResponse } from 'mercadopago/dist/clients/preference/commonTypes'
import type { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes'
import type { MerchantOrderResponse } from 'mercadopago/dist/clients/merchantOrder/commonTypes'

export type MercadoPagoCheckoutStatus = 'success' | 'pending' | 'failure'

export type MercadoPagoStatusQuery = {
  collectionId?: string | null
  collectionStatus?: string | null
  externalReference?: string | null
  merchantOrderId?: string | null
  paymentId?: string | null
  preferenceId?: string | null
  status?: string | null
}

export type MercadoPagoResolvedStatus = {
  orderStatus: 'pending_payment' | 'confirmed' | 'fulfillment_blocked' | 'cancelled'
  paymentStatus: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back'
  providerPaymentId?: string
  providerRawStatus: string
}

type SignatureParts = {
  ts: string
  v1: string
}

export function parseMercadoPagoSignatureHeader(signatureHeader: string | null): SignatureParts | null {
  if (!signatureHeader) {
    return null
  }

  const entries = signatureHeader.split(',')
  let ts = ''
  let v1 = ''

  for (const entry of entries) {
    const [rawKey, rawValue] = entry.split('=')
    const key = rawKey?.trim()
    const value = rawValue?.trim()

    if (!key || !value) {
      continue
    }

    if (key === 'ts') {
      ts = value
    }

    if (key === 'v1') {
      v1 = value
    }
  }

  if (!ts || !v1) {
    return null
  }

  return { ts, v1 }
}

export function buildMercadoPagoWebhookManifest(dataId: string, requestId: string, timestamp: string) {
  return `id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`
}

const DEFAULT_SIGNATURE_TOLERANCE_MS = 5 * 60 * 1000

function isSignatureTimestampFresh(ts: string, toleranceMs: number) {
  const parsed = Number(ts)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return false
  }

  // Mercado Pago sends ts in seconds or milliseconds depending on the notification source
  const timestampMs = parsed < 1e12 ? parsed * 1000 : parsed

  return Math.abs(Date.now() - timestampMs) <= toleranceMs
}

export function verifyMercadoPagoWebhookSignature(args: {
  dataId: string
  requestId: string
  secret: string
  signatureHeader: string | null
  toleranceMs?: number
}) {
  const parts = parseMercadoPagoSignatureHeader(args.signatureHeader)

  if (!parts) {
    return false
  }

  if (!isSignatureTimestampFresh(parts.ts, args.toleranceMs ?? DEFAULT_SIGNATURE_TOLERANCE_MS)) {
    return false
  }

  const manifest = buildMercadoPagoWebhookManifest(args.dataId, args.requestId, parts.ts)
  const digest = crypto.createHmac('sha256', args.secret).update(manifest).digest('hex')
  const left = Buffer.from(digest)
  const right = Buffer.from(parts.v1)

  if (left.length !== right.length) {
    return false
  }

  return crypto.timingSafeEqual(left, right)
}

export function buildMercadoPagoWebhookDebug(args: {
  dataId: string
  requestId: string
  secret: string
  signatureHeader: string | null
}) {
  const parts = parseMercadoPagoSignatureHeader(args.signatureHeader)

  if (!parts) {
    return {
      manifest: null,
      parsedSignature: null,
      expectedSignature: null,
    }
  }

  const manifest = buildMercadoPagoWebhookManifest(args.dataId, args.requestId, parts.ts)
  const expectedSignature = crypto.createHmac('sha256', args.secret).update(manifest).digest('hex')

  return {
    manifest,
    parsedSignature: parts,
    expectedSignature,
  }
}

export function splitCustomerName(fullName: string) {
  const normalized = fullName.trim().replace(/\s+/g, ' ')

  if (!normalized) {
    return { firstName: '', lastName: '' }
  }

  const parts = normalized.split(' ')
  const [firstName, ...rest] = parts

  return {
    firstName,
    lastName: rest.join(' '),
  }
}

const ARGENTINA_COUNTRY_CODE = '54'
const ARGENTINA_NATIONAL_NUMBER_LENGTH = 10

/**
 * Normalizes an Argentine phone number to its national form (area code +
 * subscriber number, without the country code, the mobile "9" or the trunk
 * "0"). Area codes vary between 2 and 4 digits, so the result is not split.
 */
export function normalizeArgentinePhoneNumber(phone: string) {
  let digits = phone.replace(/\D/g, '')

  if (digits.startsWith(ARGENTINA_COUNTRY_CODE) && digits.length > ARGENTINA_NATIONAL_NUMBER_LENGTH + 1) {
    digits = digits.slice(ARGENTINA_COUNTRY_CODE.length)
  }

  if (digits.startsWith('9') && digits.length === ARGENTINA_NATIONAL_NUMBER_LENGTH + 1) {
    digits = digits.slice(1)
  }

  return digits.replace(/^0+/, '')
}

export function getMercadoPagoInitPoint(preference: PreferenceResponse) {
  if (process.env.NODE_ENV !== 'production' && preference.sandbox_init_point) {
    return preference.sandbox_init_point
  }

  return preference.init_point ?? preference.sandbox_init_point ?? null
}

export function buildPreferenceRequest(input: {
  description?: string
  externalReference: string
  items: PreferenceRequest['items']
  notificationUrl: string
  payer: PreferenceRequest['payer']
  publicBaseUrl: string
  metadata: Record<string, string | number>
  statementDescriptor?: string
}) {
  const base = input.publicBaseUrl.replace(/\/$/, '')
  // IPN notifications cannot be validated with the webhook secret, so ask
  // Mercado Pago to send only signed Webhooks for this preference.
  const notificationUrl = new URL(input.notificationUrl)
  notificationUrl.searchParams.set('source_news', 'webhooks')

  return {
    auto_return: 'approved',
    back_urls: {
      failure: `${base}/checkout/retorno/failure/${input.metadata.orderId}?token=${input.metadata.confirmationToken}`,
      pending: `${base}/checkout/retorno/pending/${input.metadata.orderId}?token=${input.metadata.confirmationToken}`,
      success: `${base}/checkout/retorno/success/${input.metadata.orderId}?token=${input.metadata.confirmationToken}`,
    },
    external_reference: input.externalReference,
    items: input.items,
    metadata: input.metadata,
    notification_url: notificationUrl.toString(),
    payer: input.payer,
    statement_descriptor: input.statementDescriptor,
  } satisfies PreferenceRequest
}

export function mapMercadoPagoPayment(payment: PaymentResponse): MercadoPagoResolvedStatus {
  const status = payment.status ?? 'pending'
  const rawStatus = payment.status_detail ? `${status}:${payment.status_detail}` : status
  const providerPaymentId = typeof payment.id === 'number' ? String(payment.id) : undefined

  if (status === 'approved') {
    return {
      orderStatus: 'confirmed',
      paymentStatus: 'approved',
      providerPaymentId,
      providerRawStatus: rawStatus,
    }
  }

  if (status === 'cancelled' || status === 'rejected' || status === 'refunded' || status === 'charged_back') {
    return {
      orderStatus: 'cancelled',
      paymentStatus:
        status === 'cancelled'
          ? 'cancelled'
          : status === 'refunded'
            ? 'refunded'
            : status === 'charged_back'
              ? 'charged_back'
              : 'rejected',
      providerPaymentId,
      providerRawStatus: rawStatus,
    }
  }

  return {
    orderStatus: 'pending_payment',
    paymentStatus: 'pending',
    providerPaymentId,
    providerRawStatus: rawStatus,
  }
}

// Orders.currency is required with this default; used only if a legacy order lacks it.
const DEFAULT_ORDER_CURRENCY = 'ARS'

export type MercadoPagoPaymentMatchOrder = {
  currency?: string | null
  externalReference?: string | null
  paymentProvider?: string | null
  total: number
}

function toCents(amount: number) {
  return Math.round(amount * 100)
}

/**
 * Returns the reason a Mercado Pago payment must not be applied to an order,
 * or null when the payment belongs to it. Payment ids reach the server from
 * untrusted query strings, so a payment for another (cheaper) order must never
 * settle this one.
 */
export function getPaymentOrderMismatch(
  order: MercadoPagoPaymentMatchOrder,
  payment: Pick<PaymentResponse, 'currency_id' | 'external_reference' | 'transaction_amount'>,
): string | null {
  if (order.paymentProvider !== 'mercadopago') {
    return 'order_not_mercadopago'
  }

  if (!order.externalReference || payment.external_reference !== order.externalReference) {
    return 'external_reference_mismatch'
  }

  if (
    typeof payment.transaction_amount !== 'number' ||
    !Number.isFinite(payment.transaction_amount) ||
    toCents(payment.transaction_amount) !== toCents(order.total)
  ) {
    return 'amount_mismatch'
  }

  const expectedCurrency = order.currency || DEFAULT_ORDER_CURRENCY

  if (payment.currency_id !== expectedCurrency) {
    return 'currency_mismatch'
  }

  return null
}

export function getLatestMerchantOrderPayment(merchantOrder: MerchantOrderResponse) {
  const payments = merchantOrder.payments?.filter((payment) => typeof payment.id === 'number') ?? []
  const sorted = payments.sort((left, right) => {
    const leftDate = new Date(left.last_modified ?? left.date_created ?? 0).getTime()
    const rightDate = new Date(right.last_modified ?? right.date_created ?? 0).getTime()
    return rightDate - leftDate
  })

  // An approved payment settles the order even when a later attempt was rejected
  return sorted.find((payment) => payment.status === 'approved') ?? sorted[0]
}

export function getNotificationDataId(requestUrl: URL) {
  return requestUrl.searchParams.get('data.id') ?? requestUrl.searchParams.get('id')
}

const MERCHANT_ORDER_TOPICS = new Set(['merchant_order', 'topic_merchant_order_wh'])

/**
 * Maps the notification topic to the resource it refers to. Webhooks send
 * "topic_merchant_order_wh" while IPN uses "merchant_order".
 */
export function normalizeNotificationTopic(topic: string) {
  if (topic === 'payment') {
    return 'payment' as const
  }

  if (MERCHANT_ORDER_TOPICS.has(topic)) {
    return 'merchant_order' as const
  }

  return null
}

export function getNotificationType(requestUrl: URL, body: unknown) {
  if (
    body &&
    typeof body === 'object' &&
    'type' in body &&
    typeof body.type === 'string' &&
    body.type.length > 0
  ) {
    return body.type
  }

  return requestUrl.searchParams.get('type') ?? requestUrl.searchParams.get('topic')
}

/**
 * Returns a Mercado Pago numeric id, or null when it is absent. Return URLs
 * carry the literal "null" when the buyer leaves the checkout without paying.
 */
export function parseMercadoPagoId(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed && /^\d+$/.test(trimmed) ? trimmed : null
}

export function parseMercadoPagoStatusQuery(searchParams: URLSearchParams): MercadoPagoStatusQuery {
  return {
    collectionId: parseMercadoPagoId(searchParams.get('collection_id')),
    collectionStatus: searchParams.get('collection_status'),
    externalReference: searchParams.get('external_reference'),
    merchantOrderId: parseMercadoPagoId(searchParams.get('merchant_order_id')),
    paymentId: parseMercadoPagoId(searchParams.get('payment_id')),
    preferenceId: searchParams.get('preference_id'),
    status: searchParams.get('status'),
  }
}
