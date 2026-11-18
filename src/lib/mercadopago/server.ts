import 'server-only'

import { randomUUID } from 'crypto'
import { MercadoPagoConfig, MerchantOrder, Payment, Preference } from 'mercadopago'
import type { PreferenceRequest, PreferenceResponse } from 'mercadopago/dist/clients/preference/commonTypes'
import type { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes'

import { createPaymentUnavailableError, CheckoutDomainError } from '@/lib/checkout-errors'
import { getPayloadClient } from '@/lib/payload'
import type { CreateOrderRequest } from '@/lib/checkout-schema'
import { buildValidatedOrderData, getOrderConfirmation } from '@/lib/checkout'
import { getAdminNotifier } from '@/lib/notifications'
import {
  buildMercadoPagoWebhookDebug,
  buildPreferenceRequest,
  getLatestMerchantOrderPayment,
  getMercadoPagoInitPoint,
  getNotificationDataId,
  getNotificationType,
  getPaymentOrderMismatch,
  mapMercadoPagoPayment,
  normalizeArgentinePhoneNumber,
  normalizeNotificationTopic,
  parseMercadoPagoId,
  splitCustomerName,
  verifyMercadoPagoWebhookSignature,
} from '@/lib/mercadopago/shared'

type MercadoPagoOrder = Awaited<ReturnType<typeof getOrderConfirmation>>

function getMercadoPagoEnv() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim()
  const publicBaseUrl = process.env.MERCADOPAGO_PUBLIC_BASE_URL?.trim()
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim()
  const statementDescriptor = process.env.MERCADOPAGO_STATEMENT_DESCRIPTOR?.trim()

  if (!accessToken || !publicBaseUrl) {
    throw createPaymentUnavailableError()
  }

  return {
    accessToken,
    publicBaseUrl: publicBaseUrl.replace(/\/$/, ''),
    statementDescriptor,
    webhookSecret,
  }
}

function getMercadoPagoClient() {
  const env = getMercadoPagoEnv()

  return new MercadoPagoConfig({
    accessToken: env.accessToken,
    options: {
      timeout: 5000,
    },
  })
}

function getPaymentClient() {
  return new Payment(getMercadoPagoClient())
}

function getPreferenceClient() {
  return new Preference(getMercadoPagoClient())
}

function getMerchantOrderClient() {
  return new MerchantOrder(getMercadoPagoClient())
}

function buildPreferenceItems(order: NonNullable<MercadoPagoOrder>) {
  return (
    order.items?.map((item) => ({
      category_id: 'others',
      currency_id: order.currency,
      description: item.productName,
      id: String(typeof item.product === 'number' ? item.product : item.product.id),
      quantity: item.quantity,
      title: item.productName,
      unit_price: item.unitPrice,
    })) ?? []
  )
}

function buildPreferencePayer(order: NonNullable<MercadoPagoOrder>): PreferenceRequest['payer'] {
  const { firstName, lastName } = splitCustomerName(order.customerName)
  // Argentine area codes have 2 to 4 digits and cannot be split reliably,
  // so the whole national number goes in `number` and area_code is omitted.
  const phoneNumber = normalizeArgentinePhoneNumber(order.customerPhone)

  return {
    email: order.customerEmail,
    name: firstName || order.customerName,
    phone: phoneNumber ? { number: phoneNumber } : undefined,
    surname: lastName || undefined,
  }
}

function createExternalReference() {
  return `order-${randomUUID()}`
}

function notifyAdminOfPaymentMismatch(
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  details: { orderId: number; paymentId?: string; reason: string },
) {
  // Fire-and-forget: an alert failure must never affect payment processing.
  void getAdminNotifier(payload)
    .then((notifier) =>
      notifier.notify({
        message: [
          'Pago de Mercado Pago requiere revisión manual',
          `Pedido #${details.orderId}`,
          `Pago #${details.paymentId ?? 'desconocido'} - motivo: ${details.reason}`,
        ].join('\n'),
        orderId: details.orderId,
        subject: `Pago requiere revisión manual - Pedido #${details.orderId}`,
      }),
    )
    .catch((error) => {
      console.error('Failed to send Mercado Pago payment mismatch alert', {
        message: error instanceof Error ? error.message : 'unknown_error',
        orderId: details.orderId,
      })
    })
}

