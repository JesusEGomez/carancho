'use client'

import Link from 'next/link'

import { formatCurrency } from '@/lib/formatCurrency'
import { useCart } from '@/providers/CartProvider'

export function CartPageClient() {
  const { itemCount, items, removeItem, setQuantity, subtotal } = useCart()

  if (!items.length) {
    return (
      <section className="rounded-[28px] border border-slate-200 bg-white p-8">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Carrito vacío</p>
        <h1 className="mt-3 text-4xl font-black text-brand-ink">Todavía no agregaste productos.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          Explorá el catálogo y sumá artículos para avanzar al checkout.
        </p>
        <Link className="mt-6 inline-flex rounded-full bg-brand-orange px-5 py-3 text-sm font-black text-white" href="/productos">
          Ir al catálogo
        </Link>
      </section>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(28,28,28,0.06)]">
        <div className="border-b border-slate-100 px-6 py-5">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Carrito</p>
          <h1 className="mt-2 text-4xl font-black text-brand-ink">
            {itemCount} producto{itemCount === 1 ? '' : 's'} listos para cerrar.
          </h1>
        </div>

        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <article className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between" key={item.product.id}>
              <div>
                <Link className="text-lg font-black text-brand-ink hover:text-brand-orange" href={`/productos/${item.product.slug}`}>
                  {item.product.name}
                </Link>
                <p className="mt-1 text-sm text-slate-500">Stock disponible: {item.product.stock}</p>
                <p className="mt-3 text-lg font-black text-brand-ink">{formatCurrency(item.product.price)}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex h-11 items-center rounded-full border border-slate-200 bg-white px-2 text-sm font-black text-brand-ink shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
                  <button
                    aria-label={`Restar una unidad de ${item.product.name}`}
                    className="btn-press flex h-8 w-8 items-center justify-center rounded-full text-lg text-slate-500 transition-colors hover:bg-[#fff2eb] hover:text-brand-orange"
                    onClick={() => setQuantity(item.product.id, item.quantity - 1)}
                    type="button"
                  >
                    −
                  </button>
                  <span className="min-w-12 text-center text-base text-brand-ink">{item.quantity}</span>
                  <button
                    aria-label={`Sumar una unidad de ${item.product.name}`}
                    className="btn-press flex h-8 w-8 items-center justify-center rounded-full text-lg text-slate-500 transition-colors hover:bg-[#fff2eb] hover:text-brand-orange"
                    onClick={() => setQuantity(item.product.id, item.quantity + 1)}
                    type="button"
                  >
                    +
                  </button>
                </div>

                <button className="btn-press text-sm font-black text-slate-400 transition-colors hover:text-brand-orange" onClick={() => removeItem(item.product.id)} type="button">
                  Quitar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(28,28,28,0.06)]">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Resumen</p>
        <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
          <span>Subtotal</span>
          <span className="font-bold text-brand-ink">{formatCurrency(subtotal)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
          <span>Envío</span>
          <span className="font-bold text-brand-ink">A coordinar</span>
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6 text-base font-black text-brand-ink">
          <span>Total</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        <Link className="orange-button btn-press mt-6 flex justify-center" href="/checkout">
          Continuar al checkout
        </Link>
        <Link className="btn-press mt-3 flex justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-brand-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-orange hover:bg-[#fff7f1] hover:text-brand-orange" href="/productos">
          Seguir comprando
        </Link>
      </aside>
    </div>
  )
}
