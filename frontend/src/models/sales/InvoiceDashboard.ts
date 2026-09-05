import { Invoice } from "./Invoice";

export interface PurchaseOrderSummary {
  id: string;
  orderNumber: string;
  supplierName: string;
  orderDate: string | null;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export interface InvoiceMetrics {
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  draftInvoices: number;
  totalRevenue: number;
  purchaseOrderTotal: number;
  netRevenue: number;
  outstandingAmount: number;
  overdueAmount: number;
  averagePaymentTime: number;
}

export interface InvoiceDashboard {
  metrics: InvoiceMetrics;
  recentInvoices: Invoice[];
  overdueInvoices: Invoice[];
  topCustomers: Array<{
    name: string;
    amount: number;
    count: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
  recentPurchaseOrders: PurchaseOrderSummary[];
}
