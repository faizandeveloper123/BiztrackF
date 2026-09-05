import type { Supplier, SupplierCreate } from "@/src/models/hrm";
import type { SupplierFormData, SupplierStats } from "./types";
import { getApiErrorMessage } from "@/src/lib/apiError";

export function emptySupplierForm(): SupplierFormData {
  return {
    name: "",
    code: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    website: "",
    paymentTerms: "",
    creditLimit: undefined,
    isActive: true,
  };
}

export function supplierToFormData(supplier: Supplier): SupplierFormData {
  return {
    name: supplier.name,
    code: supplier.code,
    contactPerson: supplier.contactPerson || "",
    email: supplier.email || "",
    phone: supplier.phone || "",
    address: supplier.address || "",
    city: supplier.city || "",
    state: supplier.state || "",
    country: supplier.country || "",
    postalCode: supplier.postalCode || "",
    website: supplier.website || "",
    paymentTerms: supplier.paymentTerms || "",
    creditLimit: supplier.creditLimit,
    isActive: supplier.isActive,
  };
}

export function filterSuppliers(
  suppliers: Supplier[],
  searchTerm: string,
): Supplier[] {
  const query = searchTerm.toLowerCase();
  if (!query) return suppliers;

  return suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(query) ||
      supplier.code.toLowerCase().includes(query) ||
      supplier.contactPerson?.toLowerCase().includes(query) ||
      supplier.city?.toLowerCase().includes(query),
  );
}

export function getSupplierStats(suppliers: Supplier[]): SupplierStats {
  return {
    total: suppliers.length,
    active: suppliers.filter((supplier) => supplier.isActive).length,
    international: suppliers.filter(
      (supplier) => supplier.country && supplier.country !== "United States",
    ).length,
  };
}

export function validateSupplierForm(formData: SupplierCreate): string | null {
  if (!formData.name.trim() || !formData.code.trim()) {
    return "Name and code are required";
  }
  return null;
}

export function getSupplierApiError(error: unknown, fallback: string): string {
  return getApiErrorMessage(error, fallback);
}
