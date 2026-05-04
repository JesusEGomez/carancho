'use client'

import { api } from '@/lib/client/api'
import type { CategoryOption } from '@/services/adminApi'

export async function fetchNavigationCategories() {
  const query = new URLSearchParams({
    depth: '1',
    limit: '200',
    sort: 'name',
  })

  query.set('where[isVisible][equals]', 'true')
  query.set('where[showInNavigation][equals]', 'true')

  const response = await api.get<{ docs: CategoryOption[] }>(`/categories?${query.toString()}`)
  return response.data
}
