from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .....api.dependencies import get_current_user, get_tenant_context
from .....config.database import get_db
from .....models.platform.user import User
from . import logic
from .schemas import EmployeeDeviceCreate, EmployeeDeviceUpdate

router = APIRouter()


@router.get("/devices")
async def list_devices(
    employee_id: Optional[str] = Query(None),
    all_devices: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
):
    return logic.list_devices(db, current_user, tenant_context, employee_id, all_devices)


@router.post("/devices")
async def assign_device(
    body: EmployeeDeviceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
):
    return logic.assign_device(body, db, current_user, tenant_context)


@router.put("/devices/{device_id}")
async def update_device(
    device_id: str,
    body: EmployeeDeviceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
):
    return logic.update_device(device_id, body, db, current_user, tenant_context)
