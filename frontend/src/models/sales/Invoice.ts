export enum InvoiceStatus {
  DRAFT = "draft",
  SENT = "sent",
  VIEWED = "viewed",
  PAID = "paid",
  PARTIALLY_PAID = "partially_paid",
  OVERDUE = "overdue",
  CANCELLED = "cancelled",
  VOID = "void",
}

export enum PaymentMethod {
  CREDIT_CARD = "credit_card",
  BANK_TRANSFER = "bank_transfer",
  CASH = "cash",
  CHECK = "check",
  PAYPAL = "paypal",
  STRIPE = "stripe",
  CREDIT = "credit",
  OTHER = "other",
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  salePrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  unit?: string;
  productId?: string;
  productSku?: string;
  projectId?: string;
  taskId?: string;
}

export interface InvoiceItemCreate {
  description: string;
  quantity: number;
  salePrice: number;
  discount: number;
  taxRate: number;
  unit?: string;
  productId?: string;
  projectId?: string;
  taskId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  billingAddress: string;
  shippingAddress?: string;
  issueDate: string;
  dueDate: string;
  orderNumber?: string;
  orderTime?: string;
  subtotal: number;
  taxAmount: number;
  vatRate?: number;
  labourCost?: number;
  total: number;
  terms?: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  opportunityId?: string;
  quoteId?: string;
  projectId?: string;
  sentAt?: string;
  viewedAt?: string;
  paidAt?: string;
  overdueAt?: string;
  createdAt: string;
  updatedAt: string;
  payments: any[];
  totalPaid: number;
  balance: number;
  daysOverdue: number;
  vehicleReg?: string;
  jobCardId?: string;
}

export interface InvoiceCreate {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: string;
  issueDate: string;
  dueDate: string;
  orderNumber?: string;
  orderTime?: string;
  labourCost?: number;
  vatRate?: number;
  terms?: string;
  items: InvoiceItemCreate[];
  opportunityId?: string;
  quoteId?: string;
  projectId?: string;
  vehicleReg?: string;
  jobCardId?: string;
}

export interface InvoiceUpdate {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  issueDate?: string;
  dueDate?: string;
  orderNumber?: string;
  orderTime?: string;
  labourCost?: number;
  vatRate?: number;
  terms?: string;
  status?: InvoiceStatus;
  items?: InvoiceItemCreate[];
  vehicleReg?: string;
  jobCardId?: string;
}

export interface InvoiceFilters {
  status?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountFrom?: number;
  amountTo?: number;
  search?: string;
  orderPrefix?: string;
}
