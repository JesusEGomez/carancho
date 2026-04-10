'use client'

import Link from 'next/link'

import { useOrder } from '@/hooks/admin/useAdminOrders'
import { formatCurrency } from '@/lib/formatCurrency'
import type { ProductRecord } from '@/services/adminApi'

const ORDER_STATUS_LABELS = {
  cancelled: 'Cancelada',
  confirmed: 'Confirmada',
  draft: 'Borrador',
  fulfillment_blocked: 'Bloqueada por stock',
  pending_payment: 'Pendiente de pago',
} as const

const PAYMENT_STATUS_LABELS = {
  approved: 'Aprobado',
  cancelled: 'Cancelado',
  charged_back: 'Contracargo',
  pending: 'Pendiente',
  rejected: 'Rechazado',
  refunded: 'Reintegrado',
} as const

function relation(value: ProductRecord | number | null | undefined) {
  return typeof value === 'object' && value !== null ? value : null
}

export function AdminOrderDetailClient({ id }: { id: string }) {
  const orderQuery = useOrder(id)
  const order = orderQuery.data
  const error = orderQuery.error?.message ?? null

  if (orderQuery.isLoading) {
    return <div className="rounded-[28px] border border-[#e9edf5] bg-white px-6 py-8 text-sm font-bold text-slate-500">Cargando orden...</div>
  }

  if (!order) {
    return <div className="rounded-[28px] border border-[#e9edf5] bg-white px-6 py-8 text-sm font-bold text-red-600">{error ?? 'No se encontró la orden.'}</div>
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#e9edf5] bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Orden #{order.id}</p>
            <h1 className="mt-2 text-4xl font-black text-brand-ink">{order.customerName}</h1>
            <p className="mt-2 text-sm text-slate-500">{order.customerEmail}</p>
          </div>
          <Link className="rounded-full border border-slate-200 px-5 py-3 text-sm font-black text-brand-ink" href="/admin/ordenes">
            Volver
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailCard label="Estado interno" value={ORDER_STATUS_LABELS[order.status]} />
          <DetailCard label="Total" value={formatCurrency(order.total)} />
          <DetailCard label="Proveedor de pago" value={order.paymentProvider ?? '-'} />
          <DetailCard label="Estado de pago" value={order.paymentStatus ? PAYMENT_STATUS_LABELS[order.paymentStatus] : '-'} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <article className="rounded-[28px] border border-[#e9edf5] bg-white shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
          <div className="border-b border-[#edf0f5] px-6 py-5">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Items</p>
          </div>
          <div className="divide-y divide-[#edf0f5]">
            {order.items?.map((item) => (
              <div className="flex items-center justify-between gap-4 px-6 py-4" key={`${item.productSlug}-${item.id ?? item.product}`}>
                <div>
                  <p className="font-black text-brand-ink">{item.productName}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.productSlug} · cantidad {item.quantity}
                  </p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Stock actual:{' '}
                    <span className="text-brand-ink">{relation(item.product)?.stock ?? 'No disponible'}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-ink">{formatCurrency(item.lineTotal)}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatCurrency(item.unitPrice)} c/u</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <aside className="space-y-6">
          <article className="rounded-[28px] border border-[#e9edf5] bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Entrega</p>
            <p className="mt-4 font-black text-brand-ink">{order.deliveryCity}</p>
            <p className="mt-2 text-sm text-slate-500">{order.deliveryAddress}</p>
            <p className="mt-2 text-sm text-slate-500">{order.customerPhone}</p>
            {order.deliveryNotes ? <p className="mt-4 text-sm text-slate-500">Notas: {order.deliveryNotes}</p> : null}
          </article>

          <article className="rounded-[28px] border border-[#e9edf5] bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Reservado para pagos</p>
            <div className="mt-4 space-y-3 text-sm">
              <p className="text-slate-500">externalReference: <span className="font-bold text-brand-ink">{order.externalReference ?? '-'}</span></p>
              <p className="text-slate-500">providerPreferenceId: <span className="font-bold text-brand-ink">{order.providerPreferenceId ?? '-'}</span></p>
              <p className="text-slate-500">providerPaymentId: <span className="font-bold text-brand-ink">{order.providerPaymentId ?? '-'}</span></p>
              <p className="text-slate-500">providerRawStatus: <span className="font-bold text-brand-ink">{order.providerRawStatus ?? '-'}</span></p>
            </div>
          </article>
        </aside>
      </section>
    </div>
  )
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[#edf0f5] bg-[#fbf7f1] p-5">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-black text-brand-ink">{value}</p>
    </div>
  )
}
