import { describe, expect, it } from 'vitest'
import type { ArrayField, Field, NumberField } from 'payload'

import { Products } from '@/collections/Products'

function findField(fields: Field[], name: string) {
  return fields.find((candidate) => 'name' in candidate && candidate.name === name)
}

function getInstallmentPlansField() {
  const field = findField(Products.fields, 'installmentPlans') as ArrayField | undefined

  if (!field || field.type !== 'array') {
    throw new Error('installmentPlans must be an array field')
  }

  return field
}

function validate(name: string, value: unknown) {
  const field = findField(getInstallmentPlansField().fields, name) as NumberField | undefined

  if (!field?.validate) {
    throw new Error(`Field ${name} has no validate function`)
  }

  const validateField = field.validate as unknown as (value: unknown, options: unknown) => true | string

  return validateField(value, {})
}

describe('Products pricing fields', () => {
  it('no longer has separate transfer or card prices', () => {
    expect(findField(Products.fields, 'transferPrice')).toBeUndefined()
    expect(findField(Products.fields, 'cardPrice')).toBeUndefined()
  })

  it('stores informational installment plans with a required count and amount', () => {
    const field = getInstallmentPlansField()

    expect(field.label).toBe('Cuotas (informativo)')
    expect(
      field.fields.map((child) => ('name' in child ? [child.name, 'required' in child && child.required] : null)),
    ).toEqual([
      ['installments', true],
      ['installmentAmount', true],
    ])
  })

  it('validates the number of installments', () => {
    expect(validate('installments', 3)).toBe(true)
    expect(validate('installments', 1)).toBe('La cantidad de cuotas debe ser un número entero mayor o igual a 2')
    expect(validate('installments', 2.5)).toBe('La cantidad de cuotas debe ser un número entero mayor o igual a 2')
    expect(validate('installments', null)).toBe('La cantidad de cuotas es obligatoria')
  })

  it('validates the installment amount', () => {
    expect(validate('installmentAmount', 4000)).toBe(true)
    expect(validate('installmentAmount', 0)).toBe('El valor de la cuota debe ser mayor a 0')
    expect(validate('installmentAmount', undefined)).toBe('El valor de la cuota es obligatorio')
  })
})
