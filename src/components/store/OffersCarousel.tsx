'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { ProductCard } from '@/components/store/ProductCard'
import type { ProductWithRelations } from '@/lib/store'

export function OffersCarousel({ products }: { products: ProductWithRelations[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const element = scrollRef.current
    if (!element) return
    setCanScrollLeft(element.scrollLeft > 0)
    setCanScrollRight(element.scrollLeft < element.scrollWidth - element.clientWidth - 1)
  }, [])

  const scroll = useCallback(
    (direction: 'left' | 'right') => {
      const element = scrollRef.current
      if (!element) return
      element.scrollBy({
        behavior: 'smooth',
        left: (direction === 'left' ? -1 : 1) * element.clientWidth * 0.8,
      })
      // Smooth scrolling finishes asynchronously, so the arrows are refreshed afterwards.
      setTimeout(checkScroll, 350)
    },
    [checkScroll],
  )

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)

    return () => window.removeEventListener('resize', checkScroll)
  }, [checkScroll, products.length])

  if (products.length === 0) return null

  const showArrows = canScrollLeft || canScrollRight

  return (
    <div aria-roledescription="carrusel" aria-label="Ofertas" role="region">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-extrabold uppercase tracking-wider text-brand-ink">Ofertas</h2>
        {showArrows ? (
          <div className="flex gap-2">
            <button
              aria-label="Ver ofertas anteriores"
              className={`flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white transition-all duration-200 ${
                canScrollLeft ? 'text-brand-ink hover:border-brand-orange hover:text-brand-orange' : 'cursor-not-allowed text-slate-300'
              }`}
              disabled={!canScrollLeft}
              onClick={() => scroll('left')}
              type="button"
            >
              <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              aria-label="Ver ofertas siguientes"
              className={`flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white transition-all duration-200 ${
                canScrollRight ? 'text-brand-ink hover:border-brand-orange hover:text-brand-orange' : 'cursor-not-allowed text-slate-300'
              }`}
              disabled={!canScrollRight}
              onClick={() => scroll('right')}
              type="button"
            >
              <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>

      <div
        className="grid auto-cols-[minmax(170px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] sm:auto-cols-[minmax(260px,1fr)] sm:gap-5 [&::-webkit-scrollbar]:hidden"
        onScroll={checkScroll}
        ref={scrollRef}
      >
        {products.map((product) => (
          <div className="w-[170px] sm:w-[260px]" key={product.id}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  )
}
