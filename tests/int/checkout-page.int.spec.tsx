import React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CartProvider } from '@/providers/CartProvider'
import { ToastProvider } from '@/providers/ToastProvider'
import { CheckoutPageClient } from '@/components/store/CheckoutPageClient'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

const CART_STORAGE_KEY = 'carancho-store-cart'

function Wrapper() {
  return (
    <ToastProvider>
      <CartProvider>
        <CheckoutPageClient />
      </CartProvider>
    </ToastProvider>
  )
}

function getButton(container: HTMLElement, text: string) {
  return Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes(text)) ?? null
}

function setInputValue(container: HTMLElement, inputId: string, value: string) {
  const input = container.querySelector<HTMLElement>(`#${inputId}`)

  if (!input) {
    throw new Error(`Input ${inputId} not found`)
  }

  act(() => {
    input.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    const nativeSetter =
      input instanceof HTMLTextAreaElement
        ? Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
        : Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set

    nativeSetter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
    input.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
  })
}

describe('CheckoutPageClient', () => {
  let container: HTMLDivElement
  let root: Root
  let storage = new Map<string, string>()

  beforeEach(() => {
    storage = new Map<string, string>()

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        clear: () => {
          storage.clear()
        },
        getItem: (key: string) => storage.get(key) ?? null,
        removeItem: (key: string) => {
          storage.delete(key)
        },
        setItem: (key: string, value: string) => {
          storage.set(key, value)
        },
      },
    })

    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([
        {
          product: {
            id: 1,
            name: 'Combo Caña + Reel Marine Sports',
            price: 45900,
            slug: 'combo-cana-reel',
            stock: 10,
          },
          quantity: 1,
        },
      ]),
    )

    container = document.createElement('div')
    document.body.innerHTML = ''
    document.body.appendChild(container)
    root = createRoot(container)
  })

  it('keeps both checkout actions disabled until required fields are valid', async () => {
    await act(async () => {
      root.render(<Wrapper />)
    })

    const mercadoPagoButton = getButton(container, 'Pagar con Mercado Pago')
    const whatsappButton = getButton(container, 'Pedir por WhatsApp')

    expect(mercadoPagoButton?.hasAttribute('disabled')).toBe(true)
    expect(whatsappButton?.hasAttribute('disabled')).toBe(true)
    expect(container.textContent).toContain('Completá los datos obligatorios para habilitar el pago y el pedido por WhatsApp.')

    setInputValue(container, 'customerName', 'Jesus Emanuel Gomez')
    setInputValue(container, 'customerEmail', 'jesus.emanuel.gomez77@gmail.com')
    setInputValue(container, 'customerPhone', '34346770089')
    setInputValue(container, 'deliveryCity', 'Santa Fe')
    setInputValue(container, 'deliveryAddress', 'Av. Almirante Brown 7425')

    await act(async () => {
      await Promise.resolve()
    })

    expect(mercadoPagoButton?.hasAttribute('disabled')).toBe(false)
    expect(whatsappButton?.hasAttribute('disabled')).toBe(false)
  })
})
