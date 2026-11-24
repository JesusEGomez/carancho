import { addDataAndFileToRequest, type Endpoint, type PayloadRequest } from 'payload'

import {
  AdminOrderActionError,
  buildOrderCancellation,
  buildPaymentMethodSwitch,
  type AdminActionOrder,
} from '@/lib/admin-order-actions'
import { whatsAppPaymentMethodSchema } from '@/lib/checkout-schema'

type OrderUpdate = (order: AdminActionOrder, req: PayloadRequest) => Promise<Record<string, unknown>>

function errorResponse(message: string, status: number) {
  return Response.json({ errors: [{ message }], message }, { status })
}

/**
 * Wraps an admin-only order action: same `isAdmin` rule as the collection access,
 * loads the order fresh from the database and persists the computed update.
 */
function orderAction(buildUpdate: OrderUpdate): Endpoint['handler'] {
  return async (req) => {
    if (req.user?.role !== 'admin') {
      return errorResponse('No autorizado.', req.user ? 403 : 401)
    }

    const id = Number(req.routeParams?.id)

    if (!Number.isInteger(id) || id <= 0) {
      return errorResponse('Orden inválida.', 400)
    }

    const order = await req.payload.findByID({
      collection: 'orders',
      depth: 0,
      disableErrors: true,
      id,
      req,
    })

    if (!order) {
      return errorResponse('No se encontró la orden.', 404)
    }

    try {
      const data = await buildUpdate(order as AdminActionOrder, req)
      const updated = await req.payload.update({
        collection: 'orders',
        data,
        depth: 1,
        id,
        req,
      })

      return Response.json(updated)
    } catch (error) {
      if (error instanceof AdminOrderActionError) {
        return errorResponse(error.message, error.status)
      }

      throw error
    }
  }
}

export const switchOrderPaymentMethodEndpoint: Endpoint = {
  handler: orderAction(async (order, req) => {
    await addDataAndFileToRequest(req)
    const parsed = whatsAppPaymentMethodSchema.safeParse((req.data as { paymentMethod?: unknown } | undefined)?.paymentMethod)

    if (!parsed.success) {
      throw new AdminOrderActionError(parsed.error.issues[0]?.message ?? 'Medio de pago inválido.', 400)
    }

    return buildPaymentMethodSwitch(order, parsed.data)
  }),
  method: 'patch',
  path: '/:id/payment-method',
}

export const cancelOrderEndpoint: Endpoint = {
  handler: orderAction(async (order) => buildOrderCancellation(order)),
  method: 'post',
  path: '/:id/cancel',
}
