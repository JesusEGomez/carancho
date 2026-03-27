import path from 'node:path'

import { getPayload } from 'payload'

import config from '../src/payload.config.js'
import { previewCategories, previewProducts } from '../src/lib/storePreview'

type SeedMediaInput = {
  alt: string
  url?: string | null
}

type MediaLike = {
  alt: string
  url?: string | null
}

const seedAdmin = {
  email: process.env.SEED_ADMIN_EMAIL || 'admin@carancho.test',
  name: process.env.SEED_ADMIN_NAME || 'Carancho Admin',
  password: process.env.SEED_ADMIN_PASSWORD || 'Carancho123!',
  role: 'admin' as const,
}

const relation = <T>(value: number | T | null | undefined) =>
  (typeof value === 'object' && value !== null ? value : null) as T | null
const fallbackMediaPath = path.resolve(process.cwd(), 'public/images/heroes/carancho-home-hero.png')

async function upsertMedia(payload: Awaited<ReturnType<typeof getPayload>>, input: SeedMediaInput) {
  const existing = await payload.find({
    collection: 'media',
    limit: 1,
    pagination: false,
    where: {
      alt: {
        equals: input.alt,
      },
    },
  })

  if (existing.docs[0]) {
    return payload.update({
      collection: 'media',
      id: existing.docs[0].id,
      data: {
        alt: input.alt,
        url: input.url ?? null,
      },
    })
  }

  const created = await payload.create({
    collection: 'media',
    data: {
      alt: input.alt,
    },
    filePath: fallbackMediaPath,
  })

  return payload.update({
    collection: 'media',
    id: created.id,
    data: {
      alt: input.alt,
      url: input.url ?? null,
    },
  })
}

async function seedAdminUser(payload: Awaited<ReturnType<typeof getPayload>>) {
  const existing = await payload.find({
    collection: 'users',
    limit: 1,
    pagination: false,
    where: {
      email: {
        equals: seedAdmin.email,
      },
    },
  })

  if (existing.docs[0]) {
    return payload.update({
      collection: 'users',
      id: existing.docs[0].id,
      data: seedAdmin,
    })
  }

  return payload.create({
    collection: 'users',
    data: seedAdmin,
  })
}

async function main() {
  const payload = await getPayload({ config })

  const admin = await seedAdminUser(payload)

  const categoryMediaBySlug = new Map<string, number>()

  for (const category of previewCategories) {
    const hero = category.heroImage

    if (hero?.alt) {
      const media = await upsertMedia(payload, {
        alt: hero.alt,
        url: hero.url ?? null,
      })

      categoryMediaBySlug.set(category.slug, media.id)
    }
  }

  const categoryIdBySlug = new Map<string, number>()

  for (const category of previewCategories) {
    const existing = await payload.find({
      collection: 'categories',
      limit: 1,
      pagination: false,
      where: {
        slug: {
          equals: category.slug,
        },
      },
    })

    const data = {
      description: category.description ?? undefined,
      featured: category.featured ?? true,
      heroImage: categoryMediaBySlug.get(category.slug),
      name: category.name,
      order: category.order ?? 0,
      slug: category.slug,
    }

    const saved = existing.docs[0]
      ? await payload.update({
          collection: 'categories',
          id: existing.docs[0].id,
          data,
        })
      : await payload.create({
          collection: 'categories',
          data,
        })

    categoryIdBySlug.set(category.slug, saved.id)
  }

  for (const product of previewProducts) {
    const featuredImage = relation<MediaLike>(product.featuredImage)

    if (!featuredImage) {
      throw new Error(`Missing featured image for product "${product.slug}"`)
    }

    const categoryId = categoryIdBySlug.get(product.category.slug)

    if (!categoryId) {
      throw new Error(`Missing category for product "${product.slug}"`)
    }

    const featuredMedia = await upsertMedia(payload, {
      alt: featuredImage.alt,
      url: featuredImage.url ?? null,
    })

    const gallery = await Promise.all(
      (product.gallery ?? []).map(async (image, index) => {
        const media = relation<MediaLike>(image)

        return upsertMedia(payload, {
          alt: media?.alt || `${product.name} gallery ${index + 1}`,
          url: media?.url ?? null,
        })
      }),
    )

    const existing = await payload.find({
      collection: 'products',
      limit: 1,
      pagination: false,
      where: {
        slug: {
          equals: product.slug,
        },
      },
    })

    const data = {
      badges: product.badges ?? [],
      category: categoryId,
      compareAtPrice: product.compareAtPrice ?? undefined,
      description: product.description,
      featuredImage: featuredMedia.id,
      features: (product.features ?? []).map((feature) => ({
        label: feature.label,
      })),
      gallery: gallery.map((image) => image.id),
      isFeatured: product.isFeatured ?? false,
      name: product.name,
      price: product.price,
      shortDescription: product.shortDescription,
      slug: product.slug,
      specifications: (product.specifications ?? []).map((specification) => ({
        label: specification.label,
        value: specification.value,
      })),
      status: product.status,
      stock: product.stock,
    }

    await (existing.docs[0]
      ? payload.update({
          collection: 'products',
          draft: false,
          id: existing.docs[0].id,
          data,
        })
      : payload.create({
          collection: 'products',
          draft: false,
          data,
        }))
  }

  console.log(
    JSON.stringify(
      {
        admin: {
          email: admin.email,
          password: seedAdmin.password,
        },
        categories: previewCategories.length,
        products: previewProducts.length,
      },
      null,
      2,
    ),
  )

  process.exit(0)
}

void main().catch((error) => {
  console.error(error)
  process.exit(1)
})
