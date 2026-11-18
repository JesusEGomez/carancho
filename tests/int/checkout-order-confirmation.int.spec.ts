import { beforeEach, describe, expect, it, vi } from 'vitest'

const findByID = vi.fn()

vi.mock('@/lib/payload', () => ({
  getPayloadClient: async () => ({ findByID }),
}))

const existingOrder = { confirmationToken: 'token-1', id: 1 }

describe('getOrderConfirmation', () => {
  beforeEach(() => {
    findByID.mockReset()
    // Mirrors Payload: findByID throws NotFound unless disableErrors is set.
    findByID.mockImplementation(async ({ disableErrors, id }) => {
      if (id === existingOrder.id) {
        return existingOrder
      }

      if (disableErrors) {
        return null
      }

      throw new Error('Not Found')
    })
  })

  it('returns the order when the token matches', async () => {
    const { getOrderConfirmation } = await import('@/lib/checkout')

    await expect(getOrderConfirmation(1, 'token-1')).resolves.toBe(existingOrder)
  })

  it('returns null for a wrong token', async () => {
    const { getOrderConfirmation } = await import('@/lib/checkout')

    await expect(getOrderConfirmation(1, 'wrong')).resolves.toBeNull()
  })

  it('returns null for a missing order id, same as a wrong token', async () => {
    const { getOrderConfirmation } = await import('@/lib/checkout')

    await expect(getOrderConfirmation(404, 'token-1')).resolves.toBeNull()
    expect(findByID).toHaveBeenCalledWith(expect.objectContaining({ disableErrors: true, id: 404 }))
  })
})
