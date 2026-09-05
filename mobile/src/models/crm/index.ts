// CRM Enums
export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL_SENT = 'proposal_sent',
  NEGOTIATION = 'negotiation',
  WON = 'won',
  LOST = 'lost',
}

export enum LeadSource {
  WEBSITE = 'website',
  REFERRAL = 'referral',
  SOCIAL_MEDIA = 'social_media',
  EMAIL_CAMPAIGN = 'email_campaign',
  COLD_CALL = 'cold_call',
  TRADE_SHOW = 'trade_show',
  PARTNER = 'partner',
  OTHER = 'other',
}

export enum OpportunityStage {
  PROSPECTING = 'prospecting',
  QUALIFICATION = 'qualification',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
}

export enum ContactType {
  LEAD = 'lead',
  CUSTOMER = 'customer',
  PARTNER = 'partner',
  VENDOR = 'vendor',
  OTHER = 'other',
}

export enum ActivityType {
  CALL = 'call',
  EMAIL = 'email',
  MEETING = 'meeting',
  TASK = 'task',
  NOTE = 'note',
  PROPOSAL = 'proposal',
  CONTRACT = 'contract',
}

export enum CompanySize {
  STARTUP = 'startup',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  ENTERPRISE = 'enterprise',
}

export enum Industry {
  TECHNOLOGY = 'technology',
  HEALTHCARE = 'healthcare',
  FINANCE = 'finance',
  MANUFACTURING = 'manufacturing',
  RETAIL = 'retail',
  EDUCATION = 'education',
  REAL_ESTATE = 'real_estate',
  CONSULTING = 'consulting',
  OTHER = 'other',
}

// CRM Models
export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  leadSource?: string;
  status: LeadStatus;
  source: LeadSource;
  assignedTo?: string;
  notes?: string;
  tags: string[];
  score: number;
  budget?: number;
  timeline?: string;
  convertedToContact?: string;
  convertedToOpportunity?: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  tenantId: string;
  createdBy: string;
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
  status?: LeadStatus;
  source?: LeadSource;
  assignedTo?: string;
  notes?: string;
  tags?: string[];
  score?: number;
  budget?: number;
  timeline?: string;
}

export interface LeadUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  status?: LeadStatus;
  source?: LeadSource;
  assignedTo?: string;
  notes?: string;
  tags?: string[];
  score?: number;
  budget?: number;
  timeline?: string;
}

export type ContactAttachment = {
  url: string;
  original_filename?: string;
  s3_key?: string;
};

export type ContactLabel = 'work' | 'personal' | 'other';

export interface LabeledEmailItem {
  value: string;
  label: ContactLabel;
}

export interface LabeledPhoneItem {
  value: string;
  label: ContactLabel;
}

export type ContactAddressRow = {
  label?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export type ContactSocialLinks = {
  facebook?: string;
  instagram?: string;
  x?: string;
  linkedin?: string;
  skype?: string;
  tiktok?: string;
  threads?: string;
};

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string;
  mobile?: string;
  emails?: LabeledEmailItem[];
  phones?: LabeledPhoneItem[];
  jobTitle?: string;
  department?: string;
  companyId?: string;
  contactType?: ContactType;
  notes?: string;
  description?: string;
  tags: string[];
  attachments?: ContactAttachment[];
  isActive: boolean;
  initials?: string | null;
  fullName?: string | null;
  birthday?: string | null;
  businessTaxId?: string | null;
  website?: string | null;
  addresses?: ContactAddressRow[];
  socialLinks?: ContactSocialLinks;
  assignedTo?: string;
  clientValue?: number;
  dealClosedValue?: number;
  remainingPayable?: number;
  lifetimeValue?: number;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  tenantId?: string;
  tenant_id?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactCreate {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string;
  mobile?: string;
  emails?: LabeledEmailItem[];
  phones?: LabeledPhoneItem[];
  jobTitle?: string;
  department?: string;
  companyId?: string;
  contactType?: ContactType;
  notes?: string;
  description?: string;
  tags?: string[];
  attachments?: ContactAttachment[];
  isActive?: boolean;
  initials?: string | null;
  fullName?: string | null;
  birthday?: string | null;
  businessTaxId?: string | null;
  website?: string | null;
  addresses?: ContactAddressRow[];
  socialLinks?: ContactSocialLinks;
  assignedTo?: string;
}

export interface ContactUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  emails?: LabeledEmailItem[];
  phones?: LabeledPhoneItem[];
  jobTitle?: string;
  department?: string;
  companyId?: string;
  contactType?: ContactType;
  notes?: string;
  description?: string;
  tags?: string[];
  attachments?: ContactAttachment[];
  isActive?: boolean;
  initials?: string | null;
  fullName?: string | null;
  birthday?: string | null;
  businessTaxId?: string | null;
  website?: string | null;
  addresses?: ContactAddressRow[];
  socialLinks?: ContactSocialLinks;
  assignedTo?: string;
}

