import { formatCurrency } from '@/lib/formatCurrency'
import { getConfiguredPaymentPrices, PAYMENT_METHOD_LABELS, type PaymentMethod, type PricedProduct } from '@/lib/pricing'

function PaymentMethodIcon({ method }: { method: PaymentMethod }) {
  const common = {
    'aria-hidden': true,
    className: 'h-5 w-5',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2,
    viewBox: '0 0 24 24',
  }

  if (method === 'card') {
    return (
      <svg {...common}>
        <rect height="14" rx="2" width="20" x="2" y="5" />
        <path d="M2 10h20" />
        <path d="M6 15h4" />
      </svg>
    )
  }

  if (method === 'transfer') {
    return (
      <svg {...common}>
        <path d="M3 10h18" />
        <path d="M5 10v8" />
        <path d="M10 10v8" />
        <path d="M14 10v8" />
        <path d="M19 10v8" />
        <path d="M3 21h18" />
        <path d="M12 3 3 8h18z" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <rect height="12" rx="2" width="20" x="2" y="6" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01" />
      <path d="M18 12h.01" />
    </svg>
  )
}

/** Renders one card per configured payment price; renders nothing when only the cash price exists. */
export function PaymentMethodPrices({ product }: { product: PricedProduct }) {
  const prices = getConfiguredPaymentPrices(product)

  if (prices.length === 0) {
    return null
  }

  return (
    <div className="mt-5">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Precio según medio de pago</p>
      <ul className={`mt-3 grid gap-3 ${prices.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {prices.map(({ method, price }) => (
          <li
            className={`flex items-center gap-3 rounded-[18px] border p-4 ${
              method === 'cash' ? 'border-brand-orange bg-orange-50' : 'border-slate-200 bg-white'
            }`}
            key={method}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                method === 'cash' ? 'bg-brand-orange text-white' : 'bg-slate-100 text-brand-ink'
              }`}
            >
              <PaymentMethodIcon method={method} />
            </span>
            <span>
              <span className="block text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                {PAYMENT_METHOD_LABELS[method]}
              </span>
              <span className="block text-lg font-black text-brand-ink">{formatCurrency(price)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
