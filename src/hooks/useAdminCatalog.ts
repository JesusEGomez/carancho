'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  fetchCategories,
  fetchCategory,
  fetchDashboardStats,
  fetchProduct,
  fetchProducts,
  saveCategory,
  saveProduct,
  type CategoryOption,
  type DashboardStats,
  type ProductRecord,
} from '@/services/adminApi'
import { uploadMedia } from '@/lib/client/media'

export const DASHBOARD_STATS_QUERY_KEY = ['admin-dashboard-stats']
export const CATEGORIES_QUERY_KEY = ['admin-categories']
export const PRODUCTS_QUERY_KEY = ['admin-products']

export function useDashboardStats() {
  return useQuery<DashboardStats, Error>({
    queryKey: DASHBOARD_STATS_QUERY_KEY,
    queryFn: fetchDashboardStats,
  })
}

export function useCategories() {
  return useQuery<{ docs: CategoryOption[] }, Error>({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: fetchCategories,
  })
}

export function useProducts(search = '') {
  return useQuery<{ docs: ProductRecord[] }, Error>({
    queryKey: [...PRODUCTS_QUERY_KEY, search],
    queryFn: () => fetchProducts(search),
  })
}

export function useProduct(id: string) {
  return useQuery<ProductRecord, Error>({
    enabled: Boolean(id),
    queryKey: ['admin-product', id],
    queryFn: () => fetchProduct(id),
  })
}

export function useCategory(id: string) {
  return useQuery<CategoryOption, Error>({
    enabled: Boolean(id),
    queryKey: ['admin-category', id],
    queryFn: () => fetchCategory(id),
  })
}

export function useUpsertCategory() {
  const queryClient = useQueryClient()

  return useMutation<
    CategoryOption,
    Error,
    {
      heroAlt: string
      heroFile?: File | null
      id: string | null
      payload: Record<string, unknown>
    }
  >({
    mutationFn: async ({ heroAlt, heroFile, id, payload }) => {
      let heroImage = payload.heroImage

      if (heroFile) {
        const media = await uploadMedia(heroFile, heroAlt)
        heroImage = media.id
      }

      return saveCategory(id, {
        ...payload,
        heroImage: heroImage ?? null,
      })
    },
    onSuccess: (category, variables) => {
      queryClient.setQueryData<{ docs: CategoryOption[] } | undefined>(CATEGORIES_QUERY_KEY, (current) => {
        if (!current) {
          return { docs: [category] }
        }

        const docs = current.docs.some((item) => item.id === category.id)
          ? current.docs.map((item) => (item.id === category.id ? category : item))
          : [...current.docs, category]

        return {
          docs: docs.sort((left, right) => (left?.name ?? '').localeCompare(right?.name ?? '')),
        }
      })

      void queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_QUERY_KEY })
      if (variables.id) {
        void queryClient.invalidateQueries({ queryKey: ['admin-category', variables.id] })
      }
    },
  })
}

export function useUpsertProduct() {
  const queryClient = useQueryClient()

  return useMutation<
    ProductRecord,
    Error,
    {
      id: string | null
      payload: Record<string, unknown>
      featuredFile?: File | null
      galleryFiles?: File[]
      galleryAlt: string
      galleryExistingIds?: number[]
      featuredAlt: string
    }
  >({
    mutationFn: async ({ featuredAlt, featuredFile, galleryAlt, galleryExistingIds, galleryFiles, id, payload }) => {
      let featuredImage = payload.featuredImage

      if (featuredFile) {
        const media = await uploadMedia(featuredFile, featuredAlt)
        featuredImage = media.id
      }

      const uploadedGallery = galleryFiles?.length
        ? await Promise.all(galleryFiles.map(async (file) => uploadMedia(file, galleryAlt)))
        : []

      if (!featuredImage) {
        throw new Error('La imagen principal es obligatoria')
      }

      return saveProduct(id, {
        ...payload,
        featuredImage,
        gallery: [...(galleryExistingIds ?? []), ...uploadedGallery.map((image) => image.id)],
      })
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_QUERY_KEY })
      if (variables.id) {
        void queryClient.invalidateQueries({ queryKey: ['admin-product', variables.id] })
      }
    },
  })
}
