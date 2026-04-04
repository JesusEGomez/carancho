'use client'

import { api } from '@/lib/client/api'
import type { StoreContactRecord } from '@/services/adminApi'

export async function fetchStoreContact() {
  const response = await api.get<{ docs: StoreContactRecord[] }>('/store-contacts?limit=1&sort=createdAt')
  return response.data.docs[0] ?? null
}
