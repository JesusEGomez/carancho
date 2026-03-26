import Image from 'next/image'
import Link from 'next/link'

import { CategoryCard } from '@/components/store/CategoryCard'
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

      <section className="bg-brand-orange">
        <div className="container-shell grid gap-4 py-4 text-center text-[11px] font-black uppercase tracking-[0.18em] text-white sm:grid-cols-3">
          <p>Envío gratis</p>
          <p>Garantía oficial</p>
          <p>Pago seguro</p>
        </div>
      </section>

      <section id="categorias" className="py-16 sm:py-20">
        <div className="container-shell">
          <h2 className="mb-8 text-center text-2xl font-extrabold uppercase tracking-wider text-brand-ink">
            Categorías destacadas
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
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

      <section className="bg-brand-panel py-16 text-white">
        <div className="container-shell text-center">
          <h2 className="text-3xl font-black sm:text-4xl">¿Querés recibir ofertas exclusivas?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Dejanos tu email y enterate antes que nadie de los nuevos ingresos.
          </p>
          <form className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <input
              className="h-12 flex-1 rounded-[8px] border border-white/10 bg-[#2a2a2a] px-5 text-sm text-white outline-none placeholder:text-slate-500"
              placeholder="Tu correo electrónico"
              type="email"
            />
            <button className="h-12 rounded-[8px] bg-brand-orange px-7 text-sm font-black uppercase tracking-[0.12em] text-white">
              Suscribirme
            </button>
          </form>
        </div>
      </section>

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
