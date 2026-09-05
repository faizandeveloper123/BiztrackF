"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiService } from "@/src/services/ApiService";
import HRMService from "@/src/services/HRMService";
import type { Product, POSCategoriesResponse } from "@/src/models/pos";
import type { Supplier } from "@/src/models/hrm/supplier";
import type { ProductFormData } from "./types";
import type { SupplierFormData } from "../../hrm/suppliers/types";
import {
  emptySupplierForm,
  getSupplierApiError,
  validateSupplierForm,
} from "../../hrm/suppliers/supplierUtils";
import {
  emptyProductFormData,
  formDataToPayload,
  productToFormData,
} from "./productUtils";
import {
  mergeLookupIntoFormData,
  type ProductCodeLookupResult,
  type ProductEntryMode,
} from "./productCodeUtils";
import { ProductFormDialog } from "./ProductFormDialog";
import { AddCategoryDialog } from "./AddCategoryDialog";
import { SupplierFormDialog } from "../../hrm/suppliers/SupplierFormDialog";

type CreateProductDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (product: Product) => void;
  editingProduct?: Product | null;
};

export function CreateProductDialog({
  open,
  onOpenChange,
  onSaved,
  editingProduct = null,
}: CreateProductDialogProps) {
  const [formData, setFormData] = useState<ProductFormData>(
    emptyProductFormData(),
  );
  const [entryMode, setEntryMode] = useState<ProductEntryMode>("manual");
  const [codeLookupLoading, setCodeLookupLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addCategoryLoading, setAddCategoryLoading] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [supplierFormData, setSupplierFormData] =
    useState<SupplierFormData>(emptySupplierForm());
  const [addSupplierLoading, setAddSupplierLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFormData(
      editingProduct
        ? productToFormData(editingProduct)
        : emptyProductFormData(),
    );
    setEntryMode("manual");
    setCodeLookupLoading(false);
    apiService
      .get("/pos/categories")
      .then((data: POSCategoriesResponse) =>
        setCategories(data.categories || []),
      )
      .catch(() => setCategories([]));
    HRMService.getSuppliers(0, 500)
      .then((res) => setSuppliers(res.suppliers || []))
      .catch(() => setSuppliers([]));
  }, [open, editingProduct]);

  const isEditing = Boolean(editingProduct);

  const handleClose = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setFormData(emptyProductFormData());
        setEntryMode("manual");
        setCodeLookupLoading(false);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = formDataToPayload(formData);
    try {
      const response = await (isEditing && editingProduct
        ? apiService.put<{ product: Product }>(
            `/pos/products/${editingProduct.id}`,
            payload,
          )
        : apiService.post<{ product: Product }>("/pos/products", payload));
      toast.success(
        isEditing
          ? "Product updated successfully"
          : "Product created successfully",
      );
      handleClose(false);
      onSaved(response.product);
    } catch {
      toast.error(
        isEditing ? "Failed to update product" : "Failed to create product",
      );
    }
  };

  const handleCodeScan = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setCodeLookupLoading(true);
    try {
      const response = (await apiService.get(
        `/pos/products/lookup?code=${encodeURIComponent(trimmed)}`,
      )) as ProductCodeLookupResult;
      setFormData((prev) => mergeLookupIntoFormData(prev, response.suggested));
      setEntryMode("manual");
      toast[response.existsInCatalog ? "warning" : "success"](response.message);
    } catch {
      toast.error("Could not load product details from scanned code.");
    } finally {
      setCodeLookupLoading(false);
    }
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    setAddCategoryLoading(true);
    try {
      await apiService.post("/pos/categories", { name });
      const data: POSCategoriesResponse =
        await apiService.get("/pos/categories");
      setCategories(data.categories || []);
      setFormData((prev) => ({ ...prev, category: name }));
      setNewCategoryName("");
      setIsAddCategoryOpen(false);
    } catch {
    } finally {
      setAddCategoryLoading(false);
    }
  };

  const openAddSupplier = () => {
    setSupplierFormData(emptySupplierForm());
    setIsAddSupplierOpen(true);
  };

  const closeAddSupplier = () => {
    setIsAddSupplierOpen(false);
    setSupplierFormData(emptySupplierForm());
  };

  const handleSupplierFormChange = (
    field: keyof SupplierFormData,
    value: string | number | boolean | undefined,
  ) => {
    setSupplierFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddSupplier = async () => {
    const validationError = validateSupplierForm(supplierFormData);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setAddSupplierLoading(true);
    try {
      const response = await HRMService.createSupplier(supplierFormData);
      const suppliersResponse = await HRMService.getSuppliers(0, 500);
      setSuppliers(suppliersResponse.suppliers || []);
      setFormData((prev) => ({ ...prev, supplierId: response.supplier.id }));
      closeAddSupplier();
      toast.success("Supplier created successfully");
    } catch (error) {
      toast.error(
        `Save Error: ${getSupplierApiError(error, "Failed to create supplier")}`,
      );
    } finally {
      setAddSupplierLoading(false);
    }
  };

  return (
    <>
      <ProductFormDialog
        open={open}
        editingProduct={editingProduct}
        formData={formData}
        entryMode={entryMode}
        codeLookupLoading={codeLookupLoading}
        categories={categories}
        suppliers={suppliers}
        onOpenChange={handleClose}
        onEntryModeChange={setEntryMode}
        onFormChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
        onCodeScan={(code) => void handleCodeScan(code)}
        onSubmit={handleSubmit}
        onAddCategoryClick={() => setIsAddCategoryOpen(true)}
        onAddSupplierClick={openAddSupplier}
      />

      <AddCategoryDialog
        open={isAddCategoryOpen}
        categoryName={newCategoryName}
        loading={addCategoryLoading}
        onOpenChange={(next) => {
          setIsAddCategoryOpen(next);
          if (!next) setNewCategoryName("");
        }}
        onCategoryNameChange={setNewCategoryName}
        onSubmit={() => void handleAddCategory()}
      />

      <SupplierFormDialog
        open={isAddSupplierOpen}
        editingSupplier={null}
        formData={supplierFormData}
        submitting={addSupplierLoading}
        onOpenChange={(next) => {
          if (!next) closeAddSupplier();
          else openAddSupplier();
        }}
        onFormChange={handleSupplierFormChange}
        onSubmit={() => void handleAddSupplier()}
        onCancel={closeAddSupplier}
      />
    </>
  );
}
