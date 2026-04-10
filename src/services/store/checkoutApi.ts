'use client'

import { api } from '@/lib/client/api'
import type { CheckoutStatusResponse, CreateOrderRequest, CreateOrderResponse } from '@/lib/checkout-schema'
import type { MercadoPagoStatusQuery } from '@/lib/mercadopago/shared'

export async function createOrder(payload: CreateOrderRequest) {
  const response = await api.post<CreateOrderResponse>('/checkout/create', payload)
  return response.data
}

export async function fetchCheckoutStatus(orderId: number, params: MercadoPagoStatusQuery & { token: string }) {
  const query = new URLSearchParams()

  query.set('token', params.token)

  if (params.collectionId) query.set('collection_id', params.collectionId)
  if (params.collectionStatus) query.set('collection_status', params.collectionStatus)
  if (params.externalReference) query.set('external_reference', params.externalReference)
  if (params.merchantOrderId) query.set('merchant_order_id', params.merchantOrderId)
  if (params.paymentId) query.set('payment_id', params.paymentId)
  if (params.preferenceId) query.set('preference_id', params.preferenceId)
  if (params.status) query.set('status', params.status)

  const response = await api.get<CheckoutStatusResponse>(`/checkout/orders/${orderId}/status?${query.toString()}`)
  return response.data
}
