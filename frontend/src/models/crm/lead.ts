export enum LeadStatus {
  NEW = "new",
  OPEN = "open",
  CONTACTED = "contacted",
  QUALIFIED = "qualified",
  PROPOSAL_SENT = "proposal_sent",
  NEGOTIATION = "negotiation",
  WON = "won",
  LOST = "lost",
  CLOSED = "closed",
}

export enum LeadPipelineStage {
  NEW_LEAD = "new_lead",
  TRIED_TO_CONTACT = "tried_to_contact",
  MADE_CONTACT = "made_contact",
  QUALIFIED = "qualified",
  APPOINTMENT_SET = "appointment_set",
  OFFER_MADE = "offer_made",
  UNDER_CONTRACT = "under_contract",
  CLOSED = "closed",
  LOST = "lost",
}

export enum LeadRating {
  HOT = "hot",
  WARM = "warm",
  COLD = "cold",
}

export enum LeadSource {
  WEBSITE = "website",
  REFERRAL = "referral",
  SOCIAL_MEDIA = "social_media",
  EMAIL_CAMPAIGN = "email_campaign",
  COLD_CALL = "cold_call",
  TRADE_SHOW = "trade_show",
  PARTNER = "partner",
  OTHER = "other",
}

export const PIPELINE_LABELS: Record<string, string> = {
  new_lead: "New Lead",
  tried_to_contact: "Tried to contact",
  made_contact: "Made contact",
  qualified: "Qualified",
  appointment_set: "Appointment set",
  offer_made: "Offer made",
  under_contract: "Under contract",
  closed: "Closed",
  lost: "Lost",
};

export const CALL_RESULTS = [
  "Lead Called In",
  "Connected",
  "Interested",
  "Attempted",
  "Called (No message left)",
  "Opt Out - Do not call",
  "Lead Is Not There",
  "Talked to Lead",
  "Wrong Number",
  "Left Voice Mail",
] as const;

export interface LeadAdditionalContact {
  id: string;
  leadId?: string;
  name?: string;
  phone?: string;
  email?: string;
  relationshipLabel?: string;
}

export interface LeadTaskItem {
  id: string;
  leadId: string;
  title: string;
  details?: string;
  assignedToId?: string;
  assignedToName?: string;
  createdById?: string;
  createdByName?: string;
  status: string;
  priority: string;
  dueAt?: string;
  reminder?: string;
  completedAt?: string;
  flagged?: boolean;
  overdue?: boolean;
  createdAt?: string;
}

export interface LeadListingSearch {
  id: string;
  leadId?: string;
  name: string;
  criteria?: Record<string, unknown>;
  city?: string;
  priceMin?: number;
  priceMax?: number;
  propertyTypes?: string[];
  emailsSent?: number;
  lastSentAt?: string;
  nextSendAt?: string;
  intervalHours?: number;
  active?: boolean;
}

export interface LeadPropertyView {
  id: string;
  leadId?: string;
  propertyType?: string;
  beds?: number;
  baths?: number;
  price?: number;
  city?: string;
  address?: string;
  mlsNumber?: string;
  viewedAt?: string;
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  status: LeadStatus | string;
  source?: LeadSource | string;
  leadSource?: LeadSource | string;
  assignedTo?: string;
  notes?: string;
  tags: string[];
  score: number;
  budget?: number;
  timeline?: string;
  priority?: string;
  pipelineStage?: string;
  leadRating?: string;
  leadType?: string;
  priceMin?: number;
  priceMax?: number;
  buyIntent?: string;
  sellIntent?: string;
  houseToSell?: string;
  buyingIn?: string;
  sellingIn?: string;
  mortgageType?: string;
  ownsRents?: string;
  workPhone?: string;
  homePhone?: string;
  address?: string;
  city?: string;
  description?: string;
  ipAddress?: string;
  lat?: number;
  lng?: number;
  mainAgentId?: string;
  listAgentId?: string;
  mortgageAgentId?: string;
  lastContactAt?: string;
  lastContactChannel?: string;
  registeredAt?: string;
  isPartial?: boolean;
  refSource?: string;
  campaignSource?: string;
  receiveSms?: boolean;
  customFields?: Record<string, unknown>;
  nextFollowUpDate?: string;
  callCount?: number;
  emailCount?: number;
  smsCount?: number;
  lastCallAt?: string;
  lastEmailAt?: string;
  lastSmsAt?: string;
  hasOpenTask?: boolean;
  hasFlaggedTask?: boolean;
  convertedToContact?: string;
  convertedToOpportunity?: string;
  lastContactDate?: string;
  tenantId?: string;
  tenant_id?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  additionalContacts?: LeadAdditionalContact[];
  openTask?: LeadTaskItem | null;
  lastPropertyView?: LeadPropertyView | null;
  propertyViewSummary?: Record<string, unknown> | null;
  listingSearches?: LeadListingSearch[];
  integrations?: { twilioConfigured?: boolean; smtpConfigured?: boolean };
}

