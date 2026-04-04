'use client'

import { useQuery } from '@tanstack/react-query'

import { fetchNavigationCategories } from '@/services/store/navigationApi'
import type { CategoryOption } from '@/services/adminApi'

export const NAVIGATION_CATEGORIES_QUERY_KEY = ['store-navigation-categories']

export function useNavigationCategories() {
  return useQuery<{ docs: CategoryOption[] }, Error>({
    queryKey: NAVIGATION_CATEGORIES_QUERY_KEY,
    queryFn: fetchNavigationCategories,
  })
}
