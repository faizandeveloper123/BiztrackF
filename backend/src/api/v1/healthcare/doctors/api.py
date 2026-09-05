from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context
from ...http_common import tenant_id_str
from .schemas import Doctor, DoctorCreate, DoctorUpdate, DoctorsResponse
from . import logic

router = APIRouter()


@router.get("/doctors", response_model=DoctorsResponse)
async def list_doctors(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=500),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.list_doctors(tenant_id_str(tenant_context), db, search=search, is_active=is_active, page=page, limit=limit)


@router.get("/doctors/{doctor_id}", response_model=Doctor)
async def get_doctor(
    doctor_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.get_doctor(tenant_id_str(tenant_context), doctor_id, db)


@router.post("/doctors", response_model=Doctor, status_code=status.HTTP_201_CREATED)
async def create_doctor_endpoint(
    body: DoctorCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.create_doctor_record(tenant_id_str(tenant_context), body, db)


@router.put("/doctors/{doctor_id}", response_model=Doctor)
async def update_doctor_endpoint(
    doctor_id: str,
    body: DoctorUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.update_doctor_record(tenant_id_str(tenant_context), doctor_id, body, db)


@router.delete("/doctors/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_doctor_endpoint(
    doctor_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    logic.delete_doctor_record(tenant_id_str(tenant_context), doctor_id, db)