export interface LeadCreate {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  status?: LeadStatus | string;
  source?: LeadSource | string;
  leadSource?: LeadSource | string;
  assignedTo?: string;
  notes?: string;
  tags?: string[];
  score?: number;
  budget?: number;
  timeline?: string;
  priority?: string;
  pipelineStage?: string;
  leadRating?: string;
  leadType?: string;
  priceMin?: number;
  priceMax?: number;
  city?: string;
  description?: string;
  mainAgentId?: string;
  isPartial?: boolean;
  refSource?: string;
  campaignSource?: string;
  receiveSms?: boolean;
}

export interface LeadUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  status?: LeadStatus | string;
  source?: LeadSource | string;
  leadSource?: LeadSource | string;
  assignedTo?: string;
  notes?: string;
  tags?: string[];
  score?: number;
  budget?: number;
  timeline?: string;
  priority?: string;
  pipelineStage?: string;
  leadRating?: string;
  leadType?: string;
  priceMin?: number;
  priceMax?: number;
  buyIntent?: string;
  sellIntent?: string;
  houseToSell?: string;
  buyingIn?: string;
  sellingIn?: string;
  mortgageType?: string;
  ownsRents?: string;
  workPhone?: string;
  homePhone?: string;
  address?: string;
  city?: string;
  description?: string;
  mainAgentId?: string;
  listAgentId?: string;
  mortgageAgentId?: string;
  isPartial?: boolean;
  refSource?: string;
  campaignSource?: string;
  receiveSms?: boolean;
  customFields?: Record<string, unknown>;
  lat?: number;
  lng?: number;
  ipAddress?: string;
}

export interface LeadNoteItem {
  id: string;
  leadId: string;
  commType: string;
  callResult?: string;
  content?: string;
  occurredAt?: string;
  createdById?: string;
  createdByName?: string;
  isSystem?: boolean;
  createdAt?: string;
}

export interface LeadEmailItem {
  id: string;
  leadId: string;
  subject?: string;
  body?: string;
  direction: string;
  status: string;
  toEmail?: string;
  fromEmail?: string;
  sentAt?: string;
  openedAt?: string;
  createdAt?: string;
  smtpConfigured?: boolean;
}

export interface LeadSmsItem {
  id: string;
  leadId: string;
  body: string;
  direction: string;
  status: string;
  toPhone?: string;
  fromPhone?: string;
  twilioSid?: string;
  sentAt?: string;
  createdAt?: string;
  twilioConfigured?: boolean;
  error?: string;
}

export interface LeadCampaignItem {
  id: string;
  name: string;
  description?: string;
  steps?: Record<string, unknown>[];
  status: string;
}

export interface LeadCampaignAssignment {
  id: string;
  leadId: string;
  campaignId: string;
  campaignName?: string;
  status: string;
  progress: number;
  currentStep: number;
  totalSteps: number;
  assignedByName?: string;
  assignedAt?: string;
}

export interface LeadSaleItem {
  id: string;
  leadId: string;
  agentRole?: string;
  closingDate?: string;
  mlsNumber?: string;
  sellingPrice?: number;
  createdAt?: string;
}

export interface LeadSavedFilter {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  pinned: boolean;
  pinOrder: number;
  color?: string;
}

export interface LeadPipelineHistoryItem {
  id: string;
  pipelineStage: string;
  changedAt?: string;
  changedById?: string;
}

export interface CRMLeadFilters {
  status?: LeadStatus | string;
  source?: LeadSource | string;
  assignedTo?: string;
  search?: string;
  pipeline?: string;
  rating?: string;
  priority?: string;
  leadType?: string;
  isPartial?: boolean;
  sort?: string;
}

export interface CRMLeadsResponse {
  leads: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
