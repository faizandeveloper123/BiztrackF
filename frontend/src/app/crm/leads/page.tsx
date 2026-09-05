"use client";

import React, {
  Suspense,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useSearchParams } from "next/navigation";
import { ModuleGuard } from "../../../components/guards/PermissionGuard";
import { LeadsDenseTable } from "@/src/components/crm/leads/LeadsDenseTable";
import { LeadsListToolbar } from "@/src/components/crm/leads/list/LeadsListToolbar";
import { LeadsPinnedFilters } from "@/src/components/crm/leads/list/LeadsPinnedFilters";
import { LeadsListControls } from "@/src/components/crm/leads/list/LeadsListControls";
import { LeadCreateDialog } from "@/src/components/crm/leads/list/LeadCreateDialog";
import { mapTenantUsers } from "@/src/components/crm/leads/leadUtils";
import CRMService from "@/src/services/CRMService";
import { Lead, CRMLeadFilters, LeadSavedFilter } from "@/src/models/crm";
import { DashboardLayout } from "../../../components/layout";
import { useConfirm } from "@/src/contexts/ConfirmContext";
import { useRBAC } from "@/src/contexts/RBACContext";
import { useCrudPermissions } from "@/src/hooks/usePermissions";

export default function CRMLeadsPage() {
  return (
    <ModuleGuard
      module="crm"
      fallback={<div>You don&apos;t have access to CRM module</div>}
    >
      <Suspense fallback={<div className="p-6">Loading leads...</div>}>
        <CRMLeadsContent />
      </Suspense>
    </ModuleGuard>
  );
}

function CRMLeadsContent() {
  const confirm = useConfirm();
  const { canCreate, canDelete } = useCrudPermissions("crm:leads");
  const searchParams = useSearchParams();
  const { tenantUsers, fetchTenantUsers } = useRBAC();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<CRMLeadFilters>({ sort: "newest" });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [savedFilters, setSavedFilters] = useState<LeadSavedFilter[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showPartialOnly, setShowPartialOnly] = useState(false);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if ((tenantUsers?.length || 0) > 0) return;
    fetchTenantUsers?.().catch(() => undefined);
  }, [fetchTenantUsers, tenantUsers?.length]);

  const users = mapTenantUsers(tenantUsers);

  const loadLeads = useCallback(async () => {
    try {
      if (!initialLoadDone.current) setLoading(true);
      else setListLoading(true);
      const active: CRMLeadFilters = {
        ...filters,
        isPartial: showPartialOnly ? true : undefined,
      };
      const response = await CRMService.getLeads(active, page, pageSize);
      const list = Array.isArray(response?.leads)
        ? (response.leads as Lead[])
        : [];
      setLeads(list);
      setTotalPages(response?.pagination?.pages || 1);
      setTotalCount(response?.pagination?.total || 0);
      initialLoadDone.current = true;
    } catch {
      setLeads([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setListLoading(false);
    }
  }, [filters, page, pageSize, showPartialOnly]);

  const loadSavedFilters = useCallback(async () => {
    try {
      const rows = await CRMService.getSavedLeadFilters();
      setSavedFilters(Array.isArray(rows) ? rows : []);
    } catch {
      setSavedFilters([]);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    loadSavedFilters();
  }, [loadSavedFilters]);

  useEffect(() => {
    if (searchParams.get("new") === "1") setIsCreateDialogOpen(true);
    if (searchParams.get("partial") === "1") setShowPartialOnly(true);
  }, [searchParams]);

  const applyPinned = (sf: LeadSavedFilter) => {
    const f = sf.filters || {};
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      priority: (f.priority as string) || undefined,
      rating: (f.leadRating as string) || undefined,
      status: (f.status as string) || undefined,
      pipeline: (f.pipelineStage as string) || undefined,
    }));
  };

  const handleSearch = () => {
    setPage(1);
    setFilters((prev) => ({ ...prev, search: search.trim() || undefined }));
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete lead?",
      description: "This cannot be undone.",
    });
    if (!ok) return;
    await CRMService.deleteLead(id);
    loadLeads();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (ids: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(ids);
    });
  };

  const runBulk = async (
    action: string,
    extra: Record<string, string> = {},
  ) => {
    if (selectedIds.size === 0) return;
    if (action === "delete") {
      const ok = await confirm({
        title: "Delete selected leads?",
        description: `Delete ${selectedIds.size} leads?`,
      });
      if (!ok) return;
    }
    await CRMService.bulkLeadAction({
      leadIds: Array.from(selectedIds),
      action,
      ...extra,
    });
    setSelectedIds(new Set());
    loadLeads();
  };

  const pinned = Array.isArray(savedFilters)
    ? savedFilters.filter((f) => f?.pinned)
    : [];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">Loading leads...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] gap-3 p-4">
        <LeadsListToolbar
          savedFilters={savedFilters}
          showPartialOnly={showPartialOnly}
          onApplyFilter={applyPinned}
          onClearFilters={() => {
            setFilters({ sort: "newest" });
            setSearch("");
            setShowPartialOnly(false);
            setPage(1);
          }}
          onBulkAction={runBulk}
          onAddNew={canCreate() ? () => setIsCreateDialogOpen(true) : undefined}
          onTogglePartial={() => {
            setShowPartialOnly((v) => !v);
            setPage(1);
          }}
        />

        <LeadsPinnedFilters pinned={pinned} onApply={applyPinned} />

        <LeadsListControls
          filters={filters}
          search={search}
          pageSize={pageSize}
          onFiltersChange={setFilters}
          onSearchChange={setSearch}
          onSearch={handleSearch}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />

        <LeadsDenseTable
          leads={leads}
          totalCount={totalCount}
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          listLoading={listLoading}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onPageChange={setPage}
          onPipelineChange={async (id, stage) => {
            await CRMService.updateLeadPipeline(id, stage);
            loadLeads();
          }}
          onAssigneeChange={async (id, userId) => {
            await CRMService.updateLead(id, {
              assignedTo: userId || undefined,
              mainAgentId: userId || undefined,
            });
            loadLeads();
          }}
          onDelete={canDelete() ? handleDelete : undefined}
          users={users}
        />
      </div>

      <LeadCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </DashboardLayout>
  );
}
