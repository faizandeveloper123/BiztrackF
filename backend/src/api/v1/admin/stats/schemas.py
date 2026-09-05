from typing import List

from pydantic import BaseModel


class CountStats(BaseModel):
    total: int
    active: int
    inactive: int


class UserStats(BaseModel):
    total: int
    active: int
    inactive: int
    superAdmins: int
    tenantAssigned: int
    systemUsers: int


class PlanDistributionItem(BaseModel):
    planName: str
    planType: str
    count: int


class AdminStatsResponse(BaseModel):
    tenants: CountStats
    users: UserStats
    subscriptions: CountStats
    planDistribution: List[PlanDistributionItem]
