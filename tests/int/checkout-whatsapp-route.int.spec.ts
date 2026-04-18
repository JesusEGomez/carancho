import { beforeEach, describe, expect, it, vi } from 'vitest'

const createWhatsAppCheckout = vi.fn()

vi.mock('server-only', () => ({}))

vi.mock('@/lib/checkout-whatsapp/server', () => ({
  createWhatsAppCheckout,
}))

describe('WhatsApp checkout route', () => {
  beforeEach(() => {
    createWhatsAppCheckout.mockReset()
  })

  it('returns the checkout payload when the order is created', async () => {
    createWhatsAppCheckout.mockResolvedValue({
      confirmationToken: 'token-123',
      orderId: 55,
      whatsappUrl: 'https://wa.me/5491155551111?text=hola',
    })

    const { POST } = await import('@/app/api/checkout/create-whatsapp/route')
    const response = await POST(
      new Request('https://example.com/api/checkout/create-whatsapp', {
        body: JSON.stringify({
          customer: {
            customerEmail: 'ana@example.com',
            customerName: 'Ana Perez',
            customerPhone: '1155551111',
            deliveryAddress: 'Av. Siempre Viva 123',
            deliveryCity: 'Buenos Aires',
            deliveryNotes: '',
          },
          items: [{ productId: 1, quantity: 1 }],
        }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      }),
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      confirmationToken: 'token-123',
      orderId: 55,
      whatsappUrl: 'https://wa.me/5491155551111?text=hola',
    })
  })

  it('returns 400 when the payload is invalid', async () => {
    const { POST } = await import('@/app/api/checkout/create-whatsapp/route')
    const response = await POST(
      new Request('https://example.com/api/checkout/create-whatsapp', {
        body: JSON.stringify({
          customer: {},
          items: [],
        }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      }),
    )

    expect(response.status).toBe(400)
    expect(createWhatsAppCheckout).not.toHaveBeenCalled()
  })
})
