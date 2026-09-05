from fastapi import APIRouter, Depends, status, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Optional

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context
from ...http_common import tenant_id_str
from .schemas import Prescription, PrescriptionCreate, PrescriptionUpdate, PrescriptionsResponse
from . import logic

router = APIRouter()


@router.get("/prescriptions", response_model=PrescriptionsResponse)
async def list_prescriptions(
    appointment_id: Optional[str] = Query(None),
    doctor_id: Optional[str] = Query(None),
    patient_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.list_prescriptions(
        tenant_id_str(tenant_context),
        db,
        appointment_id=appointment_id,
        doctor_id=doctor_id,
        patient_id=patient_id,
        search=search,
        page=page,
        limit=limit,
    )


@router.get("/prescriptions/{prescription_id}", response_model=Prescription)
async def get_prescription(
    prescription_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.get_prescription(tenant_id_str(tenant_context), prescription_id, db)


@router.post("/prescriptions", response_model=Prescription, status_code=status.HTTP_201_CREATED)
async def create_prescription_endpoint(
    body: PrescriptionCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.create_prescription_record(tenant_id_str(tenant_context), body, db)


@router.put("/prescriptions/{prescription_id}", response_model=Prescription)
async def update_prescription_endpoint(
    prescription_id: str,
    body: PrescriptionUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.update_prescription_record(tenant_id_str(tenant_context), prescription_id, body, db)


@router.delete("/prescriptions/{prescription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prescription_endpoint(
    prescription_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    logic.delete_prescription_record(tenant_id_str(tenant_context), prescription_id, db)


@router.get("/prescriptions/{prescription_id}/download")
async def download_prescription_pdf(
    prescription_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    pdf_bytes = logic.download_prescription_pdf(tenant_id_str(tenant_context), prescription_id, db)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=prescription-{prescription_id}.pdf"},
    )
