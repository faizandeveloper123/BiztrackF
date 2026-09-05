import { PaymentMethod } from "./Invoice";

export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
  CANCELLED = "cancelled",
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  reference?: string;
  notes?: string;
  status: PaymentStatus;
  tenantId: string;
  createdBy: string;
  processedAt?: string;
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

export interface PaymentUpdate {
  amount?: number;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  reference?: string;
  notes?: string;
  status?: PaymentStatus;
}

export interface PaymentFilters {
  invoiceId?: string;
  paymentMethod?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}
