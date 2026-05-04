'use client'

import Image from 'next/image'
import { useEffect, useEffectEvent, useState } from 'react'

const HERO_SLIDES = [
  {
    alt: 'Pescador lanzando en río de montaña al amanecer',
    objectPosition: 'object-[72%_center] sm:object-[68%_center]',
    src: '/images/heroes/carancho-home-hero-4.png',
  },
  {
    alt: 'Campamento outdoor con carpa y fogón frente a la montaña',
    objectPosition: 'object-[70%_center] sm:object-center',
    src: '/images/heroes/carancho-home-hero-5.png',
  },
  {
    alt: 'Pez saltando con señuelo en lago durante el atardecer',
    objectPosition: 'object-[78%_center] sm:object-[70%_center]',
    src: '/images/heroes/carancho-home-hero-6.png',
  },
] as const

const HERO_BAND_ITEMS = ['Pesca deportiva', 'Camping y aventura', 'Hogar y utilitarios'] as const

export function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const slideCount = HERO_SLIDES.length

  const goToNextSlide = useEffectEvent(() => {
    setActiveIndex((currentIndex) => (currentIndex + 1) % slideCount)
  })

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      goToNextSlide()
    }, 3800)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [goToNextSlide])

  return (
    <section className="relative isolate overflow-x-hidden bg-brand-panel">
      {HERO_SLIDES.map((slide, index) => (
        <div
          key={slide.src}
          aria-hidden={activeIndex !== index}
          className={`absolute inset-0 transition-opacity duration-700 ${
            activeIndex === index ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <Image
            alt={slide.alt}
            className={`object-cover ${slide.objectPosition}`}
            fill
            priority={index === 0}
            sizes="100vw"
            src={slide.src}
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.46)_0%,rgba(15,23,42,0.38)_35%,rgba(15,23,42,0.66)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.34)_0%,rgba(15,23,42,0.14)_34%,rgba(15,23,42,0.22)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.10),transparent_58%)]" />

      <div className="container-shell relative py-20 sm:py-24">
        <div className="max-w-4xl text-left">
          <h1 className="text-4xl font-black leading-tight text-white drop-shadow-[0_10px_28px_rgba(15,23,42,0.42)] sm:text-6xl">
            Dedicados a la <span className="text-brand-orange">Pesca</span>
            <br />
            la <span className="text-brand-orange">Caza</span> y la Aventura
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/88 drop-shadow-[0_6px_18px_rgba(15,23,42,0.35)] sm:text-lg">
            Equipamiento de alta calidad para pescadores apasionados y amantes de la
            vida al aire libre.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {HERO_BAND_ITEMS.map((item) => (
              <span
                className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/92 shadow-[0_12px_28px_rgba(15,23,42,0.24)] backdrop-blur-sm sm:text-xs"
                key={item}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
