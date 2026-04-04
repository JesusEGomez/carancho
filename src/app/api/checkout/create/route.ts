import { NextResponse } from 'next/server'

import { CheckoutDomainError } from '@/lib/checkout-errors'
import { buildValidatedOrderData } from '@/lib/checkout'
import { getPayloadClient } from '@/lib/payload'
import { createOrderRequestSchema, type CreateOrderResponse } from '@/lib/checkout-schema'

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createOrderRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: parsed.error.issues[0]?.message ?? 'Invalid checkout payload',
      },
      { status: 400 },
    )
  }

  try {
    const payload = await getPayloadClient()
    const orderData = await buildValidatedOrderData(parsed.data)
    const order = await payload.create({
      collection: 'orders',
      data: orderData,
    })

    const response: CreateOrderResponse = {
      confirmationToken: order.confirmationToken,
      orderId: order.id,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    if (error instanceof CheckoutDomainError) {
      return NextResponse.json(
        {
          code: error.code,
          message: error.message,
          meta: error.meta,
        },
        { status: error.status },
      )
    }

    const message = error instanceof Error ? error.message : 'No se pudo crear la orden.'
    return NextResponse.json({ message }, { status: 400 })
  }
}
