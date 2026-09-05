export interface Supplier {
  id: string;
  tenantId: string;
  createdBy: string;
  name: string;
  code: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  paymentTerms?: string;
  creditLimit?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierCreate {
  name: string;
  code: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  paymentTerms?: string;
  creditLimit?: number;
  isActive?: boolean;
}

export interface SupplierUpdate {
  name?: string;
  code?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  paymentTerms?: string;
  creditLimit?: number;
  isActive?: boolean;
}

export interface SupplierResponse {
  supplier: Supplier;
}

export interface SuppliersResponse {
  suppliers: Supplier[];
  total: number;
}
