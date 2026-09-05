from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .....api.dependencies import get_current_user, get_tenant_context
from .....config.database import get_db
from .....models.platform.user import User
from . import logic

router = APIRouter()


@router.get("/dashboard")
async def employee_portal_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
):
    return logic.get_dashboard(db, current_user, tenant_context)
