from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import desc, or_
from sqlalchemy.orm import Session

from .....models.ngo import Donor
from ...repository import create_entity, delete_by_id, get_by_id
from ..shared import donor_to_schema
from ...healthcare.logic_common import create_payload, update_record, paginated_list
from .schemas import DonorCreate, DonorUpdate, DonorsResponse


def get_donor_by_id(donor_id: str, db: Session, tenant_id: str = None):
    return get_by_id(Donor, donor_id, db, tenant_id)


def get_donor_by_email(tenant_id: str, email: str, db: Session):
    return (
        db.query(Donor)
        .filter(Donor.tenant_id == tenant_id, Donor.email == email.strip().lower())
        .first()
    )


def _generate_donor_code(db: Session, tenant_id: str) -> str:
    last = (
        db.query(Donor)
        .filter(Donor.tenant_id == tenant_id)
        .order_by(desc(Donor.donor_code))
        .first()
    )
    if last and last.donor_code and last.donor_code.startswith("DON"):
        try:
            num = int(last.donor_code.replace("DON", ""))
            return f"DON{num + 1:03d}"
        except ValueError:
            pass
    count = db.query(Donor).filter(Donor.tenant_id == tenant_id).count()
    return f"DON{count + 1:03d}"


def get_donors(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    donor_type: Optional[str] = None,
    status: Optional[str] = None,
) -> List[Donor]:
    query = db.query(Donor).filter(Donor.tenant_id == tenant_id)
    if donor_type:
        query = query.filter(Donor.donor_type == donor_type.strip().lower())
    if status:
        query = query.filter(Donor.status == status.strip().lower())
    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            Donor.full_name.ilike(term)
            | Donor.email.ilike(term)
            | or_(Donor.phone.is_(None), Donor.phone.ilike(term))
            | Donor.donor_code.ilike(term)
            | or_(Donor.organization.is_(None), Donor.organization.ilike(term))
        )
    return query.order_by(Donor.full_name.asc()).offset(skip).limit(limit).all()


def get_donors_count(
    db: Session,
    tenant_id: str,
    search: Optional[str] = None,
    donor_type: Optional[str] = None,
    status: Optional[str] = None,
) -> int:
    query = db.query(Donor).filter(Donor.tenant_id == tenant_id)
    if donor_type:
        query = query.filter(Donor.donor_type == donor_type.strip().lower())
    if status:
        query = query.filter(Donor.status == status.strip().lower())
    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            Donor.full_name.ilike(term)
            | Donor.email.ilike(term)
            | or_(Donor.phone.is_(None), Donor.phone.ilike(term))
            | Donor.donor_code.ilike(term)
            | or_(Donor.organization.is_(None), Donor.organization.ilike(term))
        )
    return query.count()


def create_donor(donor_data: dict, db: Session) -> Donor:
    return create_entity(Donor, donor_data, db)


def update_donor(donor_id: str, update_data: dict, db: Session, tenant_id: str = None):
    return update_record(donor_id, update_data, db, tenant_id, get_donor_by_id)


def delete_donor(donor_id: str, db: Session, tenant_id: str = None) -> bool:
    return delete_by_id(Donor, donor_id, db, tenant_id)


def list_donors(
    tenant_id: str,
    db: Session,
    search: Optional[str] = None,
    donor_type: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
) -> DonorsResponse:
    return paginated_list(
        get_donors,
        get_donors_count,
        donor_to_schema,
        DonorsResponse,
        "donors",
        db,
        tenant_id,
        page=page,
        limit=limit,
        get_kwargs={"search": search, "donor_type": donor_type, "status": status},
    )


def get_donor(tenant_id: str, donor_id: str, db: Session):
    db_donor = get_donor_by_id(donor_id, db, tenant_id)
    if not db_donor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donor not found")
    return donor_to_schema(db_donor)


def create_donor_record(tenant_id: str, body: DonorCreate, db: Session):
    if get_donor_by_email(tenant_id, body.email, db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A donor with this email already exists",
        )
    data = create_payload(body, tenant_id, is_active=True)
    data["donor_code"] = _generate_donor_code(db, tenant_id)
    data["status"] = body.status
    data["donor_type"] = body.donor_type
    if body.total_donated is not None:
        data["total_donated"] = body.total_donated
    db_donor = create_donor(data, db)
    return donor_to_schema(db_donor)


def update_donor_record(tenant_id: str, donor_id: str, body: DonorUpdate, db: Session):
    db_donor = get_donor_by_id(donor_id, db, tenant_id)
    if not db_donor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donor not found")
    update_data = body.model_dump(exclude_unset=True)
    if body.email is not None:
        existing = get_donor_by_email(tenant_id, body.email, db)
        if existing and str(existing.id) != str(donor_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A donor with this email already exists",
            )
    updated = update_donor(donor_id, update_data, db, tenant_id)
    return donor_to_schema(updated)


def delete_donor_record(tenant_id: str, donor_id: str, db: Session) -> None:
    if not delete_donor(donor_id, db, tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donor not found")
