import type { Where } from 'payload'
import type { Category, Media, Product } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { previewCategories, previewProducts } from '@/lib/storePreview'

export type ProductWithRelations = Product & {
  category: Category
  featuredImage: Media
  gallery?: Media[] | null
}

const CATALOG_PAGE_SIZE = 9

const relation = <T>(value: number | T | null | undefined) =>
  (typeof value === 'object' && value !== null ? value : null) as T | null

const getCategoryId = (category: Category | number | null | undefined) => {
  if (typeof category === 'number') {
    return category
  }

  if (category && typeof category === 'object') {
    return category.id
  }

  return null
}

const getParentCategoryId = (category: Category | null | undefined) => {
  if (!category?.parent) {
    return category?.id ?? null
  }

  return getCategoryId(category.parent)
}

const isTopLevelCategory = (category: Category) => !relation<Category>(category.parent)

const getPayloadSafely = async () => {
  try {
    return await getPayloadClient()
  } catch (error) {
    console.error('Storefront Payload bootstrap failed, falling back to preview data.', error)
    return null
  }
}

export async function getFeaturedCategories(limit?: number) {
  const payload = await getPayloadSafely()

  if (!payload) {
    return previewCategories.slice(0, limit ?? previewCategories.length).map((category) => ({
      ...category,
      heroImage: relation<Media>(category.heroImage),
    }))
  }

  try {
    const result = await payload.find({
      collection: 'categories',
      depth: 1,
      limit: 24,
      overrideAccess: false,
      sort: 'name',
      where: {
        and: [
          {
            featured: {
              equals: true,
            },
          },
          {
            parent: {
              exists: false,
            },
          },
        ],
      },
    })

    const docs = result.docs.length
      ? result.docs.map((category) => ({
          ...category,
          heroImage: relation<Media>(category.heroImage),
        }))
      : previewCategories

    return docs.slice(0, limit ?? docs.length).map((category) => ({
      ...category,
      heroImage: relation<Media>(category.heroImage),
    }))
  } catch (error) {
    console.error('Failed to load featured categories from Payload, using preview data.', error)
    return previewCategories.slice(0, limit ?? previewCategories.length).map((category) => ({
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

const DEFAULT_PRICE_RANGE_MAX = 50000
const SORT_OPTIONS = {
  newest: '-createdAt',
  featured: '-isFeatured',
  priceAsc: 'price',
  priceDesc: '-price',
} as const

export type CatalogSort = keyof typeof SORT_OPTIONS

const DEFAULT_CATALOG_SORT: CatalogSort = 'featured'

const buildCombinedWhere = (...conditions: Array<Where | null>) => {
  const validConditions = conditions.filter(Boolean) as Where[]

  if (!validConditions.length) {
    return {}
  }

  if (validConditions.length === 1) {
    return validConditions[0]
  }

  return {
    and: validConditions,
  } satisfies Where
}

export async function getCatalogData(
  search?: string,
  categorySlug?: string,
  page = 1,
  maxPrice?: string,
  sort?: string,
) {
  const baseWhere: Where = {}
  const normalizedSearch = search?.trim() ?? ''
  const currentPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
  const requestedMaxPrice = Number(maxPrice)
  const hasRequestedMaxPrice = Number.isFinite(requestedMaxPrice) && requestedMaxPrice > 0
  const activeSort: CatalogSort = sort && sort in SORT_OPTIONS ? (sort as CatalogSort) : DEFAULT_CATALOG_SORT

  if (normalizedSearch) {
    baseWhere.or = [
      {
        name: {
          contains: normalizedSearch,
        },
      },
      {
        shortDescription: {
          contains: normalizedSearch,
        },
      },
    ]
  }

  const previewSelectedCategory = previewCategories.find((category) => category.slug === categorySlug)
  const fallbackBaseProducts = (previewSelectedCategory
    ? previewProducts.filter((product) => product.category.slug === previewSelectedCategory.slug)
    : previewProducts
  ).filter((product) => {
    const term = normalizedSearch.toLowerCase()

    if (!term) {
      return true
    }

    return (
      product.name.toLowerCase().includes(term) ||
      product.slug.toLowerCase().includes(term) ||
      product.shortDescription.toLowerCase().includes(term)
    )
  })
  const fallbackPriceRangeMax = Math.max(
    DEFAULT_PRICE_RANGE_MAX,
    ...fallbackBaseProducts.map((product) => product.price),
  )
  const fallbackActiveMaxPrice = hasRequestedMaxPrice
    ? Math.min(Math.floor(requestedMaxPrice), fallbackPriceRangeMax)
    : fallbackPriceRangeMax
  const fallbackProducts = fallbackBaseProducts.filter((product) => product.price <= fallbackActiveMaxPrice)
  const fallbackTotalPages = Math.max(1, Math.ceil(fallbackProducts.length / CATALOG_PAGE_SIZE))
  const fallbackPage = Math.min(currentPage, fallbackTotalPages)
  const fallbackPageProducts = fallbackProducts.slice(
    (fallbackPage - 1) * CATALOG_PAGE_SIZE,
    fallbackPage * CATALOG_PAGE_SIZE,
  )

  const payload = await getPayloadSafely()

  if (!payload) {
    const parentCategories = previewCategories
    const selectedCategory = previewCategories.find((category) => category.slug === categorySlug) ?? null

    return {
      activeSort,
      categories: parentCategories,
      currentPage: fallbackPage,
      maxPriceRange: fallbackPriceRangeMax,
      activeMaxPrice: fallbackActiveMaxPrice,
      products: fallbackPageProducts,
      selectedCategory: selectedCategory ?? previewSelectedCategory ?? null,
      selectedParentCategory: selectedCategory ?? previewSelectedCategory ?? null,
      searchTerm: normalizedSearch,
      subcategories: [],
      totalPages: fallbackTotalPages,
      totalProducts: fallbackProducts.length,
    }
  }

  try {
    const categoriesResult = await payload.find({
      collection: 'categories',
      depth: 1,
      limit: 50,
      overrideAccess: false,
      sort: 'name',
    })

    const categories = categoriesResult.docs.length
      ? categoriesResult.docs.map((category) => ({
          ...category,
          heroImage: relation<Media>(category.heroImage),
        }))
      : previewCategories

    const topLevelCategories = categories.filter(isTopLevelCategory)
    const selectedCategory = categories.find((category) => category.slug === categorySlug) ?? null
    const selectedParentCategory = selectedCategory
      ? categories.find((category) => category.id === getParentCategoryId(selectedCategory)) ?? selectedCategory
      : null
    const selectedSubcategories = selectedParentCategory
      ? categories.filter((category) => getParentCategoryId(category) === selectedParentCategory.id && category.id !== selectedParentCategory.id)
      : []

    if (selectedCategory) {
      if (selectedCategory.parent) {
        baseWhere.category = {
          equals: selectedCategory.id,
        }
      } else {
        baseWhere.category = {
          in: [selectedCategory.id, ...selectedSubcategories.map((category) => category.id)],
        }
      }
    }

    const maxPriceResult = await payload.find({
      collection: 'products',
      depth: 0,
      limit: 1,
      overrideAccess: false,
      sort: '-price',
      where: baseWhere,
    })
    const payloadPriceRangeMax = Math.max(DEFAULT_PRICE_RANGE_MAX, maxPriceResult.docs[0]?.price ?? 0)
    const activeMaxPrice = hasRequestedMaxPrice
      ? Math.min(Math.floor(requestedMaxPrice), payloadPriceRangeMax)
      : payloadPriceRangeMax
    const where = buildCombinedWhere(
      baseWhere,
      activeMaxPrice < payloadPriceRangeMax
        ? {
            price: {
              less_than_equal: activeMaxPrice,
            },
          }
        : null,
    )

    const productsResult = await payload.find({
      collection: 'products',
      depth: 2,
      limit: CATALOG_PAGE_SIZE,
      overrideAccess: false,
      page: currentPage,
      sort: SORT_OPTIONS[activeSort],
      where,
    })

    return {
      activeSort,
      categories: topLevelCategories,
      currentPage: productsResult.page,
      maxPriceRange: payloadPriceRangeMax,
      activeMaxPrice,
      products: productsResult.docs.map(normalizeProduct),
      selectedCategory: selectedCategory ?? previewSelectedCategory ?? null,
      selectedParentCategory,
      searchTerm: normalizedSearch,
      subcategories: selectedSubcategories,
      totalPages: productsResult.totalPages,
      totalProducts: productsResult.totalDocs,
    }
  } catch (error) {
    console.error('Failed to load catalog data from Payload, using preview data.', error)
    return {
      activeSort,
      categories: previewCategories,
      currentPage: fallbackPage,
      maxPriceRange: fallbackPriceRangeMax,
      activeMaxPrice: fallbackActiveMaxPrice,
      products: fallbackPageProducts,
      selectedCategory: previewSelectedCategory ?? null,
      selectedParentCategory: previewSelectedCategory ?? null,
      searchTerm: normalizedSearch,
      subcategories: [],
      totalPages: fallbackTotalPages,
      totalProducts: fallbackProducts.length,
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
