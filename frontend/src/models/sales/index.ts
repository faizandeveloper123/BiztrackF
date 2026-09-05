// Sales Module Types and Interfaces

export enum LeadStatus {
  NEW = "new",
  CONTACTED = "contacted",
  QUALIFIED = "qualified",
  PROPOSAL = "proposal",
  NEGOTIATION = "negotiation",
  WON = "won",
  LOST = "lost",
}

export enum LeadSource {
  WEBSITE = "website",
  REFERRAL = "referral",
  SOCIAL_MEDIA = "social_media",
  EMAIL_CAMPAIGN = "email_campaign",
  COLD_OUTREACH = "cold_outreach",
  TRADE_SHOW = "trade_show",
  OTHER = "other",
}

export enum OpportunityStage {
  PROSPECTING = "prospecting",
  QUALIFICATION = "qualification",
  QUALIFIED = "qualified",
  PROPOSAL = "proposal",
  NEGOTIATION = "negotiation",
  CLOSED_WON = "closed_won",
  CLOSED_LOST = "closed_lost",
}

export enum QuoteStatus {
  DRAFT = "draft",
  SENT = "sent",
  VIEWED = "viewed",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  EXPIRED = "expired",
}

export enum ContractStatus {
  DRAFT = "draft",
  PENDING_SIGNATURE = "pending_signature",
  ACTIVE = "active",
  EXPIRED = "expired",
  TERMINATED = "terminated",
}

export enum ContactType {
  LEAD = "lead",
  CUSTOMER = "customer",
  PARTNER = "partner",
  VENDOR = "vendor",
}

export enum ContactStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  LEAD = "lead",
  PROSPECT = "prospect",
  CUSTOMER = "customer",
}

export enum ContactSource {
  WEBSITE = "website",
  REFERRAL = "referral",
  SOCIAL_MEDIA = "social_media",
  EMAIL_CAMPAIGN = "email_campaign",
  COLD_OUTREACH = "cold_outreach",
  TRADE_SHOW = "trade_show",
  EVENT = "event",
  OTHER = "other",
}

export enum CompanyType {
  CUSTOMER = "customer",
  PROSPECT = "prospect",
  PARTNER = "partner",
  VENDOR = "vendor",
  COMPETITOR = "competitor",
}

export enum CompanyIndustry {
  TECHNOLOGY = "technology",
  HEALTHCARE = "healthcare",
  FINANCE = "finance",
  RETAIL = "retail",
  MANUFACTURING = "manufacturing",
  EDUCATION = "education",
  REAL_ESTATE = "real_estate",
  CONSULTING = "consulting",
  OTHER = "other",
}

export enum OpportunityPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum ActivityType {
  CALL = "call",
  EMAIL = "email",
  MEETING = "meeting",
  NOTE = "note",
  TASK = "task",
  PROPOSAL_SENT = "proposal_sent",
  QUOTE_SENT = "quote_sent",
  CONTRACT_SIGNED = "contract_signed",
}

// Lead Types
export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  leadSource: LeadSource;
  status: LeadStatus;
  assignedTo?: string;
  notes?: string;
  tags: string[];
  estimatedValue?: number;
  expectedCloseDate?: string;
  tenantId: string;
  createdBy: string;
  assignedToUser?: {
    id: string;
    name: string;
  };
  activities: any[];
  createdAt: string;
  updatedAt: string;
}

export interface LeadCreate {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  leadSource: LeadSource;
  status: LeadStatus;
  assignedTo?: string;
  notes?: string;
  tags: string[];
  estimatedValue?: number;
  expectedCloseDate?: string;
}

export interface LeadUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  leadSource?: LeadSource;
  status?: LeadStatus;
  assignedTo?: string;
  notes?: string;
  tags?: string[];
  estimatedValue?: number;
  expectedCloseDate?: string;
}

// Contact Types
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string;
  jobTitle?: string;
  title?: string;
  department?: string;
  contactType: ContactType;
  status: ContactStatus;
  source: ContactSource;
  isPrimary: boolean;
  notes?: string;
  tags: string[];
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  companyId: string;
  tenantId: string;
  createdBy: string;
  activities: any[];
  createdAt: string;
  updatedAt: string;
}

