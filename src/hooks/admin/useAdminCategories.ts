'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { uploadMedia } from '@/lib/client/media'
import { DASHBOARD_STATS_QUERY_KEY } from '@/hooks/admin/useAdminDashboard'
import { NAVIGATION_CATEGORIES_QUERY_KEY } from '@/hooks/store/useStoreNavigation'
import { fetchCategories, fetchCategory, saveCategory, type CategoryOption } from '@/services/adminApi'

export const CATEGORIES_QUERY_KEY = ['admin-categories']

export function useCategories() {
  return useQuery<{ docs: CategoryOption[] }, Error>({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: fetchCategories,
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
      void queryClient.invalidateQueries({ queryKey: NAVIGATION_CATEGORIES_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_QUERY_KEY })
      if (variables.id) {
        void queryClient.invalidateQueries({ queryKey: ['admin-category', variables.id] })
      }
    },
  })
}
