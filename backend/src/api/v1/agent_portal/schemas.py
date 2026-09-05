from pydantic import BaseModel
from typing import Any, Dict, List, Optional


class AgentLevelInfo(BaseModel):
    key: str
    icon: str
    label: str
    minPct: float


class AgentLevelResponse(BaseModel):
    current: AgentLevelInfo
    next: Optional[AgentLevelInfo] = None
    progressPct: float
    targetAchievementPct: float
    installmentCompletionPct: float = 0.0


class AgentOverviewResponse(BaseModel):
    totalEarnings: float
    dealsClosed: int
    dealClosedValue: float
    pendingInstallments: float
    targetAchievementPct: float
    remainingTargetAmount: float
    monthlyTarget: float
    averageDealValue: float
    biggestDeal: float
    winRatePct: float
    level: AgentLevelResponse
    openLeads: int
    openOpportunities: int


class ClientEarningsRow(BaseModel):
    contactId: str
    clientName: str
    source: str
    dealValue: float
    paidAmount: float
    remainingBalance: float
    contributionPct: float


class AgentEarningsResponse(AgentOverviewResponse):
    clients: List[ClientEarningsRow]


class AgentBadgeItem(BaseModel):
    key: str
    icon: str
    label: str
    description: str
    earned: bool
    earnedAt: Optional[str] = None


class AgentMilestoneItem(BaseModel):
    pct: int
    icon: str
    label: str
    unlocked: bool


class AgentAchievementsResponse(BaseModel):
    badges: List[AgentBadgeItem]
    milestones: List[AgentMilestoneItem]
    level: AgentLevelResponse
    targetAchievementPct: float


class PipelineStageItem(BaseModel):
    stage: str
    count: int
    amount: float


class AgentPipelineResponse(BaseModel):
    pipeline: List[PipelineStageItem]


class AgentLeadItem(BaseModel):
    id: str
    firstName: str
    lastName: str
    email: str
    company: Optional[str] = None
    status: str
    leadSource: Optional[str] = None
    createdAt: Optional[str] = None


class AgentLeadsResponse(BaseModel):
    leads: List[AgentLeadItem]
    total: int
    page: int
    limit: int


class SalesTargetSet(BaseModel):
    userId: str
    year: int
    month: int
    targetAmount: float


class TeamMemberAnalytics(AgentOverviewResponse):
    userId: str
    name: str


class TeamAnalyticsResponse(BaseModel):
    members: List[TeamMemberAnalytics]
    total: int


class LeaderboardRow(BaseModel):
    rank: int
    userId: str
    name: str
    totalEarnings: float
    dealsClosed: int
    targetAchievementPct: float
    level: AgentLevelResponse


class LeaderboardResponse(BaseModel):
    leaderboard: List[LeaderboardRow]


class SalesTargetItem(BaseModel):
    userId: str
    name: str
    year: int
    month: int
    targetAmount: float


class SalesTargetsResponse(BaseModel):
    targets: List[SalesTargetItem]


class ContactLedgerEntry(BaseModel):
    id: str
    entryType: str
    revenueType: str
    amount: float
    description: Optional[str] = None
    entryDate: str
    invoiceId: Optional[str] = None
    paymentId: Optional[str] = None


class ContactLedgerResponse(BaseModel):
    entries: List[ContactLedgerEntry]
    totalPaid: float
    totalPending: float