// The SDK rethrows the Mercado Pago JSON error body, e.g. { error: 'not_found', status: 404 }.
function isMercadoPagoNotFoundError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    Number((error as { status: unknown }).status) === 404
  )
}

/** Resolves to null when Mercado Pago answers 404; any other failure is rethrown. */
async function getUnlessNotFound<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request
  } catch (error) {
    if (isMercadoPagoNotFoundError(error)) {
      return null
    }

    throw error
  }
}

async function applyPaymentStateToOrder(args: {
  order: NonNullable<MercadoPagoOrder>
  payment: PaymentResponse
  // Only the signed webhook path alerts the admin: the public status route
  // can be replayed at will and must not be able to spam the inbox.
  notifyOnMismatch?: boolean
}) {
  const mapped = mapMercadoPagoPayment(args.payment)
  const mismatch = getPaymentOrderMismatch(args.order, args.payment)
  const payload = await getPayloadClient()

  if (mismatch) {
    // The order status is intentionally left untouched: a human must review it.
    console.error('Ignoring Mercado Pago payment that does not belong to the order; needs manual review', {
      orderCurrency: args.order.currency,
      orderExternalReference: args.order.externalReference,
      orderId: args.order.id,
      orderTotal: args.order.total,
      paymentAmount: args.payment.transaction_amount,
      paymentCurrency: args.payment.currency_id,
      paymentExternalReference: args.payment.external_reference,
      paymentId: mapped.providerPaymentId,
      reason: mismatch,
    })
    if (args.notifyOnMismatch) {
      notifyAdminOfPaymentMismatch(payload, {
        orderId: args.order.id,
        paymentId: mapped.providerPaymentId,
        reason: mismatch,
      })
    }
    return args.order
  }

  // Notifications can arrive out of order: never downgrade a paid order
  // unless the payment moved to a genuine post-approval state.
  const orderIsPaid = args.order.status === 'confirmed' || args.order.status === 'fulfillment_blocked'
  const isPostApprovalUpdate =
    mapped.orderStatus === 'confirmed' ||
    mapped.paymentStatus === 'refunded' ||
    mapped.paymentStatus === 'charged_back'

  if (orderIsPaid && !isPostApprovalUpdate) {
    console.warn('Ignoring Mercado Pago payment state that would downgrade a paid order', {
      currentStatus: args.order.status,
      incomingStatus: mapped.orderStatus,
      orderId: args.order.id,
      paymentId: mapped.providerPaymentId,
      rawStatus: mapped.providerRawStatus,
    })
    return args.order
  }

  try {
    return await payload.update({
      collection: 'orders',
      id: args.order.id,
      data: {
        paymentStatus: mapped.paymentStatus,
        providerPaymentId: mapped.providerPaymentId,
        providerRawStatus: mapped.providerRawStatus,
        status: mapped.orderStatus,
      },
    })
  } catch (error) {
    if (
      mapped.orderStatus === 'confirmed' &&
      error instanceof CheckoutDomainError &&
      error.code === 'OUT_OF_STOCK'
    ) {
      console.error('Mercado Pago payment approved but stock confirmation failed', {
        orderId: args.order.id,
        paymentId: mapped.providerPaymentId,
        rawStatus: mapped.providerRawStatus,
      })

      return payload.update({
        collection: 'orders',
        id: args.order.id,
        data: {
          paymentStatus: mapped.paymentStatus,
          providerPaymentId: mapped.providerPaymentId,
          providerRawStatus: `${mapped.providerRawStatus}:stock_sync_failed`,
          status: 'fulfillment_blocked',
        },
      })
    }

    throw error
  }
}

