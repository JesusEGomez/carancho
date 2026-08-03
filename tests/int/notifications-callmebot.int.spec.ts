import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { createCallMeBotNotifier } from '@/lib/notifications/callmebot'

describe('CallMeBot admin notifier', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('calls the CallMeBot API with phone, encoded text and apikey', async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response('message queued', { status: 200 }))

    const notifier = createCallMeBotNotifier({ apiKey: 'super-secret-key', phone: '5491155551111' })
    const result = await notifier.notify({ orderId: 128, message: 'Nueva compra confirmada' })

    expect(result).toEqual({ delivered: true })
    expect(global.fetch).toHaveBeenCalledTimes(1)

    const requestedUrl = new URL(String(vi.mocked(global.fetch).mock.calls[0]?.[0]))
    expect(requestedUrl.origin + requestedUrl.pathname).toBe('https://api.callmebot.com/whatsapp.php')
    expect(requestedUrl.searchParams.get('phone')).toBe('5491155551111')
    expect(requestedUrl.searchParams.get('text')).toBe('Nueva compra confirmada')
    expect(requestedUrl.searchParams.get('apikey')).toBe('super-secret-key')
  })

  it('returns delivered:false without throwing when the response is not ok', async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response('forbidden', { status: 403 }))

    const notifier = createCallMeBotNotifier({ apiKey: 'super-secret-key', phone: '5491155551111' })
    const result = await notifier.notify({ orderId: 128, message: 'Nueva compra confirmada' })

    expect(result.delivered).toBe(false)
  })

  it('returns delivered:false without throwing when fetch rejects (network error)', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('network down'))

    const notifier = createCallMeBotNotifier({ apiKey: 'super-secret-key', phone: '5491155551111' })

    await expect(
      notifier.notify({ orderId: 128, message: 'Nueva compra confirmada' }),
    ).resolves.toEqual(expect.objectContaining({ delivered: false }))
  })

  it('never logs the apikey, even when a failure is logged', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    vi.mocked(global.fetch).mockResolvedValue(new Response('forbidden', { status: 403 }))

    const apiKey = 'super-secret-key-that-must-not-leak'
    const notifier = createCallMeBotNotifier({ apiKey, phone: '5491155551111' })
    await notifier.notify({ orderId: 128, message: 'Nueva compra confirmada' })

    vi.mocked(global.fetch).mockRejectedValue(new Error('network down'))
    await notifier.notify({ orderId: 129, message: 'Nueva compra confirmada' })

    const allCalls = [...consoleErrorSpy.mock.calls, ...consoleWarnSpy.mock.calls, ...consoleLogSpy.mock.calls]

    for (const args of allCalls) {
      for (const arg of args) {
        const serialized = typeof arg === 'string' ? arg : JSON.stringify(arg)
        expect(serialized).not.toContain(apiKey)
      }
    }
  })
})
