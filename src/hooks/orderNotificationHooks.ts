import type { CollectionAfterChangeHook } from 'payload'

import { getAdminNotifier } from '@/lib/notifications'
import { buildAdminOrderAlert } from '@/lib/notifications/message'

function getAdminPanelUrl(orderId: number): string {
  const baseUrl = process.env.MERCADOPAGO_PUBLIC_BASE_URL?.trim().replace(/\/$/, '') ?? ''
  return `${baseUrl}/admin/ordenes/${orderId}`
}

export const notifyAdminAfterOrderChange: CollectionAfterChangeHook = async ({
  context,
  doc,
  previousDoc,
  req,
}) => {
  if (context.skipAdminAlert) {
    return doc
  }

  const wasAlreadyConfirmed = previousDoc?.status === 'confirmed'

  if (doc.status !== 'confirmed' || wasAlreadyConfirmed) {
    return doc
  }

  try {
    const notifier = await getAdminNotifier(req.payload)
    const alert = buildAdminOrderAlert(
      {
        customerName: doc.customerName,
        id: doc.id,
        total: doc.total,
      },
      getAdminPanelUrl(doc.id),
    )

    await notifier.notify(alert)
  } catch (error) {
    console.error('Failed to send admin purchase confirmation alert', {
      message: error instanceof Error ? error.message : 'unknown_error',
      orderId: doc.id,
    })
  }

  return doc
}
