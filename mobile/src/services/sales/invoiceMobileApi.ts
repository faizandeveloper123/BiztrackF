import { apiService } from '../ApiService';
import type {
  DeliveryNote,
  DeliveryNoteCreate,
  Invoice,
  InvoiceCreate,
  InvoiceDashboard,
  InvoiceFilters,
  InvoiceUpdate,
  InstallmentPlan,
  InstallmentPlanCreate,
  InstallmentPlanUpdate,
  ApplyPaymentToInstallmentRequest,
  Payment,
  PaymentCreate,
  InvoiceCustomerOption,
} from '../../models/sales';
import type { Product } from '../../models/pos';

export async function fetchInvoicesPaged(
  filters: InvoiceFilters,
  page = 1,
  limit = 15,
): Promise<{ invoices: Invoice[]; pagination: Record<string, unknown> }> {
  const p = new URLSearchParams();
  p.append('page', String(page));
  p.append('limit', String(limit));
  if (filters.status) p.append('status', filters.status);
  if (filters.customerId) p.append('customer_id', filters.customerId);
  if (filters.dateFrom) p.append('date_from', filters.dateFrom);
  if (filters.dateTo) p.append('date_to', filters.dateTo);
  if (filters.amountFrom != null) p.append('amount_from', String(filters.amountFrom));
  if (filters.amountTo != null) p.append('amount_to', String(filters.amountTo));
  if (filters.search) p.append('search', filters.search);
  return apiService.get(`/invoices?${p.toString()}`);
}

export async function getInvoice(id: string): Promise<Invoice> {
  const res = await apiService.get<{ invoice: Invoice }>(`/invoices/${id}`);
  return res.invoice;
}

export async function createInvoice(data: InvoiceCreate): Promise<Invoice> {
  const res = await apiService.post<{ invoice: Invoice }>('/invoices', data);
  return res.invoice;
}

export async function updateInvoice(
  id: string,
  data: InvoiceUpdate,
): Promise<Invoice> {
  const res = await apiService.put<{ invoice: Invoice }>(
    `/invoices/${id}`,
    data,
  );
  return res.invoice;
}

export async function deleteInvoice(id: string): Promise<void> {
  await apiService.delete(`/invoices/${id}`);
}

export async function getInvoiceDashboard(): Promise<InvoiceDashboard> {
  return apiService.get<InvoiceDashboard>('/invoices/dashboard/overview');
}

export async function sendInvoiceEmail(
  invoiceId: string,
  toEmail?: string,
  message?: string,
): Promise<{ message: string; warning?: string }> {
  const body: Record<string, string> = {};
  if (toEmail) body.to_email = toEmail;
  if (message) body.message = message;
  return apiService.post(
    `/invoices/${invoiceId}/send`,
    Object.keys(body).length ? body : undefined,
  );
}

export async function sendInvoiceWhatsApp(invoiceId: string): Promise<{
  whatsapp_url: string;
  formatted_message: string;
  pdf_url?: string;
}> {
  return apiService.post(`/invoices/${invoiceId}/send-whatsapp`);
}

export async function markInvoicePaid(invoiceId: string): Promise<void> {
  await apiService.post(`/invoices/${invoiceId}/mark-as-paid`);
}

export async function createPayment(
  invoiceId: string,
  data: PaymentCreate,
): Promise<Payment> {
  const res = await apiService.post<{ payment: Payment }>(
    `/invoices/${invoiceId}/payments`,
    data,
  );
  return res.payment;
}

export async function searchInvoiceCustomers(
  query: string,
  limit = 20,
): Promise<InvoiceCustomerOption[]> {
  const q = encodeURIComponent(query);
  return apiService.get<InvoiceCustomerOption[]>(
    `/invoices/customers/search?q=${q}&limit=${limit}`,
  );
}

export async function fetchInvoiceProducts(): Promise<Product[]> {
  const res = await apiService.get<{ products?: Product[]; pagination?: unknown } | Product[]>(
    '/pos/products',
  );
  if (Array.isArray(res)) return res;
  return res.products ?? [];
}

export async function createInstallmentPlan(
  data: InstallmentPlanCreate,
): Promise<InstallmentPlan> {
  return apiService.post<InstallmentPlan>(
    '/installments/installment-plans',
    data,
  );
}

export async function getAllInstallmentPlans(
  skip = 0,
  limit = 200,
): Promise<InstallmentPlan[]> {
  return apiService.get<InstallmentPlan[]>(
    `/installments/installment-plans?skip=${skip}&limit=${limit}`,
  );
}

export async function getInstallmentPlan(
  planId: string,
): Promise<InstallmentPlan> {
  return apiService.get<InstallmentPlan>(
    `/installments/installment-plans/${planId}`,
  );
}

export async function updateInstallmentPlan(
  planId: string,
  data: InstallmentPlanUpdate,
): Promise<InstallmentPlan> {
  return apiService.patch<InstallmentPlan>(
    `/installments/installment-plans/${planId}`,
    data,
  );
}

export async function applyPaymentToInstallment(
  planId: string,
  installmentId: string,
  data: ApplyPaymentToInstallmentRequest,
): Promise<unknown> {
  return apiService.post(
    `/installments/installment-plans/${planId}/installments/${installmentId}/apply-payment`,
    data,
  );
}

export async function createDeliveryNote(
  data: DeliveryNoteCreate,
): Promise<DeliveryNote> {
  return apiService.post<DeliveryNote>('/delivery-notes', data);
}

export async function getDeliveryNotes(
  invoiceId?: string,
  skip = 0,
  limit = 100,
): Promise<DeliveryNote[]> {
  const p = new URLSearchParams();
  p.append('skip', String(skip));
  p.append('limit', String(limit));
  if (invoiceId) p.append('invoice_id', invoiceId);
  return apiService.get<DeliveryNote[]>(`/delivery-notes?${p.toString()}`);
}

export async function getDeliveryNote(id: string): Promise<DeliveryNote> {
  return apiService.get<DeliveryNote>(`/delivery-notes/${id}`);
}
