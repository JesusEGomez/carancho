'use client'

import { useMemo, useState } from 'react'

import { CategoryCard } from '@/components/store/CategoryCard'
import type { Category, Media } from '@/payload-types'

type FeaturedCategoriesCarouselProps = {
  categories: Array<
    Category & {
      heroImage?: Media | null
    }
  >
}

function chunkCategories<T>(items: T[], size: number) {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

export function FeaturedCategoriesCarousel({ categories }: FeaturedCategoriesCarouselProps) {
  const slides = useMemo(() => chunkCategories(categories, 3), [categories])
  const [activeIndex, setActiveIndex] = useState(0)

  if (!slides.length) {
    return null
  }

  const activeSlide = slides[activeIndex] ?? slides[0]
  const hasMultipleSlides = slides.length > 1

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {activeSlide.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>

      {hasMultipleSlides ? (
        <div className="flex items-center justify-center gap-3">
          <button
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-brand-ink"
            onClick={() => setActiveIndex((current) => (current === 0 ? slides.length - 1 : current - 1))}
            type="button"
          >
            Anterior
          </button>
          <div className="flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                aria-label={`Ir al grupo ${index + 1}`}
                className={`h-3 w-3 rounded-full ${
                  index === activeIndex ? 'bg-brand-orange' : 'bg-slate-300'
                }`}
                onClick={() => setActiveIndex(index)}
                type="button"
              />
            ))}
          </div>
          <button
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-brand-ink"
            onClick={() => setActiveIndex((current) => (current === slides.length - 1 ? 0 : current + 1))}
            type="button"
          >
            Siguiente
          </button>
        </div>
      ) : null}
    </div>
  )
}
