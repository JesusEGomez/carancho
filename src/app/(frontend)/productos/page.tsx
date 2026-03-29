import Link from 'next/link'

import { StoreFooter } from '@/components/store/StoreFooter'
import { StoreHeader } from '@/components/store/StoreHeader'
import { ProductCard } from '@/components/store/ProductCard'
import { getCatalogData } from '@/lib/store'

type Props = {
  searchParams: Promise<{
    categoria?: string
    page?: string
    q?: string
  }>
}

export default async function ProductsPage({ searchParams }: Props) {
  const { categoria, page, q } = await searchParams
  const requestedPage = Number(page ?? '1')
  const {
    categories,
    currentPage,
    products,
    searchTerm,
    selectedCategory,
    selectedParentCategory,
    subcategories,
    totalPages,
    totalProducts,
  } = await getCatalogData(q, categoria, requestedPage)
  const selectedCategorySlug = selectedCategory?.slug ?? null
  const pageTitle = selectedCategory?.name ?? 'Cañas de Pesca'
  const safeCurrentPage = currentPage ?? 1
  const subcategoryDescription = selectedParentCategory
    ? `Filtrá dentro de ${selectedParentCategory.name}.`
    : 'Elegí una categoría principal para ver sus subcategorías.'
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  const buildCatalogHref = (nextPage?: number) => {
    const params = new URLSearchParams()

    if (selectedCategorySlug) {
      params.set('categoria', selectedCategorySlug)
    }

    if (searchTerm) {
      params.set('q', searchTerm)
    }

    if (nextPage && nextPage > 1) {
      params.set('page', String(nextPage))
    }

    const query = params.toString()
    return query ? `/productos?${query}` : '/productos'
  }

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
                {subcategories.length ? (
                  subcategories.map((item) => (
                    <Link
                      key={item.id}
                      className={`flex items-center justify-between rounded-[14px] px-4 py-3 text-sm font-bold ${
                        item.slug === selectedCategorySlug
                          ? 'bg-brand-orange text-white shadow-[0_12px_22px_rgba(240,90,25,0.24)]'
                          : 'bg-white text-slate-600'
                      }`}
                      href={`/productos?categoria=${item.slug}`}
                    >
                      <span>{item.name}</span>
                    </Link>
                  ))
                ) : (
                  <p className="rounded-[14px] bg-white px-4 py-3 text-sm text-slate-500">{subcategoryDescription}</p>
                )}
              </div>
            </div>
          </aside>

          <section>
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-brand-ink">{pageTitle}</h1>
                <p className="mt-2 text-sm text-slate-500">
                  {totalProducts} producto{totalProducts === 1 ? '' : 's'} encontrados
                </p>
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
              {products.length ? (
                products.map((product) => <ProductCard key={product.id} product={product} />)
              ) : (
                <div className="rounded-[28px] border border-slate-200 bg-white p-8 md:col-span-2 xl:col-span-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Sin resultados</p>
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
                        href={selectedCategorySlug ? `/productos?categoria=${selectedCategorySlug}` : '/productos'}
                      >
                        Quitar búsqueda
                      </Link>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {totalPages > 1 ? (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Link
                  aria-disabled={safeCurrentPage === 1}
                  className={`flex h-9 min-w-9 items-center justify-center rounded-[10px] px-3 text-sm font-black ${
                    safeCurrentPage === 1 ? 'pointer-events-none bg-slate-100 text-slate-300' : 'bg-white text-slate-500'
                  }`}
                  href={buildCatalogHref(safeCurrentPage - 1)}
                >
                  ‹
                </Link>
                {pageNumbers.map((pageNumber) => (
                  <Link
                    key={pageNumber}
                    className={`flex h-9 min-w-9 items-center justify-center rounded-[10px] px-3 text-sm font-black ${
                      pageNumber === safeCurrentPage ? 'bg-brand-orange text-white' : 'bg-white text-slate-400'
                    }`}
                    href={buildCatalogHref(pageNumber)}
                  >
                    {pageNumber}
                  </Link>
                ))}
                <Link
                  aria-disabled={safeCurrentPage === totalPages}
                  className={`flex h-9 min-w-9 items-center justify-center rounded-[10px] px-3 text-sm font-black ${
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
