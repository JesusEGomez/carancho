'use client'

import { useQuery } from '@tanstack/react-query'

import { fetchStoreContact } from '@/services/store/contactApi'
import type { StoreContactRecord } from '@/services/adminApi'

export const STORE_CONTACT_QUERY_KEY = ['store-contact']

export function useStoreContact() {
  return useQuery<StoreContactRecord | null, Error>({
    queryKey: STORE_CONTACT_QUERY_KEY,
    queryFn: fetchStoreContact,
  })
}
