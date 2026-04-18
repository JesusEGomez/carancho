import { describe, expect, it } from 'vitest'

import { buildWhatsAppCheckoutMessage, createWhatsAppUrl } from '@/lib/alerts/whatsapp'

describe('WhatsApp alerts', () => {
  it('builds a checkout message with order, customer and item summary', () => {
    const message = buildWhatsAppCheckoutMessage({
      customerEmail: 'ana@example.com',
      customerName: 'Ana Perez',
      customerPhone: '+54 9 11 5555 1111',
      deliveryAddress: 'Av. Siempre Viva 123',
      deliveryCity: 'Buenos Aires',
      deliveryNotes: 'Entregar por la tarde',
      id: 42,
      items: [
        {
          lineTotal: 20000,
          productName: 'Combo Waterdog',
          quantity: 2,
          unitPrice: 10000,
        },
      ],
      total: 20000,
    })

    expect(message).toContain('Pedido #42')
    expect(message).toContain('Ana Perez')
    expect(message).toContain('Buenos Aires')
    expect(message).toContain('Combo Waterdog')
    expect(message).toContain('2 x $10.000')
    expect(message).toContain('$20.000')
    expect(message).toContain('Entregar por la tarde')
  })

  it('creates a wa.me url with normalized phone and encoded message', () => {
    const url = createWhatsAppUrl({
      message: 'Hola Carancho',
      phone: '+54 9 11 5555-1111',
    })

    expect(url).toBe('https://wa.me/5491155551111?text=Hola%20Carancho')
  })
})
