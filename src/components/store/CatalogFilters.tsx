'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

import { PriceRangeFilter } from '@/components/store/PriceRangeFilter'
import type { Category } from '@/payload-types'

type CatalogFiltersProps = {
  categories: Category[]
  subcategories: Category[]
  selectedCategorySlug: string | null
  selectedParentCategory: Category | null
  maxPriceRange: number
  activeMaxPrice: number
}

function FilterIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M3 6h18M7 12h10M10 18h4" strokeLinecap="round" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 transition-transform duration-200"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function countActiveFilters(
  selectedCategorySlug: string | null,
  activeMaxPrice: number,
  maxPriceRange: number,
) {
  let count = 0

  if (selectedCategorySlug) {
    count += 1
  }

  if (activeMaxPrice < maxPriceRange) {
    count += 1
  }

  return count
}

export function CatalogFilters({
  activeMaxPrice,
  categories,
  maxPriceRange,
  selectedCategorySlug,
  selectedParentCategory,
  subcategories,
}: CatalogFiltersProps) {
  const searchParams = useSearchParams()
  const [expanded, setExpanded] = useState(false)
  const activeFilterCount = countActiveFilters(selectedCategorySlug, activeMaxPrice, maxPriceRange)

  const buildCategoryHref = (slug: string | null) => {
    const params = new URLSearchParams()

    // Preserve current search term
    const q = searchParams.get('q')
    if (q) {
      params.set('q', q)
    }

    // Preserve current max price
    const maxPrice = searchParams.get('maxPrice')
    if (maxPrice) {
      params.set('maxPrice', maxPrice)
    }

    // Preserve current sort
    const sort = searchParams.get('sort')
    if (sort && sort !== 'featured') {
      params.set('sort', sort)
    }

    // Set the new category (or omit for "Ver todos")
    if (slug) {
      params.set('categoria', slug)
    }

    const query = params.toString()
    return query ? `/productos?${query}` : '/productos'
  }

  const filterContent = (
    <>
      <div className="mb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Filtros</p>
      </div>

      <div className="grid gap-7 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] xl:grid-cols-1">
        <div>
          <h3 className="text-xl font-black tracking-tight text-brand-ink">Categorías</h3>
          <div className="mt-4 space-y-3">
            <Link
              className={`block text-base font-bold transition-colors ${
                !selectedCategorySlug
                  ? 'text-brand-orange'
                  : 'text-slate-700 hover:text-brand-orange'
              }`}
              href={buildCategoryHref(null)}
            >
              Ver todos
            </Link>

            {categories.map((item) => {
              const isParentActive = selectedParentCategory?.id === item.id
              const childCategories = isParentActive ? subcategories : []

              return (
                <div key={item.id} className="space-y-2">
                  <Link
                    className={`block text-base font-bold transition-colors ${
                      isParentActive
                        ? 'text-brand-orange'
                        : 'text-slate-700 hover:text-brand-orange'
                    }`}
                    href={buildCategoryHref(item.slug)}
                  >
                    {item.name}
                  </Link>

                  {childCategories.length ? (
                    <div className="space-y-2 border-l border-[#e4d5c4] pl-4">
                      {childCategories.map((child) => {
                        const isChildActive = child.slug === selectedCategorySlug

                        return (
                          <Link
                            key={child.id}
                            className={`block text-sm font-bold transition-colors ${
                              isChildActive
                                ? 'text-brand-orange'
                                : 'text-slate-500 hover:text-brand-ink'
                            }`}
                            href={buildCategoryHref(child.slug)}
                          >
                            {child.name}
                          </Link>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        <div className="md:border-l md:border-[#e4d5c4] md:pl-6 xl:border-t xl:border-l-0 xl:pt-7 xl:pl-0">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
            Filtrar por
          </p>
          <div className="mt-5">
            <h3 className="text-base font-black tracking-tight text-brand-ink">Precio</h3>
            <PriceRangeFilter maxValue={maxPriceRange} value={activeMaxPrice} />
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar: visible on xl+ */}
      <aside className="hidden self-start xl:sticky xl:top-28 xl:block">
        <div className="rounded-[22px] border border-[#e8dfd3] bg-[#f7f1e8] p-5 xl:rounded-none xl:border-0 xl:bg-transparent xl:p-0">
          {filterContent}
        </div>
      </aside>

      {/* Mobile/tablet collapsible panel: visible below xl */}
      <div className="xl:hidden">
        <button
          aria-expanded={expanded}
          className="flex w-full items-center justify-between rounded-[16px] border border-[#e8dfd3] bg-[#f7f1e8] px-5 py-3.5 text-left transition-shadow hover:shadow-sm"
          onClick={() => {
            setExpanded((prev) => !prev)
          }}
          type="button"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-brand-orange/10 text-brand-orange">
              <FilterIcon />
            </span>
            <div>
              <span className="text-sm font-black text-brand-ink">Filtros</span>
              {activeFilterCount > 0 ? (
                <span className="ml-2 rounded-full bg-brand-orange/10 px-2 py-0.5 text-[11px] font-bold text-brand-orange">
                  {activeFilterCount} {activeFilterCount === 1 ? 'activo' : 'activos'}
                </span>
              ) : null}
            </div>
          </div>
          <span
            className={`text-slate-400 transition-transform duration-200 ${
              expanded ? 'rotate-180' : ''
            }`}
          >
            <ChevronDownIcon />
          </span>
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            expanded ? 'mt-3 max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="rounded-[22px] border border-[#e8dfd3] bg-[#f7f1e8] p-5">
            {filterContent}
          </div>
        </div>
      </div>
    </>
  )
}
