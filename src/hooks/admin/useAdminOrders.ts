'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  cancelOrder,
  fetchOrder,
  fetchOrders,
  saveOrderPaymentMethod,
  saveOrderStatus,
  type OrderRecord,
} from '@/services/adminApi'

export const ORDERS_QUERY_KEY = ['admin-orders']

export function useOrders() {
  return useQuery({
    queryFn: fetchOrders,
    queryKey: ORDERS_QUERY_KEY,
  })
}

export function useOrder(id: string) {
  return useQuery({
    enabled: Boolean(id),
    queryFn: () => fetchOrder(id),
    queryKey: [...ORDERS_QUERY_KEY, id],
  })
}

export function useUpdateOrderStatus() {
  const storeUpdatedOrder = useStoreUpdatedOrder()

  return useMutation<
    OrderRecord,
    Error,
    {
      id: string
      paymentProvider?: OrderRecord['paymentProvider']
      status: OrderRecord['status']
    }
  >({
    mutationFn: saveOrderStatus,
    onSuccess: storeUpdatedOrder,
  })
}

export function useUpdateOrderPaymentMethod() {
  const storeUpdatedOrder = useStoreUpdatedOrder()

  return useMutation<OrderRecord, Error, { id: string; paymentMethod: 'cash' | 'transfer' }>({
    mutationFn: saveOrderPaymentMethod,
    onSuccess: storeUpdatedOrder,
  })
}

export function useCancelOrder() {
  const storeUpdatedOrder = useStoreUpdatedOrder()

  return useMutation<OrderRecord, Error, { id: string }>({
    mutationFn: cancelOrder,
    onSuccess: storeUpdatedOrder,
  })
}

function useStoreUpdatedOrder() {
  const queryClient = useQueryClient()

  return (data: OrderRecord, variables: { id: string }) => {
    queryClient.setQueryData<OrderRecord | undefined>([...ORDERS_QUERY_KEY, variables.id], data)
    void queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY })
    void queryClient.invalidateQueries({ queryKey: [...ORDERS_QUERY_KEY, variables.id] })
  }
}
