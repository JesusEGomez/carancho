'use client'

import Link from 'next/link'

import { useCategories, useToggleCategoryVisibility } from '@/hooks/admin/useAdminCategories'
import type { CategoryOption } from '@/services/adminApi'

function relation(value: CategoryOption | number | null | undefined) {
  return typeof value === 'object' && value !== null ? value : null
}

export default function AdminCategoriesPage() {
  const categoriesQuery = useCategories()
  const toggleCategoryVisibilityMutation = useToggleCategoryVisibility()
  const categories = categoriesQuery.data?.docs ?? []
  const error = categoriesQuery.error?.message ?? toggleCategoryVisibilityMutation.error?.message ?? null

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
        <table className="w-full table-fixed text-left text-sm xl:table-auto">
          <thead className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            <tr>
              <th className="w-[28%] px-3 py-4 sm:px-6">Nombre</th>
              <th className="hidden px-6 py-4 xl:table-cell">Slug</th>
              <th className="hidden px-6 py-4 xl:table-cell">Tipo</th>
              <th className="hidden px-6 py-4 xl:table-cell">Padre</th>
              <th className="w-[24%] px-3 py-4 sm:px-6">Tienda</th>
              <th className="hidden px-6 py-4 xl:table-cell">Navegación</th>
              <th className="hidden px-6 py-4 xl:table-cell">Destacada</th>
              <th className="sticky right-0 z-10 w-[48%] bg-white px-3 py-4 text-right sm:px-6">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {parentCategories.flatMap((category) => {
              const subcategories = subcategoriesByParent.get(category.id) ?? []

              return [
                <tr key={`parent-${category.id}`} className="border-t border-[#f1f4f8]">
                  <td className="min-w-0 px-3 py-4 sm:px-6">
                    <p className="truncate font-black text-brand-ink">{category.name}</p>
                  </td>
                  <td className="hidden px-6 py-4 text-slate-500 xl:table-cell">{category.slug}</td>
                  <td className="hidden px-6 py-4 xl:table-cell">
                    <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-black text-[#2563eb]">
                      Principal
                    </span>
                  </td>
                  <td className="hidden px-6 py-4 text-slate-500 xl:table-cell">-</td>
                  <td className="px-3 py-4 sm:px-6">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        category.isVisible ?? true ? 'bg-[#ecfdf3] text-[#15803d]' : 'bg-[#f3f4f6] text-slate-500'
                      }`}
                    >
                      {category.isVisible ?? true ? 'Visible' : 'Oculta'}
                    </span>
                  </td>
                  <td className="hidden px-6 py-4 xl:table-cell">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        category.showInNavigation ? 'bg-[#ecfdf3] text-[#15803d]' : 'bg-[#f3f4f6] text-slate-500'
                      }`}
                    >
                      {category.showInNavigation ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="hidden px-6 py-4 xl:table-cell">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        category.featured ? 'bg-[#fff7f1] text-brand-orange' : 'bg-[#f3f4f6] text-slate-500'
                      }`}
                    >
                      {category.featured ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="sticky right-0 z-10 bg-white px-3 py-4 text-right sm:px-6">
                    <div className="flex items-center justify-end gap-2 lg:gap-4">
                      <button
                        className="whitespace-nowrap text-sm font-black text-slate-500 hover:text-brand-orange disabled:opacity-50"
                        disabled={toggleCategoryVisibilityMutation.isPending}
                        onClick={() => {
                          void toggleCategoryVisibilityMutation.mutateAsync({
                            id: String(category.id),
                            isVisible: !(category.isVisible ?? true),
                          })
                        }}
                        type="button"
                      >
                        {category.isVisible ?? true ? 'Dar de baja' : 'Dar de alta'}
                      </button>
                      <Link className="text-sm font-black text-brand-orange" href={`/admin/categorias/${category.id}`}>
                        Editar
                      </Link>
                    </div>
                  </td>
                </tr>,
                ...subcategories.map((subcategory) => (
                  <tr key={`child-${subcategory.id}`} className="border-t border-[#f8fafc] bg-[#fcfdff]">
                    <td className="min-w-0 px-3 py-4 sm:px-6">
                      <p className="truncate font-bold text-brand-ink">└ {subcategory.name}</p>
                    </td>
                    <td className="hidden px-6 py-4 text-slate-500 xl:table-cell">{subcategory.slug}</td>
                    <td className="hidden px-6 py-4 xl:table-cell">
                      <span className="rounded-full bg-[#f3f4f6] px-3 py-1 text-xs font-black text-slate-500">
                        Subcategoría
                      </span>
                    </td>
                    <td className="hidden px-6 py-4 text-slate-500 xl:table-cell">{category.name}</td>
                    <td className="px-3 py-4 sm:px-6">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          subcategory.isVisible ?? true ? 'bg-[#ecfdf3] text-[#15803d]' : 'bg-[#f3f4f6] text-slate-500'
                        }`}
                      >
                        {subcategory.isVisible ?? true ? 'Visible' : 'Oculta'}
                      </span>
                    </td>
                    <td className="hidden px-6 py-4 xl:table-cell">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          subcategory.showInNavigation ? 'bg-[#ecfdf3] text-[#15803d]' : 'bg-[#f3f4f6] text-slate-500'
                        }`}
                      >
                        {subcategory.showInNavigation ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td className="hidden px-6 py-4 text-slate-500 xl:table-cell">No</td>
                    <td className="sticky right-0 z-10 bg-[#fcfdff] px-3 py-4 text-right sm:px-6">
                      <div className="flex items-center justify-end gap-2 lg:gap-4">
                        <button
                          className="whitespace-nowrap text-sm font-black text-slate-500 hover:text-brand-orange disabled:opacity-50"
                          disabled={toggleCategoryVisibilityMutation.isPending}
                          onClick={() => {
                            void toggleCategoryVisibilityMutation.mutateAsync({
                              id: String(subcategory.id),
                              isVisible: !(subcategory.isVisible ?? true),
                            })
                          }}
                          type="button"
                        >
                          {subcategory.isVisible ?? true ? 'Dar de baja' : 'Dar de alta'}
                        </button>
                        <Link className="text-sm font-black text-brand-orange" href={`/admin/categorias/${subcategory.id}`}>
                          Editar
                        </Link>
                      </div>
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
