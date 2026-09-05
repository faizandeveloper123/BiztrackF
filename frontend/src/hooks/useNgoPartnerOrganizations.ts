"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import ngoService from "@/src/services/NgoService";
import type {
  PartnerOrganization,
  PartnerOrganizationCreate,
} from "@/src/models/ngo";
import { extractErrorMessage } from "@/src/utils/errorUtils";
import {
  PARTNERS_PAGE_LIMIT,
  buildPartnerPayload,
  emptyPartnerForm,
  partnerToFormData,
} from "@/src/utils/ngo/partnerOrganizationUtils";

export function useNgoPartnerOrganizations() {
  const limit = PARTNERS_PAGE_LIMIT;
  const [organizations, setOrganizations] = useState<PartnerOrganization[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerOrganization | null>(null);
  const [viewing, setViewing] = useState<PartnerOrganization | null>(null);
  const [formData, setFormData] =
    useState<PartnerOrganizationCreate>(emptyPartnerForm());
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ngoService.getPartnerOrganizations({
        search: appliedSearch || undefined,
        sector: sectorFilter || undefined,
        organization_size: sizeFilter || undefined,
        page,
        limit,
      });
      setOrganizations(res.organizations);
      setTotal(res.total);
    } catch (e) {
      toast.error(
        extractErrorMessage(e, "Failed to load partner organizations"),
      );
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, sectorFilter, sizeFilter, page, limit]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  const applyFilters = () => {
    setAppliedSearch(search.trim());
    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setAppliedSearch("");
    setSectorFilter("");
    setSizeFilter("");
    setPage(1);
  };

  const openAdd = () => {
    setEditing(null);
    setFormData(emptyPartnerForm());
    setFormOpen(true);
  };

  const openEdit = (org: PartnerOrganization) => {
    setEditing(org);
    setFormData(partnerToFormData(org));
    setFormOpen(true);
  };

  const openView = (org: PartnerOrganization) => {
    setViewing(org);
    setViewOpen(true);
  };

  const handleSubmit = async () => {
    const payload = buildPartnerPayload(formData);
    if (!payload) {
      toast.error("Name and email are required");
      return;
    }
    try {
      setSubmitLoading(true);
      if (editing) {
        await ngoService.updatePartnerOrganization(editing.id, payload);
        toast.success("Partner organization updated");
      } else {
        await ngoService.createPartnerOrganization(payload);
        toast.success("Partner organization created");
      }
      setFormOpen(false);
      await loadOrganizations();
    } catch (e) {
      toast.error(
        extractErrorMessage(e, "Failed to save partner organization"),
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (org: PartnerOrganization) => {
    try {
      await ngoService.deletePartnerOrganization(org.id);
      toast.success("Partner organization deleted");
      await loadOrganizations();
    } catch (e) {
      toast.error(
        extractErrorMessage(e, "Failed to delete partner organization"),
      );
      throw e;
    }
  };

  const editFromView = () => {
    if (!viewing) return;
    setViewOpen(false);
    openEdit(viewing);
  };

  return {
    organizations,
    total,
    loading,
    search,
    setSearch,
    sectorFilter,
    setSectorFilter,
    sizeFilter,
    setSizeFilter,
    page,
    setPage,
    limit,
    formOpen,
    setFormOpen,
    viewOpen,
    setViewOpen,
    editing,
    viewing,
    formData,
    setFormData,
    submitLoading,
    applyFilters,
    resetFilters,
    openAdd,
    openEdit,
    openView,
    handleSubmit,
    handleDelete,
    editFromView,
  };
}
