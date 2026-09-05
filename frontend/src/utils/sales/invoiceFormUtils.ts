import type {
  Invoice,
  InvoiceCreate,
  InvoiceItemCreate,
} from "@/src/models/sales";
import type { Customer } from "@/src/services/CustomerService";
import type {
  InvoiceFormErrors,
  InvoiceFormTotals,
} from "@/src/types/sales/invoiceForm";
import type { JobCard, Vehicle } from "@/src/models/workshop";

export const EMPTY_NEW_ITEM: InvoiceItemCreate = {
  description: "",
  quantity: 1,
  salePrice: 0,
  discount: 0,
  taxRate: 0,
  productId: "",
  unit: "piece",
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function toLocalDateInputValue(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function toLocalDateTimeInputValue(date: Date = new Date()): string {
  return `${toLocalDateInputValue(date)}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function parseToLocalDateTimeInputValue(value: string): string {
  if (!value) return toLocalDateTimeInputValue();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return toLocalDateTimeInputValue();
  }
  return toLocalDateTimeInputValue(parsed);
}

export function defaultDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return toLocalDateInputValue(date);
}

export function defaultOrderTime(): string {
  return toLocalDateTimeInputValue();
}

export function emptyInvoiceForm(): InvoiceCreate {
  return {
    customerId: "",
    customerName: "",
    customerEmail: "",
    shippingAddress: "",
    issueDate: toLocalDateInputValue(),
    dueDate: defaultDueDate(),
    orderNumber: "",
    orderTime: defaultOrderTime(),
    labourCost: 0,
    vatRate: 0,
    terms: "",
    items: [],
    opportunityId: "",
    quoteId: "",
    projectId: "",
    vehicleReg: "",
    jobCardId: "",
  };
}

export function invoiceFormDataFromInvoice(invoice: Invoice): InvoiceCreate {
  return {
    customerId: invoice.customerId,
    customerName: invoice.customerName,
    customerEmail: invoice.customerEmail,
    customerPhone: invoice.customerPhone || "",
    shippingAddress: invoice.shippingAddress || "",
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    orderNumber: invoice.orderNumber || "",
    orderTime: invoice.orderTime
      ? parseToLocalDateTimeInputValue(String(invoice.orderTime))
      : defaultOrderTime(),
    labourCost: invoice.labourCost || 0,
    vatRate: invoice.vatRate || 0,
    terms: invoice.terms || "",
    items: [],
    opportunityId: invoice.opportunityId || "",
    quoteId: invoice.quoteId || "",
    projectId: invoice.projectId || "",
    vehicleReg: invoice.vehicleReg || "",
    jobCardId: invoice.jobCardId || "",
  };
}

export function invoiceItemsFromInvoice(invoice: Invoice): InvoiceItemCreate[] {
  return invoice.items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    salePrice: item.salePrice,
    discount: item.discount,
    taxRate: item.taxRate,
    unit: item.unit,
    productId: item.productId,
    projectId: item.projectId,
    taskId: item.taskId,
  }));
}

export function invoiceItemsFromJobCard(jc: JobCard): InvoiceItemCreate[] {
  const rawItems = Array.isArray(jc.items) ? jc.items : [];
  const mapped: InvoiceItemCreate[] = [];
  for (const it of rawItems) {
    const r = it as unknown as Record<string, unknown>;
    const description = String(
      r.description ?? r.part_description ?? r.part_no ?? r.partNo ?? "",
    );
    const quantityRaw =
      typeof r.quantity === "number"
        ? r.quantity
        : parseFloat(String(r.qty ?? r.quantity ?? 1));
    const quantity =
      Number.isFinite(quantityRaw) && quantityRaw > 0 ? quantityRaw : 1;
    const salePriceRaw =
      typeof r.unitPrice === "number"
        ? r.unitPrice
        : parseFloat(String(r.unit_price ?? r.unitPrice ?? 0));
    const salePrice = Number.isFinite(salePriceRaw) ? salePriceRaw : 0;
    const productId = r.productId ? String(r.productId) : "";
    if (!description && !salePrice && !productId) continue;
    mapped.push({
      description: description || "Item",
      quantity,
      salePrice,
      discount: 0,
      taxRate: 0,
      unit: String(r.unit ?? "piece"),
      productId,
    });
  }
  return mapped;
}

export function jobCardLabourEstimate(jc: JobCard): number {
  return Number(jc.labor_estimate) || 0;
}

export function jobCardVatRate(jc: JobCard): number {
  const raw = Number(jc.vat_rate);
  return Number.isFinite(raw) && raw >= 0 ? raw : 0;
}

export function jobCardToVehicle(jc: JobCard): Vehicle | null {
  const vi = (jc.vehicle_info || {}) as Record<string, unknown>;
  const reg = vi.registration_number ? String(vi.registration_number) : "";
  if (!vi.registration_number && !vi.vin && !vi.make && !vi.model) {
    return null;
  }
  return {
    id: vi.vehicle_id ? String(vi.vehicle_id) : jc.id,
    tenant_id: jc.tenant_id,
    make: vi.make ? String(vi.make) : "",
    model: vi.model ? String(vi.model) : "",
    year: vi.year ? String(vi.year) : "",
    color: vi.color ? String(vi.color) : "",
    vin: vi.vin ? String(vi.vin) : "",
    registration_number: reg,
    mileage: vi.mileage ? String(vi.mileage) : "",
    engine_number: vi.engine_number ? String(vi.engine_number) : "",
    is_active: true,
    created_at: "",
    updated_at: "",
  };
}

export function customerFallbackFromInvoice(invoice: Invoice): Customer {
  return {
    id: invoice.customerId,
    customerId: invoice.customerId,
    firstName: invoice.customerName.split(" ")[0] || "",
    lastName: invoice.customerName.split(" ").slice(1).join(" ") || "",
    email: invoice.customerEmail,
    phone: invoice.customerPhone || "",
    customerType: "individual",
    customerStatus: "active",
    creditLimit: 0,
    currentBalance: 0,
    paymentTerms: "Cash",
    tags: [],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function calculateInvoiceTotals(
  formData: InvoiceCreate,
  items: InvoiceItemCreate[],
): InvoiceFormTotals {
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.salePrice,
    0,
  );
  const discountAmount = items.reduce(
    (sum, item) =>
      sum + item.quantity * item.salePrice * ((item.discount || 0) / 100),
    0,
  );
  const labourCost = formData.labourCost || 0;
  const vatRate = formData.vatRate || 0;
  const taxableBase = subtotal - discountAmount + labourCost;
  const taxAmount = taxableBase * vatRate;
  const total = taxableBase + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    labourCost: Math.round(labourCost * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export function hasWorkshopInvoiceData(invoice: Invoice): boolean {
  return Boolean(invoice.vehicleReg || invoice.jobCardId);
}

export function validateInvoiceForm(
  formData: InvoiceCreate,
  items: InvoiceItemCreate[],
  hasCustomer: boolean,
): InvoiceFormErrors {
  const newErrors: InvoiceFormErrors = {};

  if (!hasCustomer) {
    newErrors.customer = "Please select a customer";
  }
  if (!formData.issueDate) {
    newErrors.issueDate = "Issue date is required";
  }
  if (!formData.dueDate) {
    newErrors.dueDate = "Due date is required";
  }
  items.forEach((item, index) => {
    if (!item.description.trim()) {
      newErrors[`item_${index}_description`] = "Item description is required";
    }
    if (item.quantity <= 0) {
      newErrors[`item_${index}_quantity`] = "Quantity must be greater than 0";
    }
    if (item.salePrice < 0) {
      newErrors[`item_${index}_salePrice`] = "Sale price cannot be negative";
    }
  });

  return newErrors;
}

export function validateNewItem(
  newItem: InvoiceItemCreate,
  requireProduct: boolean,
): InvoiceFormErrors {
  const itemErrors: InvoiceFormErrors = {};
  if (requireProduct && !newItem.productId) {
    itemErrors.newItemProduct = "Please select a product";
  }
  if (!newItem.description.trim()) {
    itemErrors.newItemDescription = "Description is required";
  }
  if (newItem.quantity <= 0) {
    itemErrors.newItemQuantity = "Quantity must be greater than 0";
  }
  if (newItem.salePrice < 0) {
    itemErrors.newItemSalePrice = "Sale price cannot be negative";
  }
  return itemErrors;
}

export function getInvoiceDialogContentClassName(
  _useCommerceLayout: boolean,
  isView: boolean,
  inline: boolean,
): string {
  if (!isView) {
    return inline
      ? "w-full min-w-0 max-w-full overflow-x-auto p-2 sm:p-3"
      : "max-h-[96vh] w-[99vw] max-w-[1600px] overflow-y-auto overflow-x-auto p-2 sm:p-3";
  }
  return inline
    ? "w-full min-w-0 max-w-full overflow-y-auto p-4"
    : "max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-auto";
}

export function lineItemTotal(item: InvoiceItemCreate): number {
  const gross = item.quantity * item.salePrice;
  const discountAmount = gross * ((item.discount || 0) / 100);
  return gross - discountAmount;
}
