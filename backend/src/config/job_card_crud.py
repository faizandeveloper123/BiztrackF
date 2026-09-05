from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from .job_card_models import JobCard


def get_job_card_by_id(job_card_id: str, db: Session, tenant_id: str = None) -> Optional[JobCard]:
    query = db.query(JobCard).options(joinedload(JobCard.assigned_to)).filter(JobCard.id == job_card_id)
    if tenant_id:
        query = query.filter(JobCard.tenant_id == tenant_id)
    return query.first()


def get_all_job_cards(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    assigned_to_id: Optional[str] = None,
) -> List[JobCard]:
    query = db.query(JobCard).filter(JobCard.tenant_id == tenant_id, JobCard.is_active == True)
    if status:
        query = query.filter(JobCard.status == status)
    if assigned_to_id:
        query = query.filter(JobCard.assigned_to_id == assigned_to_id)
    return query.options(joinedload(JobCard.assigned_to)).order_by(JobCard.created_at.desc()).offset(skip).limit(limit).all()


def get_next_job_card_number(db: Session, tenant_id: str) -> str:
    """Generate the next job card number.

    Format: JC-YYYYMMDD-{sequence} where {sequence} continues globally across
    all job cards (not reset per day), so existing cards keep their numbers.
    """
    numbers = (
        db.query(JobCard.job_card_number)
        .filter(JobCard.tenant_id == tenant_id, JobCard.is_active == True)
        .all()
    )
    max_number = 0
    for (card_number,) in numbers:
        try:
            parsed = int(str(card_number).split("-")[-1])
            if parsed > max_number:
                max_number = parsed
        except (ValueError, IndexError):
            continue
    next_number = max_number + 1
    date_part = datetime.utcnow().strftime("%Y%m%d")
    return f"JC-{date_part}-{next_number:03d}"


def create_job_card(job_card_data: dict, db: Session, tenant_id: str = None) -> JobCard:
    data = dict(job_card_data)
    customer_id = data.get("customer_id")
    if customer_id and tenant_id:
        try:
            from ..api.v1.crm.customers.logic import get_customer_by_id
            customer = get_customer_by_id(db, str(customer_id), tenant_id)
            if customer:
                data["customer_name"] = f"{getattr(customer, 'firstName', '') or ''} {getattr(customer, 'lastName', '') or ''}".strip() or None
                data["customer_phone"] = getattr(customer, "phone", None) or getattr(customer, "mobile", None)
        except Exception:
            pass
    db_job_card = JobCard(**data)
    db.add(db_job_card)
    db.commit()
    db.refresh(db_job_card)
    return db_job_card


def update_job_card(job_card_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[JobCard]:
    job_card = get_job_card_by_id(job_card_id, db, tenant_id)
    if not job_card:
        return None
    customer_id = update_data.get("customer_id")
    if customer_id is not None and tenant_id:
        if customer_id:
            try:
                from ..api.v1.crm.customers.logic import get_customer_by_id
                customer = get_customer_by_id(db, str(customer_id), tenant_id)
                if customer:
                    update_data["customer_name"] = f"{getattr(customer, 'firstName', '') or ''} {getattr(customer, 'lastName', '') or ''}".strip() or None
                    update_data["customer_phone"] = getattr(customer, "phone", None) or getattr(customer, "mobile", None)
            except Exception:
                pass
        else:
            update_data["customer_name"] = None
            update_data["customer_phone"] = None
    for key, value in update_data.items():
        if hasattr(job_card, key):
            setattr(job_card, key, value)
    job_card.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(job_card)
    return job_card


def delete_job_card(job_card_id: str, db: Session, tenant_id: str = None) -> bool:
    job_card = get_job_card_by_id(job_card_id, db, tenant_id)
    if not job_card:
        return False
    job_card.is_active = False
    job_card.updated_at = datetime.utcnow()
    db.commit()
    return True


def get_job_card_stats(db: Session, tenant_id: str) -> dict:
    from sqlalchemy import case
    counts = (
        db.query(
            func.count(JobCard.id).label("total"),
            func.sum(case((JobCard.status == "draft", 1), else_=0)).label("draft"),
            func.sum(case((JobCard.status == "in_progress", 1), else_=0)).label("in_progress"),
            func.sum(case((JobCard.status == "completed", 1), else_=0)).label("completed"),
            func.sum(case((JobCard.status == "cancelled", 1), else_=0)).label("cancelled"),
        )
        .filter(JobCard.tenant_id == tenant_id, JobCard.is_active == True)
        .first()
    )
    return {
        "total": counts.total or 0,
        "draft": counts.draft or 0,
        "in_progress": counts.in_progress or 0,
        "completed": counts.completed or 0,
        "cancelled": counts.cancelled or 0,
    }
