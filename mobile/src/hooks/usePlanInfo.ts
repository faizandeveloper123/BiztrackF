import { useCallback } from 'react';
import { useCachedApi } from './useCachedApi';
import { apiService } from '../services/ApiService';

export interface PlanInfo {
  planType: string;
  planName: string;
  features: string[];
  maxProjects: number;
  maxUsers: number;
  subscriptionStatus: string;
}

export function usePlanInfo() {
  const fetchPlan = useCallback(
    () => apiService.get('/tenants/current/subscription'),
    [],
  );

  const {
    data: subscriptionData,
    loading,
    error,
    refetch,
    clearCache,
  } = useCachedApi('plan_info', fetchPlan, {
    ttl: 5 * 60 * 1000,
    refetchOnAppFocus: true,
  });

  const planInfo: PlanInfo | null = subscriptionData
    ? (() => {
        if (subscriptionData.success && subscriptionData.subscription) {
          const subscription = subscriptionData.subscription;
          const plan = subscription.plan;

          return {
            planType: plan.planType || 'unknown',
            planName: plan.name || 'Unknown Plan',
            features: plan.features || [],
            maxProjects: plan.maxProjects || 0,
            maxUsers: plan.maxUsers || 0,
            subscriptionStatus: subscription.status || 'unknown',
          };
        }
        return {
          planType: 'workshop',
          planName: 'Workshop Master',
          features: [
            'Project Management',
          ],
          maxProjects: 100,
          maxUsers: 50,
          subscriptionStatus: 'active',
        };
      })()
    : null;

  return {
    planInfo,
    loading,
    error,
    refreshPlanInfo: refetch,
    clearPlanCache: clearCache,
  };
}
