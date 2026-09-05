import { apiService } from "./ApiService";
import {
  LeadCreate,
  LeadUpdate,
  CRMLeadsResponse,
  Contact,
  ContactCreate,
  ContactUpdate,
  CRMContactsResponse,
  Company,
  CompanyCreate,
  CompanyUpdate,
  CRMCompaniesResponse,
  Opportunity,
  OpportunityCreate,
  OpportunityUpdate,
  CRMOpportunitiesResponse,
  SalesActivity,
  SalesActivityCreate,
  SalesActivityUpdate,
  CRMActivitiesResponse,
  CRMDashboard,
  CRMLeadFilters,
  CRMContactFilters,
  CRMCompanyFilters,
  CRMOpportunityFilters,
  CRMActivityFilters,
} from "../models/crm";

// Re-export customer types and service from shared CustomerService
export type {
  Customer,
  CustomerCreate,
  CustomerUpdate,
  CustomerStats,
  CustomersResponse,
  CustomerAttachment,
  ContactLabel,
  LabeledEmailItem,
  LabeledPhoneItem,
} from "./CustomerService";

export { CustomerService } from "./CustomerService";

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

export interface GuarantorUpdate extends Partial<GuarantorCreate> {}

// Existing Lead Types
export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  leadSource?: string;
  source?: string;
  status?: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
  priority: "low" | "medium" | "high" | "urgent";
  assignedToId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export class CRMService {
  private apiService = apiService;

  private normalizeOpportunityPayload(
    opportunity: OpportunityCreate | OpportunityUpdate,
  ) {
    const payload: Record<string, unknown> = { ...opportunity };
    const optionalStringFields = [
      "expectedCloseDate",
      "leadId",
      "contactId",
      "companyId",
      "assignedTo",
      "notes",
      "description",
    ];

    optionalStringFields.forEach((field) => {
      const value = payload[field];
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) {
          delete payload[field];
        } else {
          payload[field] = trimmed;
        }
      }
    });

    return payload;
  }

  // Lead Management
  async getLeads(
    filters?: CRMLeadFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<CRMLeadsResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", String(filters.status));
    if (filters?.source) params.append("source", String(filters.source));
    if (filters?.assignedTo) params.append("assigned_to", filters.assignedTo);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.pipeline) params.append("pipeline", filters.pipeline);
    if (filters?.rating) params.append("rating", filters.rating);
    if (filters?.priority) params.append("priority", filters.priority);
    if (filters?.leadType) params.append("lead_type", filters.leadType);
    if (filters?.isPartial != null)
      params.append("is_partial", String(filters.isPartial));
    if (filters?.sort) params.append("sort", filters.sort);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.apiService.get(`/crm/leads?${params.toString()}`);
  }

  async getLead(id: string): Promise<any> {
    return this.apiService.get(`/crm/leads/${id}`);
  }

  async getLeadDetail(id: string): Promise<any> {
    return this.apiService.get(`/crm/leads/${id}/detail`);
  }

  async createLead(lead: LeadCreate): Promise<Lead> {
    const payload: Record<string, unknown> = { ...lead };
    const normalizedLeadSource = payload.leadSource ?? payload.source;
    if (normalizedLeadSource) {
      payload.leadSource = normalizedLeadSource;
    }
    delete payload.source;
    if (typeof payload.email === "string") {
      payload.email = payload.email.trim();
    }
    return this.apiService.post("/crm/leads", payload);
  }

  async updateLead(id: string, lead: LeadUpdate): Promise<Lead> {
    const payload: Record<string, unknown> = { ...lead };
    const normalizedLeadSource = payload.leadSource ?? payload.source;
    if (normalizedLeadSource) {
      payload.leadSource = normalizedLeadSource;
    }
    delete payload.source;
    if (typeof payload.email === "string") {
      payload.email = payload.email.trim();
    }
    return this.apiService.put(`/crm/leads/${id}`, payload);
  }

  async deleteLead(id: string): Promise<void> {
    return this.apiService.delete(`/crm/leads/${id}`);
  }

  async bulkLeadAction(data: {
    leadIds: string[];
    action: string;
    assignedTo?: string;
    pipelineStage?: string;
    status?: string;
    leadRating?: string;
    priority?: string;
    tags?: string[];
  }): Promise<{ message: string; updated: number }> {
    return this.apiService.post("/crm/leads/bulk", data);
  }

  async updateLeadPipeline(id: string, pipelineStage: string): Promise<any> {
    return this.apiService.post(`/crm/leads/${id}/pipeline`, { pipelineStage });
  }

  async getLeadTimeline(id: string): Promise<any[]> {
    return this.apiService.get(`/crm/leads/${id}/timeline`);
  }

  async getLeadNotes(id: string, hideSystem = false): Promise<any[]> {
    return this.apiService.get(
      `/crm/leads/${id}/notes?hide_system=${hideSystem}`,
    );
  }

  async createLeadNote(
    id: string,
    data: {
      commType?: string;
      callResult?: string;
      content?: string;
      occurredAt?: string;
    },
  ): Promise<any> {
    return this.apiService.post(`/crm/leads/${id}/notes`, data);
  }

  async deleteLeadNote(leadId: string, noteId: string): Promise<void> {
    return this.apiService.delete(`/crm/leads/${leadId}/notes/${noteId}`);
  }

  async getLeadTasks(id: string, includeCompleted = false): Promise<any[]> {
    return this.apiService.get(
      `/crm/leads/${id}/tasks?include_completed=${includeCompleted}`,
    );
  }

  async createLeadTask(
    id: string,
    data: Record<string, unknown>,
  ): Promise<any> {
    return this.apiService.post(`/crm/leads/${id}/tasks`, data);
  }

  async updateLeadTask(
    leadId: string,
    taskId: string,
    data: Record<string, unknown>,
  ): Promise<any> {
    return this.apiService.put(`/crm/leads/${leadId}/tasks/${taskId}`, data);
  }

  async completeLeadTask(leadId: string, taskId: string): Promise<any> {
    return this.apiService.post(
      `/crm/leads/${leadId}/tasks/${taskId}/complete`,
      {},
    );
  }

  async pushLeadTask(leadId: string, taskId: string, hours = 24): Promise<any> {
    return this.apiService.post(
      `/crm/leads/${leadId}/tasks/${taskId}/push?hours=${hours}`,
      {},
    );
  }

  async deleteLeadTask(leadId: string, taskId: string): Promise<void> {
    return this.apiService.delete(`/crm/leads/${leadId}/tasks/${taskId}`);
  }

  async getLeadEmails(id: string, direction?: string): Promise<any[]> {
    const q = direction ? `?direction=${direction}` : "";
    return this.apiService.get(`/crm/leads/${id}/emails${q}`);
  }

  async composeLeadEmail(
    id: string,
    data: { subject: string; body: string; toEmail?: string },
  ): Promise<any> {
    return this.apiService.post(`/crm/leads/${id}/emails`, data);
  }

  async getLeadSms(id: string): Promise<any[]> {
    return this.apiService.get(`/crm/leads/${id}/sms`);
  }

  async sendLeadSms(
    id: string,
    data: { body: string; toPhone?: string },
  ): Promise<any> {
    return this.apiService.post(`/crm/leads/${id}/sms`, data);
  }

  async getLeadCampaigns(): Promise<any[]> {
    return this.apiService.get("/crm/leads/campaigns");
  }

  async createLeadCampaign(data: {
    name: string;
    description?: string;
    steps?: Record<string, unknown>[];
  }): Promise<any> {
    return this.apiService.post("/crm/leads/campaigns", data);
  }

  async getLeadCampaignAssignments(id: string): Promise<any[]> {
    return this.apiService.get(`/crm/leads/${id}/campaign-assignments`);
  }

  async assignLeadCampaign(id: string, campaignId: string): Promise<any> {
    return this.apiService.post(`/crm/leads/${id}/campaign-assignments`, {
      campaignId,
    });
  }

  async leadCampaignAction(
    leadId: string,
    assignmentId: string,
    action: string,
  ): Promise<any> {
    return this.apiService.post(
      `/crm/leads/${leadId}/campaign-assignments/${assignmentId}/${action}`,
      {},
    );
  }

  async getListingSearches(id: string): Promise<any[]> {
    return this.apiService.get(`/crm/leads/${id}/listing-searches`);
  }

  async createListingSearch(
    id: string,
    data: Record<string, unknown>,
  ): Promise<any> {
    return this.apiService.post(`/crm/leads/${id}/listing-searches`, data);
  }

  async deleteListingSearch(leadId: string, searchId: string): Promise<void> {
    return this.apiService.delete(
      `/crm/leads/${leadId}/listing-searches/${searchId}`,
    );
  }

  async runListingSearch(leadId: string, searchId: string): Promise<any> {
    return this.apiService.post(
      `/crm/leads/${leadId}/listing-searches/${searchId}/run`,
      {},
    );
  }

  async getPropertyViews(id: string): Promise<any[]> {
    return this.apiService.get(`/crm/leads/${id}/property-views`);
  }

  async createPropertyView(
    id: string,
    data: Record<string, unknown>,
  ): Promise<any> {
    return this.apiService.post(`/crm/leads/${id}/property-views`, data);
  }

  async getLeadSales(id: string): Promise<any[]> {
    return this.apiService.get(`/crm/leads/${id}/sales`);
  }

  async createLeadSale(
    id: string,
    data: Record<string, unknown>,
  ): Promise<any> {
    return this.apiService.post(`/crm/leads/${id}/sales`, data);
  }

  async getAdditionalContacts(id: string): Promise<any[]> {
    return this.apiService.get(`/crm/leads/${id}/additional-contacts`);
  }

  async createAdditionalContact(
    id: string,
    data: Record<string, unknown>,
  ): Promise<any> {
    return this.apiService.post(`/crm/leads/${id}/additional-contacts`, data);
  }

  async getSavedLeadFilters(): Promise<any[]> {
    return this.apiService.get("/crm/leads/saved-filters");
  }

  async createSavedLeadFilter(data: Record<string, unknown>): Promise<any> {
    return this.apiService.post("/crm/leads/saved-filters", data);
  }

  async getLeadIntegrationsStatus(): Promise<{
    twilioConfigured: boolean;
    smtpConfigured: boolean;
  }> {
    return this.apiService.get("/crm/leads/integrations/status");
  }

  async convertLeadToContact(
    leadId: string,
    contactData: ContactCreate,
  ): Promise<{ message: string; contact: Contact }> {
    return this.apiService.post(`/crm/leads/${leadId}/convert`, contactData);
  }

  // Contact Management
  async getContacts(
    filters?: CRMContactFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<CRMContactsResponse> {
    const params = new URLSearchParams();
    if (filters?.type) params.append("type", filters.type);
    if (filters?.companyId) params.append("company_id", filters.companyId);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.assignedTo) params.append("assigned_to", filters.assignedTo);
    if (filters?.industry) params.append("industry", filters.industry);
    if (filters?.website?.trim())
      params.append("website", filters.website.trim());
    if (
      filters?.birthdayMonth != null &&
      filters.birthdayMonth >= 1 &&
      filters.birthdayMonth <= 12
    )
      params.append("birthday_month", String(filters.birthdayMonth));
    if (filters?.country?.trim())
      params.append("country", filters.country.trim());
    if (filters?.dateField) params.append("date_field", filters.dateField);
    if (filters?.dateFrom) params.append("date_from", filters.dateFrom);
    if (filters?.dateTo) params.append("date_to", filters.dateTo);
    if (filters?.quickFilter)
      params.append("quick_filter", filters.quickFilter);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.apiService.get(`/crm/contacts?${params.toString()}`);
  }

  async getContact(id: string): Promise<Contact> {
    return this.apiService.get(`/crm/contacts/${id}`);
  }

  async createContact(contact: ContactCreate): Promise<Contact> {
    return this.apiService.post("/crm/contacts", contact);
  }

  async updateContact(id: string, contact: ContactUpdate): Promise<Contact> {
    return this.apiService.put(`/crm/contacts/${id}`, contact);
  }

  async deleteContact(id: string): Promise<void> {
    return this.apiService.delete(`/crm/contacts/${id}`);
  }

  // Company Management
  async getCompanies(
    filters?: CRMCompanyFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<CRMCompaniesResponse> {
    const params = new URLSearchParams();
    if (filters?.industry) params.append("industry", filters.industry);
    if (filters?.size) params.append("size", filters.size);
    if (filters?.search) params.append("search", filters.search);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.apiService.get(`/crm/companies?${params.toString()}`);
  }

  async getCompany(id: string): Promise<Company> {
    return this.apiService.get(`/crm/companies/${id}`);
  }

  async createCompany(company: CompanyCreate): Promise<Company> {
    return this.apiService.post("/crm/companies", company);
  }

  async updateCompany(id: string, company: CompanyUpdate): Promise<Company> {
    return this.apiService.put(`/crm/companies/${id}`, company);
  }

  async deleteCompany(id: string): Promise<void> {
    return this.apiService.delete(`/crm/companies/${id}`);
  }

  // Opportunity Management
  async getOpportunities(
    filters?: CRMOpportunityFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<CRMOpportunitiesResponse> {
    const params = new URLSearchParams();
    if (filters?.stage) params.append("stage", filters.stage);
    if (filters?.assignedTo) params.append("assigned_to", filters.assignedTo);
    if (filters?.search) params.append("search", filters.search);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.apiService.get(`/crm/opportunities?${params.toString()}`);
  }

  async getOpportunity(id: string): Promise<Opportunity> {
    return this.apiService.get(`/crm/opportunities/${id}`);
  }

  async createOpportunity(
    opportunity: OpportunityCreate,
  ): Promise<Opportunity> {
    const payload = this.normalizeOpportunityPayload(opportunity);
    return this.apiService.post("/crm/opportunities", payload);
  }

  async updateOpportunity(
    id: string,
    opportunity: OpportunityUpdate,
  ): Promise<Opportunity> {
    const payload = this.normalizeOpportunityPayload(opportunity);
    return this.apiService.put(`/crm/opportunities/${id}`, payload);
  }

  async deleteOpportunity(id: string): Promise<void> {
    return this.apiService.delete(`/crm/opportunities/${id}`);
  }

  // Sales Activity Management
  async getActivities(
    filters?: CRMActivityFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<CRMActivitiesResponse> {
    const params = new URLSearchParams();
    if (filters?.type) params.append("type", filters.type);
    if (filters?.completed !== undefined)
      params.append("completed", filters.completed.toString());
    if (filters?.search) params.append("search", filters.search);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.apiService.get(`/crm/activities?${params.toString()}`);
  }

  async getActivity(id: string): Promise<SalesActivity> {
    return this.apiService.get(`/crm/activities/${id}`);
  }

  async createActivity(activity: SalesActivityCreate): Promise<SalesActivity> {
    return this.apiService.post("/crm/activities", activity);
  }

  async updateActivity(
    id: string,
    activity: SalesActivityUpdate,
  ): Promise<SalesActivity> {
    return this.apiService.put(`/crm/activities/${id}`, activity);
  }

  async deleteActivity(id: string): Promise<void> {
    return this.apiService.delete(`/crm/activities/${id}`);
  }

  async getGuarantors(customerId: string): Promise<Guarantor[]> {
    return this.apiService.get(`/crm/customers/${customerId}/guarantors`);
  }

  async createGuarantor(
    customerId: string,
    data: GuarantorCreate,
  ): Promise<Guarantor> {
    return this.apiService.post(
      `/crm/customers/${customerId}/guarantors`,
      data,
    );
  }

  async updateGuarantor(
    guarantorId: string,
    data: GuarantorUpdate,
  ): Promise<Guarantor> {
    return this.apiService.put(`/crm/guarantors/${guarantorId}`, data);
  }

  async deleteGuarantor(guarantorId: string): Promise<void> {
    return this.apiService.delete(`/crm/guarantors/${guarantorId}`);
  }

  async getDashboard(): Promise<CRMDashboard> {
    return this.apiService.get("/crm/dashboard");
  }

  // Utility Methods
  getLeadStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      new: "bg-blue-100 text-blue-800",
      contacted: "bg-yellow-100 text-yellow-800",
      qualified: "bg-green-100 text-green-800",
      proposal_sent: "bg-purple-100 text-purple-800",
      negotiation: "bg-orange-100 text-orange-800",
      won: "bg-green-100 text-green-800",
      lost: "bg-red-100 text-red-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  }

  getOpportunityStageColor(stage: string): string {
    const stageColors: { [key: string]: string } = {
      prospecting: "bg-blue-100 text-blue-800",
      qualification: "bg-yellow-100 text-yellow-800",
      proposal: "bg-purple-100 text-purple-800",
      negotiation: "bg-orange-100 text-orange-800",
      closed_won: "bg-green-100 text-green-800",
      closed_lost: "bg-red-100 text-red-800",
    };
    return stageColors[stage] || "bg-gray-100 text-gray-800";
  }

  getActivityTypeColor(type: string): string {
    const typeColors: { [key: string]: string } = {
      call: "bg-blue-100 text-blue-800",
      email: "bg-green-100 text-green-800",
      meeting: "bg-purple-100 text-purple-800",
      task: "bg-yellow-100 text-yellow-800",
      note: "bg-gray-100 text-gray-800",
      proposal: "bg-indigo-100 text-indigo-800",
      contract: "bg-pink-100 text-pink-800",
    };
    return typeColors[type] || "bg-gray-100 text-gray-800";
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

export default new CRMService();
