import { Invoice } from './Invoice';

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
  topCustomers: Array<{
    name: string;
    amount: number;
    count: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
}
