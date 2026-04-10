import { beforeEach, describe, expect, it, vi } from 'vitest'

const handleMercadoPagoWebhook = vi.fn()

vi.mock('server-only', () => ({}))

vi.mock('@/lib/mercadopago/server', () => ({
  handleMercadoPagoWebhook,
}))

describe('Mercado Pago webhook route', () => {
  beforeEach(() => {
    handleMercadoPagoWebhook.mockReset()
  })

  it('returns the handler status when the notification is rejected', async () => {
    handleMercadoPagoWebhook.mockResolvedValue({
      processed: false,
      reason: 'invalid_signature',
      status: 401,
    })

    const { POST } = await import('@/app/api/payments/mercadopago/webhook/route')
    const response = await POST(
      new Request('https://example.com/api/payments/mercadopago/webhook', {
        body: JSON.stringify({ type: 'payment' }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      ok: false,
      reason: 'invalid_signature',
    })
  })

  it('returns 500 when webhook processing throws', async () => {
    handleMercadoPagoWebhook.mockRejectedValue(new Error('boom'))

    const { POST } = await import('@/app/api/payments/mercadopago/webhook/route')
    const response = await POST(
      new Request('https://example.com/api/payments/mercadopago/webhook', {
        body: JSON.stringify({ type: 'payment' }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      }),
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      ok: false,
    })
  })
})
