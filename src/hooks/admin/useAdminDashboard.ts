'use client'

import { useQuery } from '@tanstack/react-query'

import { fetchDashboardStats, type DashboardStats } from '@/services/adminApi'

export const DASHBOARD_STATS_QUERY_KEY = ['admin-dashboard-stats']

export function useDashboardStats() {
  return useQuery<DashboardStats, Error>({
    queryKey: DASHBOARD_STATS_QUERY_KEY,
    queryFn: fetchDashboardStats,
  })
}
