'use client'

import { api } from '@/lib/client/api'
import type { CategoryOption } from '@/services/adminApi'

export async function fetchNavigationCategories() {
  const query = new URLSearchParams({
    depth: '0',
    limit: '50',
    sort: 'name',
    'where[parent][exists]': 'false',
    'where[showInNavigation][equals]': 'true',
  })

  const response = await api.get<{ docs: CategoryOption[] }>(`/categories?${query.toString()}`)
  return response.data
}
