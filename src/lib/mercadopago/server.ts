import 'server-only'

import { randomUUID } from 'crypto'
import { MercadoPagoConfig, MerchantOrder, Payment, Preference } from 'mercadopago'
import type { PreferenceRequest, PreferenceResponse } from 'mercadopago/dist/clients/preference/commonTypes'
import type { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes'

import { createPaymentUnavailableError, CheckoutDomainError } from '@/lib/checkout-errors'
import { getPayloadClient } from '@/lib/payload'
import type { CreateOrderRequest } from '@/lib/checkout-schema'
import { buildValidatedOrderData, getOrderConfirmation } from '@/lib/checkout'
import {
  buildMercadoPagoWebhookDebug,
  buildPreferenceRequest,
  getLatestMerchantOrderPayment,
  getMercadoPagoInitPoint,
  getNotificationDataId,
  getNotificationType,
  mapMercadoPagoPayment,
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
  const digits = order.customerPhone.replace(/\D/g, '')

  return {
    email: order.customerEmail,
    name: firstName || order.customerName,
    phone: {
      area_code: digits.slice(0, 4) || undefined,
      number: digits.slice(4) || digits || undefined,
    },
    surname: lastName || undefined,
  }
}

function createExternalReference() {
  return `order-${randomUUID()}`
}

async function applyPaymentStateToOrder(args: {
  order: NonNullable<MercadoPagoOrder>
  payment: PaymentResponse
}) {
  const payload = await getPayloadClient()
  const mapped = mapMercadoPagoPayment(args.payment)

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

  if (args.paymentId) {
    const paymentClient = getPaymentClient()
    const payment = await paymentClient.get({ id: Number(args.paymentId) })
    return applyPaymentStateToOrder({ order, payment })
  }

  if (args.merchantOrderId) {
    const merchantOrderClient = getMerchantOrderClient()
    const merchantOrder = await merchantOrderClient.get({
      merchantOrderId: Number(args.merchantOrderId),
    })
    const latestPayment = getLatestMerchantOrderPayment(merchantOrder)

    if (latestPayment?.id) {
      const paymentClient = getPaymentClient()
      const payment = await paymentClient.get({ id: latestPayment.id })
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

  if (!dataId || !topic || !requestId || !env.webhookSecret) {
    console.warn('Ignoring Mercado Pago webhook with missing metadata', {
      dataId,
      hasSecret: Boolean(env.webhookSecret),
      requestId,
      topic,
    })
    return {
      processed: false,
      reason: 'missing_metadata',
      status: 400,
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

    console.warn('Rejected Mercado Pago webhook with invalid signature', {
      dataId,
      expectedSignature: debug.expectedSignature,
      manifest: debug.manifest,
      parsedSignature: debug.parsedSignature,
      requestId,
      signatureHeader,
      topic,
    })
    return {
      processed: false,
      reason: 'invalid_signature',
      status: 401,
    } as const
  }

  if (topic === 'payment') {
    const paymentClient = getPaymentClient()
    const payment = await paymentClient.get({ id: Number(dataId) })
    const externalReference = payment.external_reference

    if (!externalReference) {
      console.warn('Mercado Pago payment notification without external reference', {
        paymentId: payment.id,
      })
      return {
        processed: false,
        reason: 'missing_external_reference',
        status: 422,
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
      console.warn('Mercado Pago payment notification did not match local order', {
        externalReference,
        paymentId: payment.id,
      })
      return {
        processed: false,
        reason: 'order_not_found',
        status: 500,
      } as const
    }

    await applyPaymentStateToOrder({ order, payment })
    return { processed: true } as const
  }

  if (topic === 'merchant_order') {
    const merchantOrderClient = getMerchantOrderClient()
    const merchantOrder = await merchantOrderClient.get({
      merchantOrderId: Number(dataId),
    })
    const externalReference = merchantOrder.external_reference

    if (!externalReference) {
      return {
        processed: false,
        reason: 'missing_external_reference',
        status: 422,
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
      return {
        processed: false,
        reason: !order ? 'order_not_found' : 'missing_latest_payment',
        status: !order ? 500 : 422,
      } as const
    }

    const paymentClient = getPaymentClient()
    const payment = await paymentClient.get({ id: latestPayment.id })
    await applyPaymentStateToOrder({ order, payment })
    return { processed: true } as const
  }

  return {
    processed: false,
    reason: 'unsupported_topic',
    status: 400,
  } as const
}
