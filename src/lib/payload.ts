import { getPayload } from 'payload'

import configPromise from '@/payload.config'

let payloadPromise: ReturnType<typeof getPayload> | null = null

export const getPayloadClient = async () => {
  if (!payloadPromise) {
    const config = await configPromise
    payloadPromise = getPayload({ config })
  }

  return payloadPromise
}

