import { useCallback } from 'react';
import { useCachedApi } from './useCachedApi';
import { apiClient } from '../services/apiClient';

export interface DashboardData {
  projects: {
    stats: {
      total: number;
      active: number;
      completed: number;
      overdue: number;
    };
    recent: Array<{
      id: string;
      name: string;
      completionPercent: number;
      status: string;
      dueDate: string;
    }>;
  };
  users: {
    total: number;
    active: number;
    recent: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      lastActive: string;
    }>;
  };
  financials: {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    monthlyTrend: Array<{
      month: string;
      revenue: number;
      expenses: number;
    }>;
  };
  inventory: {
    totalItems: number;
    lowStock: number;
    outOfStock: number;
    recentMovements: Array<{
      id: string;
      itemName: string;
      type: string;
      quantity: number;
      timestamp: string;
    }>;
  };
  planInfo: {
    planType: string;
    features: string[];
  };
  timestamp?: string;
  tenant_id: string;
}

export const useDashboard = () => {
  const fetchDashboard = useCallback(
    () => apiClient.get<DashboardData>('/dashboard/overview'),
    [],
  );

  const { data, loading, error, refetch, clearCache } = useCachedApi<DashboardData>(
    'dashboard_overview',
    fetchDashboard,
    { ttl: 30000, refetchOnAppFocus: true },
  );

  return {
    data,
    loading,
    error,
    refetch,
    clearCache,
  };
};
