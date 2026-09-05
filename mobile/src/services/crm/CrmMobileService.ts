import { apiService } from '../ApiService';
import type { CRMDashboard } from '../../models/crm';
import type {
  Customer,
  CustomerCreate,
  CustomerStats,
  CustomerUpdate,
  CustomersResponse,
  Guarantor,
  GuarantorCreate,
  GuarantorUpdate,
  CustomerImportResult,
} from '../../models/crm/customers';

const customersBase = '/crm/customers';

export async function getCrmDashboard(): Promise<CRMDashboard> {
  return apiService.get<CRMDashboard>('/crm/dashboard');
}

export async function getCustomers(
  skip: number,
  limit: number,
  search?: string,
  status?: string,
  customerType?: string,
): Promise<CustomersResponse> {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  if (customerType) params.append('customer_type', customerType);
  return apiService.get<CustomersResponse>(`${customersBase}?${params.toString()}`);
}

export async function getCustomerStats(): Promise<CustomerStats> {
  return apiService.get<CustomerStats>(`${customersBase}/stats`);
}

export async function createCustomer(data: CustomerCreate): Promise<Customer> {
  return apiService.post<Customer>(customersBase, data);
}

export async function updateCustomer(
  id: string,
  data: CustomerUpdate,
): Promise<Customer> {
  return apiService.put<Customer>(`${customersBase}/${id}`, data);
}

export async function deleteCustomer(id: string): Promise<{ message: string }> {
  return apiService.delete(`${customersBase}/${id}`);
}

export async function uploadCustomerPhoto(
  customerId: string,
  imageBase64: string,
): Promise<Customer> {
  return apiService.patch<Customer>(`${customersBase}/${customerId}/photo`, {
    image: imageBase64,
  });
}

export async function deleteCustomerPhoto(customerId: string): Promise<Customer> {
  return apiService.delete<Customer>(`${customersBase}/${customerId}/photo`);
}

export async function importCustomersFromFile(input: {
  uri: string;
  name: string;
  mimeType?: string;
}): Promise<CustomerImportResult> {
  const formData = new FormData();
  formData.append('file', {
    uri: input.uri,
    name: input.name,
    type: input.mimeType || 'application/octet-stream',
  } as unknown as Blob);
  return apiService.post<CustomerImportResult>(
    `${customersBase}/import`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
}

export async function getGuarantors(customerId: string): Promise<Guarantor[]> {
  return apiService.get<Guarantor[]>(
    `${customersBase}/${customerId}/guarantors`,
  );
}

export async function createGuarantor(
  customerId: string,
  data: GuarantorCreate,
): Promise<Guarantor> {
  return apiService.post<Guarantor>(
    `${customersBase}/${customerId}/guarantors`,
    data,
  );
}

export async function updateGuarantor(
  guarantorId: string,
  data: GuarantorUpdate,
): Promise<Guarantor> {
  return apiService.put<Guarantor>(`/crm/guarantors/${guarantorId}`, data);
}

export async function deleteGuarantor(guarantorId: string): Promise<void> {
  await apiService.delete(`/crm/guarantors/${guarantorId}`);
}

export function formatCrmDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatCrmDateTime(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getLeadStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-amber-100 text-amber-800',
    qualified: 'bg-green-100 text-green-800',
    proposal_sent: 'bg-purple-100 text-purple-800',
    negotiation: 'bg-orange-100 text-orange-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800',
  };
  return map[status] || 'bg-slate-100 text-slate-800';
}

export function getOpportunityStageBadgeClass(stage: string): string {
  const map: Record<string, string> = {
    prospecting: 'bg-blue-100 text-blue-800',
    qualification: 'bg-amber-100 text-amber-800',
    proposal: 'bg-purple-100 text-purple-800',
    negotiation: 'bg-orange-100 text-orange-800',
    closed_won: 'bg-green-100 text-green-800',
    closed_lost: 'bg-red-100 text-red-800',
  };
  return map[stage] || 'bg-slate-100 text-slate-800';
}

export function getActivityTypeIconName(type: string): string {
  switch (type) {
    case 'call':
      return 'call-outline';
    case 'email':
      return 'mail-outline';
    case 'meeting':
      return 'calendar-outline';
    case 'task':
      return 'locate-outline';
    case 'note':
      return 'bar-chart-outline';
    default:
      return 'ellipse-outline';
  }
}

export function getActivityTypeBubbleClass(type: string): string {
  const map: Record<string, string> = {
    call: 'bg-blue-100',
    email: 'bg-green-100',
    meeting: 'bg-purple-100',
    task: 'bg-amber-100',
    note: 'bg-slate-100',
    proposal: 'bg-indigo-100',
    contract: 'bg-pink-100',
  };
  return map[type] || 'bg-slate-100';
}
