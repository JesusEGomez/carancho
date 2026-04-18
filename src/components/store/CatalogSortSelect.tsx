'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { startTransition } from 'react'

import type { CatalogSort } from '@/lib/store'

type CatalogSortSelectProps = {
  value: CatalogSort
}

const SORT_LABELS: Record<CatalogSort, string> = {
  featured: 'Destacados',
  newest: 'Más recientes',
  priceAsc: 'Precio: menor a mayor',
  priceDesc: 'Precio: mayor a menor',
}

export function CatalogSortSelect({ value }: CatalogSortSelectProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <label className="grid min-w-0 gap-2 text-sm">
      <span className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Ordenar por</span>
      <select
        className="h-12 rounded-[16px] border border-slate-200 bg-white px-4 font-bold text-brand-ink outline-none transition-colors focus:border-brand-orange"
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString())
          const nextValue = event.target.value as CatalogSort

          if (nextValue === 'featured') {
            params.delete('sort')
          } else {
            params.set('sort', nextValue)
          }

          params.delete('page')

          const query = params.toString()
          const nextUrl = query ? `${pathname}?${query}` : pathname

          startTransition(() => {
            router.replace(nextUrl, { scroll: false })
          })
        }}
        value={value}
      >
        {Object.entries(SORT_LABELS).map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue}>
            {label}
          </option>
        ))}
      </select>
    </label>
  )
}
