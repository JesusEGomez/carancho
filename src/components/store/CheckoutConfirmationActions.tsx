'use client'

export function CheckoutConfirmationActions() {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <button
        className="rounded-full bg-brand-orange px-5 py-3 text-sm font-black text-white"
        onClick={() => {
          window.location.href = '/productos'
        }}
        type="button"
      >
        Seguir comprando
      </button>
      <button
        className="rounded-full border border-slate-200 px-5 py-3 text-sm font-black text-brand-ink"
        onClick={() => {
          window.location.href = '/'
        }}
        type="button"
      >
        Volver al inicio
      </button>
    </div>
  )
}
