"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import ngoService from "@/src/services/NgoService";
import type { Donor, DonorCreate } from "@/src/models/ngo";
import { extractErrorMessage } from "@/src/utils/errorUtils";
import {
  DONORS_PAGE_LIMIT,
  buildDonorPayload,
  donorToFormData,
  emptyDonorForm,
} from "@/src/utils/ngo/donorUtils";

export function useNgoDonors() {
  const limit = DONORS_PAGE_LIMIT;
  const [donors, setDonors] = useState<Donor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editing, setEditing] = useState<Donor | null>(null);
  const [viewing, setViewing] = useState<Donor | null>(null);
  const [formData, setFormData] = useState<DonorCreate>(emptyDonorForm());
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadDonors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ngoService.getDonors({
        search: appliedSearch || undefined,
        donor_type: typeFilter || undefined,
        page,
        limit,
      });
      setDonors(res.donors);
      setTotal(res.total);
    } catch (e) {
      toast.error(extractErrorMessage(e, "Failed to load donors"));
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, typeFilter, page, limit]);

  useEffect(() => {
    loadDonors();
  }, [loadDonors]);

  const applyFilters = () => {
    setAppliedSearch(search.trim());
    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setAppliedSearch("");
    setTypeFilter("");
    setPage(1);
  };

  const openAdd = () => {
    setEditing(null);
    setFormData(emptyDonorForm());
    setFormOpen(true);
  };

  const openEdit = (donor: Donor) => {
    setEditing(donor);
    setFormData(donorToFormData(donor));
    setFormOpen(true);
  };

  const openView = (donor: Donor) => {
    setViewing(donor);
    setViewOpen(true);
  };

  const closeForm = () => setFormOpen(false);
  const closeView = () => setViewOpen(false);

  const handleSubmit = async () => {
    const payload = buildDonorPayload(formData);
    if (!payload) {
      toast.error("Full name and email are required");
      return;
    }
    try {
      setSubmitLoading(true);
      if (editing) {
        await ngoService.updateDonor(editing.id, payload);
        toast.success("Donor updated");
      } else {
        await ngoService.createDonor(payload);
        toast.success("Donor created");
      }
      setFormOpen(false);
      await loadDonors();
    } catch (e) {
      toast.error(extractErrorMessage(e, "Failed to save donor"));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (donor: Donor) => {
    try {
      await ngoService.deleteDonor(donor.id);
      toast.success("Donor deleted");
      await loadDonors();
    } catch (e) {
      toast.error(extractErrorMessage(e, "Failed to delete donor"));
      throw e;
    }
  };

  const editFromView = () => {
    if (!viewing) return;
    setViewOpen(false);
    openEdit(viewing);
  };

  return {
    donors,
    total,
    loading,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
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
    closeForm,
    closeView,
    handleSubmit,
    handleDelete,
    editFromView,
  };
}
