from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session

from .....models.healthcare import Doctor, Appointment, Prescription, Admission
from ...repository import get_by_id, create_entity, delete_by_id
from ..logic_common import paginated_list, create_payload, update_record
from ..shared import doctor_to_schema, availability_to_db
from .schemas import DoctorCreate, DoctorUpdate, DoctorsResponse


def get_doctor_by_id(doctor_id: str, db: Session, tenant_id: str = None):
    return get_by_id(Doctor, doctor_id, db, tenant_id)


def get_doctor_by_pmdc(tenant_id: str, pmdc_number: str, db: Session):
    return (
        db.query(Doctor)
        .filter(and_(Doctor.tenant_id == tenant_id, Doctor.pmdc_number == pmdc_number))
        .first()
    )


def get_doctors(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> List[Doctor]:
    query = db.query(Doctor).filter(Doctor.tenant_id == tenant_id)
    if is_active is not None:
        query = query.filter(Doctor.is_active == is_active)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            Doctor.first_name.ilike(search_lower)
            | Doctor.last_name.ilike(search_lower)
            | Doctor.pmdc_number.ilike(search_lower)
            | Doctor.phone.ilike(search_lower)
            | or_(Doctor.specialization.is_(None), Doctor.specialization.ilike(search_lower))
        )
    return query.order_by(Doctor.createdAt.desc()).offset(skip).limit(limit).all()


def get_doctors_count(db: Session, tenant_id: str, search: Optional[str] = None, is_active: Optional[bool] = None) -> int:
    query = db.query(Doctor).filter(Doctor.tenant_id == tenant_id)
    if is_active is not None:
        query = query.filter(Doctor.is_active == is_active)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            Doctor.first_name.ilike(search_lower)
            | Doctor.last_name.ilike(search_lower)
            | Doctor.pmdc_number.ilike(search_lower)
            | Doctor.phone.ilike(search_lower)
            | or_(Doctor.specialization.is_(None), Doctor.specialization.ilike(search_lower))
        )
    return query.count()


def create_doctor(doctor_data: dict, db: Session) -> Doctor:
    return create_entity(Doctor, doctor_data, db)


def update_doctor(doctor_id: str, update_data: dict, db: Session, tenant_id: str = None):
    return update_record(doctor_id, update_data, db, tenant_id, get_doctor_by_id)


def delete_doctor(doctor_id: str, db: Session, tenant_id: str = None) -> bool:
    doctor = get_doctor_by_id(doctor_id, db, tenant_id)
    if not doctor:
        return False
    tid, did = doctor.tenant_id, doctor.id
    db.query(Prescription).filter(Prescription.doctor_id == did, Prescription.tenant_id == tid).delete(synchronize_session=False)
    db.query(Appointment).filter(Appointment.doctor_id == did, Appointment.tenant_id == tid).delete(synchronize_session=False)
    db.query(Admission).filter(Admission.doctor_id == did, Admission.tenant_id == tid).delete(synchronize_session=False)
    db.delete(doctor)
    db.commit()
    return True


def list_doctors(
    tenant_id: str,
    db: Session,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    limit: int = 20,
) -> DoctorsResponse:
    return paginated_list(
        get_doctors,
        get_doctors_count,
        doctor_to_schema,
        DoctorsResponse,
        "doctors",
        db,
        tenant_id,
        page=page,
        limit=limit,
        get_kwargs={"search": search, "is_active": is_active},
    )


def get_doctor(tenant_id: str, doctor_id: str, db: Session):
    db_doctor = get_doctor_by_id(doctor_id, db, tenant_id)
    if not db_doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return doctor_to_schema(db_doctor)


def create_doctor_record(tenant_id: str, body: DoctorCreate, db: Session):
    existing = get_doctor_by_pmdc(tenant_id, body.pmdc_number, db)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A doctor with this PMDC number already exists for this tenant",
        )
    data = create_payload(body, tenant_id, is_active=True)
    data["availability"] = availability_to_db(body.availability)
    return doctor_to_schema(create_doctor(data, db))


def update_doctor_record(tenant_id: str, doctor_id: str, body: DoctorUpdate, db: Session):
    db_doctor = get_doctor_by_id(doctor_id, db, tenant_id)
    if not db_doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    if body.pmdc_number is not None and body.pmdc_number != db_doctor.pmdc_number:
        if get_doctor_by_pmdc(tenant_id, body.pmdc_number, db):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A doctor with this PMDC number already exists for this tenant",
            )
    update_data = body.model_dump(exclude_unset=True)
    if "availability" in update_data and update_data["availability"] is not None:
        update_data["availability"] = availability_to_db(update_data["availability"])
    return doctor_to_schema(update_doctor(doctor_id, update_data, db, tenant_id))


def delete_doctor_record(tenant_id: str, doctor_id: str, db: Session) -> None:
    if not delete_doctor(doctor_id, db, tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
