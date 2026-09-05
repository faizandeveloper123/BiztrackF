"use client";

import { DashboardLayout } from "@/src/components/layout";
import { ModuleGuard } from "@/src/components/guards/PermissionGuard";
import { PartnerOrganizationFormDialog } from "@/src/components/ngo/partner-organizations/PartnerOrganizationFormDialog";
import { PartnerOrganizationViewDialog } from "@/src/components/ngo/partner-organizations/PartnerOrganizationViewDialog";
import { PartnerOrganizationsFiltersCard } from "@/src/components/ngo/partner-organizations/PartnerOrganizationsFiltersCard";
import { PartnerOrganizationsGrid } from "@/src/components/ngo/partner-organizations/PartnerOrganizationsGrid";
import { PartnerOrganizationsPageHeader } from "@/src/components/ngo/partner-organizations/PartnerOrganizationsPageHeader";
import { useConfirm } from "@/src/contexts/ConfirmContext";
import { useNgoPartnerOrganizations } from "@/src/hooks/useNgoPartnerOrganizations";
import type { PartnerOrganization } from "@/src/models/ngo";
import { partnerPaginationRange } from "@/src/utils/ngo/partnerOrganizationUtils";

export default function NgoPartnerOrganizationsPage() {
  return (
    <ModuleGuard
      module="ngo"
      fallback={<div>You don&apos;t have access to the NGO module</div>}
    >
      <NgoPartnerOrganizationsContent />
    </ModuleGuard>
  );
}

function NgoPartnerOrganizationsContent() {
  const confirm = useConfirm();
  const state = useNgoPartnerOrganizations();
  const { showingStart, showingEnd } = partnerPaginationRange(
    state.page,
    state.limit,
    state.total,
  );

  const confirmDelete = async (org: PartnerOrganization) => {
    const ok = await confirm({
      title: "Delete partner organization",
      description: `Remove ${org.name}? This cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    await state.handleDelete(org);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto space-y-6 px-6 py-8">
        <PartnerOrganizationsPageHeader onAdd={state.openAdd} />
        <PartnerOrganizationsFiltersCard
          search={state.search}
          sectorFilter={state.sectorFilter}
          sizeFilter={state.sizeFilter}
          onSearchChange={state.setSearch}
          onSectorFilterChange={state.setSectorFilter}
          onSizeFilterChange={state.setSizeFilter}
          onApply={state.applyFilters}
          onReset={state.resetFilters}
        />
        <PartnerOrganizationsGrid
          organizations={state.organizations}
          loading={state.loading}
          total={state.total}
          page={state.page}
          showingStart={showingStart}
          showingEnd={showingEnd}
          onPageChange={state.setPage}
          onView={state.openView}
          onEdit={state.openEdit}
          onDelete={confirmDelete}
        />
      </div>
      <PartnerOrganizationFormDialog
        open={state.formOpen}
        onOpenChange={state.setFormOpen}
        editing={!!state.editing}
        formData={state.formData}
        onFormChange={state.setFormData}
        onSubmit={state.handleSubmit}
        submitLoading={state.submitLoading}
      />
      <PartnerOrganizationViewDialog
        open={state.viewOpen}
        onOpenChange={state.setViewOpen}
        organization={state.viewing}
        onEdit={state.editFromView}
      />
    </DashboardLayout>
  );
}
