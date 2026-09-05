"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiService } from "@/src/services/ApiService";
import type {
  AdminPlan,
  AdminPlanStats,
  AdminPlanUpdatePayload,
  AdminPlansListResponse,
} from "@/src/types/adminPlan";

function normalizePlan(raw: AdminPlan): AdminPlan {
  return {
    ...raw,
    description: raw.description ?? "",
    features: Array.isArray(raw.features) ? raw.features : [],
  };
}

export function useAdminPlans() {
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPlan, setSelectedPlan] = useState<AdminPlan | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get<AdminPlansListResponse>("/plans");
      const list = response.plans ?? [];
      setPlans(list.map(normalizePlan));
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPlans();
  }, [fetchPlans]);

  const planStats = useMemo<AdminPlanStats>(() => {
    const totalPlans = plans.length;
    const activePlans = plans.filter((plan) => plan.isActive).length;
    return {
      totalPlans,
      activePlans,
      inactivePlans: totalPlans - activePlans,
      totalSubscriptions: 0,
    };
  }, [plans]);

  const filteredPlans = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return plans.filter((plan) => {
      const matchesSearch =
        !query ||
        plan.name.toLowerCase().includes(query) ||
        plan.description.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && plan.isActive) ||
        (statusFilter === "inactive" && !plan.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [plans, searchQuery, statusFilter]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 || statusFilter !== "all";

  const openEditDialog = useCallback((plan: AdminPlan) => {
    setSelectedPlan({ ...plan });
    setIsEditDialogOpen(true);
  }, []);

  const closeEditDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedPlan(null);
  }, []);

  const handleEditDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeEditDialog();
        return;
      }
      setIsEditDialogOpen(true);
    },
    [closeEditDialog],
  );

  const patchSelectedPlan = useCallback((patch: Partial<AdminPlan>) => {
    setSelectedPlan((current) => (current ? { ...current, ...patch } : null));
  }, []);

  const handleActivatePlan = useCallback(
    async (planId: string) => {
      try {
        await apiService.put(`/plans/${planId}/activate`);
        await fetchPlans();
      } catch {
        /* handled by api layer */
      }
    },
    [fetchPlans],
  );

  const handleDeactivatePlan = useCallback(
    async (planId: string) => {
      try {
        await apiService.put(`/plans/${planId}/deactivate`);
        await fetchPlans();
      } catch {
        /* handled by api layer */
      }
    },
    [fetchPlans],
  );

  const handleUpdatePlan = useCallback(async () => {
    if (!selectedPlan) return;

    const payload: AdminPlanUpdatePayload = {
      name: selectedPlan.name,
      description: selectedPlan.description,
      price: selectedPlan.price,
      billingCycle: selectedPlan.billingCycle,
      maxUsers: selectedPlan.maxUsers,
      isActive: selectedPlan.isActive,
    };

    try {
      setIsUpdating(true);
      await apiService.put(`/plans/${selectedPlan.id}`, payload);
      await fetchPlans();
      closeEditDialog();
    } catch {
      /* handled by api layer */
    } finally {
      setIsUpdating(false);
    }
  }, [selectedPlan, fetchPlans, closeEditDialog]);

  return {
    plans,
    planStats,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredPlans,
    hasActiveFilters,
    selectedPlan,
    isEditDialogOpen,
    isUpdating,
    openEditDialog,
    closeEditDialog,
    handleEditDialogOpenChange,
    patchSelectedPlan,
    handleActivatePlan,
    handleDeactivatePlan,
    handleUpdatePlan,
  };
}
