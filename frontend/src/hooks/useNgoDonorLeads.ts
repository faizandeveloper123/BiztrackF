"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import ngoService from "@/src/services/NgoService";
import type { DonorLead, DonorLeadCreate } from "@/src/models/ngo";
import { extractErrorMessage } from "@/src/utils/errorUtils";
import {
  DONOR_LEADS_PAGE_LIMIT,
  buildDonorLeadPayload,
  donorLeadToFormData,
  emptyDonorLeadForm,
} from "@/src/utils/ngo/donorLeadUtils";

export function useNgoDonorLeads() {
  const limit = DONOR_LEADS_PAGE_LIMIT;
  const [leads, setLeads] = useState<DonorLead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");
  const [appliedSource, setAppliedSource] = useState("");
  const [appliedDate, setAppliedDate] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editing, setEditing] = useState<DonorLead | null>(null);
  const [viewing, setViewing] = useState<DonorLead | null>(null);
  const [formData, setFormData] =
    useState<DonorLeadCreate>(emptyDonorLeadForm());
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ngoService.getDonorLeads({
        search: appliedSearch || undefined,
        status: appliedStatus || undefined,
        source: appliedSource || undefined,
        created_date: appliedDate || undefined,
        page,
        limit,
      });
      setLeads(res.leads);
      setTotal(res.total);
    } catch (e) {
      toast.error(extractErrorMessage(e, "Failed to load donor leads"));
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, appliedStatus, appliedSource, appliedDate, page, limit]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const applyFilters = () => {
    setAppliedSearch(search.trim());
    setAppliedStatus(statusFilter);
    setAppliedSource(sourceFilter);
    setAppliedDate(dateFilter);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setSourceFilter("");
    setDateFilter("");
    setAppliedSearch("");
    setAppliedStatus("");
    setAppliedSource("");
    setAppliedDate("");
    setPage(1);
  };

  const openAdd = () => {
    setEditing(null);
    setFormData(emptyDonorLeadForm());
    setFormOpen(true);
  };

  const openEdit = (lead: DonorLead) => {
    setEditing(lead);
    setFormData(donorLeadToFormData(lead));
    setFormOpen(true);
  };

  const openView = (lead: DonorLead) => {
    setViewing(lead);
    setViewOpen(true);
  };

  const handleSubmit = async () => {
    const payload = buildDonorLeadPayload(formData);
    if (!payload) {
      toast.error("Full name and email are required");
      return;
    }
    try {
      setSubmitLoading(true);
      if (editing) {
        await ngoService.updateDonorLead(editing.id, payload);
        toast.success("Donor lead updated");
      } else {
        await ngoService.createDonorLead(payload);
        toast.success("Donor lead created");
      }
      setFormOpen(false);
      await loadLeads();
    } catch (e) {
      toast.error(extractErrorMessage(e, "Failed to save donor lead"));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (lead: DonorLead) => {
    try {
      await ngoService.deleteDonorLead(lead.id);
      toast.success("Donor lead deleted");
      await loadLeads();
    } catch (e) {
      toast.error(extractErrorMessage(e, "Failed to delete donor lead"));
      throw e;
    }
  };

  const editFromView = () => {
    if (!viewing) return;
    setViewOpen(false);
    openEdit(viewing);
  };

  return {
    leads,
    total,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sourceFilter,
    setSourceFilter,
    dateFilter,
    setDateFilter,
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
