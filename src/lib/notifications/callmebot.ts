import type { AdminAlert, AdminNotifier, AlertResult } from '@/lib/notifications/types'

const CALLMEBOT_ENDPOINT = 'https://api.callmebot.com/whatsapp.php'
const REQUEST_TIMEOUT_MS = 5000

export type CallMeBotConfig = {
  apiKey: string
  phone: string
}

export function createCallMeBotNotifier(config: CallMeBotConfig): AdminNotifier {
  return {
    async notify(alert: AdminAlert): Promise<AlertResult> {
      const url = new URL(CALLMEBOT_ENDPOINT)
      url.searchParams.set('phone', config.phone)
      url.searchParams.set('text', alert.message)
      url.searchParams.set('apikey', config.apiKey)

      try {
        const response = await fetch(url.toString(), {
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })

        if (!response.ok) {
          console.error('CallMeBot admin alert rejected by provider', {
            orderId: alert.orderId,
            status: response.status,
          })
          return { delivered: false, reason: `http_${response.status}` }
        }

        return { delivered: true }
      } catch (error) {
        console.error('CallMeBot admin alert request failed', {
          message: error instanceof Error ? error.message : 'unknown_error',
          orderId: alert.orderId,
        })
        return { delivered: false, reason: 'request_failed' }
      }
    },
  }
}
