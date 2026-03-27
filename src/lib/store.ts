import type { Where } from 'payload'
import type { Category, Media, Product } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { previewCategories, previewProducts } from '@/lib/storePreview'

export type ProductWithRelations = Product & {
  category: Category
  featuredImage: Media
  gallery?: Media[] | null
}

const relation = <T>(value: number | T | null | undefined) =>
  (typeof value === 'object' && value !== null ? value : null) as T | null

const getPayloadSafely = async () => {
  try {
    return await getPayloadClient()
  } catch (error) {
    console.error('Storefront Payload bootstrap failed, falling back to preview data.', error)
    return null
  }
}

export async function getFeaturedCategories(limit = 3) {
  const payload = await getPayloadSafely()

  if (!payload) {
    return previewCategories.slice(0, limit).map((category) => ({
      ...category,
      heroImage: relation<Media>(category.heroImage),
    }))
  }

  try {
    const result = await payload.find({
      collection: 'categories',
      depth: 1,
      limit,
      overrideAccess: false,
      sort: 'order',
      where: {
        featured: {
          equals: true,
        },
      },
    })

    const docs = result.docs.length
      ? result.docs.map((category) => ({
          ...category,
          heroImage: relation<Media>(category.heroImage),
        }))
      : previewCategories

    return docs.slice(0, limit).map((category) => ({
      ...category,
      heroImage: relation<Media>(category.heroImage),
    }))
  } catch (error) {
    console.error('Failed to load featured categories from Payload, using preview data.', error)
    return previewCategories.slice(0, limit).map((category) => ({
      ...category,
      heroImage: relation<Media>(category.heroImage),
    }))
  }
}

export async function getFeaturedProducts(limit = 8) {
  const payload = await getPayloadSafely()

  if (!payload) {
    return previewProducts.slice(0, limit)
  }

  try {
    const result = await payload.find({
      collection: 'products',
      depth: 2,
      limit,
      overrideAccess: false,
      sort: '-createdAt',
      where: {
        isFeatured: {
          equals: true,
        },
      },
    })

    return (result.docs.length ? result.docs.map(normalizeProduct) : previewProducts).slice(0, limit)
  } catch (error) {
    console.error('Failed to load featured products from Payload, using preview data.', error)
    return previewProducts.slice(0, limit)
  }
}

export async function getCatalogData(search?: string, categorySlug?: string) {
  const where: Where = {}

  if (search?.trim()) {
    where.or = [
      {
        name: {
          contains: search.trim(),
        },
      },
      {
        shortDescription: {
          contains: search.trim(),
        },
      },
    ]
  }

  const previewSelectedCategory = previewCategories.find((category) => category.slug === categorySlug)
  const fallbackProducts = (previewSelectedCategory
    ? previewProducts.filter((product) => product.category.slug === previewSelectedCategory.slug)
    : previewProducts
  ).filter((product) => {
    const term = search?.trim().toLowerCase()

    if (!term) {
      return true
    }

    return (
      product.name.toLowerCase().includes(term) ||
      product.slug.toLowerCase().includes(term) ||
      product.shortDescription.toLowerCase().includes(term)
    )
  })

  const payload = await getPayloadSafely()

  if (!payload) {
    return {
      categories: previewCategories,
      products: fallbackProducts,
      selectedCategorySlug: previewSelectedCategory?.slug ?? null,
      searchTerm: search?.trim() ?? '',
    }
  }

  try {
    const categoriesResult = await payload.find({
      collection: 'categories',
      depth: 1,
      limit: 50,
      overrideAccess: false,
      sort: 'order',
    })

    const selectedCategory = categoriesResult.docs.find((category) => category.slug === categorySlug)

    if (selectedCategory) {
      where.category = {
        equals: selectedCategory.id,
      }
    }

    const productsResult = await payload.find({
      collection: 'products',
      depth: 2,
      limit: 24,
      overrideAccess: false,
      sort: '-createdAt',
      where,
    })

    const categories = categoriesResult.docs.length
      ? categoriesResult.docs.map((category) => ({
          ...category,
          heroImage: relation<Media>(category.heroImage),
        }))
      : previewCategories

    return {
      categories,
      products: productsResult.docs.length ? productsResult.docs.map(normalizeProduct) : fallbackProducts,
      selectedCategorySlug: selectedCategory?.slug ?? previewSelectedCategory?.slug ?? null,
      searchTerm: search?.trim() ?? '',
    }
  } catch (error) {
    console.error('Failed to load catalog data from Payload, using preview data.', error)
    return {
      categories: previewCategories,
      products: fallbackProducts,
      selectedCategorySlug: previewSelectedCategory?.slug ?? null,
      searchTerm: search?.trim() ?? '',
    }
  }
}

export async function getProductBySlug(slug: string) {
  const previewProduct = previewProducts.find((item) => item.slug === slug)
  const payload = await getPayloadSafely()

  if (!payload) {
    if (!previewProduct) {
      return null
    }

    return {
      product: previewProduct,
      relatedProducts: previewProducts
        .filter((item) => item.category.slug === previewProduct.category.slug && item.slug !== previewProduct.slug)
        .slice(0, 4),
    }
  }

  try {
    const result = await payload.find({
      collection: 'products',
      depth: 2,
      limit: 1,
      overrideAccess: false,
      where: {
        slug: {
          equals: slug,
        },
      },
    })

    const product = result.docs[0]

    if (!product && !previewProduct) {
      return null
    }

    if (!product && previewProduct) {
      return {
        product: previewProduct,
        relatedProducts: previewProducts
          .filter((item) => item.category.slug === previewProduct.category.slug && item.slug !== previewProduct.slug)
          .slice(0, 4),
      }
    }

    const normalized = normalizeProduct(product as Product)
    const categoryId = normalized.category.id

    const relatedResult = await payload.find({
      collection: 'products',
      depth: 2,
      limit: 4,
      overrideAccess: false,
      where: {
        and: [
          {
            category: {
              equals: categoryId,
            },
          },
          {
            id: {
              not_equals: normalized.id,
            },
          },
        ],
      },
    })

    return {
      product: normalized,
      relatedProducts: relatedResult.docs.map(normalizeProduct),
    }
  } catch (error) {
    console.error(`Failed to load product "${slug}" from Payload, using preview data.`, error)

    if (!previewProduct) {
      return null
    }

    return {
      product: previewProduct,
      relatedProducts: previewProducts
        .filter((item) => item.category.slug === previewProduct.category.slug && item.slug !== previewProduct.slug)
        .slice(0, 4),
    }
  }
}

function normalizeProduct(product: Product): ProductWithRelations {
  return {
    ...product,
    category: relation<Category>(product.category) as Category,
    featuredImage: relation<Media>(product.featuredImage) as Media,
    gallery:
      product.gallery?.map((image) => relation<Media>(image)).filter(Boolean) as Media[] | null | undefined,
  }
}
