import uuid
from datetime import datetime
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .....config.database import get_employee_by_id
from .....config.hrm_models import EmployeeDevice as DBEmployeeDevice
from .....models.platform.user import User
from ...http_common import tenant_id_str
from ..shared import device_to_dict, get_or_create_employee, is_manager
from .schemas import EmployeeDeviceCreate, EmployeeDeviceUpdate


def list_devices(
    db: Session,
    current_user: User,
    tenant_context: dict,
    employee_id: Optional[str],
    all_devices: bool,
) -> dict:
    tenant_id = tenant_id_str(tenant_context)
    employee = get_or_create_employee(db, current_user, tenant_id)
    manager = is_manager(db, current_user, tenant_id)
    q = db.query(DBEmployeeDevice).filter(DBEmployeeDevice.tenant_id == tenant_id)
    if all_devices and manager:
        pass
    elif employee_id and manager:
        q = q.filter(DBEmployeeDevice.employeeId == employee_id)
    else:
        q = q.filter(DBEmployeeDevice.employeeId == str(employee.id))
    rows = q.order_by(DBEmployeeDevice.assignedAt.desc()).all()
    return {"devices": [device_to_dict(d, db) for d in rows]}


def assign_device(
    body: EmployeeDeviceCreate,
    db: Session,
    current_user: User,
    tenant_context: dict,
) -> dict:
    tenant_id = tenant_id_str(tenant_context)
    if not is_manager(db, current_user, tenant_id):
        raise HTTPException(status_code=403, detail="Manager access required")
    emp = get_employee_by_id(body.employeeId, db, tenant_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    device = DBEmployeeDevice(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        employeeId=body.employeeId,
        name=body.name,
        deviceType=body.deviceType,
        serialNumber=body.serialNumber,
        model=body.model,
        status="assigned",
        notes=body.notes,
        assignedBy=str(current_user.id),
        assignedAt=datetime.utcnow(),
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow(),
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device_to_dict(device, db)


def update_device(
    device_id: str,
    body: EmployeeDeviceUpdate,
    db: Session,
    current_user: User,
    tenant_context: dict,
) -> dict:
    tenant_id = tenant_id_str(tenant_context)
    if not is_manager(db, current_user, tenant_id):
        raise HTTPException(status_code=403, detail="Manager access required")
    device = db.query(DBEmployeeDevice).filter(
        DBEmployeeDevice.id == device_id,
        DBEmployeeDevice.tenant_id == tenant_id,
    ).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    data = body.model_dump(exclude_unset=True)
    if "returnedAt" in data and data["returnedAt"]:
        device.returnedAt = datetime.fromisoformat(data.pop("returnedAt")[:19])
        device.status = "returned"
    for k, v in data.items():
        if hasattr(device, k) and v is not None:
            setattr(device, k, v)
    device.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(device)
    return device_to_dict(device, db)
