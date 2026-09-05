import { apiService } from "./ApiService";

export type ContactLabel = "work" | "personal" | "other";

export interface LabeledEmailItem {
  value: string;
  label: ContactLabel;
}

export interface LabeledPhoneItem {
  value: string;
  label: ContactLabel;
}

export interface CustomerAttachment {
  url: string;
  original_filename?: string;
  s3_key?: string;
}

// Customer Types
export interface Customer {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  emails?: LabeledEmailItem[];
  phones?: LabeledPhoneItem[];
  cnic?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  customerType: "individual" | "business";
  customerStatus: "active" | "inactive" | "blocked";
  creditLimit: number;
  currentBalance: number;
  paymentTerms: "Credit" | "Card" | "Cash" | "Due Payments";
  assignedToId?: string;
  notes?: string;
  description?: string;
  tags: string[];
  attachments?: CustomerAttachment[];
  image_url?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerCreate {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  emails?: LabeledEmailItem[];
  phones?: LabeledPhoneItem[];
  cnic?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  customerType?: "individual" | "business";
  customerStatus?: "active" | "inactive" | "blocked";
  creditLimit?: number;
  currentBalance?: number;
  paymentTerms?: "Credit" | "Card" | "Cash" | "Due Payments";
  assignedToId?: string;
  notes?: string;
  description?: string;
  tags?: string[];
  attachments?: CustomerAttachment[];
}

export interface CustomerUpdate extends Partial<CustomerCreate> {}

export interface CustomerStats {
  total_customers: number;
  active_customers: number;
  inactive_customers: number;
  blocked_customers: number;
  individual_customers: number;
  business_customers: number;
  recent_customers: number;
}

export interface CustomersResponse {
  customers: Customer[];
  total: number;
}

// Shared Customer Service - Can be used by both CRM and Invoice modules
export class CustomerService {
  private static baseUrl = "/crm/customers"; // Primary endpoint

  static async getCustomers(
    skip: number = 0,
    limit: number = 100,
    search?: string,
    status?: string,
    customerType?: string,
  ): Promise<CustomersResponse> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (customerType) params.append("customer_type", customerType);

    const response = await apiService.get(
      `${this.baseUrl}?${params.toString()}`,
    );
    return response;
  }

  static async getCustomerById(id: string): Promise<Customer> {
    const response = await apiService.get(`${this.baseUrl}/${id}`);
    return response;
  }

  static async createCustomer(customerData: CustomerCreate): Promise<Customer> {
    const response = await apiService.post(this.baseUrl, customerData);
    return response;
  }

  static async updateCustomer(
    id: string,
    customerData: CustomerUpdate,
  ): Promise<Customer> {
    const response = await apiService.put(
      `${this.baseUrl}/${id}`,
      customerData,
    );
    return response;
  }

  static async deleteCustomer(id: string): Promise<{ message: string }> {
    const response = await apiService.delete(`${this.baseUrl}/${id}`);
    return response;
  }

  static async getCustomerStats(): Promise<CustomerStats> {
    const response = await apiService.get(`${this.baseUrl}/stats`);
    return response;
  }

  static async searchCustomers(
    query: string,
    limit: number = 20,
  ): Promise<Customer[]> {
    const response = await apiService.get(
      `${this.baseUrl}/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    );
    return response;
  }

  static async uploadCustomerPhoto(
    customerId: string,
    imageBase64: string,
  ): Promise<Customer> {
    const response = await apiService.patch(
      `${this.baseUrl}/${customerId}/photo`,
      { image: imageBase64 },
    );
    return response;
  }

  static async deleteCustomerPhoto(customerId: string): Promise<Customer> {
    const response = await apiService.delete(
      `${this.baseUrl}/${customerId}/photo`,
    );
    return response;
  }

  // Utility methods
  static getCustomerDisplayName(customer: Customer): string {
    return `${customer.firstName} ${customer.lastName}`;
  }

  static getCustomerStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      blocked: "bg-red-100 text-red-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  }

  static getCustomerTypeColor(type: string): string {
    const typeColors: { [key: string]: string } = {
      individual: "bg-blue-100 text-blue-800",
      business: "bg-purple-100 text-purple-800",
    };
    return typeColors[type] || "bg-gray-100 text-gray-800";
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  static formatDate(date: string): string {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
}

export default CustomerService;
