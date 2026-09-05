from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .....models.healthcare import Prescription, Appointment
from ...repository import get_by_id, create_entity, delete_by_id
from ..logic_common import create_payload, update_record
from ..shared import prescription_to_schema, prescription_items_to_db
from .schemas import PrescriptionCreate, PrescriptionUpdate, PrescriptionsResponse


def get_prescription_by_id(prescription_id: str, db: Session, tenant_id: str = None):
    return get_by_id(Prescription, prescription_id, db, tenant_id)


def get_prescriptions(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 100,
    appointment_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Prescription]:
    query = db.query(Prescription).filter(Prescription.tenant_id == tenant_id)
    if appointment_id:
        query = query.filter(Prescription.appointment_id == appointment_id)
    if doctor_id:
        query = query.filter(Prescription.doctor_id == doctor_id)
    if patient_id:
        query = query.join(Appointment, Prescription.appointment_id == Appointment.id).filter(
            Appointment.patient_id == patient_id
        )
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(Prescription.patient_name.ilike(search_lower))
    return (
        query.order_by(Prescription.prescription_date.desc(), Prescription.createdAt.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_prescriptions_count(
    db: Session,
    tenant_id: str,
    appointment_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    search: Optional[str] = None,
) -> int:
    query = db.query(Prescription).filter(Prescription.tenant_id == tenant_id)
    if appointment_id:
        query = query.filter(Prescription.appointment_id == appointment_id)
    if doctor_id:
        query = query.filter(Prescription.doctor_id == doctor_id)
    if patient_id:
        query = query.join(Appointment, Prescription.appointment_id == Appointment.id).filter(
            Appointment.patient_id == patient_id
        )
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(Prescription.patient_name.ilike(search_lower))
    return query.count()


def create_prescription(prescription_data: dict, db: Session) -> Prescription:
    return create_entity(Prescription, prescription_data, db)


def update_prescription(prescription_id: str, update_data: dict, db: Session, tenant_id: str = None):
    return update_record(prescription_id, update_data, db, tenant_id, get_prescription_by_id)


def delete_prescription(prescription_id: str, db: Session, tenant_id: str = None) -> bool:
    return delete_by_id(Prescription, prescription_id, db, tenant_id)


def _enrich_prescriptions(db_rx_list, tenant_id: str, db: Session):
    from ..doctors.logic import get_doctor_by_id
    from ..appointments.logic import get_appointment_by_id

    doctors_map = {}
    appointments_map = {}
    for rx in db_rx_list:
        if str(rx.doctor_id) not in doctors_map:
            doctors_map[str(rx.doctor_id)] = get_doctor_by_id(str(rx.doctor_id), db, tenant_id)
        if str(rx.appointment_id) not in appointments_map:
            apt = get_appointment_by_id(str(rx.appointment_id), db, tenant_id)
            appointments_map[str(rx.appointment_id)] = (
                str(apt.appointment_date) if apt and apt.appointment_date else None
            )
    return [
        prescription_to_schema(
            rx,
            doctors_map.get(str(rx.doctor_id)),
            appointments_map.get(str(rx.appointment_id)),
        )
        for rx in db_rx_list
    ]


def list_prescriptions(
    tenant_id: str,
    db: Session,
    appointment_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
) -> PrescriptionsResponse:
    skip = (page - 1) * limit
    db_rx_list = get_prescriptions(
        db, tenant_id, skip=skip, limit=limit,
        appointment_id=appointment_id, doctor_id=doctor_id, patient_id=patient_id, search=search,
    )
    total = get_prescriptions_count(
        db, tenant_id, appointment_id=appointment_id, doctor_id=doctor_id, patient_id=patient_id, search=search
    )
    return PrescriptionsResponse(prescriptions=_enrich_prescriptions(db_rx_list, tenant_id, db), total=total)


def get_prescription(tenant_id: str, prescription_id: str, db: Session):
    from ..doctors.logic import get_doctor_by_id
    from ..appointments.logic import get_appointment_by_id

    db_rx = get_prescription_by_id(prescription_id, db, tenant_id)
    if not db_rx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    db_doctor = get_doctor_by_id(str(db_rx.doctor_id), db, tenant_id)
    apt = get_appointment_by_id(str(db_rx.appointment_id), db, tenant_id)
    apt_date = str(apt.appointment_date) if apt and apt.appointment_date else None
    return prescription_to_schema(db_rx, db_doctor, apt_date)


def create_prescription_record(tenant_id: str, body: PrescriptionCreate, db: Session):
    from ..appointments.logic import get_appointment_by_id
    from ..doctors.logic import get_doctor_by_id

    apt = get_appointment_by_id(body.appointment_id, db, tenant_id)
    if not apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    db_doctor = get_doctor_by_id(body.doctor_id, db, tenant_id)
    if not db_doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    data = create_payload(body, tenant_id)
    data["items"] = prescription_items_to_db(body.items or [])
    db_rx = create_prescription(data, db)
    return prescription_to_schema(db_rx, db_doctor, str(apt.appointment_date))


def update_prescription_record(tenant_id: str, prescription_id: str, body: PrescriptionUpdate, db: Session):
    from ..appointments.logic import get_appointment_by_id
    from ..doctors.logic import get_doctor_by_id

    if not get_prescription_by_id(prescription_id, db, tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    if body.doctor_id is not None and not get_doctor_by_id(body.doctor_id, db, tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    update_data = body.model_dump(exclude_unset=True)
    if "items" in update_data and update_data["items"] is not None:
        update_data["items"] = prescription_items_to_db(update_data["items"])
    updated = update_prescription(prescription_id, update_data, db, tenant_id)
    db_doctor = get_doctor_by_id(str(updated.doctor_id), db, tenant_id)
    apt = get_appointment_by_id(str(updated.appointment_id), db, tenant_id)
    apt_date = str(apt.appointment_date) if apt and apt.appointment_date else None
    return prescription_to_schema(updated, db_doctor, apt_date)


def delete_prescription_record(tenant_id: str, prescription_id: str, db: Session) -> None:
    deleted = delete_prescription(prescription_id, db, tenant_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")


def download_prescription_pdf(tenant_id: str, prescription_id: str, db: Session):
    from ...prescription_pdf import generate_prescription_pdf
    from ..doctors.logic import get_doctor_by_id

    db_rx = get_prescription_by_id(prescription_id, db, tenant_id)
    if not db_rx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    db_doctor = get_doctor_by_id(str(db_rx.doctor_id), db, tenant_id)
    return generate_prescription_pdf(db_rx, db_doctor, None)
