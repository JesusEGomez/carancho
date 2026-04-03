'use client'

import { api } from '@/lib/client/api'

export type CategoryOption = {
  id: number
  name: string
  slug: string
  description?: string | null
  featured?: boolean | null
  showInNavigation?: boolean | null
  heroImage?: number | MediaRecord | null
  parent?: CategoryOption | number | null
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

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [products, categories, featured, lowStock] = await Promise.all([
    api.get<{ totalDocs: number }>('/products?limit=1'),
    api.get<{ totalDocs: number }>('/categories?limit=1'),
    api.get<{ totalDocs: number }>('/products?limit=1&where[isFeatured][equals]=true'),
    api.get<{ totalDocs: number }>('/products?limit=1&where[stock][less_than]=5'),
  ])

  return {
    totalProducts: products.data.totalDocs,
    featuredProducts: featured.data.totalDocs,
    totalCategories: categories.data.totalDocs,
    lowStockProducts: lowStock.data.totalDocs,
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

  const response = await api.get<{ docs: ProductRecord[] }>(`/products?${query.toString()}`)
  return response.data
}

export async function fetchProduct(id: string) {
  const response = await api.get<ProductRecord>(`/products/${id}?depth=1`)
  return response.data
}

export async function fetchCategory(id: string) {
  const response = await api.get<CategoryOption>(`/categories/${id}?depth=1`)
  return response.data
}

export async function saveProduct(id: string | null, payload: Record<string, unknown>) {
  const response = id
    ? await api.patch<ProductRecord>(`/products/${id}`, payload)
    : await api.post<ProductRecord>('/products', payload)

  return response.data
}

export async function fetchCategories() {
  const response = await api.get<{ docs: CategoryOption[] }>('/categories?depth=1&limit=200&sort=name')
  return response.data
}

export async function saveCategory(id: string | null, payload: Record<string, unknown>) {
  const response = id
    ? await api.patch<CategoryOption>(`/categories/${id}`, payload)
    : await api.post<CategoryOption>('/categories', payload)

  return response.data
}
