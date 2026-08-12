import type { Payload } from 'payload'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { createEmailNotifier } from '@/lib/notifications/email'

function buildPayload(sendEmail: ReturnType<typeof vi.fn>) {
  return { sendEmail } as unknown as Payload
}

describe('Email admin notifier', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends the alert to the resolved recipient with the order id in the subject', async () => {
    const sendEmail = vi.fn().mockResolvedValue(undefined)

    const notifier = createEmailNotifier({
      payload: buildPayload(sendEmail),
      to: 'ventas@carancho-outdoors.com',
    })
    const result = await notifier.notify({ orderId: 128, message: 'Nueva compra confirmada' })

    expect(result).toEqual({ delivered: true })
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(sendEmail).toHaveBeenCalledWith({
      subject: 'Nueva compra confirmada - Pedido #128',
      text: 'Nueva compra confirmada',
      to: 'ventas@carancho-outdoors.com',
    })
  })

  it('returns delivered:false without throwing when the transport rejects', async () => {
    const sendEmail = vi.fn().mockRejectedValue(new Error('smtp connection refused'))

    const notifier = createEmailNotifier({
      payload: buildPayload(sendEmail),
      to: 'ventas@carancho-outdoors.com',
    })

    await expect(
      notifier.notify({ orderId: 128, message: 'Nueva compra confirmada' }),
    ).resolves.toEqual(expect.objectContaining({ delivered: false }))
  })

  it('never logs the recipient address when a failure is logged', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const recipient = 'privado@carancho-outdoors.com'
    const sendEmail = vi.fn().mockRejectedValue(new Error('smtp connection refused'))

    const notifier = createEmailNotifier({ payload: buildPayload(sendEmail), to: recipient })
    await notifier.notify({ orderId: 129, message: 'Nueva compra confirmada' })

    const allCalls = [
      ...consoleErrorSpy.mock.calls,
      ...consoleWarnSpy.mock.calls,
      ...consoleLogSpy.mock.calls,
    ]

    for (const args of allCalls) {
      for (const arg of args) {
        const serialized = typeof arg === 'string' ? arg : JSON.stringify(arg)
        expect(serialized).not.toContain(recipient)
      }
    }
  })
})
