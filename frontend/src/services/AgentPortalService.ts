import { apiService } from "./ApiService";

export type AgentDateQuickFilter = "today" | "7d" | "30d" | "90d" | "all";

export type AgentLevelInfo = {
  key: string;
  icon: string;
  label: string;
  minPct: number;
};

export type AgentLevelResponse = {
  current: AgentLevelInfo;
  next?: AgentLevelInfo | null;
  progressPct: number;
  targetAchievementPct: number;
  installmentCompletionPct?: number;
};

export type AgentOverview = {
  totalEarnings: number;
  dealsClosed: number;
  dealClosedValue: number;
  pendingInstallments: number;
  targetAchievementPct: number;
  remainingTargetAmount: number;
  monthlyTarget: number;
  averageDealValue: number;
  biggestDeal: number;
  winRatePct: number;
  level: AgentLevelResponse;
  openLeads: number;
  openOpportunities: number;
};

export type ClientEarningsRow = {
  contactId: string;
  clientName: string;
  source: string;
  dealValue: number;
  paidAmount: number;
  remainingBalance: number;
  contributionPct: number;
};

export type AgentEarnings = AgentOverview & {
  clients: ClientEarningsRow[];
};

export type AgentBadge = {
  key: string;
  icon: string;
  label: string;
  description: string;
  earned: boolean;
  earnedAt?: string | null;
};

export type AgentMilestone = {
  pct: number;
  icon: string;
  label: string;
  unlocked: boolean;
};

export type AgentAchievements = {
  badges: AgentBadge[];
  milestones: AgentMilestone[];
  level: AgentLevelResponse;
  targetAchievementPct: number;
};

export type PipelineStage = {
  stage: string;
  count: number;
  amount: number;
};

export type AgentLead = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  status: string;
  leadSource?: string;
  createdAt?: string;
};

export type AgentLeadsResponse = {
  leads: AgentLead[];
  total: number;
  page: number;
  limit: number;
};

export type TeamMember = AgentOverview & {
  userId: string;
  name: string;
};

export type TeamAnalytics = {
  members: TeamMember[];
  total: number;
};

export type LeaderboardRow = {
  rank: number;
  userId: string;
  name: string;
  totalEarnings: number;
  dealsClosed: number;
  targetAchievementPct: number;
  level: AgentLevelResponse;
};

export type SalesTargetItem = {
  userId: string;
  name: string;
  year: number;
  month: number;
  targetAmount: number;
};

export type AgentPortalFilters = {
  dateFrom?: string;
  dateTo?: string;
  quickFilter?: AgentDateQuickFilter;
  agentId?: string;
};

export type ContactLedgerEntry = {
  id: string;
  entryType: string;
  revenueType: string;
  amount: number;
  description?: string;
  entryDate: string;
  invoiceId?: string;
  paymentId?: string;
};

export type ContactLedger = {
  entries: ContactLedgerEntry[];
  totalPaid: number;
  totalPending: number;
};

function buildParams(filters?: AgentPortalFilters): string {
  const params = new URLSearchParams();
  if (filters?.dateFrom) params.append("date_from", filters.dateFrom);
  if (filters?.dateTo) params.append("date_to", filters.dateTo);
  if (filters?.quickFilter && filters.quickFilter !== "all")
    params.append("quick_filter", filters.quickFilter);
  if (filters?.agentId) params.append("agent_id", filters.agentId);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

class AgentPortalService {
  async getOverview(filters?: AgentPortalFilters): Promise<AgentOverview> {
    return apiService.get(`/agent-portal/overview${buildParams(filters)}`);
  }

  async getEarnings(filters?: AgentPortalFilters): Promise<AgentEarnings> {
    return apiService.get(`/agent-portal/earnings${buildParams(filters)}`);
  }

  async getAchievements(
    filters?: AgentPortalFilters,
  ): Promise<AgentAchievements> {
    return apiService.get(`/agent-portal/achievements${buildParams(filters)}`);
  }

  async getPipeline(
    filters?: AgentPortalFilters,
  ): Promise<{ pipeline: PipelineStage[] }> {
    return apiService.get(`/agent-portal/pipeline${buildParams(filters)}`);
  }

  async getLeads(
    page = 1,
    limit = 20,
    filters?: AgentPortalFilters,
  ): Promise<AgentLeadsResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (filters?.dateFrom) params.append("date_from", filters.dateFrom);
    if (filters?.dateTo) params.append("date_to", filters.dateTo);
    if (filters?.quickFilter && filters.quickFilter !== "all")
      params.append("quick_filter", filters.quickFilter);
    if (filters?.agentId) params.append("agent_id", filters.agentId);
    return apiService.get(`/agent-portal/leads?${params.toString()}`);
  }

  async getTeam(filters?: AgentPortalFilters): Promise<TeamAnalytics> {
    return apiService.get(`/agent-portal/team${buildParams(filters)}`);
  }

  async getLeaderboard(
    filters?: AgentPortalFilters,
  ): Promise<{ leaderboard: LeaderboardRow[] }> {
    return apiService.get(`/agent-portal/leaderboard${buildParams(filters)}`);
  }

  async getTargets(
    year?: number,
    month?: number,
  ): Promise<{ targets: SalesTargetItem[] }> {
    const params = new URLSearchParams();
    if (year) params.append("year", String(year));
    if (month) params.append("month", String(month));
    const qs = params.toString();
    return apiService.get(`/agent-portal/targets${qs ? `?${qs}` : ""}`);
  }

  async setTarget(
    userId: string,
    year: number,
    month: number,
    targetAmount: number,
  ): Promise<void> {
    await apiService.post("/agent-portal/targets", {
      userId,
      year,
      month,
      targetAmount,
    });
  }

  async getContactLedger(contactId: string): Promise<ContactLedger> {
    return apiService.get(`/crm/contacts/${contactId}/ledger`);
  }
}

const agentPortalService = new AgentPortalService();
export default agentPortalService;
