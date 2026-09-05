from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ....api.crm_access import can_see_all_crm_records
from ....models.crm.agent_portal import AgentSalesTarget
from ....services import agent_portal_service
from ..crm.http_common import require_tenant, tenant_id_str
from .schemas import (
    AgentAchievementsResponse,
    AgentEarningsResponse,
    AgentLeadsResponse,
    AgentOverviewResponse,
    AgentPipelineResponse,
    LeaderboardResponse,
    SalesTargetSet,
    SalesTargetsResponse,
    TeamAnalyticsResponse,
)


def _resolve_agent_id(current_user, tenant_context: dict, agent_id: Optional[str]) -> str:
    if agent_id and can_see_all_crm_records(tenant_context):
        return agent_id
    return str(current_user.id)


def get_overview(
    db: Session,
    current_user,
    tenant_context: dict,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    quick_filter: Optional[str] = None,
    agent_id: Optional[str] = None,
):
    ctx = require_tenant(tenant_context)
    uid = _resolve_agent_id(current_user, ctx, agent_id)
    data = agent_portal_service.get_agent_overview(
        db, tenant_id_str(ctx), uid, date_from, date_to, quick_filter
    )
    return AgentOverviewResponse(**data)


def get_earnings(
    db: Session,
    current_user,
    tenant_context: dict,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    quick_filter: Optional[str] = None,
    agent_id: Optional[str] = None,
):
    ctx = require_tenant(tenant_context)
    uid = _resolve_agent_id(current_user, ctx, agent_id)
    data = agent_portal_service.get_agent_earnings(
        db, tenant_id_str(ctx), uid, date_from, date_to, quick_filter
    )
    return AgentEarningsResponse(**data)


def get_achievements(
    db: Session,
    current_user,
    tenant_context: dict,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    quick_filter: Optional[str] = None,
    agent_id: Optional[str] = None,
):
    ctx = require_tenant(tenant_context)
    uid = _resolve_agent_id(current_user, ctx, agent_id)
    data = agent_portal_service.get_agent_achievements(db, tenant_id_str(ctx), uid)
    return AgentAchievementsResponse(**data)


def get_pipeline(
    db: Session,
    current_user,
    tenant_context: dict,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    quick_filter: Optional[str] = None,
    agent_id: Optional[str] = None,
):
    ctx = require_tenant(tenant_context)
    uid = _resolve_agent_id(current_user, ctx, agent_id)
    data = agent_portal_service.get_agent_pipeline(
        db, tenant_id_str(ctx), uid, date_from, date_to, quick_filter
    )
    return AgentPipelineResponse(**data)


def get_leads(
    db: Session,
    current_user,
    tenant_context: dict,
    page: int = 1,
    limit: int = 20,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    quick_filter: Optional[str] = None,
    agent_id: Optional[str] = None,
):
    ctx = require_tenant(tenant_context)
    uid = _resolve_agent_id(current_user, ctx, agent_id)
    data = agent_portal_service.get_agent_leads(
        db, tenant_id_str(ctx), uid, page, limit, date_from, date_to, quick_filter
    )
    return AgentLeadsResponse(**data)


def get_team(
    db: Session,
    current_user,
    tenant_context: dict,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    quick_filter: Optional[str] = None,
):
    if not can_see_all_crm_records(tenant_context):
        raise HTTPException(status_code=403, detail="Only managers can view team analytics")
    ctx = require_tenant(tenant_context)
    data = agent_portal_service.get_team_analytics(
        db, tenant_id_str(ctx), date_from, date_to, quick_filter
    )
    return TeamAnalyticsResponse(**data)


def get_leaderboard(
    db: Session,
    current_user,
    tenant_context: dict,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    quick_filter: Optional[str] = None,
):
    ctx = require_tenant(tenant_context)
    data = agent_portal_service.get_leaderboard(
        db, tenant_id_str(ctx), date_from, date_to, quick_filter
    )
    return LeaderboardResponse(**data)


def list_targets(
    db: Session,
    current_user,
    tenant_context: dict,
    year: Optional[int] = None,
    month: Optional[int] = None,
):
    ctx = require_tenant(tenant_context)
    data = agent_portal_service.get_sales_targets(db, tenant_id_str(ctx), year, month)
    return SalesTargetsResponse(**data)


def set_sales_target(
    db: Session,
    current_user,
    tenant_context: dict,
    payload: SalesTargetSet,
):
    if not can_see_all_crm_records(tenant_context):
        raise HTTPException(status_code=403, detail="Only managers can set sales targets")
    ctx = require_tenant(tenant_context)
    tid = tenant_id_str(ctx)
    import uuid
    row = db.query(AgentSalesTarget).filter(
        AgentSalesTarget.tenant_id == uuid.UUID(tid),
        AgentSalesTarget.userId == uuid.UUID(payload.userId),
        AgentSalesTarget.year == payload.year,
        AgentSalesTarget.month == payload.month,
    ).first()
    if row:
        row.targetAmount = payload.targetAmount
    else:
        row = AgentSalesTarget(
            tenant_id=uuid.UUID(tid),
            userId=uuid.UUID(payload.userId),
            year=payload.year,
            month=payload.month,
            targetAmount=payload.targetAmount,
        )
        db.add(row)
    db.commit()
    return {"message": "Sales target updated", "targetAmount": payload.targetAmount}
