"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import HRMService from "@/src/services/HRMService";
import type { Supplier } from "@/src/models/hrm";
import type { SupplierFormData } from "@/src/components/hrm/suppliers/types";
import {
  emptySupplierForm,
  filterSuppliers,
  getSupplierApiError,
  getSupplierStats,
  supplierToFormData,
  validateSupplierForm,
} from "@/src/components/hrm/suppliers/supplierUtils";

export function useSuppliersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
    null,
  );
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] =
    useState<SupplierFormData>(emptySupplierForm());
  const [submitting, setSubmitting] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await HRMService.getSuppliers();
      setSuppliers(response.suppliers);
    } catch (error) {
      toast.error(
        `Load Error: ${getSupplierApiError(error, "Failed to load suppliers")}`,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const filteredSuppliers = useMemo(
    () => filterSuppliers(suppliers, searchTerm),
    [suppliers, searchTerm],
  );

  const stats = useMemo(() => getSupplierStats(suppliers), [suppliers]);

  const openCreateDialog = useCallback(() => {
    setEditingSupplier(null);
    setFormData(emptySupplierForm());
    setShowFormDialog(true);
  }, []);

  useEffect(() => {
    if (searchParams.get("openAdd") !== "true") return;
    openCreateDialog();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("openAdd");
    const nextQuery = params.toString();
    router.replace(
      nextQuery ? `/hrm/suppliers?${nextQuery}` : "/hrm/suppliers",
    );
  }, [searchParams, router, openCreateDialog]);

  const openEditDialog = useCallback((supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData(supplierToFormData(supplier));
    setShowFormDialog(true);
  }, []);

  const closeFormDialog = useCallback(() => {
    setShowFormDialog(false);
    setEditingSupplier(null);
    setFormData(emptySupplierForm());
  }, []);

  const handleFormInputChange = useCallback(
    (
      field: keyof SupplierFormData,
      value: string | number | boolean | undefined,
    ) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const handleFormSubmit = useCallback(async () => {
    const validationError = validateSupplierForm(formData);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setSubmitting(true);
      if (editingSupplier) {
        await HRMService.updateSupplier(editingSupplier.id, formData);
        toast.success("Supplier updated successfully");
      } else {
        await HRMService.createSupplier(formData);
        toast.success("Supplier created successfully");
      }
      await fetchSuppliers();
      closeFormDialog();
    } catch (error) {
      toast.error(
        `Save Error: ${getSupplierApiError(error, "Failed to save supplier")}`,
      );
    } finally {
      setSubmitting(false);
    }
  }, [formData, editingSupplier, fetchSuppliers, closeFormDialog]);

  const openDeleteDialog = useCallback((supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSupplierToDelete(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!supplierToDelete) return;

    try {
      await HRMService.deleteSupplier(supplierToDelete.id);
      await fetchSuppliers();
      closeDeleteDialog();
      toast.success("Supplier deleted successfully");
    } catch (error) {
      toast.error(
        `Delete Error: ${getSupplierApiError(error, "Failed to delete supplier")}`,
      );
    }
  }, [supplierToDelete, fetchSuppliers, closeDeleteDialog]);

  const handleFormDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) closeFormDialog();
      else setShowFormDialog(true);
    },
    [closeFormDialog],
  );

  const handleDeleteDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) closeDeleteDialog();
      else setIsDeleteDialogOpen(true);
    },
    [closeDeleteDialog],
  );

  return {
    loading,
    searchTerm,
    setSearchTerm,
    filteredSuppliers,
    stats,
    showFormDialog,
    editingSupplier,
    formData,
    submitting,
    isDeleteDialogOpen,
    supplierToDelete,
    openCreateDialog,
    openEditDialog,
    closeFormDialog,
    handleFormInputChange,
    handleFormSubmit,
    openDeleteDialog,
    closeDeleteDialog,
    handleDelete,
    handleFormDialogOpenChange,
    handleDeleteDialogOpenChange,
  };
}
