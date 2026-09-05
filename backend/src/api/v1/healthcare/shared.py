from typing import List, Optional, Type, TypeVar
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import and_
from sqlalchemy.orm import Session

from ....models.common import ModulePermission
from ....config.core_models import User as UserModel, Role as RoleModel
from .doctors.schemas import Doctor, DoctorAvailabilitySlot
from .patients.schemas import Patient
from .appointments.schemas import Appointment
from .prescriptions.schemas import Prescription, PrescriptionItem
from .staff.schemas import HealthcareStaff
from .expense_categories.schemas import ExpenseCategory
from .daily_expenses.schemas import DailyExpense
from .admissions.schemas import Admission

T = TypeVar("T", bound=BaseModel)

HEALTHCARE_PERMISSION_SET = {
    ModulePermission.HEALTHCARE_VIEW.value,
    ModulePermission.HEALTHCARE_CREATE.value,
    ModulePermission.HEALTHCARE_UPDATE.value,
    ModulePermission.HEALTHCARE_DELETE.value,
}


def _coerce_orm_value(val):
    if isinstance(val, UUID):
        return str(val)
    return val


def orm_to_schema(schema_cls: Type[T], orm, **extra) -> T:
    data = {}
    for field_name in schema_cls.model_fields:
        if field_name in extra:
            data[field_name] = _coerce_orm_value(extra[field_name])
        elif hasattr(orm, field_name):
            data[field_name] = _coerce_orm_value(getattr(orm, field_name))
    for key, val in extra.items():
        if key not in data:
            data[key] = _coerce_orm_value(val)
    return schema_cls.model_validate(data)


def availability_to_db(availability: List[DoctorAvailabilitySlot]) -> list:
    return [{"day": s.day, "start_time": s.start_time, "end_time": s.end_time} for s in (availability or [])]


def _availability_from_db(raw) -> List[DoctorAvailabilitySlot]:
    slots = []
    for s in (raw if isinstance(raw, list) else []):
        if isinstance(s, dict):
            slots.append(
                DoctorAvailabilitySlot(
                    day=s.get("day", ""),
                    start_time=s.get("start_time", ""),
                    end_time=s.get("end_time", ""),
                )
            )
    return slots


def doctor_to_schema(orm) -> Doctor:
    return orm_to_schema(
        Doctor,
        orm,
        availability=_availability_from_db(orm.availability or []),
    )


def patient_to_schema(orm) -> Patient:
    return orm_to_schema(Patient, orm)


def expense_category_to_schema(orm) -> ExpenseCategory:
    return orm_to_schema(ExpenseCategory, orm)


def appointment_to_schema(orm, db_doctor=None) -> Appointment:
    if db_doctor is None and hasattr(orm, "doctor") and orm.doctor:
        db_doctor = orm.doctor
    extra = {}
    if db_doctor:
        extra["doctor_first_name"] = db_doctor.first_name
        extra["doctor_last_name"] = db_doctor.last_name
    if orm.patient_id:
        extra["patient_id"] = str(orm.patient_id)
    return orm_to_schema(Appointment, orm, **extra)


def prescription_items_to_db(items: List[PrescriptionItem]) -> list:
    out = []
    for i in (items or []):
        row = {"type": i.type}
        if i.type == "medicine":
            row["medicine_name"] = i.medicine_name or ""
            row["dosage"] = i.dosage
            row["frequency"] = i.frequency
            row["duration"] = i.duration
        elif i.type == "vitals":
            row["vital_name"] = i.vital_name or ""
            row["vital_value"] = i.vital_value
            row["vital_unit"] = i.vital_unit
        else:
            row["test_name"] = i.test_name or ""
            row["test_instructions"] = i.test_instructions
        out.append(row)
    return out


