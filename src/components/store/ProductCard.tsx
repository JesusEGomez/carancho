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

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[22px] bg-white p-3 shadow-[0_12px_35px_rgba(15,23,42,0.08)]">
      <div className="relative overflow-hidden rounded-[18px] bg-slate-100">
        <StoreMedia
          alt={image?.alt ?? product.name}
          className="aspect-[0.95] h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          fallbackLabel={product.category.name}
          src={image?.url}
        />

        {firstBadge ? (
          <span className="absolute left-3 top-3 rounded-full bg-brand-orange px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
            {BADGE_LABELS[firstBadge]}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-4 px-1 pb-1 pt-4">
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">{product.category.name}</p>
          <h3 className="line-clamp-2 text-[19px] leading-6 font-black text-brand-ink">{product.name}</h3>
          <p className="line-clamp-2 text-sm leading-6 text-slate-500">{product.shortDescription}</p>
        </div>

        <div className="mt-auto space-y-3">
          <div>
            <p className="text-[1.7rem] leading-none font-black text-brand-ink">{formatCurrency(product.price)}</p>
            {product.compareAtPrice ? (
              <p className="mt-1 text-sm font-semibold text-slate-400 line-through">
                {formatCurrency(product.compareAtPrice)}
              </p>
            ) : null}
          </div>

          <Link
            href={`/productos/${product.slug}`}
            className="block rounded-[14px] bg-brand-orange px-4 py-3 text-center text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-orange-600"
          >
            Comprar
          </Link>
        </div>
      </div>
    </article>
  )
}
