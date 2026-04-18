import { NextResponse } from 'next/server'

import { createWhatsAppCheckout } from '@/lib/checkout-whatsapp/server'
import { CheckoutDomainError } from '@/lib/checkout-errors'
import { createOrderRequestSchema, type CreateWhatsAppOrderResponse } from '@/lib/checkout-schema'

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
    const response: CreateWhatsAppOrderResponse = await createWhatsAppCheckout(parsed.data)
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

    console.error('Unexpected WhatsApp checkout creation error', error)
    return NextResponse.json({ message: 'No se pudo preparar el pedido por WhatsApp.' }, { status: 500 })
  }
}
