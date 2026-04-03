'use client'

import Link from 'next/link'

import { useCategories } from '@/hooks/admin/useAdminCategories'
import type { CategoryOption } from '@/services/adminApi'

function relation(value: CategoryOption | number | null | undefined) {
  return typeof value === 'object' && value !== null ? value : null
}

export default function AdminCategoriesPage() {
  const categoriesQuery = useCategories()
  const categories = categoriesQuery.data?.docs ?? []
  const error = categoriesQuery.error?.message ?? null

  const parentCategories = categories.filter((category) => !category.parent)
  const subcategoriesByParent = new Map<number, CategoryOption[]>(
    parentCategories.map((category) => [category.id, []]),
  )

  for (const category of categories) {
    const parent = relation(category.parent)

    if (!parent) {
      continue
    }

    const current = subcategoriesByParent.get(parent.id) ?? []
    current.push(category)
    subcategoriesByParent.set(parent.id, current)
  }

  return (
    <section className="rounded-[28px] border border-[#e9edf5] bg-white shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 border-b border-[#edf0f5] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Categorías</p>
          <h1 className="mt-2 text-4xl font-black text-brand-ink">Gestión de categorías</h1>
        </div>
        <div className="flex gap-3">
          <Link className="rounded-full bg-brand-orange px-5 py-3 text-sm font-black text-white" href="/admin/categorias/nueva">
            Nueva categoría
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            <tr>
              <th className="px-6 py-4">Nombre</th>
              <th className="px-6 py-4">Slug</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Padre</th>
              <th className="px-6 py-4">Navegación</th>
              <th className="px-6 py-4">Destacada</th>
              <th className="px-6 py-4 text-right">Editar</th>
            </tr>
          </thead>
          <tbody>
            {parentCategories.flatMap((category) => {
              const subcategories = subcategoriesByParent.get(category.id) ?? []

              return [
                <tr key={`parent-${category.id}`} className="border-t border-[#f1f4f8]">
                  <td className="px-6 py-4">
                    <p className="font-black text-brand-ink">{category.name}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{category.slug}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-black text-[#2563eb]">
                      Principal
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">-</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        category.showInNavigation ? 'bg-[#ecfdf3] text-[#15803d]' : 'bg-[#f3f4f6] text-slate-500'
                      }`}
                    >
                      {category.showInNavigation ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        category.featured ? 'bg-[#fff7f1] text-brand-orange' : 'bg-[#f3f4f6] text-slate-500'
                      }`}
                    >
                      {category.featured ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link className="text-sm font-black text-brand-orange" href={`/admin/categorias/${category.id}`}>
                      Editar
                    </Link>
                  </td>
                </tr>,
                ...subcategories.map((subcategory) => (
                  <tr key={`child-${subcategory.id}`} className="border-t border-[#f8fafc] bg-[#fcfdff]">
                    <td className="px-6 py-4">
                      <p className="font-bold text-brand-ink">└ {subcategory.name}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{subcategory.slug}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-[#f3f4f6] px-3 py-1 text-xs font-black text-slate-500">
                        Subcategoría
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{category.name}</td>
                    <td className="px-6 py-4 text-slate-500">No</td>
                    <td className="px-6 py-4 text-slate-500">No</td>
                    <td className="px-6 py-4 text-right">
                      <Link className="text-sm font-black text-brand-orange" href={`/admin/categorias/${subcategory.id}`}>
                        Editar
                      </Link>
                    </td>
                  </tr>
                )),
              ]
            })}
          </tbody>
        </table>
      </div>

      {!categories.length ? (
        <div className="px-6 py-6 text-sm text-slate-500">Todavía no hay categorías cargadas.</div>
      ) : null}

      {error ? <p className="border-t border-[#edf0f5] px-6 py-4 text-sm font-bold text-red-600">{error}</p> : null}
    </section>
  )
}
