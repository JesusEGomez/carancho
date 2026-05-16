'use client'

import { useState, useCallback } from 'react'
import { StoreMedia } from './StoreMedia'
import type { Media } from '@/payload-types'

interface ProductImageGalleryProps {
  images: Media[]
  productName: string
  categoryName: string
}

export function ProductImageGallery({ images, productName, categoryName }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const validImages = images.filter((img) => img.url)
  const currentImage = validImages[activeIndex] ?? validImages[0]

  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < validImages.length) {
      setActiveIndex(index)
    }
  }, [validImages.length])

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % validImages.length)
  }, [validImages.length])

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + validImages.length) % validImages.length)
  }, [validImages.length])

  if (validImages.length === 0) {
    return (
      <div className="overflow-hidden rounded-[24px] bg-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
        <StoreMedia
          alt={productName}
          className="aspect-[1.22] w-full object-cover"
          fallbackLabel={productName}
          src={null}
        />
      </div>
    )
  }

  return (
    <div>
      {/* Imagen principal con navegación */}
      <div className="group relative overflow-hidden rounded-[24px] bg-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
        <StoreMedia
          alt={currentImage.alt ?? productName}
          className="aspect-[1.22] w-full object-cover transition-opacity duration-300"
          fallbackLabel={categoryName}
          src={currentImage.url}
        />

        {validImages.length > 1 && (
          <>
            {/* Flecha izquierda */}
            <button
              aria-label="Imagen anterior"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-ink opacity-0 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:scale-110 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange group-hover:opacity-100"
              onClick={goPrev}
              type="button"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Flecha derecha */}
            <button
              aria-label="Imagen siguiente"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-ink opacity-0 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:scale-110 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange group-hover:opacity-100"
              onClick={goNext}
              type="button"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Indicadores */}
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              {validImages.map((_, index) => (
                <button
                  key={index}
                  aria-label={`Ver imagen ${index + 1}`}
                  aria-current={index === activeIndex ? 'true' : undefined}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    index === activeIndex
                      ? 'w-6 bg-brand-orange'
                      : 'w-2 bg-white/70 hover:bg-white'
                  }`}
                  onClick={() => goTo(index)}
                  type="button"
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Miniaturas */}
      {validImages.length > 1 && (
        <div className="mt-4 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {validImages.map((image, index) => (
            <button
              key={image.id}
              className={`w-[88px] shrink-0 overflow-hidden rounded-[18px] border-2 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange ${
                index === activeIndex
                  ? 'border-brand-orange ring-2 ring-brand-orange/20'
                  : 'border-transparent hover:border-slate-300'
              } bg-slate-100`}
              onClick={() => goTo(index)}
              type="button"
            >
              <StoreMedia
                alt={image.alt}
                className="aspect-square w-full object-cover"
                fallbackLabel={categoryName}
                src={image.url}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
