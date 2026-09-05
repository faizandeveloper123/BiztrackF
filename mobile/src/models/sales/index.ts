export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum ContractStatus {
  DRAFT = 'draft',
  PENDING_SIGNATURE = 'pending_signature',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
}

export interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Quote {
  id: string;
  title: string;
  description?: string;
  opportunityId?: string;
  contactId?: string;
  validUntil: string;
  amount?: number;
  terms?: string;
  notes?: string;
  items: QuoteItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  quoteNumber: string;
  status: QuoteStatus | string;
  tenantId?: string;
  createdBy?: string;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteCreatePayload {
  title: string;
  description?: string;
  opportunityId: string;
  validUntil: string;
  terms?: string;
  notes?: string;
  items: QuoteItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface Contract {
  id: string;
  title: string;
  description?: string;
  opportunityId?: string;
  contactId?: string;
  companyId?: string;
  contactName?: string;
  companyName?: string;
  startDate: string;
  endDate: string;
  value: number;
  terms?: string;
  notes?: string;
  autoRenew: boolean;
  renewalTerms?: string;
  contractNumber: string;
  status: ContractStatus | string;
  tenantId?: string;
  createdBy?: string;
  signedAt?: string;
  activatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractCreatePayload {
  title: string;
  description?: string;
  opportunityId: string;
  startDate: string;
  endDate: string;
  value: number;
  terms?: string;
  notes?: string;
  autoRenew: boolean;
  renewalTerms?: string;
}

export interface QuotesResponse {
  quotes: Quote[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface ContractsResponse {
  contracts: Contract[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  VOID = 'void',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  CHECK = 'check',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  CREDIT = 'credit',
  OTHER = 'other',
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
  productId?: string;
  projectId?: string;
  taskId?: string;
}

export interface InvoiceItemCreate {
  description: string;
  quantity: number;
  salePrice: number;
  discount: number;
  taxRate: number;
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
  billingAddress?: string;
  shippingAddress?: string;
  issueDate: string;
  dueDate: string;
  orderNumber?: string;
  orderTime?: string;
  subtotal: number;
  taxAmount: number;
  labourCost?: number;
  total: number;
  terms?: string;
  status: InvoiceStatus | string;
  items: InvoiceItem[];
  opportunityId?: string;
  quoteId?: string;
  projectId?: string;
  sentAt?: string;
  viewedAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  payments: unknown[];
  totalPaid: number;
  balance: number;
  daysOverdue: number;
}

export interface InvoiceCreate {
  customerId: string;
  customerName: string;
  customerEmail: string;
  billingAddress?: string;
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
}

export interface InvoiceUpdate {
  customerName?: string;
  customerEmail?: string;
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
}

export interface InvoiceFilters {
  status?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountFrom?: number;
  amountTo?: number;
  search?: string;
}

export interface InvoiceMetrics {
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  draftInvoices: number;
  totalRevenue: number;
  outstandingAmount: number;
  overdueAmount: number;
  averagePaymentTime: number;
}

export interface InvoiceDashboard {
  metrics: InvoiceMetrics;
  recentInvoices: Invoice[];
  overdueInvoices: Invoice[];
  topCustomers: Array<{ name: string; amount: number; count: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod | string;
  paymentDate: string;
  reference?: string;
  notes?: string;
  status: PaymentStatus | string;
  tenantId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentCreate {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  reference?: string;
  notes?: string;
}

export interface Installment {
  id: string;
  tenant_id: string;
  installment_plan_id: string;
  sequence_number: number;
  due_date: string;
  amount: number;
  status: string;
  paid_amount: number;
  payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstallmentPlan {
  id: string;
  tenant_id: string;
  invoice_id: string;
  total_amount: number;
  currency: string;
  number_of_installments: number;
  frequency: string;
  first_due_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  installments: Installment[];
}

export interface InstallmentPlanCreate {
  invoice_id: string;
  total_amount: number;
  number_of_installments: number;
  frequency: string;
  first_due_date: string;
  currency?: string;
}

export interface InstallmentPlanUpdate {
  status?: string;
}

export interface ApplyPaymentToInstallmentRequest {
  amount: number;
  payment_id?: string;
}

export interface DeliveryNote {
  id: string;
  tenant_id: string;
  invoice_id: string;
  note: string | null;
  created_by: string;
  created_at: string;
  invoice_number?: string | null;
  customer_name?: string | null;
}

export interface DeliveryNoteCreate {
  invoice_id: string;
  note?: string | null;
}

export interface InvoiceCustomerOption {
  id: string;
  customerId?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
}
