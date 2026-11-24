import React from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { OrderRecord } from '@/services/adminApi'

const mocks = vi.hoisted(() => ({
  cancel: vi.fn(),
  finalize: vi.fn(),
  order: null as unknown,
  refetch: vi.fn(),
  switchMethod: vi.fn(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

vi.mock('@/providers/ToastProvider', () => ({
  useToast: () => ({ showError: vi.fn() }),
}))

vi.mock('@/hooks/admin/useAdminOrders', () => ({
  useCancelOrder: () => ({ isPending: false, mutateAsync: mocks.cancel }),
  useOrder: () => ({ data: mocks.order, error: null, isLoading: false, refetch: mocks.refetch }),
  useUpdateOrderPaymentMethod: () => ({ isPending: false, mutateAsync: mocks.switchMethod }),
  useUpdateOrderStatus: () => ({ isPending: false, mutateAsync: mocks.finalize }),
}))

import { AdminOrderDetailClient } from '@/components/admin/AdminOrderDetailClient'

function buildOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    confirmationToken: 'token',
    currency: 'ARS',
    customerEmail: 'ana@example.com',
    customerName: 'Ana Perez',
    customerPhone: '1155551111',
    deliveryAddress: 'Av. Siempre Viva 123',
    deliveryCity: 'Buenos Aires',
    id: 12,
    items: [
      {
        cashUnitPrice: 1000,
        id: 'item-1',
        lineTotal: 2200,
        product: 1,
        productName: 'Caña',
        productSlug: 'cana',
        quantity: 2,
        transferUnitPrice: 1100,
        unitPrice: 1100,
      },
    ],
    paymentMethod: 'transfer',
    paymentProvider: 'whatsapp',
    paymentStatus: 'pending',
    status: 'pending_whatsapp',
    subtotal: 2200,
    total: 2200,
    ...overrides,
  }
}

describe('AdminOrderDetailClient', () => {
  beforeEach(() => {
    mocks.order = buildOrder()
    for (const mock of [mocks.cancel, mocks.finalize, mocks.refetch, mocks.switchMethod]) {
      mock.mockReset()
      mock.mockResolvedValue({})
    }
  })

  afterEach(() => {
    cleanup()
  })

  it('opens the finalize dialog with the registered method and total', () => {
    render(<AdminOrderDetailClient id="12" />)

    fireEvent.click(screen.getByRole('button', { name: 'Dar por finalizada' }))

    const dialog = screen.getByRole('alertdialog', { name: '¿Finalizar la orden?' })
    expect(within(dialog).getByText('Transferencia')).toBeTruthy()
    expect(within(dialog).getByText(/2\.200/)).toBeTruthy()
    expect(mocks.refetch).toHaveBeenCalled()
    expect(mocks.finalize).not.toHaveBeenCalled()
  })

  it('closes without finalizing on "Cancelar y actualizar"', () => {
    render(<AdminOrderDetailClient id="12" />)

    fireEvent.click(screen.getByRole('button', { name: 'Dar por finalizada' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar y actualizar' }))

    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(mocks.finalize).not.toHaveBeenCalled()
  })

  it('finalizes only after "Sí, finalizar"', () => {
    render(<AdminOrderDetailClient id="12" />)

    fireEvent.click(screen.getByRole('button', { name: 'Dar por finalizada' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sí, finalizar' }))

    expect(mocks.finalize).toHaveBeenCalledWith({ id: '12', paymentProvider: 'whatsapp', status: 'confirmed' })
  })

  it('cancels the order only after confirming the cancel dialog', () => {
    render(<AdminOrderDetailClient id="12" />)

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar orden' }))
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }))
    expect(mocks.cancel).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar orden' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar orden' }))
    expect(mocks.cancel).toHaveBeenCalledWith({ id: '12' })
  })

  it('offers switching to the other WhatsApp payment method', () => {
    render(<AdminOrderDetailClient id="12" />)

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar a Efectivo' }))

    expect(mocks.switchMethod).toHaveBeenCalledWith({ id: '12', paymentMethod: 'cash' })
  })

  it('hides the switch when the order has no price snapshots', () => {
    const order = buildOrder()
    mocks.order = { ...order, items: order.items!.map((item) => ({ ...item, transferUnitPrice: null })) }

    render(<AdminOrderDetailClient id="12" />)

    expect(screen.queryByRole('button', { name: /Cambiar a/ })).toBeNull()
  })

  it('shows no WhatsApp actions for Mercado Pago orders', () => {
    mocks.order = buildOrder({ paymentMethod: 'card', paymentProvider: 'mercadopago', status: 'pending_payment' })

    render(<AdminOrderDetailClient id="12" />)

    expect(screen.queryByRole('button', { name: 'Cancelar orden' })).toBeNull()
    expect(screen.queryByRole('button', { name: /Cambiar a/ })).toBeNull()
    expect(screen.getByText('Tarjeta')).toBeTruthy()
  })
})
