from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from ....config.database import get_db
from ....api.dependencies import get_current_user, get_tenant_context, require_permission
from ....models.platform.enums import ModulePermission
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
from . import logic

router = APIRouter()


@router.get("/overview", response_model=AgentOverviewResponse)
async def agent_overview(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    quick_filter: Optional[str] = Query(None),
    agent_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_overview(db, current_user, tenant_context, date_from, date_to, quick_filter, agent_id)


@router.get("/earnings", response_model=AgentEarningsResponse)
async def agent_earnings(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    quick_filter: Optional[str] = Query(None),
    agent_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_earnings(db, current_user, tenant_context, date_from, date_to, quick_filter, agent_id)


@router.get("/achievements", response_model=AgentAchievementsResponse)
async def agent_achievements(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    quick_filter: Optional[str] = Query(None),
    agent_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_achievements(db, current_user, tenant_context, date_from, date_to, quick_filter, agent_id)


@router.get("/pipeline", response_model=AgentPipelineResponse)
async def agent_pipeline(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    quick_filter: Optional[str] = Query(None),
    agent_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_pipeline(db, current_user, tenant_context, date_from, date_to, quick_filter, agent_id)


@router.get("/leads", response_model=AgentLeadsResponse)
async def agent_leads(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    quick_filter: Optional[str] = Query(None),
    agent_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_leads(db, current_user, tenant_context, page, limit, date_from, date_to, quick_filter, agent_id)


@router.get("/team", response_model=TeamAnalyticsResponse)
async def agent_team(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    quick_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_team(db, current_user, tenant_context, date_from, date_to, quick_filter)


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def agent_leaderboard(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    quick_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_leaderboard(db, current_user, tenant_context, date_from, date_to, quick_filter)


@router.get("/targets", response_model=SalesTargetsResponse)
async def list_sales_targets(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.list_targets(db, current_user, tenant_context, year, month)


@router.post("/targets")
async def set_sales_target(
    payload: SalesTargetSet,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value)),
):
    return logic.set_sales_target(db, current_user, tenant_context, payload)
