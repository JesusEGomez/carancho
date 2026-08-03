import type { Payload } from 'payload'

import { createCallMeBotNotifier } from '@/lib/notifications/callmebot'
import type { AdminAlert, AdminNotifier, AlertResult } from '@/lib/notifications/types'

let warnedNotConfigured = false

function warnNotConfiguredOnce() {
  if (warnedNotConfigured) {
    return
  }

  warnedNotConfigured = true
  console.warn(
    'Admin purchase alerts are not configured: missing CALLMEBOT_API_KEY env var or store contact phone. Skipping WhatsApp notifications.',
  )
}

function createNoopNotifier(): AdminNotifier {
  return {
    async notify(_alert: AdminAlert): Promise<AlertResult> {
      warnNotConfiguredOnce()
      return { delivered: false, reason: 'not_configured' }
    },
  }
}

function getCallMeBotApiKey(): string | null {
  const apiKey = process.env.CALLMEBOT_API_KEY?.trim()
  return apiKey ? apiKey : null
}

async function resolveAdminPhone(payload: Payload): Promise<string | null> {
  const contacts = await payload.find({
    collection: 'store-contacts',
    depth: 0,
    limit: 1,
    overrideAccess: false,
  })

  const phone = contacts.docs[0]?.phone?.trim()
  return phone ? phone : null
}

export async function getAdminNotifier(payload: Payload): Promise<AdminNotifier> {
  const apiKey = getCallMeBotApiKey()

  if (!apiKey) {
    return createNoopNotifier()
  }

  const phone = await resolveAdminPhone(payload)

  if (!phone) {
    return createNoopNotifier()
  }

  return createCallMeBotNotifier({ apiKey, phone })
}
