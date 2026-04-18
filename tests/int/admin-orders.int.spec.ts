import { beforeEach, describe, expect, it, vi } from 'vitest'

const { patchMock } = vi.hoisted(() => ({
  patchMock: vi.fn(),
}))

vi.mock('@/lib/client/api', () => ({
  api: {
    patch: patchMock,
  },
}))

import { saveOrderStatus } from '@/services/adminApi'

describe('admin order updates', () => {
  beforeEach(() => {
    patchMock.mockReset()
    patchMock.mockResolvedValue({
      data: {
        id: 12,
        paymentProvider: 'whatsapp',
        paymentStatus: 'approved',
        status: 'confirmed',
      },
    })
  })

  it('marks WhatsApp orders as confirmed and approved when finalizing them', async () => {
    await saveOrderStatus({
      id: '12',
      paymentProvider: 'whatsapp',
      status: 'confirmed',
    })

    expect(patchMock).toHaveBeenCalledWith('/orders/12', {
      paymentStatus: 'approved',
      status: 'confirmed',
    })
  })

  it('updates Mercado Pago orders without overriding the payment status', async () => {
    await saveOrderStatus({
      id: '12',
      paymentProvider: 'mercadopago',
      status: 'confirmed',
    })

    expect(patchMock).toHaveBeenCalledWith('/orders/12', {
      status: 'confirmed',
    })
  })
})
