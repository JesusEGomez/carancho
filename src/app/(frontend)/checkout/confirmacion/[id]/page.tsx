import Link from 'next/link'
import { notFound } from 'next/navigation'

import { StoreFooter } from '@/components/store/StoreFooter'
import { StoreHeader } from '@/components/store/StoreHeader'
import { formatCurrency } from '@/lib/formatCurrency'
import { getOrderConfirmation } from '@/lib/checkout'

type Props = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    token?: string
  }>
}

export default async function CheckoutConfirmationPage({ params, searchParams }: Props) {
  const { id } = await params
  const { token } = await searchParams
  const orderId = Number(id)

  if (!token || !Number.isFinite(orderId)) {
    notFound()
  }

  const order = await getOrderConfirmation(orderId, token)

  if (!order) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#fbf7f1]">
      <StoreHeader />
      <div className="container-shell py-8 sm:py-10">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_12px_32px_rgba(28,28,28,0.06)]">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Orden confirmada</p>
          <h1 className="mt-3 text-4xl font-black text-brand-ink">Recibimos tu pedido y ya quedó registrado.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Te vamos a contactar a {order.customerEmail} para coordinar entrega y próximos pasos.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[22px] border border-slate-100 bg-[#fbf7f1] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Orden</p>
              <p className="mt-2 text-xl font-black text-brand-ink">#{order.id}</p>
            </div>
            <div className="rounded-[22px] border border-slate-100 bg-[#fbf7f1] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Estado</p>
              <p className="mt-2 text-xl font-black text-brand-ink">{order.status}</p>
            </div>
            <div className="rounded-[22px] border border-slate-100 bg-[#fbf7f1] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Total</p>
              <p className="mt-2 text-xl font-black text-brand-ink">{formatCurrency(order.total)}</p>
            </div>
            <div className="rounded-[22px] border border-slate-100 bg-[#fbf7f1] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Ciudad</p>
              <p className="mt-2 text-xl font-black text-brand-ink">{order.deliveryCity}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
            <div>
              <h2 className="text-2xl font-black text-brand-ink">Detalle del pedido</h2>
              <div className="mt-4 divide-y divide-slate-100 rounded-[22px] border border-slate-100">
                {order.items?.map((item) => (
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

            <aside className="rounded-[22px] border border-slate-100 bg-[#fbf7f1] p-5">
              <h2 className="text-xl font-black text-brand-ink">Entrega</h2>
              <p className="mt-4 text-sm font-bold text-brand-ink">{order.customerName}</p>
              <p className="mt-1 text-sm text-slate-500">{order.customerPhone}</p>
              <p className="mt-1 text-sm text-slate-500">{order.deliveryAddress}</p>
              {order.deliveryNotes ? <p className="mt-4 text-sm text-slate-500">Notas: {order.deliveryNotes}</p> : null}
            </aside>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="rounded-full bg-brand-orange px-5 py-3 text-sm font-black text-white" href="/productos">
              Seguir comprando
            </Link>
            <Link className="rounded-full border border-slate-200 px-5 py-3 text-sm font-black text-brand-ink" href="/">
              Volver al inicio
            </Link>
          </div>
        </section>
      </div>
      <StoreFooter />
    </div>
  )
}
