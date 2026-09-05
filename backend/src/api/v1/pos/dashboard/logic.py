from datetime import datetime
from typing import Any, Dict

from sqlalchemy.orm import Session
from sqlalchemy import func

from .....models.pos import POSShift as POSShiftORM, POSTransaction as POSTransactionORM


def get_pos_dashboard_data(db: Session, tenant_id: str) -> Dict[str, Any]:
    today = datetime.utcnow().date()
    start_of_day = datetime.combine(today, datetime.min.time())
    end_of_day = datetime.combine(today, datetime.max.time())

    today_transactions = (
        db.query(POSTransactionORM)
        .filter(
            POSTransactionORM.tenant_id == tenant_id,
            POSTransactionORM.createdAt >= start_of_day,
            POSTransactionORM.createdAt <= end_of_day,
        )
        .all()
    )

    today_sales = sum(txn.total for txn in today_transactions)
    today_count = len(today_transactions)

    open_shifts = (
        db.query(POSShiftORM)
        .filter(POSShiftORM.tenant_id == tenant_id, POSShiftORM.status == "open")
        .count()
    )

    start_of_month = datetime(today.year, today.month, 1)
    month_transactions = (
        db.query(POSTransactionORM)
        .filter(
            POSTransactionORM.tenant_id == tenant_id,
            POSTransactionORM.createdAt >= start_of_month,
        )
        .all()
    )

    month_sales = sum(txn.total for txn in month_transactions)
    month_count = len(month_transactions)

    payment_methods = (
        db.query(
            POSTransactionORM.paymentMethod,
            func.count(POSTransactionORM.id),
            func.sum(POSTransactionORM.total),
        )
        .filter(
            POSTransactionORM.tenant_id == tenant_id,
            POSTransactionORM.createdAt >= start_of_day,
            POSTransactionORM.createdAt <= end_of_day,
        )
        .group_by(POSTransactionORM.paymentMethod)
        .all()
    )

    payment_breakdown = {
        method: {"count": count, "total": float(total or 0)}
        for method, count, total in payment_methods
    }

    return {
        "today": {"sales": round(today_sales, 2), "transactions": today_count},
        "month": {"sales": round(month_sales, 2), "transactions": month_count},
        "open_shifts": open_shifts,
        "payment_methods": payment_breakdown,
    }


def get_pos_dashboard_endpoint(db: Session, tenant_context: dict):
    from fastapi import HTTPException

    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    try:
        return get_pos_dashboard_data(db, tenant_context["tenant_id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard data: {str(e)}")
