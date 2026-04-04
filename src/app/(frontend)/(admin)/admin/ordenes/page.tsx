'use client'

import Link from 'next/link'

import { useOrders } from '@/hooks/admin/useAdminOrders'
import { formatCurrency } from '@/lib/formatCurrency'

const ORDER_STATUS_LABELS = {
  cancelled: 'Cancelada',
  confirmed: 'Confirmada',
  draft: 'Borrador',
  pending_payment: 'Pendiente de pago',
} as const

export default function AdminOrdersPage() {
  const ordersQuery = useOrders()
  const orders = ordersQuery.data?.docs ?? []
  const error = ordersQuery.error?.message ?? null

  return (
    <section className="rounded-[28px] border border-[#e9edf5] bg-white shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 border-b border-[#edf0f5] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Órdenes</p>
          <h1 className="mt-2 text-4xl font-black text-brand-ink">Checkout local</h1>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            <tr>
              <th className="px-6 py-4">Orden</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Items</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr className="border-t border-[#f1f4f8]" key={order.id}>
                <td className="px-6 py-4">
                  <p className="font-black text-brand-ink">#{order.id}</p>
                  <p className="mt-1 text-xs text-slate-400">{order.createdAt ? new Date(order.createdAt).toLocaleString('es-AR') : '-'}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-black text-brand-ink">{order.customerName}</p>
                  <p className="mt-1 text-xs text-slate-400">{order.customerEmail}</p>
                </td>
                <td className="px-6 py-4 text-slate-500">{order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0}</td>
                <td className="px-6 py-4 font-bold text-brand-ink">{formatCurrency(order.total)}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-[#fff7f1] px-3 py-1 text-xs font-black text-brand-orange">
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link className="text-sm font-black text-brand-orange" href={`/admin/ordenes/${order.id}`}>
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!orders.length ? <div className="px-6 py-6 text-sm text-slate-500">Todavía no hay órdenes creadas.</div> : null}
      {error ? <p className="border-t border-[#edf0f5] px-6 py-4 text-sm font-bold text-red-600">{error}</p> : null}
    </section>
  )
}
