from typing import List, Optional

from pydantic import BaseModel


class SubscriptionPlanInfo(BaseModel):
    id: Optional[str] = None
    name: str
    planType: Optional[str] = None
    price: float = 0
    billingCycle: Optional[str] = None


class AdminSubscriptionItem(BaseModel):
    id: str
    tenant_id: str
    tenant_name: Optional[str] = None
    status: str
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    autoRenew: bool
    plan: Optional[SubscriptionPlanInfo] = None
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None


class SubscriptionStats(BaseModel):
    total: int
    active: int
    trial: int
    cancelled: int
    expired: int
    inactive: int


class AdminSubscriptionsResponse(BaseModel):
    subscriptions: List[AdminSubscriptionItem]
    stats: SubscriptionStats
