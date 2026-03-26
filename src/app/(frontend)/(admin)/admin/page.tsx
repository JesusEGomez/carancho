'use client'

import Link from 'next/link'

import { useCategories, useDashboardStats, useProducts } from '@/hooks/useAdminCatalog'
import { formatCurrency } from '@/lib/formatCurrency'

export default function AdminDashboardPage() {
  const statsQuery = useDashboardStats()
  const productsQuery = useProducts()
  const categoriesQuery = useCategories()

  const stats = statsQuery.data
  const products = productsQuery.data?.docs ?? []
  const categories = categoriesQuery.data?.docs ?? []
  const error = statsQuery.error?.message ?? productsQuery.error?.message ?? categoriesQuery.error?.message ?? null

  const statCards = [
    { label: 'Total Productos', value: stats?.totalProducts ?? 0, accent: '+12%' },
    { label: 'Ventas Mensuales', value: '$45,200.00', accent: '+5.4%' },
    { label: 'Clientes Activos', value: '842', accent: 'Estable' },
    { label: 'Stock Bajo', value: stats?.lowStockProducts ?? 0, accent: '-2%' },
  ]

  return (
    <div className="grid gap-6">
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <article key={item.label} className="rounded-[24px] border border-[#e9edf5] bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff3eb] text-brand-orange">●</span>
              <span className="rounded-full bg-[#f5f8fc] px-3 py-1 text-xs font-black text-emerald-500">{item.accent}</span>
            </div>
            <p className="mt-7 text-sm font-semibold text-slate-400">{item.label}</p>
            <p className="mt-2 text-4xl font-black text-brand-ink">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[28px] border border-[#e9edf5] bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
          <h2 className="text-3xl font-black text-brand-ink">Subir Nuevo Producto</h2>
          <p className="mt-1 text-sm text-slate-400">Agregue detalles del equipo de pesca</p>

          <div className="mt-8 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-brand-ink">
              Nombre del Producto
              <input className="h-12 rounded-[16px] border border-[#dfe5ef] px-4 outline-none" placeholder="Ej: Caña Shimano Vengeance" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-brand-ink">
                Precio ($)
                <input className="h-12 rounded-[16px] border border-[#dfe5ef] px-4 outline-none" placeholder="0.00" />
              </label>
              <label className="grid gap-2 text-sm font-bold text-brand-ink">
                Categoría
                <select className="h-12 rounded-[16px] border border-[#dfe5ef] px-4 outline-none">
                  <option>{categories[0]?.name ?? 'Cañas'}</option>
                </select>
              </label>
            </div>

            <label className="grid gap-2 text-sm font-bold text-brand-ink">
              Descripción
              <textarea
                className="min-h-32 rounded-[20px] border border-[#dfe5ef] px-4 py-3 outline-none"
                placeholder="Detalles técnicos del producto..."
              />
            </label>

            <div className="rounded-[24px] border border-dashed border-[#d8e1ee] px-6 py-10 text-center text-slate-400">
              <p className="font-bold">Arrastra o haz clic para subir</p>
              <p className="mt-2 text-xs">JPG, PNG (max. 5MB)</p>
            </div>

            <Link className="rounded-[16px] bg-brand-orange px-5 py-4 text-center text-sm font-black uppercase tracking-[0.12em] text-white" href="/admin/productos/nuevo">
              Guardar Producto
            </Link>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#e9edf5] bg-white shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 border-b border-[#edf0f5] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-black text-brand-ink">Lista de Inventario</h2>
              <p className="mt-1 text-sm text-slate-400">Últimas actualizaciones hoy</p>
            </div>
            <div className="rounded-full border border-[#dfe5ef] bg-white px-5 py-3 text-sm text-slate-400">Buscar producto...</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4">Precio</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 4).map((product) => {
                  const lowStock = product.stock < 5

                  return (
                    <tr key={product.id} className="border-t border-[#f1f4f8]">
                      <td className="px-6 py-4">
                        <p className="font-black text-brand-ink">{product.name}</p>
                        <p className="mt-1 text-xs text-slate-400">SKU: CR-{product.id}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {typeof product.category === 'object' ? product.category.name : product.category}
                      </td>
                      <td className="px-6 py-4 font-bold text-brand-ink">{formatCurrency(product.price)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            lowStock ? 'bg-[#fff5d9] text-[#c98900]' : 'bg-[#eaf9ef] text-[#2f9e57]'
                          }`}
                        >
                          {lowStock ? 'Bajo Stock' : 'En Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-400">✎ 🗑</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-5 text-sm text-slate-400">
            <p>Mostrando {Math.min(products.length, 4)} productos</p>
            <Link className="font-black text-brand-orange" href="/admin/productos">
              Ver inventario completo
            </Link>
          </div>
        </div>
      </section>

      {error ? <p className="rounded-[20px] bg-red-50 px-5 py-4 text-sm font-bold text-red-600">{error}</p> : null}
    </div>
  )
}
