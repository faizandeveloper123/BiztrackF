from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .....models.healthcare import Patient
from ...repository import get_by_id, create_entity, delete_by_id
from ..logic_common import paginated_list, create_payload, update_record
from ..shared import patient_to_schema, appointment_to_schema, prescription_to_schema
from .schemas import PatientCreate, PatientUpdate, PatientsResponse, PatientHistoryResponse


def get_patient_by_id(patient_id: str, db: Session, tenant_id: str = None):
    return get_by_id(Patient, patient_id, db, tenant_id)


def get_patients(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> List[Patient]:
    query = db.query(Patient).filter(Patient.tenant_id == tenant_id)
    if is_active is not None:
        query = query.filter(Patient.is_active == is_active)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            Patient.full_name.ilike(search_lower)
            | or_(Patient.phone.is_(None), Patient.phone.ilike(search_lower))
            | or_(Patient.email.is_(None), Patient.email.ilike(search_lower))
        )
    return query.order_by(Patient.full_name.asc()).offset(skip).limit(limit).all()


def get_patients_count(db: Session, tenant_id: str, search: Optional[str] = None, is_active: Optional[bool] = None) -> int:
    query = db.query(Patient).filter(Patient.tenant_id == tenant_id)
    if is_active is not None:
        query = query.filter(Patient.is_active == is_active)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            Patient.full_name.ilike(search_lower)
            | or_(Patient.phone.is_(None), Patient.phone.ilike(search_lower))
            | or_(Patient.email.is_(None), Patient.email.ilike(search_lower))
        )
    return query.count()


def create_patient(patient_data: dict, db: Session) -> Patient:
    return create_entity(Patient, patient_data, db)


def update_patient(patient_id: str, update_data: dict, db: Session, tenant_id: str = None):
    return update_record(patient_id, update_data, db, tenant_id, get_patient_by_id)


def delete_patient(patient_id: str, db: Session, tenant_id: str = None) -> bool:
    return delete_by_id(Patient, patient_id, db, tenant_id)


def list_patients(
    tenant_id: str,
    db: Session,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    limit: int = 50,
) -> PatientsResponse:
    return paginated_list(
        get_patients,
        get_patients_count,
        patient_to_schema,
        PatientsResponse,
        "patients",
        db,
        tenant_id,
        page=page,
        limit=limit,
        get_kwargs={"search": search, "is_active": is_active},
    )


def get_patient(tenant_id: str, patient_id: str, db: Session):
    db_patient = get_patient_by_id(patient_id, db, tenant_id)
    if not db_patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient_to_schema(db_patient)


def get_patient_history(tenant_id: str, patient_id: str, db: Session) -> PatientHistoryResponse:
    from ..appointments.logic import get_appointments, get_appointment_by_id
    from ..prescriptions.logic import get_prescriptions
    from ..doctors.logic import get_doctor_by_id

    db_patient = get_patient_by_id(patient_id, db, tenant_id)
    if not db_patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    patient = patient_to_schema(db_patient)
    db_appointments = get_appointments(
        db, tenant_id, skip=0, limit=500, patient_id=patient_id, is_active=None
    )
    doctors_map = {}
    for apt in db_appointments:
        if str(apt.doctor_id) not in doctors_map:
            doctors_map[str(apt.doctor_id)] = get_doctor_by_id(str(apt.doctor_id), db, tenant_id)
    appointments = [
        appointment_to_schema(a, doctors_map.get(str(a.doctor_id)))
        for a in db_appointments
    ]
    db_prescriptions = get_prescriptions(db, tenant_id, skip=0, limit=500, patient_id=patient_id)
    doctors_map_rx = {}
    appointments_map = {}
    for rx in db_prescriptions:
        if str(rx.doctor_id) not in doctors_map_rx:
            doctors_map_rx[str(rx.doctor_id)] = get_doctor_by_id(str(rx.doctor_id), db, tenant_id)
        if str(rx.appointment_id) not in appointments_map:
            apt = get_appointment_by_id(str(rx.appointment_id), db, tenant_id)
            appointments_map[str(rx.appointment_id)] = (
                str(apt.appointment_date) if apt and apt.appointment_date else None
            )
    prescriptions = [
        prescription_to_schema(
            rx,
            doctors_map_rx.get(str(rx.doctor_id)),
            appointments_map.get(str(rx.appointment_id)),
        )
        for rx in db_prescriptions
    ]
    return PatientHistoryResponse(patient=patient, appointments=appointments, prescriptions=prescriptions)


def create_patient_record(tenant_id: str, body: PatientCreate, db: Session):
    data = create_payload(body, tenant_id, is_active=True)
    db_patient = create_patient(data, db)
    return patient_to_schema(db_patient)


def update_patient_record(tenant_id: str, patient_id: str, body: PatientUpdate, db: Session):
    updated = update_patient(patient_id, body.model_dump(exclude_unset=True), db, tenant_id)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient_to_schema(updated)


def delete_patient_record(tenant_id: str, patient_id: str, db: Session) -> None:
    deleted = delete_patient(patient_id, db, tenant_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
