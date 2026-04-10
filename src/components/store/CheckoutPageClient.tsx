'use client'

import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { buildCreateOrderRequest } from '@/lib/checkout-client'
import { CHECKOUT_ERROR_CODES } from '@/lib/checkout-errors'
import { createOrder } from '@/services/store/checkoutApi'
import { checkoutFormSchema, type CheckoutFormData } from '@/lib/checkout-schema'
import { formatCurrency } from '@/lib/formatCurrency'
import { useCart } from '@/providers/CartProvider'
import { useToast } from '@/providers/ToastProvider'
import { ApiError } from '@/lib/client/api'

export function CheckoutPageClient() {
  const { items, subtotal } = useCart()
  const { showError } = useToast()
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0)
  const distinctProducts = items.length
  const [stockErrorProductName, setStockErrorProductName] = useState<string | null>(null)
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
    clearErrors,
  } = useForm<CheckoutFormData>({
    defaultValues: {
      customerEmail: '',
      customerName: '',
      customerPhone: '',
      deliveryAddress: '',
      deliveryCity: '',
      deliveryNotes: '',
    },
    resolver: zodResolver(checkoutFormSchema) as Resolver<CheckoutFormData>,
  })

  if (!items.length) {
    return (
      <section className="rounded-[28px] border border-slate-200 bg-white p-8">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Checkout</p>
        <h1 className="mt-3 text-4xl font-black text-brand-ink">No hay productos para cerrar.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          Agregá artículos al carrito antes de completar tus datos.
        </p>
      </section>
    )
  }

  const submitCheckout = async (values: CheckoutFormData) => {
    try {
      clearErrors('root')
      setStockErrorProductName(null)
      const response = await createOrder(buildCreateOrderRequest(items, values))
      window.location.assign(response.initPoint)
    } catch (error) {
      const fallbackMessage = error instanceof Error ? error.message : 'No se pudo completar la orden.'
      const highlightedProduct =
        error instanceof ApiError && error.code === CHECKOUT_ERROR_CODES.OUT_OF_STOCK ? error.meta?.productName ?? null : null
      const message =
        error instanceof ApiError && error.code === CHECKOUT_ERROR_CODES.OUT_OF_STOCK
          ? `${error.message} Ajustá el carrito y volvé a intentar.`
          : fallbackMessage
      setStockErrorProductName(highlightedProduct)
      setError('root', {
        message,
        type: error instanceof ApiError ? (error.code ?? 'server').toLowerCase() : 'server',
      })
      showError(message)
    }
  }

  const onSubmit = handleSubmit(submitCheckout)

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(28,28,28,0.06)]">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Checkout</p>
        <h1 className="mt-2 text-4xl font-black text-brand-ink">Completá tus datos para confirmar la orden.</h1>

        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-black text-brand-ink" htmlFor="customerName">
              Nombre completo
            </label>
            <input className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-brand-orange" id="customerName" {...register('customerName')} />
            {errors.customerName ? <p className="mt-2 text-sm font-bold text-red-600">{errors.customerName.message}</p> : null}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-black text-brand-ink" htmlFor="customerEmail">
                Email
              </label>
              <input className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-brand-orange" id="customerEmail" {...register('customerEmail')} />
              {errors.customerEmail ? <p className="mt-2 text-sm font-bold text-red-600">{errors.customerEmail.message}</p> : null}
            </div>
            <div>
              <label className="text-sm font-black text-brand-ink" htmlFor="customerPhone">
                Teléfono
              </label>
              <input className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-brand-orange" id="customerPhone" {...register('customerPhone')} />
              {errors.customerPhone ? <p className="mt-2 text-sm font-bold text-red-600">{errors.customerPhone.message}</p> : null}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-black text-brand-ink" htmlFor="deliveryCity">
                Ciudad
              </label>
              <input className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-brand-orange" id="deliveryCity" {...register('deliveryCity')} />
              {errors.deliveryCity ? <p className="mt-2 text-sm font-bold text-red-600">{errors.deliveryCity.message}</p> : null}
            </div>
            <div>
              <label className="text-sm font-black text-brand-ink" htmlFor="deliveryAddress">
                Dirección
              </label>
              <input className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-brand-orange" id="deliveryAddress" {...register('deliveryAddress')} />
              {errors.deliveryAddress ? <p className="mt-2 text-sm font-bold text-red-600">{errors.deliveryAddress.message}</p> : null}
            </div>
          </div>

          <div>
            <label className="text-sm font-black text-brand-ink" htmlFor="deliveryNotes">
              Notas de entrega
            </label>
            <textarea className="mt-2 min-h-28 w-full rounded-3xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-orange" id="deliveryNotes" {...register('deliveryNotes')} />
            {errors.deliveryNotes ? <p className="mt-2 text-sm font-bold text-red-600">{errors.deliveryNotes.message}</p> : null}
          </div>

          {errors.root?.message ? <p className="text-sm font-bold text-red-600">{errors.root.message}</p> : null}

          <button className="rounded-full bg-brand-orange px-6 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Redirigiendo al pago...' : 'Pagar con Mercado Pago'}
          </button>
        </form>
      </section>

      <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(28,28,28,0.06)]">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Resumen</p>
        <div className="mt-5 rounded-[22px] border border-slate-100 bg-[#fbf7f1] p-4">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            <span>Productos</span>
            <span>{distinctProducts}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            <span>Unidades</span>
            <span>{totalUnits}</span>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {items.map((item) => (
            <div
              className={`rounded-[20px] border p-4 transition-colors ${
                stockErrorProductName && item.product.name === stockErrorProductName
                  ? 'border-red-200 bg-red-50/70'
                  : 'border-slate-100'
              }`}
              key={item.product.id}
            >
              <div className="flex items-start justify-between gap-4 text-sm">
                <div>
                  <p className="font-black text-brand-ink">{item.product.name}</p>
                  <p className="mt-1 text-slate-500">
                    {formatCurrency(item.product.price)} x {item.quantity}
                  </p>
                  {stockErrorProductName && item.product.name === stockErrorProductName ? (
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-red-600">
                      Sin stock suficiente para confirmar
                    </p>
                  ) : null}
                </div>
                <p className="font-bold text-brand-ink">{formatCurrency(item.product.price * item.quantity)}</p>
              </div>
              <div>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Subtotal de este producto
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3 border-t border-slate-100 pt-6">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Subtotal de productos</span>
            <span className="font-bold text-brand-ink">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Envío</span>
            <span className="font-bold text-brand-ink">A coordinar</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6 text-base font-black text-brand-ink">
          <span>Total</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
      </aside>
    </div>
  )
}
