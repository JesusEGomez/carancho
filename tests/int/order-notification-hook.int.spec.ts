import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CollectionAfterChangeHook } from 'payload'

vi.mock('server-only', () => ({}))

const notifyMock = vi.fn()
const getAdminNotifier = vi.fn()

vi.mock('@/lib/notifications', () => ({
  getAdminNotifier,
}))

type HookArgs = Parameters<CollectionAfterChangeHook>[0]

function buildArgs(overrides: {
  context?: Record<string, unknown>
  doc: Record<string, unknown>
  previousDoc?: Record<string, unknown>
}): HookArgs {
  return {
    collection: {} as HookArgs['collection'],
    context: overrides.context ?? {},
    data: overrides.doc,
    doc: overrides.doc,
    operation: 'update',
    previousDoc: overrides.previousDoc as HookArgs['previousDoc'],
    req: { payload: {} } as HookArgs['req'],
  } as HookArgs
}

describe('notifyAdminAfterOrderChange', () => {
  beforeEach(() => {
    notifyMock.mockReset()
    getAdminNotifier.mockReset()
    getAdminNotifier.mockResolvedValue({ notify: notifyMock })
    notifyMock.mockResolvedValue({ delivered: true })
  })

  it('notifies the admin exactly once when the order transitions into confirmed', async () => {
    const { notifyAdminAfterOrderChange } = await import('@/hooks/orderNotificationHooks')

    const doc = { customerName: 'Juan Perez', id: 128, status: 'confirmed', total: 45000 }
    const previousDoc = { customerName: 'Juan Perez', id: 128, status: 'pending_payment', total: 45000 }

    const result = await notifyAdminAfterOrderChange(buildArgs({ doc, previousDoc }))

    expect(getAdminNotifier).toHaveBeenCalledTimes(1)
    expect(notifyMock).toHaveBeenCalledTimes(1)
    expect(notifyMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ orderId: 128 }),
    )
    expect(result).toBe(doc)
  })

  it('does not notify again when the order was already confirmed (webhook retry)', async () => {
    const { notifyAdminAfterOrderChange } = await import('@/hooks/orderNotificationHooks')

    const doc = { customerName: 'Juan Perez', id: 128, status: 'confirmed', total: 45000 }
    const previousDoc = { customerName: 'Juan Perez', id: 128, status: 'confirmed', total: 45000 }

    const result = await notifyAdminAfterOrderChange(buildArgs({ doc, previousDoc }))

    expect(getAdminNotifier).not.toHaveBeenCalled()
    expect(notifyMock).not.toHaveBeenCalled()
    expect(result).toBe(doc)
  })

  it('does not notify when the order does not transition to confirmed', async () => {
    const { notifyAdminAfterOrderChange } = await import('@/hooks/orderNotificationHooks')

    const doc = { customerName: 'Juan Perez', id: 128, status: 'cancelled', total: 45000 }
    const previousDoc = { customerName: 'Juan Perez', id: 128, status: 'pending_payment', total: 45000 }

    await notifyAdminAfterOrderChange(buildArgs({ doc, previousDoc }))

    expect(getAdminNotifier).not.toHaveBeenCalled()
    expect(notifyMock).not.toHaveBeenCalled()
  })

  it('respects the skipAdminAlert escape hatch', async () => {
    const { notifyAdminAfterOrderChange } = await import('@/hooks/orderNotificationHooks')

    const doc = { customerName: 'Test', id: 130, status: 'confirmed', total: 1000 }
    const previousDoc = { customerName: 'Test', id: 130, status: 'pending_payment', total: 1000 }

    await notifyAdminAfterOrderChange(buildArgs({ context: { skipAdminAlert: true }, doc, previousDoc }))

    expect(getAdminNotifier).not.toHaveBeenCalled()
    expect(notifyMock).not.toHaveBeenCalled()
  })

  it('never throws and still returns doc when the notifier reports a failed delivery', async () => {
    notifyMock.mockResolvedValue({ delivered: false, reason: 'boom' })

    const { notifyAdminAfterOrderChange } = await import('@/hooks/orderNotificationHooks')

    const doc = { customerName: 'Maria Lopez', id: 131, status: 'confirmed', total: 10000 }
    const previousDoc = { customerName: 'Maria Lopez', id: 131, status: 'pending_payment', total: 10000 }

    await expect(notifyAdminAfterOrderChange(buildArgs({ doc, previousDoc }))).resolves.toBe(doc)
  })

  it('never throws and still returns doc when the notifier rejects outright', async () => {
    getAdminNotifier.mockRejectedValue(new Error('boom'))

    const { notifyAdminAfterOrderChange } = await import('@/hooks/orderNotificationHooks')

    const doc = { customerName: 'Maria Lopez', id: 132, status: 'confirmed', total: 10000 }
    const previousDoc = { customerName: 'Maria Lopez', id: 132, status: 'pending_payment', total: 10000 }

    await expect(notifyAdminAfterOrderChange(buildArgs({ doc, previousDoc }))).resolves.toBe(doc)
  })
})