export async function createMercadoPagoCheckout(input: CreateOrderRequest) {
  const payload = await getPayloadClient()
  const env = getMercadoPagoEnv()
  const orderData = await buildValidatedOrderData(input)
  const externalReference = createExternalReference()

  const order = await payload.create({
    collection: 'orders',
    data: {
      ...orderData,
      externalReference,
      paymentProvider: 'mercadopago',
      paymentStatus: 'pending',
      status: 'pending_payment',
    },
  })

  const preferenceClient = getPreferenceClient()
  const preferenceBody = buildPreferenceRequest({
    externalReference,
    items: buildPreferenceItems(order),
    metadata: {
      confirmationToken: order.confirmationToken,
      orderId: order.id,
    },
    notificationUrl: `${env.publicBaseUrl}/api/payments/mercadopago/webhook`,
    payer: buildPreferencePayer(order),
    publicBaseUrl: env.publicBaseUrl,
    statementDescriptor: env.statementDescriptor,
  })

  const preference = await preferenceClient.create({
    body: preferenceBody,
    requestOptions: {
      idempotencyKey: `${order.id}:${externalReference}`,
    },
  })
  const initPoint = getMercadoPagoInitPoint(preference)

  if (!preference.id || !initPoint) {
    console.error('Mercado Pago preference response missing identifiers', {
      orderId: order.id,
      preference,
    })
    throw createPaymentUnavailableError()
  }

  await payload.update({
    collection: 'orders',
    id: order.id,
    data: {
      providerPreferenceId: preference.id,
    },
  })

  return {
    confirmationToken: order.confirmationToken,
    initPoint,
    orderId: order.id,
    preferenceId: preference.id,
  }
}

export async function reconcileMercadoPagoOrder(args: {
  merchantOrderId?: string | null
  orderId: number
  paymentId?: string | null
  preferenceId?: string | null
  token: string
}) {
  const order = await getOrderConfirmation(args.orderId, args.token)

  if (!order) {
    return null
  }

  if (args.preferenceId && order.providerPreferenceId && args.preferenceId !== order.providerPreferenceId) {
    console.warn('Mercado Pago preference mismatch during checkout return', {
      expected: order.providerPreferenceId,
      orderId: order.id,
      received: args.preferenceId,
    })
  }

  const paymentId = parseMercadoPagoId(args.paymentId)
  const merchantOrderId = parseMercadoPagoId(args.merchantOrderId)

  // Return URL ids are untrusted: an unknown or foreign id (MP 404) leaves
  // the order unchanged instead of failing the status request.
  if (paymentId) {
    const paymentClient = getPaymentClient()
    const payment = await getUnlessNotFound(paymentClient.get({ id: Number(paymentId) }))

    if (!payment) {
      console.warn('Mercado Pago payment from checkout return was not found', {
        orderId: order.id,
        paymentId,
      })
      return order
    }

    return applyPaymentStateToOrder({ order, payment })
  }

  if (merchantOrderId) {
    const merchantOrderClient = getMerchantOrderClient()
    const merchantOrder = await getUnlessNotFound(
      merchantOrderClient.get({
        merchantOrderId: Number(merchantOrderId),
      }),
    )

    if (!merchantOrder) {
      console.warn('Mercado Pago merchant order from checkout return was not found', {
        merchantOrderId,
        orderId: order.id,
      })
      return order
    }

    const latestPayment = getLatestMerchantOrderPayment(merchantOrder)

    if (latestPayment?.id) {
      const paymentClient = getPaymentClient()
      const payment = await getUnlessNotFound(paymentClient.get({ id: latestPayment.id }))

      if (!payment) {
        console.warn('Mercado Pago payment from merchant order was not found', {
          merchantOrderId,
          orderId: order.id,
          paymentId: latestPayment.id,
        })
        return order
      }

      return applyPaymentStateToOrder({ order, payment })
    }
  }

  return order
}

