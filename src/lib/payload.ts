import { getPayload } from 'payload'

import configPromise from '@/payload.config'

let payloadPromise: ReturnType<typeof getPayload> | null = null

export const getPayloadClient = async () => {
  if (!payloadPromise) {
    const pending = configPromise.then((config) => getPayload({ config }))
    payloadPromise = pending
    // Drop a failed initialization (e.g. DB down on first request) so the
    // next call retries instead of reusing the rejected promise forever.
    pending.catch(() => {
      if (payloadPromise === pending) {
        payloadPromise = null
      }
    })
  }

  return payloadPromise
}

