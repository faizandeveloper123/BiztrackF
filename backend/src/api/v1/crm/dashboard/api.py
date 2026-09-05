from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from .....models.common import ModulePermission
from .schemas import CRMDashboard
from . import logic

router = APIRouter()


@router.get("/dashboard", response_model=CRMDashboard)
async def get_crm_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_crm_dashboard(db, current_user, tenant_context)
