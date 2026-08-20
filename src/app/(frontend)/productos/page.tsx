import Link from 'next/link'
import type { Metadata } from 'next'

import { CatalogFilters } from '@/components/store/CatalogFilters'
import { CatalogSortSelect } from '@/components/store/CatalogSortSelect'
import { StoreFooter } from '@/components/store/StoreFooter'
import { StoreHeader } from '@/components/store/StoreHeader'
import { ProductCard } from '@/components/store/ProductCard'
import { getCatalogData } from '@/lib/store'

type Props = {
  searchParams: Promise<{
    categoria?: string
    maxPrice?: string
    page?: string
    q?: string
    sort?: string
  }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams
  const hasFilters = Boolean(
    params.categoria || params.maxPrice || params.page || params.q || params.sort,
  )

  return {
    alternates: {
      canonical: '/productos',
    },
    description:
      'Explorá el catálogo de pesca, caza, camping, náutica y aventura de Carancho Outdoors.',
    robots: hasFilters
      ? {
          follow: true,
          index: false,
        }
      : undefined,
    title: 'Catálogo de productos',
  }
}

export default async function ProductsPage({ searchParams }: Props) {
  const { categoria, maxPrice, page, q, sort } = await searchParams
  const requestedPage = Number(page ?? '1')
  const {
    activeMaxPrice,
    activeSort,
    categories,
    currentPage,
    maxPriceRange,
    products,
    searchTerm,
    selectedCategory,
    selectedParentCategory,
    subcategories,
    totalPages,
    totalProducts,
  } = await getCatalogData(q, categoria, requestedPage, maxPrice, sort)
  const selectedCategorySlug = selectedCategory?.slug ?? null
  const pageTitle = selectedCategory?.name ?? 'Productos'
  const safeCurrentPage = currentPage ?? 1
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)
  const hasActiveFilters = Boolean(
    selectedCategorySlug ||
    searchTerm ||
    activeMaxPrice < maxPriceRange ||
    activeSort !== 'featured',
  )
  const sortLabel =
    activeSort === 'newest'
      ? 'Más recientes'
      : activeSort === 'priceAsc'
        ? 'Precio ascendente'
        : activeSort === 'priceDesc'
          ? 'Precio descendente'
          : 'Destacados'

  const buildCatalogHref = (nextPage?: number) => {
    const params = new URLSearchParams()

    if (selectedCategorySlug) {
      params.set('categoria', selectedCategorySlug)
    }

    if (searchTerm) {
      params.set('q', searchTerm)
    }

    if (activeMaxPrice < maxPriceRange) {
      params.set('maxPrice', String(activeMaxPrice))
    }

    if (activeSort !== 'featured') {
      params.set('sort', activeSort)
    }

    if (nextPage && nextPage > 1) {
      params.set('page', String(nextPage))
    }

    const query = params.toString()
    return query ? `/productos?${query}` : '/productos'
  }

  return (
    <div className="min-h-screen bg-[#fbf7f1]">
      <StoreHeader showSearch={false} />

      <div className="container-shell py-8 sm:py-10">
        <nav className="mb-6 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-400 sm:mb-8">
          <Link href="/" className="hover:text-brand-orange">
            Inicio
          </Link>
          <span>/</span>
          <span className="text-brand-orange">Pesca</span>
          {selectedParentCategory ? (
            <>
              <span>/</span>
              <span className="text-brand-ink">{selectedParentCategory.name}</span>
            </>
          ) : null}
          {selectedCategory?.parent ? (
            <>
              <span>/</span>
              <span className="text-brand-ink">{selectedCategory.name}</span>
            </>
          ) : null}
        </nav>

        <div className="grid gap-8 xl:grid-cols-[270px_minmax(0,1fr)] xl:items-start xl:gap-10">
          <CatalogFilters
            activeMaxPrice={activeMaxPrice}
            categories={categories}
            maxPriceRange={maxPriceRange}
            selectedCategorySlug={selectedCategorySlug}
            selectedParentCategory={selectedParentCategory}
            subcategories={subcategories}
          />

          <section className="min-w-0">
            <div className="rounded-[24px] border border-[#e8dfd3] bg-[rgba(255,255,255,0.72)] p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] backdrop-blur sm:p-6 lg:p-7">
              <div className="hidden xl:block">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-brand-orange">
                  Catálogo
                </p>
                <h1 className="mt-3 text-[2.2rem] leading-[0.95] font-black tracking-tight text-brand-ink sm:text-[2.8rem]">
                  {pageTitle}
                </h1>
                <p className="mt-3 text-sm font-semibold text-slate-500">
                  {totalProducts} producto{totalProducts === 1 ? '' : 's'} encontrados
                </p>
              </div>

              <div className="mt-0 grid gap-4 xl:mt-6 xl:justify-self-stretch">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.1fr)_minmax(220px,0.9fr)_auto] xl:items-end">
                  <form action="/productos" className="grid gap-2">
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                      Buscar
                    </span>
                    {selectedCategorySlug ? (
                      <input name="categoria" type="hidden" value={selectedCategorySlug} />
                    ) : null}
                    {activeMaxPrice < maxPriceRange ? (
                      <input name="maxPrice" type="hidden" value={activeMaxPrice} />
                    ) : null}
                    {activeSort !== 'featured' ? (
                      <input name="sort" type="hidden" value={activeSort} />
                    ) : null}
                    <input
                      className="h-12 rounded-[16px] border border-slate-200 bg-white px-5 text-sm text-brand-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-orange"
                      defaultValue={searchTerm}
                      name="q"
                      placeholder="Buscar productos..."
                      type="search"
                    />
                  </form>

                  <div className="min-w-0">
                    <CatalogSortSelect value={activeSort} />
                  </div>

                  {hasActiveFilters ? (
                    <div className="hidden gap-2 xl:grid">
                      <span className="text-[11px] font-black uppercase tracking-[0.22em] text-transparent select-none">
                        Accion
                      </span>
                      <Link
                        className="inline-flex h-12 items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-bold text-slate-500 transition-colors hover:border-brand-orange hover:text-brand-orange md:col-span-2 xl:col-span-1 xl:min-w-[148px]"
                        href="/productos"
                      >
                        Limpiar filtros
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>

              {hasActiveFilters ? (
                <div className="mt-5 hidden flex-wrap items-center gap-2 border-t border-[rgba(148,163,184,0.16)] pt-5 xl:flex">
                  <span className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Activos
                  </span>
                  {selectedParentCategory ? (
                    <span className="rounded-full bg-[#fff1e8] px-3 py-1.5 text-xs font-bold text-brand-orange">
                      {selectedParentCategory.name}
                    </span>
                  ) : null}
                  {selectedCategory?.parent ? (
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
                      {selectedCategory.name}
                    </span>
                  ) : null}
                  {searchTerm ? (
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
                      Busqueda: {searchTerm}
                    </span>
                  ) : null}
                  {activeMaxPrice < maxPriceRange ? (
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
                      Hasta ${activeMaxPrice.toLocaleString('es-AR')}
                    </span>
                  ) : null}
                  {activeSort !== 'featured' ? (
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
                      {sortLabel}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:gap-6">
              {products.length ? (
                products.map((product) => <ProductCard key={product.id} product={product} />)
              ) : (
                <div className="col-span-2 rounded-[28px] border border-slate-200 bg-white p-8 lg:col-span-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Sin resultados
                  </p>
                  <h2 className="mt-3 text-2xl font-black text-brand-ink">
                    {selectedCategory
                      ? `No hay productos cargados en ${selectedCategory.name}.`
                      : 'No encontramos productos para esta búsqueda.'}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                    {selectedCategory
                      ? 'Probá con otra subcategoría o volvé a ver el catálogo completo para seguir explorando.'
                      : 'Probá limpiando la búsqueda o volviendo al catálogo completo.'}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      className="rounded-full bg-brand-orange px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white"
                      href="/productos"
                    >
                      Ver todo el catálogo
                    </Link>
                    {searchTerm ? (
                      <Link
                        className="rounded-full border border-slate-200 px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-brand-ink"
                        href={
                          selectedCategorySlug
                            ? `/productos?categoria=${selectedCategorySlug}`
                            : '/productos'
                        }
                      >
                        Quitar búsqueda
                      </Link>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {totalPages > 1 ? (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                <Link
                  aria-disabled={safeCurrentPage === 1}
                  className={`flex h-10 min-w-10 items-center justify-center rounded-[12px] px-3 text-sm font-black shadow-[0_8px_20px_rgba(15,23,42,0.05)] ${
                    safeCurrentPage === 1
                      ? 'pointer-events-none bg-slate-100 text-slate-300'
                      : 'bg-white text-slate-500'
                  }`}
                  href={buildCatalogHref(safeCurrentPage - 1)}
                >
                  ‹
                </Link>
                {pageNumbers.map((pageNumber) => (
                  <Link
                    key={pageNumber}
                    className={`flex h-10 min-w-10 items-center justify-center rounded-[12px] px-3 text-sm font-black shadow-[0_8px_20px_rgba(15,23,42,0.05)] ${
                      pageNumber === safeCurrentPage
                        ? 'bg-brand-orange text-white'
                        : 'bg-white text-slate-400'
                    }`}
                    href={buildCatalogHref(pageNumber)}
                  >
                    {pageNumber}
                  </Link>
                ))}
                <Link
                  aria-disabled={safeCurrentPage === totalPages}
                  className={`flex h-10 min-w-10 items-center justify-center rounded-[12px] px-3 text-sm font-black shadow-[0_8px_20px_rgba(15,23,42,0.05)] ${
                    safeCurrentPage === totalPages
                      ? 'pointer-events-none bg-slate-100 text-slate-300'
                      : 'bg-white text-slate-500'
                  }`}
                  href={buildCatalogHref(safeCurrentPage + 1)}
                >
                  ›
                </Link>
              </div>
            ) : null}
          </section>
        </div>
      </div>

      <StoreFooter />
    </div>
  )
}
