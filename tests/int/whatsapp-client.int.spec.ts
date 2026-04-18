import { afterEach, describe, expect, it, vi } from 'vitest'

import { createWhatsAppTabHandle, openWhatsAppLink } from '@/lib/alerts/whatsapp-client'

describe('WhatsApp client helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('opens the final WhatsApp URL in a new tab', () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(window)

    openWhatsAppLink({
      message: 'Hola Carancho',
      phone: '+54 9 11 5555-1111',
    })

    expect(openSpy).toHaveBeenCalledWith('https://wa.me/5491155551111?text=Hola%20Carancho', '_blank')
  })

  it('can pre-open a tab and redirect it after the order is created', () => {
    const hrefState = {
      value: '',
    }
    const focus = vi.fn()
    const close = vi.fn()
    const popup = {
      close,
      closed: false,
      focus,
      opener: window,
      location: {
        get href() {
          return hrefState.value
        },
        set href(value: string) {
          hrefState.value = value
        },
      },
    } as unknown as Window

    const openSpy = vi.spyOn(window, 'open').mockReturnValue(popup)

    const tabHandle = createWhatsAppTabHandle()

    expect(openSpy).toHaveBeenCalledWith('', '_blank')
    expect(tabHandle).not.toBeNull()

    tabHandle?.redirect('https://wa.me/5491155551111?text=Pedido')

    expect(hrefState.value).toBe('https://wa.me/5491155551111?text=Pedido')
    expect(focus).toHaveBeenCalled()
  })
})