def prescription_to_schema(orm, db_doctor=None, appointment_date=None) -> Prescription:
    if db_doctor is None and hasattr(orm, "doctor") and orm.doctor:
        db_doctor = orm.doctor
    items = orm.items or []
    prescription_items = []
    for x in (items if isinstance(items, list) else []):
        t = x.get("type") or "medicine"
        prescription_items.append(
            PrescriptionItem(
                type=t if t in ("medicine", "vitals", "test") else "medicine",
                medicine_name=x.get("medicine_name"),
                dosage=x.get("dosage"),
                frequency=x.get("frequency"),
                duration=x.get("duration"),
                vital_name=x.get("vital_name"),
                vital_value=x.get("vital_value"),
                vital_unit=x.get("vital_unit"),
                test_name=x.get("test_name"),
                test_instructions=x.get("test_instructions"),
            )
        )
    apt_date = appointment_date
    if apt_date is None and hasattr(orm, "appointment") and orm.appointment:
        apt_date = str(orm.appointment.appointment_date) if orm.appointment.appointment_date else None
    extra = {"items": prescription_items, "appointment_date": apt_date}
    if db_doctor:
        extra["doctor_first_name"] = db_doctor.first_name
        extra["doctor_last_name"] = db_doctor.last_name
    return orm_to_schema(Prescription, orm, **extra)


def normalize_healthcare_permissions(perms: Optional[List[str]]) -> List[str]:
    items = [p for p in (perms or []) if isinstance(p, str)]
    filtered = [p for p in items if p in HEALTHCARE_PERMISSION_SET]
    deduped = list(dict.fromkeys(filtered))
    if not deduped:
        deduped = [ModulePermission.HEALTHCARE_VIEW.value]
    return deduped


def merge_healthcare_permissions(existing: Optional[List[str]], healthcare_perms: List[str]) -> List[str]:
    base = [p for p in (existing or []) if isinstance(p, str) and not p.startswith("healthcare:")]
    merged = base + healthcare_perms
    return list(dict.fromkeys(merged))


def ensure_healthcare_staff_role(db: Session, tenant_id: str) -> RoleModel:
    tid = UUID(tenant_id) if isinstance(tenant_id, str) else tenant_id
    role = db.query(RoleModel).filter(
        and_(
            RoleModel.tenant_id == tid,
            RoleModel.name == "healthcare_staff",
            RoleModel.isActive == True,
        )
    ).first()
    if role:
        return role
    role = RoleModel(
        tenant_id=tid,
        name="healthcare_staff",
        display_name="Healthcare Staff",
        description="Healthcare module staff",
        permissions=[],
        isActive=True,
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def staff_to_schema(db_staff, db_user: UserModel, permissions: List[str]) -> HealthcareStaff:
    return HealthcareStaff(
        id=str(db_staff.id),
        tenant_id=str(db_staff.tenant_id),
        user_id=str(db_staff.user_id),
        username=db_user.userName,
        email=db_user.email,
        first_name=db_user.firstName,
        last_name=db_user.lastName,
        phone=db_staff.phone,
        role=db_staff.role,
        permissions=permissions,
        is_active=db_staff.is_active if hasattr(db_staff, "is_active") else True,
        createdAt=db_staff.createdAt,
        updatedAt=db_staff.updatedAt,
    )


def daily_expense_to_schema(orm) -> DailyExpense:
    category_name = None
    if hasattr(orm, "category") and orm.category:
        category_name = orm.category.name
    return orm_to_schema(
        DailyExpense,
        orm,
        category_id=str(orm.category_id),
        category_name=category_name,
        amount=float(orm.amount) if orm.amount is not None else 0.0,
    )


def admission_to_schema(orm, db_patient=None, db_doctor=None) -> Admission:
    if db_patient is None and hasattr(orm, "patient") and orm.patient:
        db_patient = orm.patient
    if db_doctor is None and hasattr(orm, "doctor") and orm.doctor:
        db_doctor = orm.doctor
    extra = {
        "patient_id": str(orm.patient_id),
        "doctor_id": str(orm.doctor_id),
    }
    if db_patient:
        extra["patient_name"] = db_patient.full_name
    if db_doctor:
        extra["doctor_first_name"] = db_doctor.first_name
        extra["doctor_last_name"] = db_doctor.last_name
    return orm_to_schema(Admission, orm, **extra)
