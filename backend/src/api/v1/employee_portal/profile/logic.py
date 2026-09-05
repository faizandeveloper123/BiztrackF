from datetime import datetime

from sqlalchemy.orm import Session

from .....config.database import update_user
from .....models.hrm_models import Employee
from .....models.platform.user import User
from .....services.rbac_service import RBACService
from ...http_common import tenant_id_str
from ...profile import process_avatar_upload
from ..shared import employee_to_model, get_or_create_employee
from .schemas import EmployeeProfileUpdate


def has_active_employee_record(
    db: Session,
    current_user: User,
    tenant_id: str,
) -> bool:
    return not RBACService.is_owner(db, str(current_user.id), tenant_id)


def get_my_profile(db: Session, current_user: User, tenant_context: dict) -> Employee:
    tenant_id = tenant_id_str(tenant_context)
    employee = get_or_create_employee(db, current_user, tenant_id)
    return employee_to_model(employee, db)


def update_my_profile(
    body: EmployeeProfileUpdate,
    db: Session,
    current_user: User,
    tenant_context: dict,
) -> Employee:
    tenant_id = tenant_id_str(tenant_context)
    employee = get_or_create_employee(db, current_user, tenant_id)
    data = body.model_dump(exclude_unset=True)
    avatar_data = data.pop("avatar", None)
    for k, v in data.items():
        if hasattr(employee, k):
            setattr(employee, k, v)
    employee.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(employee)

    if avatar_data is not None and employee.userId:
        avatar_url = process_avatar_upload(avatar_data, str(employee.userId))
        update_user(str(employee.userId), {"avatar": avatar_url}, db)

    return employee_to_model(employee, db)
