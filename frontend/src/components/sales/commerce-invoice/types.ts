import type { Customer } from "@/src/services/CustomerService";
import type { Product } from "@/src/models/pos";
import type { InvoiceCreate, InvoiceItemCreate } from "@/src/models/sales";

export interface CommerceInvoiceTotals {
  subtotal: number;
  labourCost: number;
  total: number;
}

export interface CommerceInvoiceFormProps {
  mode: "create" | "edit";
  formData: InvoiceCreate;
  errors: Record<string, string>;
  items: InvoiceItemCreate[];
  newItem: InvoiceItemCreate;
  products: Product[];
  selectedCustomer: Customer | null;
  totals: CommerceInvoiceTotals;
  loading: boolean;
  error?: string | null;
  createInstallmentPlan: boolean;
  installmentCount: number;
  installmentFrequency: string;
  installmentFirstDueDate: string;
  onInputChange: (field: keyof InvoiceCreate, value: string | number) => void;
  onCustomerSelect: (customer: Customer | null) => void;
  onNewItemChange: (item: InvoiceItemCreate) => void;
  onProductSelect: (productId: string) => void;
  onAddItem: () => void;
  onAddExtraItem: () => void | Promise<void>;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, patch: Partial<InvoiceItemCreate>) => void;
  onClearInvoice: () => void;
  onCancel: () => void;
  onNewCustomer?: () => void;
  setCreateInstallmentPlan: (value: boolean) => void;
  setInstallmentCount: (value: number) => void;
  setInstallmentFrequency: (value: string) => void;
  setInstallmentFirstDueDate: (value: string) => void;
  clearFieldError: (key: string) => void;
}
