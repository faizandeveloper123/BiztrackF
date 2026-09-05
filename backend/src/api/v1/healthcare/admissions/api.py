from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from .....config.database import get_db, User
from .....api.dependencies import get_current_user, get_tenant_context
from ...http_common import tenant_id_str
from ..appointments.schemas import AppointmentInvoiceCreate
from .schemas import Admission, AdmissionCreate, AdmissionUpdate, AdmissionsResponse, AdmissionInvoicesResponse
from . import logic

router = APIRouter()


@router.get("/admissions", response_model=AdmissionsResponse)
async def list_admissions(
    status: Optional[str] = Query(None),
    patient_id: Optional[str] = Query(None),
    doctor_id: Optional[str] = Query(None),
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
    return logic.list_admissions(
        tenant_id_str(tenant_context),
        db,
        status=status,
        patient_id=patient_id,
        doctor_id=doctor_id,
        date_from=date_from,
        date_to=date_to,
        search=search,
        is_active=is_active,
        page=page,
        limit=limit,
    )


@router.get("/admissions/{admission_id}", response_model=Admission)
async def get_admission(
    admission_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.get_admission(tenant_id_str(tenant_context), admission_id, db)


@router.post("/admissions", response_model=Admission, status_code=status.HTTP_201_CREATED)
async def create_admission_endpoint(
    body: AdmissionCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.create_admission_record(tenant_id_str(tenant_context), body, db)


@router.put("/admissions/{admission_id}", response_model=Admission)
async def update_admission_endpoint(
    admission_id: str,
    body: AdmissionUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.update_admission_record(tenant_id_str(tenant_context), admission_id, body, db)


@router.delete("/admissions/{admission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_admission_endpoint(
    admission_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    logic.delete_admission_record(tenant_id_str(tenant_context), admission_id, db)


@router.post("/admissions/{admission_id}/invoice", status_code=status.HTTP_201_CREATED)
async def create_admission_invoice_endpoint(
    admission_id: str,
    body: AppointmentInvoiceCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
):
    line_items = [{"description": i.description, "amount": i.amount} for i in body.line_items]
    inv = logic.create_admission_invoice(
        tenant_id_str(tenant_context),
        admission_id,
        line_items,
        str(current_user.id),
        db,
    )
    return {"invoice_id": str(inv.id), "invoice_number": inv.invoiceNumber}


@router.get("/admission-invoices", response_model=AdmissionInvoicesResponse)
async def list_admission_invoices(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.list_admission_invoices(tenant_id_str(tenant_context), db, page=page, limit=limit)
