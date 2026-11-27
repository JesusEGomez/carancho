import { formatCurrency } from '@/lib/formatCurrency'
import { BASE_PRICE_LABEL, getInstallmentPlans, type InstallmentPlan } from '@/lib/pricing'

const iconProps = {
  'aria-hidden': true,
  className: 'h-5 w-5',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 2,
  viewBox: '0 0 24 24',
}

function CashIcon() {
  return (
    <svg {...iconProps}>
      <rect height="12" rx="2" width="20" x="2" y="6" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01" />
      <path d="M18 12h.01" />
    </svg>
  )
}

function CardIcon() {
  return (
    <svg {...iconProps}>
      <rect height="14" rx="2" width="20" x="2" y="5" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
    </svg>
  )
}

type PaymentMethodPricesProps = {
  product: {
    installmentPlans?: Partial<InstallmentPlan>[] | null
    price: number
  }
}

/**
 * Highlights the cash / transfer price and lists the informational installment plans.
 * Renders nothing when the product has no installment plans, since the base price is already shown.
 */
export function PaymentMethodPrices({ product }: PaymentMethodPricesProps) {
  const plans = getInstallmentPlans(product.installmentPlans)

  if (plans.length === 0) {
    return null
  }

  return (
    <div className="mt-5" data-testid="payment-method-prices">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Medios de pago</p>
      <div className="mt-3 flex min-w-0 items-center gap-3 rounded-[18px] border border-brand-orange bg-orange-50 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white">
          <CashIcon />
        </span>
        <span className="min-w-0">
          <span className="block break-words text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
            {BASE_PRICE_LABEL}
          </span>
          <span className="block text-lg font-black text-brand-ink">{formatCurrency(product.price)}</span>
        </span>
      </div>
      <div className="mt-3 rounded-[18px] border border-slate-200 bg-white p-4">
        <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
          <span className="text-brand-ink">
            <CardIcon />
          </span>
          Cuotas
        </p>
        <ul className="mt-3 space-y-2" data-testid="installment-plans">
          {plans.map((plan) => (
            <li className="text-sm font-bold text-brand-ink" key={plan.installments}>
              {plan.installments} cuotas de {formatCurrency(plan.installmentAmount)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
