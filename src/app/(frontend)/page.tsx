import Image from 'next/image'
import Link from 'next/link'
import { connection } from 'next/server'

import { FeaturedCategoriesCarousel } from '@/components/store/FeaturedCategoriesCarousel'
import { FloatingSocialButtons } from '@/components/store/FloatingSocialButtons'
import { StoreBenefitsSection } from '@/components/store/StoreBenefitsSection'
import { StoreFooter } from '@/components/store/StoreFooter'
import { HeroCarousel } from '@/components/store/HeroCarousel'
import { StoreHeader } from '@/components/store/StoreHeader'
import { ProductCard } from '@/components/store/ProductCard'
import { getFeaturedCategories, getFeaturedProducts } from '@/lib/store'

export default async function HomePage() {
  // The catalog lives in Payload, so this page has to be rendered per request. Without
  // this the build prerenders it — and the builder has no network route to the database,
  // so an empty storefront gets baked into the HTML and served until something
  // revalidates it. `/productos` is already dynamic because it awaits searchParams.
  await connection()

  const [categories, products] = await Promise.all([getFeaturedCategories(), getFeaturedProducts(4)])

  return (
    <div className="min-h-screen bg-brand-cream">
      <StoreHeader />
      <FloatingSocialButtons />

      <HeroCarousel />

      {categories.length ? (
        <section id="categorias" className="bg-[#efebe5] pt-16 pb-16 sm:pt-20 sm:pb-20">
          <div className="container-shell">
            <h2 className="mb-8 text-center text-2xl font-extrabold uppercase tracking-wider text-brand-ink">
              Categorías destacadas
            </h2>
            <FeaturedCategoriesCarousel categories={categories} />
          </div>
        </section>
      ) : null}

      <section className={`bg-[#efebe5] pb-18 ${categories.length ? '' : 'pt-16 sm:pt-20'}`}>
        <div className="container-shell">
          <div className="mb-8 flex items-end justify-between gap-5">
            <h2 className="text-[30px] font-black uppercase tracking-tight text-brand-ink sm:text-[34px]">Nuevos ingresos</h2>
            <Link className="text-sm font-black text-brand-orange" href="/productos">
              Ver todo el catálogo →
            </Link>
          </div>

          {products.length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-slate-200 bg-white p-8">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                Catálogo en preparación
              </p>
              <h3 className="mt-3 text-2xl font-black text-brand-ink">
                Todavía no hay productos publicados.
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Estamos cargando el catálogo. Escribinos por WhatsApp y te contamos qué tenemos
                disponible.
              </p>
            </div>
          )}
        </div>
      </section>

      <StoreBenefitsSection />

      <section className="bg-[#e9e4dd] py-16 sm:py-20">
        <div className="container-shell text-center">
          <h2 className="mb-8 text-2xl font-extrabold uppercase tracking-wider text-brand-ink">
            Marcas que nos acompañan
          </h2>
          <Image
            alt="Marcas: Alpine Skate, Coleman, Plano, Colony, Discovery, PARD, DMF, Outdoor Noire, Suri, Kunnan, Libertad, Umarex Airguns, Marine, Okuma, Omoto, Payo, Fox Airguns, Stanley, Spinit, Igloo, Trento, Mustad, Shimano, Contigo"
            className="mx-auto h-auto w-full max-w-4xl invert opacity-45 mix-blend-multiply"
            height={692}
            sizes="(max-width: 768px) 100vw, 896px"
            src="/images/brands/brands-logos-v2.png"
            width={1129}
          />
        </div>
      </section>

      <StoreFooter />
    </div>
  )
}
