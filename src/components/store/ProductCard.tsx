'use client'

import Link from 'next/link'

import { AddToCartButton } from '@/components/store/AddToCartButton'
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
          <span
            className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-xs ${badgeClassName}`}
          >
            {badgeLabel.toUpperCase()}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="mb-1 line-clamp-2 text-[13px] leading-tight font-bold text-brand-ink transition-colors group-hover:text-brand-orange sm:text-sm">
          {product.name}
        </h3>
        <p className="mb-2 line-clamp-2 text-[11px] text-slate-500 sm:mb-3 sm:text-xs">{product.shortDescription}</p>

        <div className="flex items-end justify-between gap-2">
          <div>
            <span className="text-base font-extrabold text-brand-ink sm:text-lg">{formatCurrency(product.price)}</span>
            {product.compareAtPrice ? (
              <span className="ml-1.5 text-[10px] text-slate-400 line-through sm:ml-2 sm:text-xs">
                {formatCurrency(product.compareAtPrice)}
              </span>
            ) : null}
          </div>
        </div>

        <AddToCartButton
          onBeforeAdd={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          product={{
            featuredImageAlt: image?.alt,
            featuredImageUrl: image?.url,
            id: product.id,
            name: product.name,
            price: product.price,
            slug: product.slug,
            stock: product.stock,
          }}
        />
      </div>
    </Link>
  )
}
