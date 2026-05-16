'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ProductCard } from './ProductCard'
import type { ProductWithRelations } from '@/lib/store'

interface RelatedProductsCarouselProps {
  products: ProductWithRelations[]
}

export function RelatedProductsCarousel({ products }: RelatedProductsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
  }, [])

  const scroll = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const scrollAmount = el.clientWidth * 0.8
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
    // Pequeño delay para actualizar el estado después del scroll suave
    setTimeout(checkScroll, 350)
  }, [checkScroll])

  useEffect(() => {
    checkScroll()

    const handleResize = () => checkScroll()

    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [checkScroll, products.length])

  if (products.length === 0) return null

  return (
    <section className="mt-20">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h2 className="text-3xl font-black text-brand-ink">Productos Relacionados</h2>
        {products.length > 4 && (
          <div className="flex gap-2">
            <button
              aria-label="Ver productos anteriores"
              className={`flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 transition-all duration-200 ${
                canScrollLeft
                  ? 'text-brand-ink hover:border-brand-orange hover:text-brand-orange'
                  : 'cursor-not-allowed text-slate-300'
              }`}
              disabled={!canScrollLeft}
              onClick={() => scroll('left')}
              type="button"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              aria-label="Ver productos siguientes"
              className={`flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 transition-all duration-200 ${
                canScrollRight
                  ? 'text-brand-ink hover:border-brand-orange hover:text-brand-orange'
                  : 'cursor-not-allowed text-slate-300'
              }`}
              disabled={!canScrollRight}
              onClick={() => scroll('right')}
              type="button"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="grid auto-cols-[minmax(260px,1fr)] grid-flow-col gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        onScroll={checkScroll}
      >
        {products.map((product) => (
          <div key={product.id} className="w-[260px] sm:w-[280px]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}
