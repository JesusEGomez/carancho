'use client'

import Link from 'next/link'
import { useDeferredValue, useState } from 'react'

import { useProducts } from '@/hooks/admin/useAdminProducts'
import { formatCurrency } from '@/lib/formatCurrency'

function ProductRowSkeleton({ index }: { index: number }) {
  return (
    <tr className="border-t border-[#f1f4f8]" key={`skeleton-${index}`}>
      <td className="px-6 py-4">
        <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-2 h-3 w-24 animate-pulse rounded-full bg-slate-100" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-28 animate-pulse rounded-full bg-slate-100" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-20 animate-pulse rounded-full bg-slate-100" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-12 animate-pulse rounded-full bg-slate-100" />
      </td>
      <td className="px-6 py-4">
        <div className="h-6 w-24 animate-pulse rounded-full bg-slate-100" />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="ml-auto h-4 w-12 animate-pulse rounded-full bg-slate-100" />
      </td>
    </tr>
  )
}

export default function AdminProductsPage() {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const productsQuery = useProducts(deferredQuery)
  const products = productsQuery.data?.docs ?? []
  const error = productsQuery.error?.message ?? null
  const isInitialLoading = productsQuery.isLoading
  const isRefreshing = productsQuery.isFetching && !productsQuery.isLoading
  const isEmpty = !isInitialLoading && !error && products.length === 0
  const hasActiveSearch = deferredQuery.trim().length > 0

  return (
    <section className="rounded-[28px] border border-[#e9edf5] bg-white shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 border-b border-[#edf0f5] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Inventario</p>
          <h1 className="mt-2 text-4xl font-black text-brand-ink">Lista de productos</h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="h-12 rounded-full border border-[#dfe5ef] px-5 text-sm outline-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o slug"
            value={query}
          />
          <Link className="rounded-full bg-brand-orange px-5 py-3 text-sm font-black text-white" href="/admin/productos/nuevo">
            Nuevo producto
          </Link>
        </div>
      </div>

      {isRefreshing ? (
        <div className="border-b border-[#edf0f5] px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          Actualizando resultados...
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            <tr>
              <th className="px-6 py-4">Producto</th>
              <th className="px-6 py-4">Categoría</th>
              <th className="px-6 py-4">Precio</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isInitialLoading
              ? Array.from({ length: 6 }, (_, index) => <ProductRowSkeleton index={index} key={index} />)
              : products.map((product) => (
                  <tr key={product.id} className="border-t border-[#f1f4f8]">
                    <td className="px-6 py-4">
                      <p className="font-black text-brand-ink">{product.name}</p>
                      <p className="mt-1 text-xs text-slate-400">{product.slug}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {typeof product.category === 'object' ? product.category.name : product.category}
                    </td>
                    <td className="px-6 py-4 font-bold text-brand-ink">{formatCurrency(product.price)}</td>
                    <td className="px-6 py-4 text-slate-500">{product.stock}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          product.stock < 5 ? 'bg-[#fff5d9] text-[#c98900]' : 'bg-[#eaf9ef] text-[#2f9e57]'
                        }`}
                      >
                        {product.stock < 5 ? 'Bajo Stock' : 'En Stock'}
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

      {isEmpty ? (
        <div className="border-t border-[#edf0f5] px-6 py-8">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Sin resultados</p>
          <h2 className="mt-3 text-2xl font-black text-brand-ink">
            {hasActiveSearch ? 'No encontramos productos para esa búsqueda.' : 'Todavía no hay productos cargados.'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            {hasActiveSearch
              ? 'Probá con otro nombre o slug para encontrar el producto que necesitás.'
              : 'Creá el primer producto para empezar a poblar el catálogo del dashboard.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="rounded-full bg-brand-orange px-5 py-3 text-sm font-black text-white" href="/admin/productos/nuevo">
              Nuevo producto
            </Link>
            {hasActiveSearch ? (
              <button
                className="rounded-full border border-slate-200 px-5 py-3 text-sm font-black text-slate-600"
                onClick={() => setQuery('')}
                type="button"
              >
                Limpiar búsqueda
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {error ? <p className="border-t border-[#edf0f5] px-6 py-4 text-sm font-bold text-red-600">{error}</p> : null}
    </section>
  )
}
