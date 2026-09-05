"use client";

import { DashboardLayout } from "@/src/components/layout";
import { ModuleGuard } from "@/src/components/guards/PermissionGuard";
import { DonorFormDialog } from "@/src/components/ngo/donors/DonorFormDialog";
import { DonorViewDialog } from "@/src/components/ngo/donors/DonorViewDialog";
import { DonorsFiltersCard } from "@/src/components/ngo/donors/DonorsFiltersCard";
import { DonorsPageHeader } from "@/src/components/ngo/donors/DonorsPageHeader";
import { DonorsTable } from "@/src/components/ngo/donors/DonorsTable";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { useConfirm } from "@/src/contexts/ConfirmContext";
import { useNgoDonors } from "@/src/hooks/useNgoDonors";
import type { Donor } from "@/src/models/ngo";
import { donorPaginationRange } from "@/src/utils/ngo/donorUtils";

export default function NgoDonorsPage() {
  return (
    <ModuleGuard
      module="ngo"
      fallback={<div>You don&apos;t have access to the NGO module</div>}
    >
      <NgoDonorsContent />
    </ModuleGuard>
  );
}

function NgoDonorsContent() {
  const { formatCurrency } = useCurrency();
  const confirm = useConfirm();
  const donorsState = useNgoDonors();
  const { showingStart, showingEnd } = donorPaginationRange(
    donorsState.page,
    donorsState.limit,
    donorsState.total,
  );

  const confirmDelete = async (donor: Donor) => {
    const ok = await confirm({
      title: "Delete donor",
      description: `Remove ${donor.full_name}? This cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    await donorsState.handleDelete(donor);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto space-y-6 px-6 py-8">
        <DonorsPageHeader onAdd={donorsState.openAdd} />
        <DonorsFiltersCard
          search={donorsState.search}
          typeFilter={donorsState.typeFilter}
          onSearchChange={donorsState.setSearch}
          onTypeFilterChange={donorsState.setTypeFilter}
          onApply={donorsState.applyFilters}
          onReset={donorsState.resetFilters}
        />
        <DonorsTable
          donors={donorsState.donors}
          loading={donorsState.loading}
          formatCurrency={formatCurrency}
          showingStart={showingStart}
          showingEnd={showingEnd}
          total={donorsState.total}
          page={donorsState.page}
          onPageChange={donorsState.setPage}
          onView={donorsState.openView}
          onEdit={donorsState.openEdit}
          onDelete={confirmDelete}
        />
      </div>
      <DonorFormDialog
        open={donorsState.formOpen}
        onOpenChange={donorsState.setFormOpen}
        editing={!!donorsState.editing}
        formData={donorsState.formData}
        onFormChange={donorsState.setFormData}
        onSubmit={donorsState.handleSubmit}
        submitLoading={donorsState.submitLoading}
      />
      <DonorViewDialog
        open={donorsState.viewOpen}
        onOpenChange={donorsState.setViewOpen}
        donor={donorsState.viewing}
        formatCurrency={formatCurrency}
        onEdit={donorsState.editFromView}
      />
    </DashboardLayout>
  );
}
