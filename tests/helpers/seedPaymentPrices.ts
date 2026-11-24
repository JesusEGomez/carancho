import path from 'node:path'

import { getPayload, type Payload } from 'payload'

import config from '../../src/payload.config.js'
import type { Order, Product } from '../../src/payload-types.js'

const imagePath = path.resolve(process.cwd(), 'public/images/heroes/carancho-home-hero.png')
const MEDIA_ALT = 'Producto demo pagos e2e'
const CATEGORY_SLUG = 'e2e-medios-de-pago'

export const paymentPriceProducts = {
  cashOnly: {
    name: 'E2E Reel solo efectivo',
    price: 10000,
    slug: 'e2e-reel-solo-efectivo',
  },
  multiPrice: {
    cardPrice: 12000,
    compareAtPrice: 16000,
    name: 'E2E Cana multi precio',
    price: 10000,
    slug: 'e2e-cana-multi-precio',
    transferPrice: 10500,
  },
} as const

export type SeededPaymentProducts = {
  cashOnly: Product
  multiPrice: Product
}

async function getClient(): Promise<Payload> {
  return getPayload({ config })
}

async function findOneBySlug<T>(payload: Payload, collection: 'categories' | 'products', slug: string) {
  const result = await payload.find({
    collection,
    depth: 0,
    limit: 1,
    where: { slug: { equals: slug } },
  })

  return (result.docs[0] as T | undefined) ?? null
}

/**
 * Upserts the products used by the payment-method price e2e specs.
 * Products are updated in place instead of deleted, because earlier orders may reference them.
 */
export async function seedPaymentPriceCatalog(): Promise<SeededPaymentProducts> {
  const payload = await getClient()

  const existingMedia = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 1,
    where: { alt: { equals: MEDIA_ALT } },
  })
  const media =
    existingMedia.docs[0] ??
    (await payload.create({
      collection: 'media',
      data: { alt: MEDIA_ALT },
      filePath: imagePath,
    }))

  const categoryData = {
    description: 'Categoria de prueba para precios por medio de pago.',
    featured: false,
    heroImage: media.id,
    name: 'E2E Medios de pago',
    slug: CATEGORY_SLUG,
  }
  const existingCategory = await findOneBySlug<{ id: number }>(payload, 'categories', CATEGORY_SLUG)
  const category = existingCategory
    ? await payload.update({ collection: 'categories', data: categoryData, draft: false, id: existingCategory.id })
    : await payload.create({ collection: 'categories', data: categoryData, draft: false })

  const baseProduct = {
    badges: [] as Product['badges'],
    category: category.id,
    description: 'Producto semilla para validar precios por medio de pago.',
    featuredImage: media.id,
    gallery: [media.id],
    isFeatured: false,
    shortDescription: 'Producto de prueba para medios de pago.',
    status: 'published' as const,
    stock: 50,
  }

  const upsertProduct = async (data: Record<string, unknown> & { slug: string }) => {
    const existing = await findOneBySlug<Product>(payload, 'products', data.slug)

    return existing
      ? payload.update({ collection: 'products', data, draft: false, id: existing.id })
      : payload.create({ collection: 'products', data: data as never, draft: false })
  }

  const cashOnly = await upsertProduct({
    ...baseProduct,
    cardPrice: null,
    compareAtPrice: null,
    name: paymentPriceProducts.cashOnly.name,
    price: paymentPriceProducts.cashOnly.price,
    showInOffers: false,
    slug: paymentPriceProducts.cashOnly.slug,
    transferPrice: null,
  })

  const multiPrice = await upsertProduct({
    ...baseProduct,
    cardPrice: paymentPriceProducts.multiPrice.cardPrice,
    compareAtPrice: paymentPriceProducts.multiPrice.compareAtPrice,
    name: paymentPriceProducts.multiPrice.name,
    price: paymentPriceProducts.multiPrice.price,
    showInOffers: true,
    slug: paymentPriceProducts.multiPrice.slug,
    transferPrice: paymentPriceProducts.multiPrice.transferPrice,
  })

  return { cashOnly: cashOnly as Product, multiPrice: multiPrice as Product }
}

export async function setShowInOffers(productId: number, showInOffers: boolean) {
  const payload = await getClient()

  await payload.update({ collection: 'products', data: { showInOffers }, draft: false, id: productId })
}

/** Published offer products other than the given ids; used to know whether "no offers" can be asserted. */
export async function countOtherOfferProducts(excludedIds: number[]) {
  const payload = await getClient()
  const result = await payload.count({
    collection: 'products',
    where: {
      and: [
        { showInOffers: { equals: true } },
        { status: { equals: 'published' } },
        { id: { not_in: excludedIds } },
      ],
    },
  })

  return result.totalDocs
}

export async function getOrder(orderId: number): Promise<Order> {
  const payload = await getClient()

  return payload.findByID({ collection: 'orders', depth: 0, id: orderId })
}

/** Removes the orders created by these specs so the dev database does not accumulate test orders. */
export async function deleteOrders(orderIds: number[]) {
  if (orderIds.length === 0) {
    return
  }

  const payload = await getClient()

  await payload.delete({ collection: 'orders', where: { id: { in: orderIds } } })
}
