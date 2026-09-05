from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from . import logic

router = APIRouter()


@router.get("/dashboard")
async def get_pos_dashboard(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("pos:reports:view")),
):
    return logic.get_pos_dashboard_endpoint(db, tenant_context)
