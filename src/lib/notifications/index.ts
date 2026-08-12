import type { Payload } from 'payload'

import { getSmtpConfig } from '@/lib/email/smtp'
import { createEmailNotifier } from '@/lib/notifications/email'
import type { AdminAlert, AdminNotifier, AlertResult } from '@/lib/notifications/types'

let warnedNotConfigured = false

function warnNotConfiguredOnce(reason: string) {
  if (warnedNotConfigured) {
    return
  }

  warnedNotConfigured = true
  console.warn(`Admin purchase alerts are not configured: ${reason}. Skipping email notifications.`)
}

function createNoopNotifier(reason: string): AdminNotifier {
  return {
    async notify(_alert: AdminAlert): Promise<AlertResult> {
      warnNotConfiguredOnce(reason)
      return { delivered: false, reason: 'not_configured' }
    },
  }
}

async function resolveAdminEmail(payload: Payload): Promise<string | null> {
  const contacts = await payload.find({
    collection: 'store-contacts',
    depth: 0,
    limit: 1,
    overrideAccess: false,
  })

  const email = contacts.docs[0]?.email?.trim()
  return email ? email : null
}

export async function getAdminNotifier(payload: Payload): Promise<AdminNotifier> {
  if (!getSmtpConfig()) {
    return createNoopNotifier('missing SMTP env vars')
  }

  const to = await resolveAdminEmail(payload)

  if (!to) {
    return createNoopNotifier('missing store contact email')
  }

  return createEmailNotifier({ payload, to })
}
