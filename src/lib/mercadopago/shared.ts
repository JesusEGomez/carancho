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

export function verifyMercadoPagoWebhookSignature(args: {
  dataId: string
  requestId: string
  secret: string
  signatureHeader: string | null
}) {
  const parts = parseMercadoPagoSignatureHeader(args.signatureHeader)

  if (!parts) {
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
    notification_url: input.notificationUrl,
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

export function getLatestMerchantOrderPayment(merchantOrder: MerchantOrderResponse) {
  const payments = merchantOrder.payments?.filter((payment) => typeof payment.id === 'number') ?? []

  return payments.sort((left, right) => {
    const leftDate = new Date(left.last_modified ?? left.date_created ?? 0).getTime()
    const rightDate = new Date(right.last_modified ?? right.date_created ?? 0).getTime()
    return rightDate - leftDate
  })[0]
}

export function getNotificationDataId(requestUrl: URL) {
  return requestUrl.searchParams.get('data.id') ?? requestUrl.searchParams.get('id')
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

export function parseMercadoPagoStatusQuery(searchParams: URLSearchParams): MercadoPagoStatusQuery {
  return {
    collectionId: searchParams.get('collection_id'),
    collectionStatus: searchParams.get('collection_status'),
    externalReference: searchParams.get('external_reference'),
    merchantOrderId: searchParams.get('merchant_order_id'),
    paymentId: searchParams.get('payment_id'),
    preferenceId: searchParams.get('preference_id'),
    status: searchParams.get('status'),
  }
}
