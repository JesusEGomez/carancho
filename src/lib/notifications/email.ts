import type { Payload } from 'payload'

import type { AdminAlert, AdminNotifier, AlertResult } from '@/lib/notifications/types'

export type EmailNotifierConfig = {
  payload: Payload
  to: string
}

export function createEmailNotifier(config: EmailNotifierConfig): AdminNotifier {
  return {
    async notify(alert: AdminAlert): Promise<AlertResult> {
      try {
        await config.payload.sendEmail({
          subject: `Nueva compra confirmada - Pedido #${alert.orderId}`,
          text: alert.message,
          to: config.to,
        })

        return { delivered: true }
      } catch (error) {
        // Never log the recipient or transport credentials.
        console.error('Email admin alert failed to send', {
          message: error instanceof Error ? error.message : 'unknown_error',
          orderId: alert.orderId,
        })

        return { delivered: false, reason: 'send_failed' }
      }
    },
  }
}
