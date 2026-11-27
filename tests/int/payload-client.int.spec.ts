import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getPayload = vi.fn()

vi.mock('payload', () => ({
  getPayload,
}))

vi.mock('@/payload.config', () => ({
  default: Promise.resolve({ secret: 'test-config' }),
}))

async function loadClient() {
  const { getPayloadClient } = await import('@/lib/payload')
  return getPayloadClient
}

describe('getPayloadClient', () => {
  beforeEach(() => {
    // Fresh module per test so the cached promise does not leak between cases.
    vi.resetModules()
    getPayload.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('retries initialization after a failed first attempt', async () => {
    const client = { name: 'payload' }
    getPayload.mockRejectedValueOnce(new Error('database unavailable')).mockResolvedValueOnce(client)
    const getPayloadClient = await loadClient()

    await expect(getPayloadClient()).rejects.toThrow('database unavailable')
    await expect(getPayloadClient()).resolves.toBe(client)
    expect(getPayload).toHaveBeenCalledTimes(2)
  })

  it('caches a successful initialization', async () => {
    const client = { name: 'payload' }
    getPayload.mockResolvedValue(client)
    const getPayloadClient = await loadClient()

    await expect(getPayloadClient()).resolves.toBe(client)
    await expect(getPayloadClient()).resolves.toBe(client)
    expect(getPayload).toHaveBeenCalledTimes(1)
    expect(getPayload).toHaveBeenCalledWith({ config: { secret: 'test-config' } })
  })
})
