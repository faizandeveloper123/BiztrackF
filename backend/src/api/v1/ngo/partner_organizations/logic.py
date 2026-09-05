from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import desc, or_
from sqlalchemy.orm import Session

from .....models.ngo import PartnerOrganization
from ...repository import create_entity, delete_by_id, get_by_id
from ..shared import partner_to_schema
from ...healthcare.logic_common import create_payload, update_record, paginated_list
from .schemas import PartnerOrganizationCreate, PartnerOrganizationUpdate, PartnerOrganizationsResponse


def get_partner_by_id(partner_id: str, db: Session, tenant_id: str = None):
    return get_by_id(PartnerOrganization, partner_id, db, tenant_id)


def get_partner_by_email(tenant_id: str, email: str, db: Session):
    return (
        db.query(PartnerOrganization)
        .filter(PartnerOrganization.tenant_id == tenant_id, PartnerOrganization.email == email.strip().lower())
        .first()
    )


def _generate_partner_code(db: Session, tenant_id: str) -> str:
    last = (
        db.query(PartnerOrganization)
        .filter(PartnerOrganization.tenant_id == tenant_id)
        .order_by(desc(PartnerOrganization.partner_code))
        .first()
    )
    if last and last.partner_code and last.partner_code.startswith("PTR"):
        try:
            num = int(last.partner_code.replace("PTR", ""))
            return f"PTR{num + 1:03d}"
        except ValueError:
            pass
    count = db.query(PartnerOrganization).filter(PartnerOrganization.tenant_id == tenant_id).count()
    return f"PTR{count + 1:03d}"


def get_partners(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    sector: Optional[str] = None,
    organization_size: Optional[str] = None,
    status: Optional[str] = None,
) -> List[PartnerOrganization]:
    query = db.query(PartnerOrganization).filter(PartnerOrganization.tenant_id == tenant_id)
    if sector:
        query = query.filter(PartnerOrganization.sector == sector.strip().lower())
    if organization_size:
        query = query.filter(PartnerOrganization.organization_size == organization_size.strip().lower())
    if status:
        query = query.filter(PartnerOrganization.status == status.strip().lower())
    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            PartnerOrganization.name.ilike(term)
            | PartnerOrganization.email.ilike(term)
            | PartnerOrganization.partner_code.ilike(term)
            | or_(PartnerOrganization.website.is_(None), PartnerOrganization.website.ilike(term))
            | or_(PartnerOrganization.location.is_(None), PartnerOrganization.location.ilike(term))
        )
    return query.order_by(PartnerOrganization.name.asc()).offset(skip).limit(limit).all()


def get_partners_count(
    db: Session,
    tenant_id: str,
    search: Optional[str] = None,
    sector: Optional[str] = None,
    organization_size: Optional[str] = None,
    status: Optional[str] = None,
) -> int:
    query = db.query(PartnerOrganization).filter(PartnerOrganization.tenant_id == tenant_id)
    if sector:
        query = query.filter(PartnerOrganization.sector == sector.strip().lower())
    if organization_size:
        query = query.filter(PartnerOrganization.organization_size == organization_size.strip().lower())
    if status:
        query = query.filter(PartnerOrganization.status == status.strip().lower())
    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            PartnerOrganization.name.ilike(term)
            | PartnerOrganization.email.ilike(term)
            | PartnerOrganization.partner_code.ilike(term)
            | or_(PartnerOrganization.website.is_(None), PartnerOrganization.website.ilike(term))
            | or_(PartnerOrganization.location.is_(None), PartnerOrganization.location.ilike(term))
        )
    return query.count()


def create_partner(data: dict, db: Session) -> PartnerOrganization:
    return create_entity(PartnerOrganization, data, db)


def update_partner(partner_id: str, update_data: dict, db: Session, tenant_id: str = None):
    return update_record(partner_id, update_data, db, tenant_id, get_partner_by_id)


def delete_partner(partner_id: str, db: Session, tenant_id: str = None) -> bool:
    return delete_by_id(PartnerOrganization, partner_id, db, tenant_id)


def list_partner_organizations(
    tenant_id: str,
    db: Session,
    search: Optional[str] = None,
    sector: Optional[str] = None,
    organization_size: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
) -> PartnerOrganizationsResponse:
    return paginated_list(
        get_partners,
        get_partners_count,
        partner_to_schema,
        PartnerOrganizationsResponse,
        "organizations",
        db,
        tenant_id,
        page=page,
        limit=limit,
        get_kwargs={
            "search": search,
            "sector": sector,
            "organization_size": organization_size,
            "status": status,
        },
    )


def get_partner_organization(tenant_id: str, partner_id: str, db: Session):
    db_partner = get_partner_by_id(partner_id, db, tenant_id)
    if not db_partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partner organization not found")
    return partner_to_schema(db_partner)


def create_partner_record(tenant_id: str, body: PartnerOrganizationCreate, db: Session):
    if get_partner_by_email(tenant_id, body.email, db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A partner organization with this email already exists",
        )
    data = create_payload(body, tenant_id, is_active=True)
    data["partner_code"] = _generate_partner_code(db, tenant_id)
    data["status"] = body.status
    db_partner = create_partner(data, db)
    return partner_to_schema(db_partner)


def update_partner_record(tenant_id: str, partner_id: str, body: PartnerOrganizationUpdate, db: Session):
    db_partner = get_partner_by_id(partner_id, db, tenant_id)
    if not db_partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partner organization not found")
    update_data = body.model_dump(exclude_unset=True)
    if body.email is not None:
        existing = get_partner_by_email(tenant_id, body.email, db)
        if existing and str(existing.id) != str(partner_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A partner organization with this email already exists",
            )
    updated = update_partner(partner_id, update_data, db, tenant_id)
    return partner_to_schema(updated)


def delete_partner_record(tenant_id: str, partner_id: str, db: Session) -> None:
    if not delete_partner(partner_id, db, tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partner organization not found")
