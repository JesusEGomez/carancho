import { describe, expect, it } from 'vitest'

import { buildOrderConfirmationPath } from '@/lib/checkout-client'

describe('checkout client helpers', () => {
  it('builds the confirmation path with the order token', () => {
    expect(buildOrderConfirmationPath(42, 'abc-123')).toBe('/checkout/confirmacion/42?token=abc-123')
  })
})
