from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from .....config.database import get_db, User
from .....api.dependencies import get_current_user, get_tenant_context
from ...http_common import tenant_id_str
from .schemas import Appointment, AppointmentCreate, AppointmentUpdate, AppointmentsResponse, AppointmentInvoiceCreate
from . import logic

router = APIRouter()


@router.get("/appointments", response_model=AppointmentsResponse)
async def list_appointments(
    doctor_id: Optional[str] = Query(None),
    patient_id: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.list_appointments(
        tenant_id_str(tenant_context),
        db,
        doctor_id=doctor_id,
        patient_id=patient_id,
        date_from=date_from,
        date_to=date_to,
        search=search,
        is_active=is_active,
        page=page,
        limit=limit,
    )


@router.get("/appointments/calendar", response_model=AppointmentsResponse)
async def list_appointments_calendar(
    date_from: str = Query(..., description="YYYY-MM-DD"),
    date_to: str = Query(..., description="YYYY-MM-DD"),
    doctor_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.list_appointments_calendar(
        tenant_id_str(tenant_context), db, date_from, date_to, doctor_id=doctor_id
    )


@router.get("/appointments/{appointment_id}", response_model=Appointment)
async def get_appointment(
    appointment_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.get_appointment(tenant_id_str(tenant_context), appointment_id, db)


@router.post("/appointments", response_model=Appointment, status_code=status.HTTP_201_CREATED)
async def create_appointment_endpoint(
    body: AppointmentCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.create_appointment_record(tenant_id_str(tenant_context), body, db)


@router.put("/appointments/{appointment_id}", response_model=Appointment)
async def update_appointment_endpoint(
    appointment_id: str,
    body: AppointmentUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.update_appointment_record(tenant_id_str(tenant_context), appointment_id, body, db)


@router.delete("/appointments/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment_endpoint(
    appointment_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    logic.delete_appointment_record(tenant_id_str(tenant_context), appointment_id, db)


@router.post("/appointments/{appointment_id}/invoice", status_code=status.HTTP_201_CREATED)
async def create_appointment_invoice_endpoint(
    appointment_id: str,
    body: AppointmentInvoiceCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
):
    line_items = [{"description": i.description, "amount": i.amount} for i in body.line_items]
    inv = logic.create_appointment_invoice(
        tenant_id_str(tenant_context),
        appointment_id,
        line_items,
        str(current_user.id),
        db,
    )
    return {"invoice_id": str(inv.id), "invoice_number": inv.invoiceNumber}
