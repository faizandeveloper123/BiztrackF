from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, case, desc, func
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from ...config.database import (
    get_db, get_all_projects, get_invoice_dashboard_data,
    get_project_stats, get_all_users
)
from ...config.hrm_models import Supplier
from ...config.inventory_models import PurchaseOrder
from ...config.job_card_models import JobCard
from ...config.job_card_crud import get_job_card_stats
from ...models.invoices import Invoice
from ...api.dependencies import get_tenant_context
from ...core.cache import cached_sync

# Purchase order statuses that represent committed spend (money going out)
COMMITTED_PO_STATUSES = [
    "submitted",
    "approved",
    "ordered",
    "arrived",
    "partially_received",
    "received",
]

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/overview")
@cached_sync(ttl=30, key_prefix="dashboard_overview_")
def get_dashboard_overview(
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Get comprehensive dashboard data in a single request"""
    try:
        if not tenant_context:
            return {
                "projects": {"recent": [], "stats": {"total": 0, "active": 0, "completed": 0, "on_hold": 0}},
                "jobCards": {"recent": [], "stats": {"total": 0, "draft": 0, "in_progress": 0, "completed": 0, "cancelled": 0}},
                "invoices": {"invoices": {"total": 0, "draft": 0, "sent": 0, "paid": 0, "overdue": 0}, "amounts": {"total": 0, "paid": 0, "outstanding": 0}},
                "users": {"users": [], "total": 0},
                "subscription": {"plan": "basic", "status": "active"},
                "timestamp": None,
                "tenant_id": None
            }
        
        tenant_id = tenant_context["tenant_id"]
        
        projects_data = get_projects_data(db, tenant_id)
        job_cards_data = get_job_cards_data(db, tenant_id)
        invoices_data = get_invoices_data(db, tenant_id)
        users_data = get_users_data(db, tenant_id)
        subscription_data = get_subscription_data(db, tenant_context)
        financials_data = get_financials_data(db, tenant_id)
        purchase_orders_data = get_purchase_orders_data(db, tenant_id)
        
        return {
            "projects": projects_data,
            "jobCards": job_cards_data,
            "invoices": invoices_data,
            "users": users_data,
            "subscription": subscription_data,
            "financials": financials_data,
            "purchaseOrders": purchase_orders_data,
            "timestamp": tenant_context.get("timestamp"),
            "tenant_id": tenant_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard data: {str(e)}")

def get_projects_data(db: Session, tenant_id: str) -> Dict[str, Any]:
    """Get projects data with stats"""
    try:
        projects = get_all_projects(db, tenant_id=tenant_id, skip=0, limit=10)
        
        stats = get_project_stats(db, tenant_id)
        
        return {
            "recent": [
                {
                    "id": str(p.id),
                    "name": p.name,
                    "status": p.status,
                    "priority": p.priority,
                    "completionPercent": p.completionPercent,
                    "createdAt": p.createdAt.isoformat() if p.createdAt else None
                } for p in projects
            ],
            "stats": stats
        }
    except Exception as e:
        return {"recent": [], "stats": {"total": 0, "active": 0, "completed": 0, "on_hold": 0}, "error": str(e)}

def get_job_cards_data(db: Session, tenant_id: str) -> Dict[str, Any]:
    """Get job card stats and recent cards"""
    try:
        stats = get_job_card_stats(db, tenant_id)
        recent = (
            db.query(JobCard)
            .filter(JobCard.tenant_id == tenant_id, JobCard.is_active == True)
            .order_by(desc(JobCard.created_at))
            .limit(5)
            .all()
        )
        return {
            "stats": stats,
            "recent": [
                {
                    "id": str(jc.id),
                    "jobCardNumber": jc.job_card_number or "",
                    "title": jc.title or "",
                    "status": jc.status or "draft",
                    "priority": jc.priority or "medium",
                    "customerName": jc.customer_name or "",
                    "createdAt": jc.created_at.isoformat() if jc.created_at else None,
                }
                for jc in recent
            ],
        }
    except Exception as e:
        return {
            "stats": {"total": 0, "draft": 0, "in_progress": 0, "completed": 0, "cancelled": 0},
            "recent": [],
            "error": str(e),
        }


def get_invoices_data(db: Session, tenant_id: str) -> Dict[str, Any]:
    """Get invoices dashboard data"""
    try:
        dashboard_data = get_invoice_dashboard_data(db, tenant_id)
        return dashboard_data
    except Exception as e:
        return {
            "invoices": {"total": 0, "draft": 0, "sent": 0, "paid": 0, "overdue": 0},
            "amounts": {"total": 0, "paid": 0, "outstanding": 0},
            "error": str(e)
        }

def get_users_data(db: Session, tenant_id: str) -> Dict[str, Any]:
    """Get users data"""
    try:
        users = get_all_users(db, tenant_id=tenant_id, skip=0, limit=50)
        return {
            "users": [
                {
                    "id": str(u.id),
                    "name": f"{u.firstName or ''} {u.lastName or ''}".strip() or u.userName,
                    "email": u.email,
                    "role": u.userRole,
                    "isActive": u.isActive
                } for u in users
            ],
            "total": len(users)
        }
    except Exception as e:
        return {"users": [], "total": 0, "error": str(e)}

def get_subscription_data(db: Session, tenant_context: dict) -> Dict[str, Any]:
    """Get subscription data"""
    try:
        return {
            "plan": tenant_context.get("plan", "basic"),
            "status": tenant_context.get("status", "active"),
            "tenant_name": tenant_context.get("tenant_name", "Unknown"),
            "features": tenant_context.get("features", [])
        }
    except Exception as e:
        return {"plan": "basic", "status": "active", "error": str(e)}


def _get_supplier_name_map(db: Session, tenant_id: str, supplier_ids: list) -> Dict[str, str]:
    """Build a {supplier_id: supplier_name} map for the given supplier ids"""
    valid_ids = []
    for supplier_id in supplier_ids:
        try:
            valid_ids.append(UUID(str(supplier_id)))
        except (ValueError, TypeError):
            continue

    if not valid_ids:
        return {}

    supplier_rows = db.query(Supplier.id, Supplier.name).filter(
        Supplier.tenant_id == tenant_id,
        Supplier.id.in_(valid_ids)
    ).all()

    return {str(supplier_id): name for supplier_id, name in supplier_rows}


def get_financials_data(db: Session, tenant_id: str) -> Dict[str, Any]:
    """Get financial overview: revenue, committed PO spend, net income and monthly trend"""
    try:
        total_revenue = db.query(func.sum(Invoice.total)).filter(
            and_(Invoice.tenant_id == tenant_id, Invoice.status == "paid")
        ).scalar() or 0

        total_expenses = db.query(func.sum(PurchaseOrder.totalAmount)).filter(
            and_(
                PurchaseOrder.tenant_id == tenant_id,
                PurchaseOrder.status.in_(COMMITTED_PO_STATUSES),
            )
        ).scalar() or 0

        monthly_trend = []
        for i in range(5, -1, -1):
            date = datetime.now() - timedelta(days=30 * i)
            month_start = date.replace(day=1)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)

            revenue = db.query(func.sum(Invoice.total)).filter(
                and_(
                    Invoice.tenant_id == tenant_id,
                    Invoice.status == "paid",
                    Invoice.paidAt >= month_start,
                    Invoice.paidAt <= month_end,
                )
            ).scalar() or 0

            expenses = db.query(func.sum(PurchaseOrder.totalAmount)).filter(
                and_(
                    PurchaseOrder.tenant_id == tenant_id,
                    PurchaseOrder.status.in_(COMMITTED_PO_STATUSES),
                    PurchaseOrder.createdAt >= month_start,
                    PurchaseOrder.createdAt <= month_end,
                )
            ).scalar() or 0

            monthly_trend.append({
                "month": month_start.strftime("%b %Y"),
                "revenue": round(float(revenue), 2),
                "expenses": round(float(expenses), 2),
            })

        return {
            "totalRevenue": round(float(total_revenue), 2),
            "totalExpenses": round(float(total_expenses), 2),
            "netIncome": round(float(total_revenue) - float(total_expenses), 2),
            "monthlyTrend": monthly_trend,
        }
    except Exception as e:
        return {
            "totalRevenue": 0,
            "totalExpenses": 0,
            "netIncome": 0,
            "monthlyTrend": [],
            "error": str(e),
        }


def get_purchase_orders_data(db: Session, tenant_id: str) -> Dict[str, Any]:
    """Get purchase order stats and recent orders"""
    try:
        total_pos = db.query(func.count(PurchaseOrder.id)).filter(
            PurchaseOrder.tenant_id == tenant_id
        ).scalar() or 0

        committed_pos = db.query(func.count(PurchaseOrder.id)).filter(
            and_(
                PurchaseOrder.tenant_id == tenant_id,
                PurchaseOrder.status.in_(COMMITTED_PO_STATUSES),
            )
        ).scalar() or 0

        received_pos = db.query(func.count(PurchaseOrder.id)).filter(
            and_(
                PurchaseOrder.tenant_id == tenant_id,
                PurchaseOrder.status == "received",
            )
        ).scalar() or 0

        pending_pos = db.query(func.count(PurchaseOrder.id)).filter(
            and_(
                PurchaseOrder.tenant_id == tenant_id,
                PurchaseOrder.status.in_(["draft", "submitted", "approved", "ordered", "arrived", "partially_received"]),
            )
        ).scalar() or 0

        committed_amount = db.query(func.sum(PurchaseOrder.totalAmount)).filter(
            and_(
                PurchaseOrder.tenant_id == tenant_id,
                PurchaseOrder.status.in_(COMMITTED_PO_STATUSES),
            )
        ).scalar() or 0

        recent_pos = db.query(PurchaseOrder).filter(
            PurchaseOrder.tenant_id == tenant_id
        ).order_by(desc(PurchaseOrder.createdAt)).limit(5).all()

        supplier_ids = [str(po.supplierId) for po in recent_pos if po.supplierId]
        supplier_name_map = _get_supplier_name_map(db, tenant_id, supplier_ids)

        recent = [
            {
                "id": str(po.id),
                "orderNumber": po.poNumber or "",
                "supplierName": supplier_name_map.get(str(po.supplierId), ""),
                "orderDate": po.orderDate.isoformat() if po.orderDate else None,
                "status": po.status or "draft",
                "totalAmount": round(float(po.totalAmount or 0), 2),
                "createdAt": po.createdAt.isoformat() if po.createdAt else None,
            }
            for po in recent_pos
        ]

        return {
            "stats": {
                "total": total_pos,
                "committed": committed_pos,
                "received": received_pos,
                "pending": pending_pos,
                "committedAmount": round(float(committed_amount), 2),
            },
            "recent": recent,
        }
    except Exception as e:
        return {
            "stats": {"total": 0, "committed": 0, "received": 0, "pending": 0, "committedAmount": 0},
            "recent": [],
            "error": str(e),
        }
