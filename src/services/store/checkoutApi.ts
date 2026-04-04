'use client'

import { api } from '@/lib/client/api'
import type { CreateOrderRequest, CreateOrderResponse } from '@/lib/checkout-schema'

export async function createOrder(payload: CreateOrderRequest) {
  const response = await api.post<CreateOrderResponse>('/checkout/create', payload)
  return response.data
}
