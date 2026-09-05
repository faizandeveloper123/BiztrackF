"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDashboard } from "@/src/hooks/useDashboard";
import { CustomerService } from "@/src/services/CustomerService";
import { NGO_ANNUAL_TARGET, type NgoSnapshot } from "@/src/types/ngoDashboard";

export function useNgoDashboard() {
  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboard();
  const [donorTotal, setDonorTotal] = useState<number | null>(null);
  const [extraLoading, setExtraLoading] = useState(true);

  const loadExtras = useCallback(async () => {
    setExtraLoading(true);
    try {
      const res = await CustomerService.getCustomers(0, 1);
      setDonorTotal(res.total ?? 0);
    } catch {
      setDonorTotal(0);
    } finally {
      setExtraLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExtras();
  }, [loadExtras]);

  const snapshot = useMemo<NgoSnapshot | null>(() => {
    if (!dashboardData) return null;

    const totalDonations = dashboardData.financials?.totalRevenue ?? 0;
    const activeDonors = donorTotal ?? dashboardData.users?.total ?? 0;
    const avgDonation =
      activeDonors > 0 ? Math.round(totalDonations / activeDonors) : 0;
    const completed = dashboardData.projects?.stats?.completed ?? 0;
    const totalProjects = dashboardData.projects?.stats?.total ?? 0;
    const impactScore =
      totalProjects > 0
        ? Math.min(99, Math.round((completed / totalProjects) * 100))
        : 0;
    const annualProgressPercent = Math.min(
      100,
      Math.round((totalDonations / NGO_ANNUAL_TARGET) * 100),
    );

    return {
      totalDonations,
      activeDonors,
      avgDonation,
      impactScore,
      activeCampaigns: dashboardData.projects?.stats?.active ?? 0,
      teamMembers: dashboardData.users?.total ?? 0,
      annualProgressPercent,
      lowStockItems: dashboardData.inventory?.lowStock ?? 0,
      pendingDonations: 0,
      giftDonationsToday: Math.round(totalDonations * 0.026),
    };
  }, [dashboardData, donorTotal]);

  const loading = dashboardLoading || extraLoading;

  const retry = useCallback(() => {
    refetchDashboard();
    void loadExtras();
  }, [refetchDashboard, loadExtras]);

  return {
    snapshot,
    loading,
    error: dashboardError,
    retry,
  };
}
