"use client";

import { DashboardLayout } from "@/src/components/layout";
import { ModuleGuard } from "@/src/components/guards/PermissionGuard";
import { DonorLeadFormDialog } from "@/src/components/ngo/donor-leads/DonorLeadFormDialog";
import { DonorLeadViewDialog } from "@/src/components/ngo/donor-leads/DonorLeadViewDialog";
import { DonorLeadsFiltersCard } from "@/src/components/ngo/donor-leads/DonorLeadsFiltersCard";
import { DonorLeadsGrid } from "@/src/components/ngo/donor-leads/DonorLeadsGrid";
import { DonorLeadsPageHeader } from "@/src/components/ngo/donor-leads/DonorLeadsPageHeader";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { useConfirm } from "@/src/contexts/ConfirmContext";
import { useNgoDonorLeads } from "@/src/hooks/useNgoDonorLeads";
import type { DonorLead } from "@/src/models/ngo";

export default function NgoDonorLeadsPage() {
  return (
    <ModuleGuard
      module="ngo"
      fallback={<div>You don&apos;t have access to the NGO module</div>}
    >
      <NgoDonorLeadsContent />
    </ModuleGuard>
  );
}

function NgoDonorLeadsContent() {
  const { formatCurrency } = useCurrency();
  const confirm = useConfirm();
  const state = useNgoDonorLeads();

  const confirmDelete = async (lead: DonorLead) => {
    const ok = await confirm({
      title: "Delete donor lead",
      description: `Remove ${lead.full_name}? This cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    await state.handleDelete(lead);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto space-y-6 px-6 py-8">
        <DonorLeadsPageHeader onAdd={state.openAdd} />
        <DonorLeadsFiltersCard
          search={state.search}
          statusFilter={state.statusFilter}
          sourceFilter={state.sourceFilter}
          dateFilter={state.dateFilter}
          onSearchChange={state.setSearch}
          onStatusChange={state.setStatusFilter}
          onSourceChange={state.setSourceFilter}
          onDateChange={state.setDateFilter}
          onApply={state.applyFilters}
          onReset={state.resetFilters}
        />
        <DonorLeadsGrid
          leads={state.leads}
          loading={state.loading}
          total={state.total}
          page={state.page}
          limit={state.limit}
          formatCurrency={formatCurrency}
          onPageChange={state.setPage}
          onView={state.openView}
          onEdit={state.openEdit}
          onDelete={confirmDelete}
        />
      </div>
      <DonorLeadFormDialog
        open={state.formOpen}
        onOpenChange={state.setFormOpen}
        editing={!!state.editing}
        formData={state.formData}
        onFormChange={state.setFormData}
        onSubmit={state.handleSubmit}
        submitLoading={state.submitLoading}
      />
      <DonorLeadViewDialog
        open={state.viewOpen}
        onOpenChange={state.setViewOpen}
        lead={state.viewing}
        formatCurrency={formatCurrency}
        onEdit={state.editFromView}
      />
    </DashboardLayout>
  );
}
