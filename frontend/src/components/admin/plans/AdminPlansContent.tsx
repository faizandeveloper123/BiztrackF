"use client";

import { DashboardLayout } from "@/src/components/layout";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { useAdminPlans } from "@/src/hooks/useAdminPlans";
import { AdminPlanCard } from "./AdminPlanCard";
import { AdminPlanEditDialog } from "./AdminPlanEditDialog";
import { AdminPlansEmptyState } from "./AdminPlansEmptyState";
import { AdminPlansFilters } from "./AdminPlansFilters";
import { AdminPlansHeader } from "./AdminPlansHeader";
import { AdminPlansLoading } from "./AdminPlansLoading";
import { AdminPlansStats } from "./AdminPlansStats";

export function AdminPlansContent() {
  const { getCurrencySymbol } = useCurrency();
  const {
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
  } = useAdminPlans();

  if (loading) {
    return <AdminPlansLoading />;
  }

  const currencySymbol = getCurrencySymbol();

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <AdminPlansHeader />
        <AdminPlansStats stats={planStats} />
        <AdminPlansFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlans.map((plan) => (
            <AdminPlanCard
              key={plan.id}
              plan={plan}
              currencySymbol={currencySymbol}
              onEdit={openEditDialog}
              onActivate={handleActivatePlan}
              onDeactivate={handleDeactivatePlan}
            />
          ))}
        </div>

        {filteredPlans.length === 0 && (
          <AdminPlansEmptyState hasActiveFilters={hasActiveFilters} />
        )}

        <AdminPlanEditDialog
          open={isEditDialogOpen}
          onOpenChange={handleEditDialogOpenChange}
          plan={selectedPlan}
          isUpdating={isUpdating}
          onPatchPlan={patchSelectedPlan}
          onSave={() => void handleUpdatePlan()}
          onCancel={closeEditDialog}
        />
      </div>
    </DashboardLayout>
  );
}
