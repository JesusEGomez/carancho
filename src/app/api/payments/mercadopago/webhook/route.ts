import { NextResponse } from 'next/server'

import { handleMercadoPagoWebhook } from '@/lib/mercadopago/server'

export async function POST(request: Request) {
  let body: unknown = null

  try {
    body = await request.json()
  } catch {
    body = null
  }

  try {
    const result = await handleMercadoPagoWebhook({
      body,
      requestHeaders: request.headers,
      requestUrl: new URL(request.url),
    })

    if (!result.processed) {
      return NextResponse.json({ ok: false, reason: result.reason }, { status: result.status })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error('Mercado Pago webhook processing error', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
