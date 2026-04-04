'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchPrimaryStoreContact, saveStoreContact, type StoreContactRecord } from '@/services/adminApi'

export const STORE_CONTACT_QUERY_KEY = ['admin-store-contact']

export function useAdminStoreContact() {
  return useQuery<StoreContactRecord | null, Error>({
    queryKey: STORE_CONTACT_QUERY_KEY,
    queryFn: fetchPrimaryStoreContact,
  })
}

export function useUpsertStoreContact() {
  const queryClient = useQueryClient()

  return useMutation<
    StoreContactRecord,
    Error,
    {
      id: string | null
      payload: Record<string, unknown>
    }
  >({
    mutationFn: ({ id, payload }) => saveStoreContact(id, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(STORE_CONTACT_QUERY_KEY, data)
      void queryClient.invalidateQueries({ queryKey: STORE_CONTACT_QUERY_KEY })
    },
  })
}
