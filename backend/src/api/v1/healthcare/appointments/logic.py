from datetime import date, datetime as dt
from typing import List, Optional, Dict, Any

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .....models.healthcare import Appointment
from ...repository import get_by_id, create_entity, delete_by_id
from ..logic_common import create_payload, update_record
from ..shared import appointment_to_schema
from ..invoice_helpers import create_healthcare_draft_invoice
from .schemas import AppointmentCreate, AppointmentUpdate, AppointmentsResponse


def get_appointment_by_id(appointment_id: str, db: Session, tenant_id: str = None):
    return get_by_id(Appointment, appointment_id, db, tenant_id)


def get_appointments(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 100,
    doctor_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> List[Appointment]:
    query = db.query(Appointment).filter(Appointment.tenant_id == tenant_id)
    if is_active is not None:
        query = query.filter(Appointment.is_active == is_active)
    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
    if patient_id:
        query = query.filter(Appointment.patient_id == patient_id)
    if date_from is not None:
        query = query.filter(Appointment.appointment_date >= date_from)
    if date_to is not None:
        query = query.filter(Appointment.appointment_date <= date_to)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            Appointment.patient_name.ilike(search_lower)
            | or_(Appointment.patient_phone.is_(None), Appointment.patient_phone.ilike(search_lower))
        )
    return (
        query.order_by(Appointment.appointment_date.desc(), Appointment.start_time.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_appointments_count(
    db: Session,
    tenant_id: str,
    doctor_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> int:
    query = db.query(Appointment).filter(Appointment.tenant_id == tenant_id)
    if is_active is not None:
        query = query.filter(Appointment.is_active == is_active)
    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
    if patient_id:
        query = query.filter(Appointment.patient_id == patient_id)
    if date_from is not None:
        query = query.filter(Appointment.appointment_date >= date_from)
    if date_to is not None:
        query = query.filter(Appointment.appointment_date <= date_to)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            Appointment.patient_name.ilike(search_lower)
            | or_(Appointment.patient_phone.is_(None), Appointment.patient_phone.ilike(search_lower))
        )
    return query.count()


def create_appointment(appointment_data: dict, db: Session) -> Appointment:
    return create_entity(Appointment, appointment_data, db)


def update_appointment(appointment_id: str, update_data: dict, db: Session, tenant_id: str = None):
    return update_record(appointment_id, update_data, db, tenant_id, get_appointment_by_id)


def delete_appointment(appointment_id: str, db: Session, tenant_id: str = None) -> bool:
    return delete_by_id(Appointment, appointment_id, db, tenant_id)


def _map_appointments(rows, tenant_id: str, db: Session):
    from ..doctors.logic import get_doctor_by_id

    doctors_map = {}
    for apt in rows:
        if str(apt.doctor_id) not in doctors_map:
            doctors_map[str(apt.doctor_id)] = get_doctor_by_id(str(apt.doctor_id), db, tenant_id)
    return [appointment_to_schema(a, doctors_map.get(str(a.doctor_id))) for a in rows]


def _resolve_patient_fields(body, tenant_id: str, db: Session):
    from ..patients.logic import get_patient_by_id

    patient_name = body.patient_name
    patient_phone = body.patient_phone
    patient_id = body.patient_id
    if body.patient_id:
        db_patient = get_patient_by_id(body.patient_id, db, tenant_id)
        if not db_patient:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
        patient_name = db_patient.full_name
        patient_phone = db_patient.phone
    elif not (body.patient_name and body.patient_name.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either patient_id or patient_name is required",
        )
    else:
        patient_name = body.patient_name.strip()
    return patient_id, patient_name, patient_phone


def list_appointments(
    tenant_id: str,
    db: Session,
    doctor_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    limit: int = 100,
) -> AppointmentsResponse:
    date_from_parsed = dt.strptime(date_from, "%Y-%m-%d").date() if date_from else None
    date_to_parsed = dt.strptime(date_to, "%Y-%m-%d").date() if date_to else None
    skip = (page - 1) * limit
    rows = get_appointments(
        db, tenant_id, skip=skip, limit=limit,
        doctor_id=doctor_id, patient_id=patient_id,
        date_from=date_from_parsed, date_to=date_to_parsed,
        search=search, is_active=is_active,
    )
    total = get_appointments_count(
        db, tenant_id, doctor_id=doctor_id, patient_id=patient_id,
        date_from=date_from_parsed, date_to=date_to_parsed,
        search=search, is_active=is_active,
    )
    return AppointmentsResponse(appointments=_map_appointments(rows, tenant_id, db), total=total)


def list_appointments_calendar(
    tenant_id: str,
    db: Session,
    date_from: str,
    date_to: str,
    doctor_id: Optional[str] = None,
) -> AppointmentsResponse:
    date_from_parsed = dt.strptime(date_from, "%Y-%m-%d").date()
    date_to_parsed = dt.strptime(date_to, "%Y-%m-%d").date()
    rows = get_appointments(
        db, tenant_id, skip=0, limit=1000, doctor_id=doctor_id,
        date_from=date_from_parsed, date_to=date_to_parsed, is_active=True,
    )
    appointments = _map_appointments(rows, tenant_id, db)
    return AppointmentsResponse(appointments=appointments, total=len(appointments))


def get_appointment(tenant_id: str, appointment_id: str, db: Session):
    from ..doctors.logic import get_doctor_by_id

    db_apt = get_appointment_by_id(appointment_id, db, tenant_id)
    if not db_apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    db_doctor = get_doctor_by_id(str(db_apt.doctor_id), db, tenant_id)
    return appointment_to_schema(db_apt, db_doctor)


def create_appointment_record(tenant_id: str, body: AppointmentCreate, db: Session):
    from ..doctors.logic import get_doctor_by_id

    db_doctor = get_doctor_by_id(body.doctor_id, db, tenant_id)
    if not db_doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    patient_id, patient_name, patient_phone = _resolve_patient_fields(body, tenant_id, db)
    data = create_payload(body, tenant_id, is_active=True)
    data.update(patient_id=patient_id, patient_name=patient_name, patient_phone=patient_phone)
    db_appointment = create_appointment(data, db)
    return appointment_to_schema(db_appointment, db_doctor)


def update_appointment_record(tenant_id: str, appointment_id: str, body: AppointmentUpdate, db: Session):
    from ..doctors.logic import get_doctor_by_id
    from ..patients.logic import get_patient_by_id

    if not get_appointment_by_id(appointment_id, db, tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    if body.doctor_id is not None and not get_doctor_by_id(body.doctor_id, db, tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    update_data = body.model_dump(exclude_unset=True)
    if body.patient_id is not None:
        if body.patient_id:
            db_patient = get_patient_by_id(body.patient_id, db, tenant_id)
            if not db_patient:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
            update_data["patient_name"] = db_patient.full_name
            update_data["patient_phone"] = db_patient.phone
        else:
            update_data["patient_id"] = None
            update_data["patient_name"] = update_data.get("patient_name") or ""
            update_data["patient_phone"] = update_data.get("patient_phone")
    updated = update_appointment(appointment_id, update_data, db, tenant_id)
    db_doctor = get_doctor_by_id(str(updated.doctor_id), db, tenant_id)
    return appointment_to_schema(updated, db_doctor)


def delete_appointment_record(tenant_id: str, appointment_id: str, db: Session) -> None:
    deleted = delete_appointment(appointment_id, db, tenant_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")


def create_appointment_invoice(
    tenant_id: str,
    appointment_id: str,
    line_items: List[Dict[str, Any]],
    created_by_user_id: str,
    db: Session,
):
    apt = get_appointment_by_id(appointment_id, db, tenant_id)
    if not apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    return create_healthcare_draft_invoice(
        tenant_id,
        line_items,
        created_by_user_id,
        db,
        order_number=f"APT-{appointment_id}",
        customer_id=str(apt.patient_id) if apt.patient_id else "",
        customer_name=getattr(apt, "patient_name", "") or "Patient",
        customer_phone=getattr(apt, "patient_phone", "") or "",
    )
