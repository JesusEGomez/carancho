import Link from 'next/link'

import { StoreFooter } from '@/components/store/StoreFooter'
import { StoreHeader } from '@/components/store/StoreHeader'
import { ProductCard } from '@/components/store/ProductCard'
import { getCatalogData } from '@/lib/store'

type Props = {
  searchParams: Promise<{
    categoria?: string
    q?: string
  }>
}

export default async function ProductsPage({ searchParams }: Props) {
  const { categoria, q } = await searchParams
  const { categories, products, searchTerm, selectedCategorySlug } = await getCatalogData(q, categoria)

  return (
    <div className="min-h-screen bg-[#fbf7f1]">
      <StoreHeader />

      <div className="container-shell py-8 sm:py-10">
        <nav className="mb-7 flex items-center gap-3 text-xs font-bold text-slate-400">
          <Link href="/" className="hover:text-brand-orange">
            Inicio
          </Link>
          <span>/</span>
          <span className="text-brand-orange">Pesca</span>
          {selectedCategorySlug ? (
            <>
              <span>/</span>
              <span className="text-brand-ink">{categories.find((item) => item.slug === selectedCategorySlug)?.name}</span>
            </>
          ) : null}
        </nav>

        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-7">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Categorías</p>
              <div className="mt-4 space-y-2">
                {[
                  {
                    href: '/productos',
                    label: 'Todas',
                    active: !selectedCategorySlug,
                  },
                  ...categories.map((item) => ({
                    href: `/productos?categoria=${item.slug}`,
                    label: item.name,
                    active: item.slug === selectedCategorySlug,
                  })),
                ].map((item) => (
                  <Link
                    key={item.href}
                    className={`flex items-center justify-between rounded-[14px] px-4 py-3 text-sm font-bold ${
                      item.active ? 'bg-brand-orange text-white shadow-[0_12px_22px_rgba(240,90,25,0.24)]' : 'bg-white text-slate-600'
                    }`}
                    href={item.href}
                  >
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Rango de precio</p>
              <div className="mt-4 h-1.5 rounded-full bg-slate-200">
                <div className="h-full w-2/5 rounded-full bg-brand-orange" />
              </div>
              <div className="mt-3 flex justify-between text-xs font-bold text-slate-400">
                <span>$0</span>
                <span>$50.000</span>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Subcategorías</p>
              <div className="mt-4 space-y-2 text-sm text-slate-500">
                {['Telescópicas', 'Enchufables', 'Grafito', 'Fibra de vidrio'].map((item) => (
                  <label key={item} className="flex items-center gap-3">
                    <input className="rounded border-slate-300" type="checkbox" />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          <section>
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-brand-ink">
                  {categories.find((item) => item.slug === selectedCategorySlug)?.name ?? 'Cañas de Pesca'}
                </h1>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <form action="/productos" className="flex items-center gap-2">
                  {selectedCategorySlug ? <input name="categoria" type="hidden" value={selectedCategorySlug} /> : null}
                  <input
                    className="h-11 rounded-full border border-slate-200 bg-white px-5 text-sm outline-none"
                    defaultValue={searchTerm}
                    name="q"
                    placeholder="Buscar productos..."
                    type="search"
                  />
                </form>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold text-slate-500">Ordenar por:</span>
                  <div className="rounded-full bg-white px-4 py-2 font-bold text-brand-ink shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
                    Más populares
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="mt-8 flex items-center justify-center gap-2">
              {['‹', '1', '2', '3', '›'].map((item) => (
                <span
                  key={item}
                  className={`flex h-9 w-9 items-center justify-center rounded-[10px] text-sm font-black ${
                    item === '1' ? 'bg-brand-orange text-white' : 'bg-white text-slate-400'
                  }`}
                >
                  {item}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>

      <StoreFooter />
    </div>
  )
}
