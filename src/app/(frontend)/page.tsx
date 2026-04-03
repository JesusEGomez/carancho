import Image from 'next/image'
import Link from 'next/link'

import { FeaturedCategoriesCarousel } from '@/components/store/FeaturedCategoriesCarousel'
import { StoreBenefitsSection } from '@/components/store/StoreBenefitsSection'
import { StoreFooter } from '@/components/store/StoreFooter'
import { HeroCarousel } from '@/components/store/HeroCarousel'
import { StoreHeader } from '@/components/store/StoreHeader'
import { ProductCard } from '@/components/store/ProductCard'
import { getFeaturedCategories, getFeaturedProducts } from '@/lib/store'

export default async function HomePage() {
  const [categories, products] = await Promise.all([getFeaturedCategories(), getFeaturedProducts(4)])

  return (
    <div className="min-h-screen bg-brand-cream">
      <StoreHeader />

      <HeroCarousel />

      <section id="categorias" className="pt-16 pb-16 sm:pt-20 sm:pb-20">
        <div className="container-shell">
          <h2 className="mb-8 text-center text-2xl font-extrabold uppercase tracking-wider text-brand-ink">
            Categorías destacadas
          </h2>
          <FeaturedCategoriesCarousel categories={categories} />
        </div>
      </section>

      <section className="pb-18">
        <div className="container-shell">
          <div className="mb-8 flex items-end justify-between gap-5">
            <h2 className="text-[30px] font-black uppercase tracking-tight text-brand-ink sm:text-[34px]">Nuevos ingresos</h2>
            <Link className="text-sm font-black text-brand-orange" href="/productos">
              Ver todo el catálogo →
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <StoreBenefitsSection />

      <section className="bg-white py-16 sm:py-20">
        <div className="container-shell text-center">
          <h2 className="mb-8 text-2xl font-extrabold uppercase tracking-wider text-brand-ink">
            Marcas que nos acompañan
          </h2>
          <Image
            alt="Marcas: Alpine Skate, Bewolk, Brogas, Colony, Contigo, Discovery, DMF, Doite, HEAD, Kumoc, Kunnan, Libertad, Makalu, Marine, Mustad, Okuma, Omoto, Payo, Rocker, Shimano, Sox, Spinit, Sportsman, Trento, Waterdog"
            className="mx-auto h-auto w-full max-w-4xl invert opacity-40"
            height={546}
            sizes="(max-width: 768px) 100vw, 896px"
            src="/images/brands/brands-logos.png"
            width={1600}
          />
        </div>
      </section>

      <StoreFooter />
    </div>
  )
}
