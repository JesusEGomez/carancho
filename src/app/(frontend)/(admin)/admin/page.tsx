'use client'

import Link from 'next/link'

import { useCategories } from '@/hooks/admin/useAdminCategories'
import { useDashboardStats } from '@/hooks/admin/useAdminDashboard'
import { useProducts } from '@/hooks/admin/useAdminProducts'
import { formatCurrency } from '@/lib/formatCurrency'

export default function AdminDashboardPage() {
  const statsQuery = useDashboardStats()
  const productsQuery = useProducts()
  const categoriesQuery = useCategories()

  const stats = statsQuery.data
  const products = productsQuery.data?.docs ?? []
  const categories = categoriesQuery.data?.docs ?? []
  const error = statsQuery.error?.message ?? productsQuery.error?.message ?? categoriesQuery.error?.message ?? null

  const lowStockProducts = products.filter((product) => product.stock < 5).slice(0, 5)
  const recentProducts = products.slice(0, 6)

  const statCards = [
    { label: 'Productos', value: stats?.totalProducts ?? 0, helper: 'Total cargados en catálogo' },
    { label: 'Destacados', value: stats?.featuredProducts ?? 0, helper: 'Visibles como productos destacados' },
    { label: 'Categorías', value: stats?.totalCategories ?? categories.length, helper: 'Categorías activas' },
    { label: 'Stock bajo', value: stats?.lowStockProducts ?? 0, helper: 'Productos con menos de 5 unidades' },
  ]

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <article key={item.label} className="rounded-[24px] border border-[#e9edf5] bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
            <p className="mt-3 text-4xl font-black text-brand-ink">{item.value}</p>
            <p className="mt-2 text-sm text-slate-500">{item.helper}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <div className="grid gap-6">
          <article className="rounded-[28px] border border-[#e9edf5] bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black text-brand-ink">Acciones rápidas</h2>
            <p className="mt-2 text-sm text-slate-500">Lo mínimo necesario para administrar el catálogo sin ruido.</p>

            <div className="mt-6 grid gap-3">
              <Link
                className="rounded-[18px] border border-[#dfe5ef] bg-white px-5 py-4 text-center text-sm font-black uppercase tracking-[0.12em] text-brand-ink"
                href="/admin/categorias/nueva"
              >
                Crear categoría
              </Link>
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
                href="/admin/categorias"
              >
                Ver categorías
              </Link>
            </div>
          </article>

          <article className="rounded-[28px] border border-[#e9edf5] bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-brand-ink">Stock bajo</h2>
                <p className="mt-2 text-sm text-slate-500">Prioridad para reponer o revisar publicación.</p>
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
                          {typeof product.category === 'object' ? product.category.name : `Categoría ${product.category}`}
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
            <h2 className="text-2xl font-black text-brand-ink">Categorías</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {categories.length ? (
                categories.map((category) => (
                  <span key={category.id} className="rounded-full bg-[#f5f8fc] px-4 py-2 text-sm font-bold text-brand-ink">
                    {category.name}
                    {category.parent ? ' / Subcategoría' : ''}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-500">Todavía no hay categorías cargadas.</p>
              )}
            </div>
          </article>
        </div>

        <article className="rounded-[28px] border border-[#e9edf5] bg-white shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-3 border-b border-[#edf0f5] px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-brand-ink">Últimos productos</h2>
              <p className="mt-1 text-sm text-slate-500">Resumen rápido del inventario cargado.</p>
            </div>
            <Link className="text-sm font-black text-brand-orange" href="/admin/productos">
              Ir al inventario completo
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4">Precio</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Editar</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.map((product) => (
                  <tr key={product.id} className="border-t border-[#f1f4f8]">
                    <td className="px-6 py-4">
                      <p className="font-black text-brand-ink">{product.name}</p>
                      <p className="mt-1 text-xs text-slate-400">Slug: {product.slug}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {typeof product.category === 'object' ? product.category.name : product.category}
                    </td>
                    <td className="px-6 py-4 font-bold text-brand-ink">{formatCurrency(product.price)}</td>
                    <td className="px-6 py-4 text-slate-500">{product.stock}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          product.status === 'published' ? 'bg-[#eaf9ef] text-[#2f9e57]' : 'bg-[#f3f4f6] text-slate-500'
                        }`}
                      >
                        {product.status === 'published' ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link className="text-sm font-black text-brand-orange" href={`/admin/productos/${product.id}`}>
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!recentProducts.length ? (
            <div className="px-6 py-6 text-sm text-slate-500">No hay productos cargados todavía.</div>
          ) : null}
        </article>
      </section>

      {error ? <p className="rounded-[20px] bg-red-50 px-5 py-4 text-sm font-bold text-red-600">{error}</p> : null}
    </div>
  )
}
