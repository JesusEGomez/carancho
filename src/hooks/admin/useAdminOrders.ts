'use client'

import { useQuery } from '@tanstack/react-query'

import { fetchOrder, fetchOrders } from '@/services/adminApi'

export function useOrders() {
  return useQuery({
    queryFn: fetchOrders,
    queryKey: ['admin-orders'],
  })
}

export function useOrder(id: string) {
  return useQuery({
    enabled: Boolean(id),
    queryFn: () => fetchOrder(id),
    queryKey: ['admin-orders', id],
  })
}
