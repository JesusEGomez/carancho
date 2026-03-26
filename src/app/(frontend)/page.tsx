import Image from 'next/image'
import Link from 'next/link'

import { StoreFooter } from '@/components/store/StoreFooter'
import { StoreHeader } from '@/components/store/StoreHeader'
import { StoreMedia } from '@/components/store/StoreMedia'
import { ProductCard } from '@/components/store/ProductCard'
import { getFeaturedCategories, getFeaturedProducts } from '@/lib/store'

export default async function HomePage() {
  const [categories, products] = await Promise.all([getFeaturedCategories(), getFeaturedProducts(4)])

  return (
    <div className="min-h-screen bg-white">
      <StoreHeader />

      <section className="relative isolate overflow-hidden bg-brand-panel">
        <Image
          alt="Paisaje de montaña con río y pescador para el hero de Carancho"
          className="object-cover object-center"
          fill
          priority
          sizes="100vw"
          src="/images/heroes/carancho-home-hero.png"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.44)_0%,rgba(15,23,42,0.36)_35%,rgba(15,23,42,0.62)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.26)_0%,rgba(15,23,42,0.08)_34%,rgba(15,23,42,0.18)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_58%)]" />
        <div className="container-shell relative py-20 text-center sm:py-24">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-4xl font-black leading-tight text-white drop-shadow-[0_10px_28px_rgba(15,23,42,0.42)] sm:text-6xl">
              Todo para tu <span className="text-brand-yellow">aventura</span>
              <br />y tu <span className="text-brand-yellow">hogar</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/88 drop-shadow-[0_6px_18px_rgba(15,23,42,0.35)] sm:text-lg">
              Equipamiento de alta calidad para pescadores apasionados y el confort de tu casa.
            </p>
            <Link className="mt-8 inline-flex rounded-[14px] bg-brand-orange px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_16px_30px_rgba(240,90,25,0.28)]" href="/productos">
              Ver productos
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-brand-yellow">
        <div className="container-shell grid gap-4 py-4 text-center text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink sm:grid-cols-3">
          <p>Envío gratis</p>
          <p>Garantía oficial</p>
          <p>Pago seguro</p>
        </div>
      </section>

      <section id="categorias" className="py-16 sm:py-20">
        <div className="container-shell">
          <h2 className="text-center text-[30px] font-black uppercase tracking-tight text-brand-ink sm:text-[34px]">
            Categorías destacadas
          </h2>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                className="group relative overflow-hidden rounded-[24px] shadow-[0_20px_40px_rgba(15,23,42,0.12)]"
                href={`/productos?categoria=${category.slug}`}
              >
                <StoreMedia
                  alt={category.heroImage?.alt ?? category.name}
                  className="min-h-[260px] w-full object-cover"
                  fallbackLabel={category.name}
                  src={category.heroImage?.url}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_10%,rgba(15,23,42,0.82)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <div className="flex items-center gap-3">
                    <span className="h-5 w-1 rounded-full bg-brand-orange" />
                    <h3 className="text-lg font-black uppercase tracking-[0.08em]">{category.name}</h3>
                  </div>
                </div>
              </Link>
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
              className="h-12 flex-1 rounded-full border border-white/10 bg-white px-5 text-sm text-brand-ink outline-none"
              placeholder="Tu correo electrónico"
              type="email"
            />
            <button className="h-12 rounded-[14px] bg-brand-yellow px-7 text-sm font-black uppercase tracking-[0.12em] text-brand-ink">
              Suscribirme
            </button>
          </form>
        </div>
      </section>

      <StoreFooter variant="light" />
    </div>
  )
}
