import { NextResponse } from 'next/server'

import { reconcileMercadoPagoOrder } from '@/lib/mercadopago/server'
import { parseMercadoPagoStatusQuery } from '@/lib/mercadopago/shared'

type Props = {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: Request, { params }: Props) {
  const { id } = await params
  const orderId = Number(id)

  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ message: 'Orden inválida.' }, { status: 400 })
  }

  const requestUrl = new URL(request.url)
  const token = requestUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ message: 'Token inválido.' }, { status: 400 })
  }

  try {
    const query = parseMercadoPagoStatusQuery(requestUrl.searchParams)
    const order = await reconcileMercadoPagoOrder({
      merchantOrderId: query.merchantOrderId,
      orderId,
      paymentId: query.paymentId ?? query.collectionId,
      preferenceId: query.preferenceId,
      token,
    })

    if (!order) {
      return NextResponse.json({ message: 'Orden no encontrada.' }, { status: 404 })
    }

    return NextResponse.json(
      {
        confirmationToken: order.confirmationToken,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryAddress: order.deliveryAddress,
        deliveryCity: order.deliveryCity,
        deliveryNotes: order.deliveryNotes,
        id: order.id,
        items:
          order.items?.map((item) => ({
            id: item.id,
            lineTotal: item.lineTotal,
            product: typeof item.product === 'number' ? item.product : item.product.id,
            productName: item.productName,
            productSlug: item.productSlug,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })) ?? [],
        paymentProvider: order.paymentProvider,
        paymentStatus: order.paymentStatus,
        providerPaymentId: order.providerPaymentId,
        providerPreferenceId: order.providerPreferenceId,
        providerRawStatus: order.providerRawStatus,
        status: order.status,
        total: order.total,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Checkout status reconciliation error', error)
    return NextResponse.json({ message: 'No se pudo obtener el estado de la orden.' }, { status: 500 })
  }
}
