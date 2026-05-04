'use client'

import Link from 'next/link'

import { useDashboardStats } from '@/hooks/admin/useAdminDashboard'
import { useOrders } from '@/hooks/admin/useAdminOrders'
import { useProducts } from '@/hooks/admin/useAdminProducts'
import { formatCurrency } from '@/lib/formatCurrency'

const ORDER_STATUS_LABELS = {
  cancelled: 'Cancelada',
  confirmed: 'Confirmada',
  draft: 'Borrador',
  fulfillment_blocked: 'Bloqueada',
  pending_payment: 'Pendiente de pago',
  pending_whatsapp: 'Pendiente por WhatsApp',
} as const

export default function AdminDashboardPage() {
  const statsQuery = useDashboardStats()
  const productsQuery = useProducts()
  const ordersQuery = useOrders()

  const stats = statsQuery.data
  const products = productsQuery.data?.docs ?? []
  const orders = ordersQuery.data?.docs ?? []
  const error =
    statsQuery.error?.message ??
    productsQuery.error?.message ??
    ordersQuery.error?.message ??
    null

  const lowStockProducts = products.filter((product) => product.stock < 5).slice(0, 4)
  const recentProducts = products.slice(0, 6)
  const recentOrders = orders.slice(0, 4)

  const statCards = [
    { label: 'Productos', value: stats?.totalProducts ?? 0, helper: 'Total cargados en catálogo' },
    { label: 'Destacados', value: stats?.featuredProducts ?? 0, helper: 'Visibles como productos destacados' },
    { label: 'Categorías', value: stats?.totalCategories ?? 0, helper: 'Categorías activas' },
    { label: 'Stock bajo', value: stats?.lowStockProducts ?? 0, helper: 'Productos con menos de 5 unidades' },
  ]

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <article
            key={item.label}
            className="rounded-[24px] border border-[#e9edf5] bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.06)]"
          >
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">
              {item.label}
            </p>
            <p className="mt-3 text-4xl font-black text-brand-ink">{item.value}</p>
            <p className="mt-2 text-sm text-slate-500">{item.helper}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <article className="rounded-[28px] border border-[#e9edf5] bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-black text-brand-ink">Acciones rápidas</h2>
          <p className="mt-2 text-sm text-slate-500">
            Lo mínimo necesario para administrar el catálogo sin ruido.
          </p>

          <div className="mt-6 grid gap-3">
            <Link
              className="rounded-[18px] bg-brand-orange px-5 py-4 text-center text-sm font-black uppercase tracking-[0.12em] text-white"
              href="/admin/productos/nuevo"
            >
              Crear producto
            </Link>
            <Link
              className="rounded-[18px] border border-[#dfe5ef] bg-white px-5 py-4 text-center text-sm font-black uppercase tracking-[0.12em] text-brand-ink"
              href="/admin/productos"
            >
              Ver inventario
            </Link>
            <Link
              className="rounded-[18px] border border-[#dfe5ef] bg-white px-5 py-4 text-center text-sm font-black uppercase tracking-[0.12em] text-brand-ink"
              href="/admin/ordenes"
            >
              Ver órdenes
            </Link>
          </div>
        </article>

        <article className="rounded-[28px] border border-[#e9edf5] bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-brand-ink">Stock bajo</h2>
              <p className="mt-2 text-sm text-slate-500">
                Prioridad para reponer o revisar publicación.
              </p>
            </div>
            <span className="rounded-full bg-[#fff7f1] px-3 py-1 text-xs font-black text-brand-orange">
              {lowStockProducts.length} visibles
            </span>
          </div>

          {lowStockProducts.length ? (
            <div className="mt-5 grid gap-3">
              {lowStockProducts.map((product) => (
                <Link
                  key={product.id}
                  className="rounded-[18px] border border-[#eef2f7] px-4 py-4 transition hover:border-brand-orange hover:bg-[#fffaf5]"
                  href={`/admin/productos/${product.id}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-black text-brand-ink">{product.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {typeof product.category === 'object'
                          ? product.category.name
                          : `Categoría ${product.category}`}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#fff5d9] px-3 py-1 text-xs font-black text-[#c98900]">
                      {product.stock} u.
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-[18px] bg-[#f7fafc] px-4 py-4 text-sm font-medium text-slate-500">
              No hay productos con stock bajo.
            </p>
          )}
        </article>

        <article className="rounded-[28px] border border-[#e9edf5] bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-brand-ink">Órdenes recientes</h2>
              <p className="mt-2 text-sm text-slate-500">
                Seguimiento rápido de los últimos pedidos.
              </p>
            </div>
            <Link className="text-sm font-black text-brand-orange" href="/admin/ordenes">
              Ver todas
            </Link>
          </div>

          {recentOrders.length ? (
            <div className="mt-5 grid gap-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  className="rounded-[18px] border border-[#eef2f7] px-4 py-4 transition hover:border-brand-orange hover:bg-[#fffaf5]"
                  href={`/admin/ordenes/${order.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-brand-ink">#{order.id}</p>
                      <p className="mt-1 text-sm text-slate-500">{order.customerName}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString('es-AR')
                          : '-'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-[#fff7f1] px-3 py-1 text-[11px] font-black text-brand-orange">
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                      <p className="mt-3 text-sm font-black text-brand-ink">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-[18px] bg-[#f7fafc] px-4 py-4 text-sm font-medium text-slate-500">
              Todavía no hay órdenes creadas.
            </p>
          )}
        </article>
      </section>

      <section className="rounded-[28px] border border-[#e9edf5] bg-white shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-3 border-b border-[#edf0f5] px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-brand-ink">Últimos productos</h2>
            <p className="mt-1 text-sm text-slate-500">
              Resumen horizontal del inventario cargado.
            </p>
          </div>
          <Link className="text-sm font-black text-brand-orange" href="/admin/productos">
            Ir al inventario completo
          </Link>
        </div>

        {recentProducts.length ? (
          <div className="grid gap-4 px-6 py-6 lg:grid-cols-2 2xl:grid-cols-3">
            {recentProducts.map((product) => (
              <Link
                key={product.id}
                className="rounded-[22px] border border-[#eef2f7] p-5 transition hover:border-brand-orange hover:bg-[#fffaf5]"
                href={`/admin/productos/${product.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-lg font-black leading-6 text-brand-ink">
                      {product.name}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {typeof product.category === 'object'
                        ? product.category.name
                        : product.category}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">Slug: {product.slug}</p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                      product.status === 'published'
                        ? 'bg-[#eaf9ef] text-[#2f9e57]'
                        : 'bg-[#f3f4f6] text-slate-500'
                    }`}
                  >
                    {product.status === 'published' ? 'Publicado' : 'Borrador'}
                  </span>
                </div>

                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Precio
                    </p>
                    <p className="mt-1 text-xl font-black text-brand-ink">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Stock
                    </p>
                    <p className="mt-1 text-lg font-black text-brand-ink">{product.stock}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-6 py-6 text-sm text-slate-500">
            No hay productos cargados todavía.
          </div>
        )}
      </section>

      {error ? (
        <p className="rounded-[20px] bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}
