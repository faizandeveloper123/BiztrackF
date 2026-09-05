from datetime import date
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import cast, desc, or_
from sqlalchemy.orm import Session
from sqlalchemy.types import Date

from .....models.ngo import DonorLead
from ...repository import create_entity, delete_by_id, get_by_id
from ..shared import donor_lead_to_schema
from ...healthcare.logic_common import create_payload, update_record, paginated_list
from .schemas import DonorLeadCreate, DonorLeadUpdate, DonorLeadsResponse


def get_donor_lead_by_id(lead_id: str, db: Session, tenant_id: str = None):
    return get_by_id(DonorLead, lead_id, db, tenant_id)


def get_donor_leads(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,
    source: Optional[str] = None,
    created_date: Optional[date] = None,
) -> List[DonorLead]:
    query = db.query(DonorLead).filter(DonorLead.tenant_id == tenant_id)
    if status:
        query = query.filter(DonorLead.status == status.strip().lower())
    if source:
        src = source.strip().lower().replace(" ", "_")
        if src == "socialmedia":
            src = "social_media"
        query = query.filter(DonorLead.source == src)
    if created_date:
        query = query.filter(cast(DonorLead.createdAt, Date) == created_date)
    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            DonorLead.full_name.ilike(term)
            | DonorLead.email.ilike(term)
            | or_(DonorLead.phone.is_(None), DonorLead.phone.ilike(term))
            | or_(DonorLead.organization.is_(None), DonorLead.organization.ilike(term))
            | or_(DonorLead.assigned_to.is_(None), DonorLead.assigned_to.ilike(term))
        )
    return query.order_by(desc(DonorLead.createdAt)).offset(skip).limit(limit).all()


def get_donor_leads_count(
    db: Session,
    tenant_id: str,
    search: Optional[str] = None,
    status: Optional[str] = None,
    source: Optional[str] = None,
    created_date: Optional[date] = None,
) -> int:
    query = db.query(DonorLead).filter(DonorLead.tenant_id == tenant_id)
    if status:
        query = query.filter(DonorLead.status == status.strip().lower())
    if source:
        src = source.strip().lower().replace(" ", "_")
        if src == "socialmedia":
            src = "social_media"
        query = query.filter(DonorLead.source == src)
    if created_date:
        query = query.filter(cast(DonorLead.createdAt, Date) == created_date)
    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            DonorLead.full_name.ilike(term)
            | DonorLead.email.ilike(term)
            | or_(DonorLead.phone.is_(None), DonorLead.phone.ilike(term))
            | or_(DonorLead.organization.is_(None), DonorLead.organization.ilike(term))
            | or_(DonorLead.assigned_to.is_(None), DonorLead.assigned_to.ilike(term))
        )
    return query.count()


def create_donor_lead(data: dict, db: Session) -> DonorLead:
    return create_entity(DonorLead, data, db)


def update_donor_lead(lead_id: str, update_data: dict, db: Session, tenant_id: str = None):
    return update_record(lead_id, update_data, db, tenant_id, get_donor_lead_by_id)


def delete_donor_lead(lead_id: str, db: Session, tenant_id: str = None) -> bool:
    return delete_by_id(DonorLead, lead_id, db, tenant_id)


def list_donor_leads(
    tenant_id: str,
    db: Session,
    search: Optional[str] = None,
    status: Optional[str] = None,
    source: Optional[str] = None,
    created_date: Optional[date] = None,
    page: int = 1,
    limit: int = 50,
) -> DonorLeadsResponse:
    return paginated_list(
        get_donor_leads,
        get_donor_leads_count,
        donor_lead_to_schema,
        DonorLeadsResponse,
        "leads",
        db,
        tenant_id,
        page=page,
        limit=limit,
        get_kwargs={
            "search": search,
            "status": status,
            "source": source,
            "created_date": created_date,
        },
    )


def get_donor_lead(tenant_id: str, lead_id: str, db: Session):
    row = get_donor_lead_by_id(lead_id, db, tenant_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donor lead not found")
    return donor_lead_to_schema(row)


def create_donor_lead_record(tenant_id: str, body: DonorLeadCreate, db: Session):
    data = create_payload(body, tenant_id, is_active=True)
    row = create_donor_lead(data, db)
    return donor_lead_to_schema(row)


def update_donor_lead_record(tenant_id: str, lead_id: str, body: DonorLeadUpdate, db: Session):
    row = get_donor_lead_by_id(lead_id, db, tenant_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donor lead not found")
    update_data = body.model_dump(exclude_unset=True)
    updated = update_donor_lead(lead_id, update_data, db, tenant_id)
    return donor_lead_to_schema(updated)


def delete_donor_lead_record(tenant_id: str, lead_id: str, db: Session) -> None:
    if not delete_donor_lead(lead_id, db, tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donor lead not found")
