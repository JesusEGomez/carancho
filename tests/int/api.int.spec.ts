import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

describe('API', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('fetches users', async () => {
    const users = await payload.find({
      collection: 'users',
    })
    expect(users).toBeDefined()
  })

  it('exposes catalog collections', async () => {
    const [categories, products] = await Promise.all([
      payload.find({ collection: 'categories' }),
      payload.find({ collection: 'products' }),
    ])

    expect(categories).toBeDefined()
    expect(products).toBeDefined()
  })
})
