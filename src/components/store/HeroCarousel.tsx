'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useEffectEvent, useState } from 'react'

const HERO_SLIDES = [
  {
    alt: 'Paisaje de montaña con río y pescador para el hero de Carancho',
    src: '/images/heroes/carancho-home-hero.png',
  },
  {
    alt: 'Lago al amanecer con bote de pesca en calma',
    src: '/images/heroes/carancho-home-hero-2.jpg',
  },
  {
    alt: 'Pescador en lancha al atardecer en lago abierto',
    src: '/images/heroes/carancho-home-hero-3.png',
  },
] as const

export function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const slideCount = HERO_SLIDES.length

  const goToNextSlide = useEffectEvent(() => {
    setActiveIndex((currentIndex) => (currentIndex + 1) % slideCount)
  })

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      goToNextSlide()
    }, 6000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [goToNextSlide])

  return (
    <section className="relative isolate overflow-hidden bg-brand-panel">
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
            className="object-cover object-center"
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
            Todo para tu <span className="text-brand-orange">aventura</span>
            <br />y tu <span className="text-brand-orange">hogar</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/88 drop-shadow-[0_6px_18px_rgba(15,23,42,0.35)] sm:text-lg">
            Equipamiento de alta calidad para pescadores apasionados y el confort de tu casa.
          </p>
            <Link className="mt-8 inline-flex rounded-[14px] bg-brand-orange px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_16px_30px_rgba(240,90,25,0.28)]" href="/productos">
              Ver productos
            </Link>
          </div>
      </div>
    </section>
  )
}
