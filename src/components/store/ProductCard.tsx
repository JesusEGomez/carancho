'use client'

import Link from 'next/link'

import type { ProductWithRelations } from '@/lib/store'
import { formatCurrency } from '@/lib/formatCurrency'
import { StoreMedia } from '@/components/store/StoreMedia'

const BADGE_LABELS: Record<string, string> = {
  destacado: 'Destacado',
  nuevo: 'Nuevo',
  oferta: 'Oferta',
}

export function ProductCard({ product }: { product: ProductWithRelations }) {
  const image = product.featuredImage
  const firstBadge = product.badges?.[0]
  const badgeLabel = firstBadge ? BADGE_LABELS[firstBadge] : null
  const badgeClassName =
    firstBadge === 'oferta' ? 'bg-brand-orange text-white' : 'bg-[hsl(var(--success))] text-white'

  return (
    <Link
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-brand-border bg-white shadow-sm transition-shadow hover:shadow-md"
      href={`/productos/${product.slug}`}
    >
      <div className="relative overflow-hidden bg-[#f1eeea]">
        <StoreMedia
          alt={image?.alt ?? product.name}
          className="aspect-square h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          fallbackLabel={product.category.name}
          src={image?.url}
        />

        {badgeLabel ? (
          <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${badgeClassName}`}>
            {badgeLabel.toUpperCase()}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 line-clamp-2 text-sm leading-tight font-bold text-brand-ink transition-colors group-hover:text-brand-orange">
          {product.name}
        </h3>
        <p className="mb-3 line-clamp-2 text-xs text-slate-500">{product.shortDescription}</p>

        <div className="flex items-end justify-between gap-2">
          <div>
            <span className="text-lg font-extrabold text-brand-ink">{formatCurrency(product.price)}</span>
            {product.compareAtPrice ? (
              <span className="ml-2 text-xs text-slate-400 line-through">{formatCurrency(product.compareAtPrice)}</span>
            ) : null}
          </div>
        </div>

        <button
          className="btn-press mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-orange py-2.5 text-sm font-semibold text-white hover:opacity-90"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          type="button"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="9" cy="20" r="1.5" />
            <circle cx="18" cy="20" r="1.5" />
            <path d="M3 4h2l2.2 10.5a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Añadir al carrito
        </button>
      </div>
    </Link>
  )
}
