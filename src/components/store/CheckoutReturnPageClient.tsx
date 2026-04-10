'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { formatCurrency } from '@/lib/formatCurrency'
import { ApiError } from '@/lib/client/api'
import type { CheckoutStatusResponse } from '@/lib/checkout-schema'
import type { MercadoPagoCheckoutStatus, MercadoPagoStatusQuery } from '@/lib/mercadopago/shared'
import { fetchCheckoutStatus } from '@/services/store/checkoutApi'
import { useCart } from '@/providers/CartProvider'

type Props = {
  orderId: number
  returnStatus: MercadoPagoCheckoutStatus
  token: string
  query: MercadoPagoStatusQuery
}

const RETURN_COPY: Record<
  MercadoPagoCheckoutStatus,
  {
    eyebrow: string
    title: string
    description: string
  }
> = {
  failure: {
    description: 'La orden quedó registrada y podés volver a intentar el pago cuando quieras.',
    eyebrow: 'Pago rechazado',
    title: 'No pudimos confirmar el pago en Mercado Pago.',
  },
  pending: {
    description: 'La orden sigue abierta y vamos a actualizar el estado apenas Mercado Pago confirme el resultado final.',
    eyebrow: 'Pago pendiente',
    title: 'Tu pago quedó en revisión.',
  },
  success: {
    description: 'Estamos sincronizando el resultado real del pago con tu orden.',
    eyebrow: 'Volviendo desde Mercado Pago',
    title: 'Recibimos el resultado del checkout.',
  },
}

function StatusBadge({ value }: { value: string }) {
  return (
    <span className="rounded-full bg-[#fff7f1] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-brand-orange">
      {value}
    </span>
  )
}

export function CheckoutReturnPageClient({ orderId, query, returnStatus, token }: Props) {
  const { clearCart } = useCart()
  const [data, setData] = useState<CheckoutStatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        setLoading(true)
        const response = await fetchCheckoutStatus(orderId, {
          ...query,
          token,
        })

        if (cancelled) {
          return
        }

        setData(response)
        setError(null)
      } catch (fetchError) {
        if (cancelled) {
          return
        }

        setError(fetchError instanceof ApiError ? fetchError.message : 'No se pudo obtener el estado actualizado de la orden.')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [orderId, query, token])

  useEffect(() => {
    if (data?.status === 'confirmed') {
      clearCart({ silent: true })
    }
  }, [clearCart, data?.status])

  const copy = RETURN_COPY[returnStatus]
  const effectiveStatus = data?.status ?? (returnStatus === 'success' ? 'pending_payment' : returnStatus === 'pending' ? 'pending_payment' : 'cancelled')
  const paymentStatusLabel = data?.paymentStatus ?? (query.collectionStatus ?? query.status ?? 'pendiente')
  const title = useMemo(() => {
    if (data?.status === 'confirmed') {
      return 'El pago fue acreditado y la orden quedó confirmada.'
    }

    if (data?.status === 'fulfillment_blocked') {
      return 'El pago fue acreditado, pero no pudimos confirmar la orden por stock.'
    }

    if (data?.status === 'pending_payment') {
      return returnStatus === 'failure' ? copy.title : 'La orden quedó registrada y sigue pendiente de confirmación.'
    }

    return copy.title
  }, [copy.title, data?.status, returnStatus])

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_12px_32px_rgba(28,28,28,0.06)]">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">{copy.eyebrow}</p>
      <h1 className="mt-3 text-4xl font-black text-brand-ink">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
        {loading ? 'Consultando el estado actualizado con Mercado Pago...' : copy.description}
      </p>

      {error ? <p className="mt-4 text-sm font-bold text-red-600">{error}</p> : null}

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Orden" value={`#${orderId}`} />
        <Metric label="Estado interno" value={effectiveStatus} />
        <Metric label="Pago" value={paymentStatusLabel} />
        <Metric label="Total" value={data ? formatCurrency(data.total) : '-'} />
      </div>

      {data ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-brand-ink">Detalle del pedido</h2>
              <StatusBadge value={effectiveStatus} />
            </div>
            <div className="mt-4 divide-y divide-slate-100 rounded-[22px] border border-slate-100">
              {data.items.map((item) => (
                <div className="flex items-center justify-between gap-4 px-5 py-4" key={`${item.productSlug}-${item.id ?? item.product}`}>
                  <div>
                    <p className="font-black text-brand-ink">{item.productName}</p>
                    <p className="text-sm text-slate-500">Cantidad: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-brand-ink">{formatCurrency(item.lineTotal)}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[22px] border border-slate-100 bg-[#fbf7f1] p-5">
              <h2 className="text-xl font-black text-brand-ink">Entrega</h2>
              <p className="mt-4 text-sm font-bold text-brand-ink">{data.customerName}</p>
              <p className="mt-1 text-sm text-slate-500">{data.customerEmail}</p>
              <p className="mt-1 text-sm text-slate-500">{data.customerPhone}</p>
              <p className="mt-1 text-sm text-slate-500">{data.deliveryAddress}</p>
              <p className="mt-1 text-sm text-slate-500">{data.deliveryCity}</p>
              {data.deliveryNotes ? <p className="mt-4 text-sm text-slate-500">Notas: {data.deliveryNotes}</p> : null}
            </div>

            <div className="rounded-[22px] border border-slate-100 bg-[#fbf7f1] p-5">
              <h2 className="text-xl font-black text-brand-ink">Mercado Pago</h2>
              <p className="mt-4 text-sm text-slate-500">
                preferenceId: <span className="font-bold text-brand-ink">{data.providerPreferenceId ?? '-'}</span>
              </p>
              <p className="mt-2 text-sm text-slate-500">
                paymentId: <span className="font-bold text-brand-ink">{data.providerPaymentId ?? '-'}</span>
              </p>
              <p className="mt-2 text-sm text-slate-500">
                rawStatus: <span className="font-bold text-brand-ink">{data.providerRawStatus ?? '-'}</span>
              </p>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="rounded-full bg-brand-orange px-5 py-3 text-sm font-black text-white" href="/checkout">
          Volver al checkout
        </Link>
        <Link className="rounded-full border border-slate-200 px-5 py-3 text-sm font-black text-brand-ink" href="/productos">
          Seguir comprando
        </Link>
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-slate-100 bg-[#fbf7f1] p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-black text-brand-ink">{value}</p>
    </div>
  )
}
