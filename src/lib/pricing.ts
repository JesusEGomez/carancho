export const PAYMENT_METHODS = ['cash', 'transfer', 'card'] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: 'Tarjeta',
  cash: 'Efectivo',
  transfer: 'Transferencia',
}

/** Label for `price`: cash and transfer always share it. */
export const BASE_PRICE_LABEL = 'Efectivo / Transferencia'

export type InstallmentPlan = {
  installmentAmount: number
  installments: number
}

type InstallmentPlanInput = {
  installmentAmount?: number | string | null
  installments?: number | string | null
}

/** Rounds a money amount to cents. Every line total and order total goes through here. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function getLineTotal(unitPrice: number, quantity: number): number {
  return roundMoney(unitPrice * quantity)
}

export function sumMoney(values: number[]): number {
  return roundMoney(values.reduce((sum, value) => sum + value, 0))
}

function toFiniteNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Valid installment plans sorted by number of installments, keeping the first plan for each
 * installment count. They are informational only: they are shown on the product page and
 * never used to compute what a customer is charged.
 */
export function getInstallmentPlans(plans: InstallmentPlanInput[] | null | undefined): InstallmentPlan[] {
  return (plans ?? [])
    .map((plan) => ({
      installmentAmount: toFiniteNumber(plan.installmentAmount),
      installments: toFiniteNumber(plan.installments),
    }))
    .filter(
      (plan): plan is InstallmentPlan =>
        plan.installments !== null &&
        Number.isInteger(plan.installments) &&
        plan.installments >= 2 &&
        plan.installmentAmount !== null &&
        plan.installmentAmount > 0,
    )
    .filter((plan, index, plans) => plans.findIndex((other) => other.installments === plan.installments) === index)
    .sort((a, b) => a.installments - b.installments)
}

/** Whole-number discount percentage of `price` against `compareAtPrice`, or null when there is no real discount. */
export function getDiscountPercentage(price: number, compareAtPrice: number | null | undefined): number | null {
  if (!compareAtPrice || !Number.isFinite(compareAtPrice) || compareAtPrice <= price || compareAtPrice <= 0) {
    return null
  }

  const percentage = Math.round(((compareAtPrice - price) / compareAtPrice) * 100)

  return percentage > 0 ? percentage : null
}

/** Payload field validator for the number of installments of an installment plan. */
export function validateInstallmentCount(value: unknown): true | string {
  const count = toFiniteNumber(value as number | string | null | undefined)

  if (count === null) {
    return 'La cantidad de cuotas es obligatoria'
  }

  if (!Number.isInteger(count) || count < 2) {
    return 'La cantidad de cuotas debe ser un número entero mayor o igual a 2'
  }

  return true
}

/** Payload field validator for the amount of each installment of an installment plan. */
export function validateInstallmentAmount(value: unknown): true | string {
  const amount = toFiniteNumber(value as number | string | null | undefined)

  if (amount === null) {
    return 'El valor de la cuota es obligatorio'
  }

  if (amount <= 0) {
    return 'El valor de la cuota debe ser mayor a 0'
  }

  return true
}
