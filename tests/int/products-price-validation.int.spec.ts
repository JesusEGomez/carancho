import { describe, expect, it } from 'vitest'
import type { NumberField } from 'payload'

import { Products } from '@/collections/Products'

function getNumberField(name: string) {
  const field = Products.fields.find((candidate) => 'name' in candidate && candidate.name === name) as NumberField | undefined

  if (!field?.validate) {
    throw new Error(`Field ${name} has no validate function`)
  }

  return field
}

function validate(name: string, value: number | null | undefined, siblingData: Record<string, unknown>) {
  const field = getNumberField(name)
  const options = { siblingData }

  const validateField = field.validate as unknown as (value: unknown, options: unknown) => true | string

  return validateField(value, options)
}

describe('Products alternative price validation', () => {
  it.each(['transferPrice', 'cardPrice'])('%s accepts an unset value', (name) => {
    expect(validate(name, null, { price: 1000 })).toBe(true)
    expect(validate(name, undefined, { price: 1000 })).toBe(true)
  })

  it.each(['transferPrice', 'cardPrice'])('%s accepts values at or above the cash price from siblingData', (name) => {
    expect(validate(name, 1000, { price: 1000 })).toBe(true)
    expect(validate(name, 1500, { price: 1000 })).toBe(true)
  })

  it.each(['transferPrice', 'cardPrice'])('%s rejects values below the cash price from siblingData', (name) => {
    expect(validate(name, 900, { price: 1000 })).toBe('El precio no puede ser menor al precio efectivo')
  })

  it('rejects negative values even without a cash price', () => {
    expect(validate('cardPrice', -5, {})).toBe('El precio debe ser mayor o igual a 0')
  })
})
