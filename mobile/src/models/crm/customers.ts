export type ContactLabel = 'work' | 'personal' | 'other';

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
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  customerType: 'individual' | 'business';
  customerStatus: 'active' | 'inactive' | 'blocked';
  creditLimit: number;
  currentBalance: number;
  paymentTerms: 'Credit' | 'Card' | 'Cash' | 'Due Payments';
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
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  customerType?: 'individual' | 'business';
  customerStatus?: 'active' | 'inactive' | 'blocked';
  creditLimit?: number;
  currentBalance?: number;
  paymentTerms?: 'Credit' | 'Card' | 'Cash' | 'Due Payments';
  assignedToId?: string;
  notes?: string;
  description?: string;
  tags?: string[];
  attachments?: CustomerAttachment[];
}

export type CustomerUpdate = Partial<CustomerCreate>;

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

export interface Guarantor {
  id: string;
  tenant_id: string;
  customer_id: string;
  name: string;
  mobile?: string;
  cnic?: string;
  residential_address?: string;
  official_address?: string;
  occupation?: string;
  relation?: string;
  display_order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GuarantorCreate {
  name: string;
  mobile?: string;
  cnic?: string;
  residential_address?: string;
  official_address?: string;
  occupation?: string;
  relation?: string;
  display_order?: number;
}

export type GuarantorUpdate = Partial<GuarantorCreate>;

export interface CustomerImportResult {
  success?: boolean;
  message?: string;
  imported_count?: number;
  failed_count?: number;
  errors?: string[];
}