export interface Company {
  id: string;
  name: string;
  industry?: Industry;
  size?: CompanySize;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  description?: string;
  notes?: string;
  tags: string[];
  isActive: boolean;
  annualRevenue?: number;
  employeeCount?: number;
  foundedYear?: number;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyCreate {
  name: string;
  industry?: Industry;
  size?: CompanySize;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  description?: string;
  notes?: string;
  tags?: string[];
  isActive?: boolean;
  annualRevenue?: number;
  employeeCount?: number;
  foundedYear?: number;
}

export interface CompanyUpdate {
  name?: string;
  industry?: Industry;
  size?: CompanySize;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  description?: string;
  notes?: string;
  tags?: string[];
  isActive?: boolean;
  annualRevenue?: number;
  employeeCount?: number;
  foundedYear?: number;
}

export interface Opportunity {
  id: string;
  title: string;
  description?: string;
  stage: OpportunityStage;
  amount?: number;
  probability: number;
  expectedCloseDate?: string;
  leadId?: string;
  contactId?: string;
  companyId?: string;
  assignedTo?: string;
  notes?: string;
  tags: string[];
  closedDate?: string;
  wonAmount?: number;
  lostReason?: string;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityCreate {
  title: string;
  description?: string;
  stage?: OpportunityStage;
  amount?: number;
  probability?: number;
  expectedCloseDate?: string;
  leadId?: string;
  contactId?: string;
  companyId?: string;
  assignedTo?: string;
  notes?: string;
  tags?: string[];
}

export interface OpportunityUpdate {
  title?: string;
  description?: string;
  stage?: OpportunityStage;
  amount?: number;
  probability?: number;
  expectedCloseDate?: string;
  leadId?: string;
  contactId?: string;
  companyId?: string;
  assignedTo?: string;
  notes?: string;
  tags?: string[];
}

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
  completed?: boolean;
  notes?: string;
  leadId?: string;
  opportunityId?: string;
  contactId?: string;
  companyId?: string;
}

export interface SalesActivityUpdate {
  type?: ActivityType;
  subject?: string;
  description?: string;
  dueDate?: string;
  completed?: boolean;
  notes?: string;
}

// CRM Response Models
export interface CRMLeadsResponse {
  leads: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CRMContactsResponse {
  contacts: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CRMCompaniesResponse {
  companies: Company[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CRMOpportunitiesResponse {
  opportunities: Opportunity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CRMActivitiesResponse {
  activities: SalesActivity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// CRM Dashboard Models
export interface CRMMetrics {
  totalLeads: number;
  activeLeads: number;
  totalContacts: number;
  totalCompanies: number;
  totalOpportunities: number;
  openOpportunities: number;
  totalRevenue: number;
  projectedRevenue: number;
  conversionRate: number;
  averageDealSize: number;
}

export interface CRMPipeline {
  stage: string;
  count: number;
  value: number;
  probability: number;
}

export interface CRMDashboard {
  metrics: CRMMetrics;
  pipeline: CRMPipeline[];
  recentActivities: SalesActivity[];
  topOpportunities: Opportunity[];
  recentLeads: Lead[];
}

// CRM Filter Types
export interface CRMLeadFilters {
  status?: LeadStatus;
  source?: LeadSource;
  assignedTo?: string;
  search?: string;
}

export interface CRMContactFilters {
  type?: ContactType;
  companyId?: string;
  search?: string;
  assignedTo?: string;
  industry?: Industry;
  website?: string;
  birthdayMonth?: number;
  country?: string;
  dateField?: 'created' | 'updated' | 'last_contacted';
  dateFrom?: string;
  dateTo?: string;
  quickFilter?: 'today' | '7d' | '30d' | '90d';
}

export interface CRMCompanyFilters {
  industry?: Industry;
  size?: CompanySize;
  search?: string;
}

export interface CRMOpportunityFilters {
  stage?: OpportunityStage;
  assignedTo?: string;
  search?: string;
}

export interface CRMActivityFilters {
  type?: ActivityType;
  completed?: boolean;
  search?: string;
}
