'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  fetchCategories,
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

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation<CategoryOption, Error, Record<string, unknown>>({
    mutationFn: saveCategory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_QUERY_KEY })
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
