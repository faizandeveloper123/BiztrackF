from typing import Any, Dict, Optional

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from .....models.crm import Company, Contact, Lead, Opportunity
from .....api.crm_access import filter_crm_rows
from ..activities.logic import get_sales_activities
from ..db_common import crm_user_scope_filter
from ..http_common import require_tenant
from ..leads.logic import get_leads
from ..opportunities.logic import get_opportunities
from ..shared import _crm_scope_user_id
from .schemas import CRMDashboard, CRMMetrics, CRMPipeline


def _get_dashboard_data(db: Session, tenant_id: str, scope_user_id: Optional[str] = None) -> Dict[str, Any]:
    def lq():
        q = db.query(Lead).filter(Lead.tenant_id == tenant_id)
        return crm_user_scope_filter(q, Lead, scope_user_id)

    def oq():
        q = db.query(Opportunity).filter(Opportunity.tenant_id == tenant_id)
        return crm_user_scope_filter(q, Opportunity, scope_user_id)

    def cq():
        q = db.query(Contact).filter(Contact.tenant_id == tenant_id)
        return crm_user_scope_filter(q, Contact, scope_user_id)

    def compq():
        q = db.query(Company).filter(Company.tenant_id == tenant_id)
        return crm_user_scope_filter(q, Company, scope_user_id)

    total_leads = lq().count()
    active_leads = lq().filter(Lead.status.in_(["new", "contacted", "qualified"])).count()
    converted_leads = lq().filter(Lead.status == "converted").count()
    total_opportunities = oq().count()
    open_opportunities = oq().filter(
        Opportunity.stage.in_(["prospecting", "qualification", "proposal", "negotiation"])
    ).count()
    total_contacts = cq().count()
    total_companies = compq().count()
    total_revenue_result = oq().filter(
        Opportunity.stage == "closed_won",
        Opportunity.amount.isnot(None),
    ).with_entities(func.sum(Opportunity.amount)).scalar()
    total_revenue = float(total_revenue_result) if total_revenue_result else 0.0
    won_opportunities_count = oq().filter(Opportunity.stage == "closed_won").count()
    average_deal_size = total_revenue / won_opportunities_count if won_opportunities_count > 0 else 0.0
    all_opportunities = oq().filter(Opportunity.amount.isnot(None)).all()
    projected_revenue = sum((opp.amount or 0) * (opp.probability or 0) / 100.0 for opp in all_opportunities)
    conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0.0

    return {
        "totalLeads": total_leads,
        "activeLeads": active_leads,
        "totalContacts": total_contacts,
        "totalCompanies": total_companies,
        "totalOpportunities": total_opportunities,
        "openOpportunities": open_opportunities,
        "totalRevenue": float(total_revenue),
        "projectedRevenue": float(projected_revenue),
        "conversionRate": float(conversion_rate),
        "averageDealSize": float(average_deal_size),
    }


get_crm_dashboard_data = _get_dashboard_data


def get_crm_dashboard(db: Session, current_user, tenant_context: Optional[dict] = None):
    try:
        ctx = require_tenant(tenant_context)
        tid = str(ctx["tenant_id"])
        scope = _crm_scope_user_id(ctx, current_user)
        metrics_data = _get_dashboard_data(db, tid, scope_user_id=scope)
        uid = str(current_user.id)
        recent_activities = filter_crm_rows(get_sales_activities(db, tid, 0, 10), ctx, uid)
        opportunities = filter_crm_rows(get_opportunities(db, tid, 0, 10), ctx, uid)
        top_opportunities = sorted(opportunities, key=lambda x: x.amount or 0, reverse=True)[:5]
        recent_leads = filter_crm_rows(get_leads(db, tid, 0, 10), ctx, uid)
        pipeline_stages = ["prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"]
        pipeline_data = []
        for stage in pipeline_stages:
            stage_opportunities = [o for o in opportunities if o.stage == stage]
            pipeline_data.append(
                CRMPipeline(
                    stage=stage,
                    count=len(stage_opportunities),
                    value=sum(o.amount or 0 for o in stage_opportunities),
                    probability=50,
                )
            )
        return CRMDashboard(
            metrics=CRMMetrics(**metrics_data),
            pipeline=pipeline_data,
            recentActivities=recent_activities,
            topOpportunities=top_opportunities,
            recentLeads=recent_leads,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard data: {str(e)}")
