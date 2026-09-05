from datetime import date, datetime as dt
from typing import List, Optional, Dict, Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .....models.healthcare import Admission, Patient
from ...repository import get_by_id, create_entity, delete_by_id
from .....api.v1.invoices.items.logic import get_invoices_by_order_prefix, get_invoices_by_order_prefix_count
from ..logic_common import create_payload, update_record
from ..shared import admission_to_schema
from ..invoice_helpers import create_healthcare_draft_invoice
from .schemas import (
    AdmissionCreate,
    AdmissionUpdate,
    AdmissionsResponse,
    AdmissionInvoiceSummary,
    AdmissionInvoicesResponse,
)


def get_admission_by_id(admission_id: str, db: Session, tenant_id: str = None):
    return get_by_id(Admission, admission_id, db, tenant_id)


def get_admissions(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> List[Admission]:
    query = db.query(Admission).filter(Admission.tenant_id == tenant_id)
    if is_active is not None:
        query = query.filter(Admission.is_active == is_active)
    if status:
        query = query.filter(Admission.status == status)
    if patient_id:
        query = query.filter(Admission.patient_id == patient_id)
    if doctor_id:
        query = query.filter(Admission.doctor_id == doctor_id)
    if date_from is not None:
        query = query.filter(Admission.admit_date >= date_from)
    if date_to is not None:
        query = query.filter(Admission.admit_date <= date_to)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.join(Patient, Admission.patient_id == Patient.id).filter(
            Patient.full_name.ilike(search_lower)
        )
    return (
        query.order_by(Admission.admit_date.desc(), Admission.createdAt.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_admissions_count(
    db: Session,
    tenant_id: str,
    status: Optional[str] = None,
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> int:
    query = db.query(Admission).filter(Admission.tenant_id == tenant_id)
    if is_active is not None:
        query = query.filter(Admission.is_active == is_active)
    if status:
        query = query.filter(Admission.status == status)
    if patient_id:
        query = query.filter(Admission.patient_id == patient_id)
    if doctor_id:
        query = query.filter(Admission.doctor_id == doctor_id)
    if date_from is not None:
        query = query.filter(Admission.admit_date >= date_from)
    if date_to is not None:
        query = query.filter(Admission.admit_date <= date_to)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.join(Patient, Admission.patient_id == Patient.id).filter(
            Patient.full_name.ilike(search_lower)
        )
    return query.count()


def create_admission(admission_data: dict, db: Session) -> Admission:
    return create_entity(Admission, admission_data, db)


def update_admission(admission_id: str, update_data: dict, db: Session, tenant_id: str = None):
    return update_record(admission_id, update_data, db, tenant_id, get_admission_by_id)


def delete_admission(admission_id: str, db: Session, tenant_id: str = None) -> bool:
    return delete_by_id(Admission, admission_id, db, tenant_id)


def _map_admissions(rows, tenant_id: str, db: Session):
    from ..patients.logic import get_patient_by_id
    from ..doctors.logic import get_doctor_by_id

    patients_map = {}
    doctors_map = {}
    for adm in rows:
        if str(adm.patient_id) not in patients_map:
            patients_map[str(adm.patient_id)] = get_patient_by_id(str(adm.patient_id), db, tenant_id)
        if str(adm.doctor_id) not in doctors_map:
            doctors_map[str(adm.doctor_id)] = get_doctor_by_id(str(adm.doctor_id), db, tenant_id)
    return [
        admission_to_schema(a, patients_map.get(str(a.patient_id)), doctors_map.get(str(a.doctor_id)))
        for a in rows
    ]


def list_admissions(
    tenant_id: str,
    db: Session,
    status: Optional[str] = None,
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    limit: int = 100,
) -> AdmissionsResponse:
    date_from_parsed = dt.strptime(date_from, "%Y-%m-%d").date() if date_from else None
    date_to_parsed = dt.strptime(date_to, "%Y-%m-%d").date() if date_to else None
    skip = (page - 1) * limit
    rows = get_admissions(
        db, tenant_id, skip=skip, limit=limit,
        status=status, patient_id=patient_id, doctor_id=doctor_id,
        date_from=date_from_parsed, date_to=date_to_parsed,
        search=search, is_active=is_active,
    )
    total = get_admissions_count(
        db, tenant_id, status=status, patient_id=patient_id, doctor_id=doctor_id,
        date_from=date_from_parsed, date_to=date_to_parsed,
        search=search, is_active=is_active,
    )
    return AdmissionsResponse(admissions=_map_admissions(rows, tenant_id, db), total=total)


def get_admission(tenant_id: str, admission_id: str, db: Session):
    from ..patients.logic import get_patient_by_id
    from ..doctors.logic import get_doctor_by_id

    db_adm = get_admission_by_id(admission_id, db, tenant_id)
    if not db_adm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admission not found")
    db_patient = get_patient_by_id(str(db_adm.patient_id), db, tenant_id)
    db_doctor = get_doctor_by_id(str(db_adm.doctor_id), db, tenant_id)
    return admission_to_schema(db_adm, db_patient, db_doctor)


def create_admission_record(tenant_id: str, body: AdmissionCreate, db: Session):
    from ..doctors.logic import get_doctor_by_id
    from ..patients.logic import get_patient_by_id

    db_doctor = get_doctor_by_id(body.doctor_id, db, tenant_id)
    if not db_doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    db_patient = get_patient_by_id(body.patient_id, db, tenant_id)
    if not db_patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    data = create_payload(body, tenant_id, is_active=True)
    db_admission = create_admission(data, db)
    return admission_to_schema(db_admission, db_patient, db_doctor)


def update_admission_record(tenant_id: str, admission_id: str, body: AdmissionUpdate, db: Session):
    from ..doctors.logic import get_doctor_by_id
    from ..patients.logic import get_patient_by_id

    if not get_admission_by_id(admission_id, db, tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admission not found")
    if body.doctor_id is not None and not get_doctor_by_id(body.doctor_id, db, tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    updated = update_admission(admission_id, body.model_dump(exclude_unset=True), db, tenant_id)
    db_patient = get_patient_by_id(str(updated.patient_id), db, tenant_id)
    db_doctor = get_doctor_by_id(str(updated.doctor_id), db, tenant_id)
    return admission_to_schema(updated, db_patient, db_doctor)


def delete_admission_record(tenant_id: str, admission_id: str, db: Session) -> None:
    deleted = delete_admission(admission_id, db, tenant_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admission not found")


def create_admission_invoice(
    tenant_id: str,
    admission_id: str,
    line_items: List[Dict[str, Any]],
    created_by_user_id: str,
    db: Session,
):
    from ..patients.logic import get_patient_by_id

    adm = get_admission_by_id(admission_id, db, tenant_id)
    if not adm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admission not found")
    patient = get_patient_by_id(str(adm.patient_id), db, tenant_id)
    return create_healthcare_draft_invoice(
        tenant_id,
        line_items,
        created_by_user_id,
        db,
        order_number=f"ADM-{admission_id}",
        customer_id=str(adm.patient_id),
        customer_name=patient.full_name if patient else "Patient",
        customer_phone=patient.phone if patient else "",
    )


def list_admission_invoices(
    tenant_id: str,
    db: Session,
    page: int = 1,
    limit: int = 50,
) -> AdmissionInvoicesResponse:
    skip = (page - 1) * limit
    db_invoices = get_invoices_by_order_prefix(db, tenant_id, "ADM-", skip=skip, limit=limit)
    total = get_invoices_by_order_prefix_count(db, tenant_id, "ADM-")
    invoices = [
        AdmissionInvoiceSummary(
            id=str(inv.id),
            invoice_number=inv.invoiceNumber or "",
            order_number=inv.orderNumber,
            customer_name=inv.customerName or "",
            total=float(inv.total or 0),
            total_paid=float(inv.totalPaid or 0),
            balance=float(inv.balance or 0),
            status=inv.status or "draft",
        )
        for inv in db_invoices
    ]
    return AdmissionInvoicesResponse(invoices=invoices, total=total)
