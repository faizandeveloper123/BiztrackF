from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context
from ...http_common import tenant_id_str
from .schemas import Patient, PatientCreate, PatientUpdate, PatientsResponse, PatientHistoryResponse
from . import logic

router = APIRouter()


@router.get("/patients", response_model=PatientsResponse)
async def list_patients(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.list_patients(tenant_id_str(tenant_context), db, search=search, is_active=is_active, page=page, limit=limit)


@router.get("/patients/{patient_id}", response_model=Patient)
async def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.get_patient(tenant_id_str(tenant_context), patient_id, db)


@router.get("/patients/{patient_id}/history", response_model=PatientHistoryResponse)
async def get_patient_history(
    patient_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.get_patient_history(tenant_id_str(tenant_context), patient_id, db)


@router.post("/patients", response_model=Patient, status_code=status.HTTP_201_CREATED)
async def create_patient_endpoint(
    body: PatientCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.create_patient_record(tenant_id_str(tenant_context), body, db)


@router.put("/patients/{patient_id}", response_model=Patient)
async def update_patient_endpoint(
    patient_id: str,
    body: PatientUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.update_patient_record(tenant_id_str(tenant_context), patient_id, body, db)


@router.delete("/patients/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient_endpoint(
    patient_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    logic.delete_patient_record(tenant_id_str(tenant_context), patient_id, db)
