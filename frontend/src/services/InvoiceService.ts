import { apiService } from "./ApiService";
import {
  Invoice,
  InvoiceCreate,
  InvoiceUpdate,
  InvoiceFilters,
  Payment,
  PaymentCreate,
  PaymentFilters,
  InvoiceDashboard,
  InstallmentPlan,
  InstallmentPlanCreate,
  InstallmentPlanUpdate,
  ApplyPaymentToInstallmentRequest,
  DeliveryNote,
  DeliveryNoteCreate,
} from "../models/sales";
import {
  Customer,
  CustomerCreate,
  CustomerUpdate,
  CustomersResponse,
  CustomerService,
} from "./CustomerService";

class InvoiceService {
  private baseUrl = "/invoices";

  // Invoice CRUD operations
  async createInvoice(invoiceData: InvoiceCreate): Promise<Invoice> {
    const response = await apiService.post(this.baseUrl, invoiceData);
    return response.invoice;
  }

  async getNextOrderNumber(): Promise<string> {
    const response = await apiService.get(`${this.baseUrl}/next-order-number`);
    return response.orderNumber;
  }

  async getInvoices(
    filters: InvoiceFilters = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<{ invoices: Invoice[]; pagination: any }> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    const filterParamKeys: Record<string, string> = {
      customerId: "customer_id",
      dateFrom: "date_from",
      dateTo: "date_to",
      amountFrom: "amount_from",
      amountTo: "amount_to",
      orderPrefix: "order_prefix",
    };

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(filterParamKeys[key] ?? key, value.toString());
      }
    });

    const response = await apiService.get(`${this.baseUrl}?${params}`);
    return response;
  }

  async getInvoice(invoiceId: string): Promise<Invoice> {
    const response = await apiService.get(`${this.baseUrl}/${invoiceId}`);
    return response.invoice;
  }

  async updateInvoice(
    invoiceId: string,
    invoiceData: InvoiceUpdate,
  ): Promise<Invoice> {
    const response = await apiService.put(
      `${this.baseUrl}/${invoiceId}`,
      invoiceData,
    );
    return response.invoice;
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/${invoiceId}`);
  }

  async sendInvoice(invoiceId: string): Promise<void> {
    await apiService.post(`${this.baseUrl}/${invoiceId}/send`);
  }

  async sendInvoiceEmail(
    invoiceId: string,
    toEmail?: string,
    message?: string,
  ): Promise<{ message: string; warning?: string }> {
    const body: any = {};
    if (toEmail) {
      body.to_email = toEmail;
    }
    if (message) {
      body.message = message;
    }
    const response = await apiService.post(
      `${this.baseUrl}/${invoiceId}/send`,
      Object.keys(body).length > 0 ? body : undefined,
    );
    return response;
  }

  async sendInvoiceWhatsApp(invoiceId: string): Promise<{
    whatsapp_url: string;
    formatted_message: string;
    pdf_url?: string;
  }> {
    return apiService.post(`${this.baseUrl}/${invoiceId}/send-whatsapp`);
  }

  async markInvoiceAsPaid(invoiceId: string): Promise<void> {
    await apiService.post(`${this.baseUrl}/${invoiceId}/mark-as-paid`);
  }

  // Bulk operations
  async bulkSendInvoices(invoiceIds: string[]): Promise<void> {
    await apiService.post(`${this.baseUrl}/bulk/send`, { invoiceIds });
  }

  async bulkMarkAsPaid(invoiceIds: string[]): Promise<void> {
    await apiService.post(`${this.baseUrl}/bulk/mark-as-paid`, { invoiceIds });
  }

  async bulkMarkAsUnpaid(invoiceIds: string[]): Promise<void> {
    await apiService.post(`${this.baseUrl}/bulk/mark-as-unpaid`, {
      invoiceIds,
    });
  }

  async bulkDeleteInvoices(invoiceIds: string[]): Promise<void> {
    await apiService.post(`${this.baseUrl}/bulk/delete`, { invoiceIds });
  }

  async downloadInvoice(invoiceId: string): Promise<Blob> {
    const response = await apiService.get(
      `${this.baseUrl}/${invoiceId}/download`,
      {
        responseType: "blob",
      },
    );
    return response;
  }

  async createInstallmentPlan(
    data: InstallmentPlanCreate,
  ): Promise<InstallmentPlan> {
    const response = await apiService.post(
      "/installments/installment-plans",
      data,
    );
    return response;
  }

  async getInstallmentPlansByInvoice(
    invoiceId: string,
  ): Promise<InstallmentPlan[]> {
    const response = await apiService.get(
      `/installments/installment-plans?invoice_id=${encodeURIComponent(invoiceId)}`,
    );
    return response;
  }

  async getAllInstallmentPlans(
    skip: number = 0,
    limit: number = 100,
  ): Promise<InstallmentPlan[]> {
    const response = await apiService.get(
      `/installments/installment-plans?skip=${skip}&limit=${limit}`,
    );
    return response;
  }

  async getInstallmentPlan(planId: string): Promise<InstallmentPlan> {
    const response = await apiService.get(
      `/installments/installment-plans/${planId}`,
    );
    return response;
  }

  async getInvoiceInstallmentPlan(
    invoiceId: string,
  ): Promise<InstallmentPlan | null> {
    const response = await apiService.get(
      `/installments/invoices/${invoiceId}/installment-plan`,
    );
    return response ?? null;
  }

  async updateInstallmentPlan(
    planId: string,
    data: InstallmentPlanUpdate,
  ): Promise<InstallmentPlan> {
    const response = await apiService.patch(
      `/installments/installment-plans/${planId}`,
      data,
    );
    return response;
  }

  async applyPaymentToInstallment(
    planId: string,
    installmentId: string,
    data: ApplyPaymentToInstallmentRequest,
  ): Promise<any> {
    const response = await apiService.post(
      `/installments/installment-plans/${planId}/installments/${installmentId}/apply-payment`,
      data,
    );
    return response;
  }

  async getCustomerInfoPdf(planId: string): Promise<Blob> {
    const blob = await apiService.get<Blob>(
      `/installments/installment-plans/${planId}/customer-info-pdf`,
      { responseType: "blob" },
    );
    return blob;
  }

  async createDeliveryNote(data: DeliveryNoteCreate): Promise<DeliveryNote> {
    const response = await apiService.post("/delivery-notes", data);
    return response;
  }

  async getDeliveryNotes(
    invoiceId?: string,
    skip: number = 0,
    limit: number = 100,
  ): Promise<DeliveryNote[]> {
    const params = new URLSearchParams();
    params.append("skip", skip.toString());
    params.append("limit", limit.toString());
    if (invoiceId) params.append("invoice_id", invoiceId);
    const response = await apiService.get(`/delivery-notes?${params}`);
    return response ?? [];
  }

  async getDeliveryNote(id: string): Promise<DeliveryNote> {
    return apiService.get(`/delivery-notes/${id}`);
  }

  async downloadDeliveryNotePdf(id: string): Promise<Blob> {
    const blob = await apiService.get<Blob>(`/delivery-notes/${id}/download`, {
      responseType: "blob",
    });
    return blob;
  }

  async getDashboard(): Promise<InvoiceDashboard> {
    const response = await apiService.get(`${this.baseUrl}/dashboard/overview`);
    return response;
  }

  // Payment operations
  async createPayment(
    invoiceId: string,
    paymentData: PaymentCreate,
  ): Promise<Payment> {
    const response = await apiService.post(
      `${this.baseUrl}/${invoiceId}/payments`,
      paymentData,
    );
    return response.payment;
  }

  async getInvoicePayments(
    invoiceId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ payments: Payment[]; pagination: any }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await apiService.get(
      `${this.baseUrl}/${invoiceId}/payments?${params}`,
    );
    return response;
  }

  async getAllPayments(
    filters: PaymentFilters = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<{ payments: Payment[]; pagination: any }> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    // Add filters, filtering out undefined values and converting to strings
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get(
      `${this.baseUrl}/payments/?${params}`,
    );
    return response;
  }

  // Helper methods
  calculateInvoiceTotals(items: any[], labourCost = 0) {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.salePrice,
      0,
    );
    const discountAmount = items.reduce(
      (sum, item) =>
        sum + item.quantity * item.salePrice * ((item.discount || 0) / 100),
      0,
    );
    const total = subtotal - discountAmount + labourCost;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      labourCost: Math.round(labourCost * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      draft: "bg-gray-100 text-gray-800",
      sent: "bg-blue-100 text-blue-800",
      viewed: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      partially_paid: "bg-orange-100 text-orange-800",
      overdue: "bg-red-100 text-red-800",
      cancelled: "bg-red-100 text-red-800",
      void: "bg-gray-100 text-gray-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      draft: "Draft",
      sent: "Sent",
      viewed: "Viewed",
      paid: "Paid",
      partially_paid: "Partially Paid",
      overdue: "Overdue",
      cancelled: "Cancelled",
      void: "Void",
    };
    return statusLabels[status] || status;
  }

  getPaymentMethodLabel(method: string): string {
    const methodLabels: { [key: string]: string } = {
      credit_card: "Credit Card",
      bank_transfer: "Bank Transfer",
      cash: "Cash",
      check: "Check",
      paypal: "PayPal",
      stripe: "Stripe",
      other: "Other",
    };
    return methodLabels[method] || method;
  }

  formatCurrency(amount: number, currency: string = "USD"): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }

  getDaysOverdue(dueDate: string): number {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  // Customer Management - Delegating to shared CustomerService
  // This ensures consistency between CRM and Invoicing modules
  async getCustomers(
    skip: number = 0,
    limit: number = 100,
    search?: string,
    status?: string,
    customerType?: string,
  ): Promise<CustomersResponse> {
    return CustomerService.getCustomers(
      skip,
      limit,
      search,
      status,
      customerType,
    );
  }

  async getCustomerById(id: string): Promise<Customer> {
    return CustomerService.getCustomerById(id);
  }

  async createCustomer(customerData: CustomerCreate): Promise<Customer> {
    return CustomerService.createCustomer(customerData);
  }

  async updateCustomer(
    id: string,
    customerData: CustomerUpdate,
  ): Promise<Customer> {
    return CustomerService.updateCustomer(id, customerData);
  }

  async deleteCustomer(id: string): Promise<{ message: string }> {
    return CustomerService.deleteCustomer(id);
  }

  async searchCustomers(
    query: string,
    limit: number = 20,
  ): Promise<Customer[]> {
    return CustomerService.searchCustomers(query, limit);
  }
}

export default new InvoiceService();
