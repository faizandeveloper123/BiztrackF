import type {
  InstallmentPlanCreate,
  Invoice,
  InvoiceCreate,
  InvoiceItemCreate,
} from "@/src/models/sales";
import type { Customer } from "@/src/services/CustomerService";
import type { Product } from "@/src/models/pos";
import type { Vehicle } from "@/src/models/workshop";

export type InstallmentPlanCreateOption = Omit<
  InstallmentPlanCreate,
  "invoice_id"
>;

export type InvoiceFormMode = "create" | "edit" | "view";

export type InvoiceFormErrors = Record<string, string>;

export type InvoiceFormTotals = {
  subtotal: number;
  discountAmount: number;
  labourCost: number;
  taxAmount: number;
  total: number;
};

export type InvoiceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    data: InvoiceCreate,
    options?: { installmentPlan?: InstallmentPlanCreateOption },
  ) => void | Promise<void>;
  mode: InvoiceFormMode;
  invoice?: Invoice | null;
  error?: string | null;
  inline?: boolean;
  initialData?: Partial<InvoiceCreate> | null;
  initialCustomer?: Customer | null;
  initialVehicle?: Vehicle | null;
};

export type InvoiceFormState = {
  formData: InvoiceCreate;
  items: InvoiceItemCreate[];
  newItem: InvoiceItemCreate;
  errors: InvoiceFormErrors;
  loading: boolean;
  products: Product[];
  selectedCustomer: Customer | null;
  selectedVehicle: Vehicle | null;
  createInstallmentPlan: boolean;
  installmentCount: number;
  installmentFrequency: string;
  installmentFirstDueDate: string;
  commerceFormKey: number;
  showCreateCustomerDialog: boolean;
};
