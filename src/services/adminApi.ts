'use client'

export type CategoryOption = {
  id: number
  name: string
  slug: string
}

export type MediaRecord = {
  id: number
  url?: string | null
  alt: string
}

export type ProductRecord = {
  id: number
  name: string
  slug: string
  shortDescription: string
  description: string
  price: number
  compareAtPrice?: number | null
  stock: number
  status: 'published' | 'draft'
  isFeatured: boolean
  showFeatures?: boolean | null
  showSpecifications?: boolean | null
  badges?: ('nuevo' | 'oferta' | 'destacado')[] | null
  category: CategoryOption | number
  featuredImage?: number | MediaRecord | null
  gallery?: (MediaRecord | number)[] | null
  features?: { label: string }[] | null
  specifications?: { label: string; value: string }[] | null
}

export type DashboardStats = {
  totalProducts: number
  featuredProducts: number
  totalCategories: number
  lowStockProducts: number
}

function getToken() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem('carancho-admin-token')
}

async function apiRequest<T>(input: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const response = await fetch(input, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `JWT ${token}` } : {}),
      ...init?.headers,
    },
  })

  const data = (await response.json()) as T & {
    errors?: { message?: string }[]
    message?: string
  }

  if (!response.ok) {
    throw new Error(data.errors?.[0]?.message ?? data.message ?? 'Request failed')
  }

  return data
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [products, categories, featured, lowStock] = await Promise.all([
    apiRequest<{ totalDocs: number }>('/api/products?limit=1'),
    apiRequest<{ totalDocs: number }>('/api/categories?limit=1'),
    apiRequest<{ totalDocs: number }>('/api/products?limit=1&where[isFeatured][equals]=true'),
    apiRequest<{ totalDocs: number }>('/api/products?limit=1&where[stock][less_than]=5'),
  ])

  return {
    totalProducts: products.totalDocs,
    featuredProducts: featured.totalDocs,
    totalCategories: categories.totalDocs,
    lowStockProducts: lowStock.totalDocs,
  }
}

export async function fetchProducts(search = '') {
  const query = new URLSearchParams({
    depth: '1',
    limit: '100',
    sort: '-createdAt',
  })

  if (search.trim()) {
    query.set('where[or][0][name][contains]', search.trim())
    query.set('where[or][1][slug][contains]', search.trim())
  }

  return apiRequest<{ docs: ProductRecord[] }>(`/api/products?${query.toString()}`)
}

export async function fetchProduct(id: string) {
  return apiRequest<ProductRecord>(`/api/products/${id}?depth=1`)
}

export async function saveProduct(id: string | null, payload: Record<string, unknown>) {
  return apiRequest<ProductRecord>(id ? `/api/products/${id}` : '/api/products', {
    body: JSON.stringify(payload),
    method: id ? 'PATCH' : 'POST',
  })
}

export async function fetchCategories() {
  return apiRequest<{ docs: CategoryOption[] }>('/api/categories?limit=100&sort=order')
}

export async function saveCategory(payload: Record<string, unknown>) {
  return apiRequest<CategoryOption>('/api/categories', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}

export async function uploadMedia(file: File, alt: string) {
  const token = getToken()
  const body = new FormData()
  body.append('_payload', JSON.stringify({ alt }))
  body.append('file', file)

  const response = await fetch('/api/media', {
    body,
    headers: token ? { Authorization: `JWT ${token}` } : undefined,
    method: 'POST',
  })

  const data = (await response.json()) as
    | (MediaRecord & {
        errors?: { message?: string }[]
        message?: string
      })
    | {
        doc?: MediaRecord
        errors?: { message?: string }[]
        message?: string
      }

  const media = 'doc' in data && data.doc ? data.doc : data

  if (!response.ok) {
    throw new Error(data.errors?.[0]?.message ?? data.message ?? 'No fue posible subir la imagen')
  }

  if (!media || typeof media !== 'object' || !('id' in media) || !media.id) {
    throw new Error('La respuesta de media no incluyó un id válido')
  }

  return media
}
