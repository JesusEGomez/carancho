import { describe, expect, it } from 'vitest'

import {
  getDiscountPercentage,
  getInstallmentPlans,
  getLineTotal,
  roundMoney,
  sumMoney,
  validateInstallmentAmount,
  validateInstallmentCount,
} from '@/lib/pricing'

describe('pricing', () => {
  it('returns no installment plans when none are set', () => {
    expect(getInstallmentPlans(undefined)).toEqual([])
    expect(getInstallmentPlans(null)).toEqual([])
    expect(getInstallmentPlans([])).toEqual([])
  })

  it('sorts installment plans and drops invalid or duplicated ones', () => {
    expect(
      getInstallmentPlans([
        { installmentAmount: 2200, installments: 6 },
        { installmentAmount: '4000', installments: '3' },
        { installmentAmount: 9999, installments: 3 },
        { installmentAmount: 5000, installments: 1 },
        { installmentAmount: 0, installments: 12 },
        { installmentAmount: 1000, installments: 2.5 },
        { installmentAmount: null, installments: 9 },
      ]),
    ).toEqual([
      { installmentAmount: 4000, installments: 3 },
      { installmentAmount: 2200, installments: 6 },
    ])
  })

  it('validates installment counts', () => {
    expect(validateInstallmentCount(2)).toBe(true)
    expect(validateInstallmentCount(12)).toBe(true)
    expect(validateInstallmentCount(null)).toBe('La cantidad de cuotas es obligatoria')
    expect(validateInstallmentCount(1)).toBe('La cantidad de cuotas debe ser un número entero mayor o igual a 2')
    expect(validateInstallmentCount(3.5)).toBe('La cantidad de cuotas debe ser un número entero mayor o igual a 2')
  })

  it('validates installment amounts', () => {
    expect(validateInstallmentAmount(4000)).toBe(true)
    expect(validateInstallmentAmount(undefined)).toBe('El valor de la cuota es obligatorio')
    expect(validateInstallmentAmount(0)).toBe('El valor de la cuota debe ser mayor a 0')
    expect(validateInstallmentAmount(-1)).toBe('El valor de la cuota debe ser mayor a 0')
  })

  it('computes the discount percentage only for a real discount', () => {
    expect(getDiscountPercentage(8000, 10000)).toBe(20)
    expect(getDiscountPercentage(6667, 10000)).toBe(33)
    expect(getDiscountPercentage(10000, 10000)).toBeNull()
    expect(getDiscountPercentage(10000, 8000)).toBeNull()
    expect(getDiscountPercentage(10000, null)).toBeNull()
  })

  it('rounds line totals and totals to cents', () => {
    expect(roundMoney(1.005)).toBe(1.01)
    expect(getLineTotal(19.99, 3)).toBe(59.97)
    expect(sumMoney([0.1, 0.2])).toBe(0.3)
  })
})
