import { describe, expect, it } from 'vitest'

import {
  getConfiguredPaymentPrices,
  getDiscountPercentage,
  getLineTotal,
  getUnitPrice,
  normalizeOptionalPrice,
  roundMoney,
  sumMoney,
  validateAlternativePrice,
} from '@/lib/pricing'

describe('pricing', () => {
  it('uses the cash price for cash and as fallback for unset alternatives', () => {
    const product = { cardPrice: null, price: 1000, transferPrice: undefined }

    expect(getUnitPrice(product, 'cash')).toBe(1000)
    expect(getUnitPrice(product, 'transfer')).toBe(1000)
    expect(getUnitPrice(product, 'card')).toBe(1000)
  })

  it('uses alternative prices when they are set', () => {
    const product = { cardPrice: 1300, price: 1000, transferPrice: 1100 }

    expect(getUnitPrice(product, 'cash')).toBe(1000)
    expect(getUnitPrice(product, 'transfer')).toBe(1100)
    expect(getUnitPrice(product, 'card')).toBe(1300)
  })

  it('treats empty strings and non-numbers as unset', () => {
    expect(normalizeOptionalPrice('')).toBeNull()
    expect(normalizeOptionalPrice('abc')).toBeNull()
    expect(normalizeOptionalPrice('1200')).toBe(1200)
    expect(getUnitPrice({ cardPrice: '', price: 900 }, 'card')).toBe(900)
  })

  it('keeps zero as a configured price', () => {
    expect(normalizeOptionalPrice(0)).toBe(0)
  })

  it('lists only configured payment prices', () => {
    expect(getConfiguredPaymentPrices({ price: 1000 })).toEqual([])
    expect(getConfiguredPaymentPrices({ cardPrice: 1300, price: 1000 })).toEqual([
      { method: 'cash', price: 1000 },
      { method: 'card', price: 1300 },
    ])
    expect(getConfiguredPaymentPrices({ cardPrice: 1300, price: 1000, transferPrice: 1100 })).toEqual([
      { method: 'cash', price: 1000 },
      { method: 'transfer', price: 1100 },
      { method: 'card', price: 1300 },
    ])
  })

  it('computes the discount percentage only for a real discount', () => {
    expect(getDiscountPercentage(8000, 10000)).toBe(20)
    expect(getDiscountPercentage(6667, 10000)).toBe(33)
    expect(getDiscountPercentage(10000, 10000)).toBeNull()
    expect(getDiscountPercentage(10000, 8000)).toBeNull()
    expect(getDiscountPercentage(10000, null)).toBeNull()
  })

  it('validates alternative prices against the cash price', () => {
    expect(validateAlternativePrice(null, 1000)).toBe(true)
    expect(validateAlternativePrice(1000, 1000)).toBe(true)
    expect(validateAlternativePrice(1200, 1000)).toBe(true)
    expect(validateAlternativePrice(900, 1000)).toBe('El precio no puede ser menor al precio efectivo')
    expect(validateAlternativePrice(-1, undefined)).toBe('El precio debe ser mayor o igual a 0')
  })

  it('rounds line totals and totals to cents', () => {
    expect(roundMoney(1.005)).toBe(1.01)
    expect(getLineTotal(19.99, 3)).toBe(59.97)
    expect(sumMoney([0.1, 0.2])).toBe(0.3)
  })
})