export interface ContactCreate {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string;
  jobTitle?: string;
  department?: string;
  contactType: ContactType;
  isPrimary: boolean;
  notes?: string;
  tags: string[];
  companyId: string;
}

// Company Types
export interface Company {
  id: string;
  name: string;
  type: CompanyType;
  industry?: CompanyIndustry;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  postalCode?: string;
  annualRevenue?: number;
  employeeCount?: number;
  description?: string;
  notes?: string;
  tags: string[];
  tenantId: string;
  createdBy: string;
  contacts: Contact[];
  opportunities: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CompanyCreate {
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  annualRevenue?: number;
  employeeCount?: number;
  description?: string;
  tags: string[];
}

// Opportunity Types
export interface Opportunity {
  id: string;
  name: string;
  title: string;
  description?: string;
  stage: OpportunityStage;
  priority: OpportunityPriority;
  amount: number;
  probability: number;
  expectedCloseDate: string;
  closeDate?: string;
  leadSource: LeadSource;
  assignedTo?: string;
  notes?: string;
  tags: string[];
  leadId?: string;
  companyId?: string;
  contactId?: string;
  tenantId: string;
  createdBy: string;
  assignedToUser?: {
    id: string;
    name: string;
  };
  activities: any[];
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityCreate {
  name: string;
  description?: string;
  stage: OpportunityStage;
  amount: number;
  probability: number;
  expectedCloseDate: string;
  leadSource: LeadSource;
  assignedTo?: string;
  notes?: string;
  tags: string[];
  leadId?: string;
  companyId?: string;
  contactId?: string;
}

// Quote Types
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
  opportunityId: string;
  contactId?: string;
  validUntil: string;
  amount?: number; // Add amount for compatibility
  terms?: string;
  notes?: string;
  items: QuoteItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  quoteNumber: string;
  status: QuoteStatus;
  tenantId: string;
  createdBy: string;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteCreate {
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

// Contract Types
export interface Contract {
  id: string;
  title: string;
  description?: string;
  opportunityId: string;
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
  status: ContractStatus;
  tenantId: string;
  createdBy: string;
  signedAt?: string;
  activatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractCreate {
  title: string;
  description?: string;
  opportunityId: string;
  contactId?: string;
  companyId?: string;
  startDate: string;
  endDate: string;
  value: number;
  terms?: string;
  notes?: string;
  autoRenew: boolean;
  renewalTerms?: string;
}

// Sales Activity Types
export interface SalesActivity {
  id: string;
  type: ActivityType;
  subject: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  notes?: string;
  leadId?: string;
  opportunityId?: string;
  contactId?: string;
  companyId?: string;
  tenantId: string;
  createdBy: string;
  assignedTo?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesActivityCreate {
  type: ActivityType;
  subject: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  notes?: string;
  leadId?: string;
  opportunityId?: string;
  contactId?: string;
  companyId?: string;
}

// Sales Dashboard Types
export interface SalesMetrics {
  totalLeads: number;
  activeLeads: number;
  totalOpportunities: number;
  openOpportunities: number;
  totalRevenue: number;
  projectedRevenue: number;
  conversionRate: number;
  averageDealSize: number;
}

export interface SalesPipeline {
  stage: string;
  count: number;
  value: number;
  probability: number;
}

export interface SalesDashboard {
  metrics: SalesMetrics;
  pipeline: SalesPipeline[];
  recentActivities: SalesActivity[];
  topOpportunities: Opportunity[];
}

// Response Types
export interface LeadsResponse {
  leads: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ContactsResponse {
  contacts: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CompaniesResponse {
  companies: Company[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface OpportunitiesResponse {
  opportunities: Opportunity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface QuotesResponse {
  quotes: Quote[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ContractsResponse {
  contracts: Contract[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SalesActivitiesResponse {
  activities: SalesActivity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export * from "./Invoice";
export * from "./Payment";
export * from "./InvoiceDashboard";
export * from "./Installment";
export * from "./DeliveryNote";
