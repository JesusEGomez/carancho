import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { StoreFooter } from '@/components/store/StoreFooter'
import { StoreHeader } from '@/components/store/StoreHeader'
import { ProductImageGallery } from '@/components/store/ProductImageGallery'
import { ProductPurchasePanel } from '@/components/store/ProductPurchasePanel'
import { RelatedProductsCarousel } from '@/components/store/RelatedProductsCarousel'
import { formatCurrency } from '@/lib/formatCurrency'
import { getProductStockPresentation } from '@/lib/product-stock'
import { getProductBySlug } from '@/lib/store'
import { absoluteUrl, serializeJsonLd } from '@/lib/seo'

type Props = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getProductBySlug(slug)

  if (!data) {
    return {
      robots: {
        follow: false,
        index: false,
      },
      title: 'Producto no encontrado',
    }
  }

  const { product } = data
  const image = product.featuredImage?.url

  return {
    alternates: {
      canonical: `/productos/${product.slug}`,
    },
    description: product.shortDescription,
    openGraph: {
      description: product.shortDescription,
      images: image ? [{ alt: product.featuredImage.alt, url: image }] : undefined,
      title: product.name,
      type: 'website',
      url: `/productos/${product.slug}`,
    },
    title: product.name,
    twitter: {
      card: 'summary_large_image',
      description: product.shortDescription,
      images: image ? [image] : undefined,
      title: product.name,
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const data = await getProductBySlug(slug)

  if (!data) {
    notFound()
  }

  const { product, relatedProducts } = data
  const features = product.features?.filter((feature) => feature.label.trim().length > 0) ?? []
  const specifications =
    product.specifications?.filter((specification) => specification.label.trim().length > 0 && specification.value.trim().length > 0) ?? []
  const showFeatures = (product.showFeatures ?? features.length > 0) && features.length > 0
  const showSpecifications = (product.showSpecifications ?? specifications.length > 0) && specifications.length > 0
  const gallery = [product.featuredImage, ...(product.gallery ?? [])].filter(
    (item, index, items): item is Extract<typeof item, object> =>
      typeof item === 'object' &&
      item !== null &&
      items.findIndex((candidate) => typeof candidate === 'object' && candidate !== null && candidate.id === item.id) === index,
  )
  const stockPresentation = getProductStockPresentation(product.stock)
  const productUrl = absoluteUrl(`/productos/${product.slug}`)
  const productImages = gallery
    .map((image) => image.url)
    .filter((url): url is string => Boolean(url))
    .map((url) => (url.startsWith('http') ? url : absoluteUrl(url)))
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    category: product.category.name,
    description: product.shortDescription,
    image: productImages,
    name: product.name,
    offers: {
      '@type': 'Offer',
      availability:
        product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      price: product.price,
      priceCurrency: 'ARS',
      url: productUrl,
    },
    url: productUrl,
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        item: absoluteUrl('/'),
        name: 'Inicio',
        position: 1,
      },
      {
        '@type': 'ListItem',
        item: absoluteUrl('/productos'),
        name: 'Productos',
        position: 2,
      },
      {
        '@type': 'ListItem',
        item: productUrl,
        name: product.name,
        position: 3,
      },
    ],
  }

  return (
    <div className="min-h-screen bg-white">
      <script
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd) }}
        type="application/ld+json"
      />
      <script
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
        type="application/ld+json"
      />
      <StoreHeader />

      <div className="container-shell py-8 sm:py-10">
        <nav className="mb-7 flex items-center gap-3 text-xs font-bold text-slate-400">
          <Link href="/" className="hover:text-brand-orange">
            Inicio
          </Link>
          <span>/</span>
          <Link href="/productos" className="hover:text-brand-orange">
            Pesca
          </Link>
          <span>/</span>
          <span className="text-brand-ink">{product.category.name}</span>
        </nav>

        <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <ProductImageGallery
            categoryName={product.category.name}
            images={gallery}
            productName={product.name}
          />

          <div className="pt-2">
            <span className={`pill-badge ${stockPresentation.badgeClassName}`}>{stockPresentation.label}</span>
            <h1 className="mt-4 text-4xl font-black leading-tight text-brand-ink sm:text-5xl">{product.name}</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-500">{product.shortDescription}</p>

            <div className="mt-6 flex items-end gap-3">
              <p className="text-4xl font-black text-brand-ink">{formatCurrency(product.price)}</p>
              {product.compareAtPrice ? (
                <>
                  <p className="text-base font-bold text-slate-400 line-through">{formatCurrency(product.compareAtPrice)}</p>
                  <span className="pill-badge bg-orange-50 text-brand-orange">-20%</span>
                </>
              ) : null}
            </div>

            <ProductPurchasePanel
              product={{
                featuredImageAlt: product.featuredImage?.alt,
                featuredImageUrl: product.featuredImage?.url,
                id: product.id,
                name: product.name,
                price: product.price,
                slug: product.slug,
                stock: product.stock,
              }}
            />

            <p className="mt-4 text-sm font-medium text-slate-500">{stockPresentation.helperText}</p>

            <div className="mt-8 grid gap-4 rounded-[22px] border border-slate-200 bg-white p-5 text-center sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-orange">Envío gratis</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-orange">Garantía oficial</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-orange">Pago seguro</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black text-brand-ink">Descripción del Producto</h2>
            <p className="mt-5 leading-8 text-slate-600">{product.description}</p>

            {showFeatures ? (
              <div className="mt-8 rounded-[22px] bg-white p-6 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
                <h3 className="text-lg font-black text-brand-ink">Características Generales</h3>
                <ul className="mt-5 space-y-3">
                  {features.map((feature, index) => (
                    <li key={`${feature.label}-${index}`} className="flex items-start gap-3 text-sm font-medium text-slate-600">
                      <span className="mt-2 h-2 w-2 rounded-full bg-emerald-500" />
                      <span>{feature.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {showSpecifications ? (
            <div className="rounded-[22px] bg-white p-6 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
              <h3 className="text-lg font-black text-brand-ink">Especificaciones Técnicas</h3>
              <div className="mt-5 divide-y divide-slate-100">
                {specifications.map((specification, index) => (
                  <div key={`${specification.label}-${index}`} className="flex items-center justify-between gap-4 py-4 text-sm">
                    <span className="font-semibold text-slate-500">{specification.label}</span>
                    <span className="text-right font-bold text-brand-ink">{specification.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <RelatedProductsCarousel products={relatedProducts} />
      </div>

      <StoreFooter />
    </div>
  )
}