export async function handleMercadoPagoWebhook(args: {
  body: unknown
  requestHeaders: Headers
  requestUrl: URL
}) {
  const env = getMercadoPagoEnv()
  const dataId = getNotificationDataId(args.requestUrl)
  const topic = getNotificationType(args.requestUrl, args.body)
  const requestId = args.requestHeaders.get('x-request-id')
  const signatureHeader = args.requestHeaders.get('x-signature')

  if (!dataId || !topic) {
    console.warn('Ignoring Mercado Pago webhook with missing metadata', {
      dataId,
      requestId,
      topic,
    })
    return {
      processed: false,
      reason: 'missing_metadata',
      status: 400,
    } as const
  }

  if (!env.webhookSecret) {
    console.error('Mercado Pago webhook secret is not configured', { dataId, topic })
    return {
      processed: false,
      reason: 'webhook_secret_not_configured',
      status: 500,
    } as const
  }

  // IPN notifications carry no x-signature/x-request-id and cannot be
  // validated with the secret, so they are rejected here. Preferences set
  // source_news=webhooks on notification_url so Mercado Pago sends only
  // signed Webhooks; older preferences may still send IPN and get a 401.
  if (!requestId || !signatureHeader) {
    console.warn('Rejected unsigned Mercado Pago notification', {
      dataId,
      hasRequestId: Boolean(requestId),
      hasSignature: Boolean(signatureHeader),
      topic,
    })
    return {
      processed: false,
      reason: 'missing_signature',
      status: 401,
    } as const
  }

  const isValid = verifyMercadoPagoWebhookSignature({
    dataId,
    requestId,
    secret: env.webhookSecret,
    signatureHeader,
  })

  if (!isValid) {
    const debug = buildMercadoPagoWebhookDebug({
      dataId,
      requestId,
      secret: env.webhookSecret,
      signatureHeader,
    })

    // Never log the expected HMAC: it is the valid signature for this request.
    console.warn('Rejected Mercado Pago webhook with invalid signature', {
      dataId,
      manifest: debug.manifest,
      parsedSignature: debug.parsedSignature,
      requestId,
      topic,
    })
    return {
      processed: false,
      reason: 'invalid_signature',
      status: 401,
    } as const
  }

  // From here on, permanent outcomes are acknowledged with 200: Mercado Pago
  // retries any other status every 15 minutes. Transient failures (API or
  // database errors) throw so the route answers 500 and Mercado Pago retries.
  const resource = normalizeNotificationTopic(topic)

  if (resource === 'payment') {
    const paymentClient = getPaymentClient()
    const payment = await getUnlessNotFound(paymentClient.get({ id: Number(dataId) }))

    if (!payment) {
      // e.g. the panel's "simulate notification" or a resource from another account.
      console.warn('Mercado Pago payment from notification was not found', { dataId })
      return {
        processed: false,
        reason: 'payment_not_found',
        status: 200,
      } as const
    }

    const externalReference = payment.external_reference

    if (!externalReference) {
      console.warn('Mercado Pago payment notification without external reference', {
        paymentId: payment.id,
      })
      return {
        processed: false,
        reason: 'missing_external_reference',
        status: 200,
      } as const
    }

    const payload = await getPayloadClient()
    const orderResult = await payload.find({
      collection: 'orders',
      limit: 1,
      where: {
        externalReference: {
          equals: externalReference,
        },
      },
    })
    const order = orderResult.docs[0] ?? null

    if (!order) {
      // Likely a payment from another integration on the same account.
      console.warn('Mercado Pago payment notification did not match local order', {
        externalReference,
        paymentId: payment.id,
      })
      return {
        processed: false,
        reason: 'order_not_found',
        status: 200,
      } as const
    }

    await applyPaymentStateToOrder({ notifyOnMismatch: true, order, payment })
    return { processed: true } as const
  }

  if (resource === 'merchant_order') {
    const merchantOrderClient = getMerchantOrderClient()
    const merchantOrder = await getUnlessNotFound(
      merchantOrderClient.get({
        merchantOrderId: Number(dataId),
      }),
    )

    if (!merchantOrder) {
      console.warn('Mercado Pago merchant order from notification was not found', { dataId })
      return {
        processed: false,
        reason: 'merchant_order_not_found',
        status: 200,
      } as const
    }

    const externalReference = merchantOrder.external_reference

    if (!externalReference) {
      console.warn('Mercado Pago merchant order notification without external reference', {
        merchantOrderId: merchantOrder.id,
      })
      return {
        processed: false,
        reason: 'missing_external_reference',
        status: 200,
      } as const
    }

    const payload = await getPayloadClient()
    const orderResult = await payload.find({
      collection: 'orders',
      limit: 1,
      where: {
        externalReference: {
          equals: externalReference,
        },
      },
    })
    const order = orderResult.docs[0] ?? null
    const latestPayment = getLatestMerchantOrderPayment(merchantOrder)

    if (!order || !latestPayment?.id) {
      const reason = !order ? 'order_not_found' : 'missing_latest_payment'
      console.warn('Ignoring Mercado Pago merchant order notification', {
        externalReference,
        merchantOrderId: merchantOrder.id,
        reason,
      })
      return {
        processed: false,
        reason,
        status: 200,
      } as const
    }

    const paymentClient = getPaymentClient()
    const payment = await paymentClient.get({ id: latestPayment.id })
    await applyPaymentStateToOrder({ notifyOnMismatch: true, order, payment })
    return { processed: true } as const
  }

  console.info('Ignoring Mercado Pago notification with unsupported topic', { dataId, topic })
  return {
    processed: false,
    reason: 'unsupported_topic',
    status: 200,
  } as const
}
