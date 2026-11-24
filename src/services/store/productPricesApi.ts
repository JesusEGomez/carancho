'use client'

import { api } from '@/lib/client/api'
import type { FreshProductPrice } from '@/lib/cart'

/**
 * Reads current prices through the public products REST API: its read access already limits
 * anonymous visitors to published products, and `select` keeps the payload to price fields.
 */
export async function fetchProductPrices(ids: number[]): Promise<FreshProductPrice[]> {
  if (ids.length === 0) {
    return []
  }

  const query = new URLSearchParams({
    depth: '0',
    limit: String(ids.length),
    'select[cardPrice]': 'true',
    'select[price]': 'true',
    'select[stock]': 'true',
    'select[transferPrice]': 'true',
    'where[id][in]': ids.join(','),
    'where[status][equals]': 'published',
  })
  const response = await api.get<{ docs: FreshProductPrice[] }>(`/products?${query.toString()}`)

  return response.data.docs
}
