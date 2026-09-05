from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .....api.dependencies import get_current_user, get_tenant_context
from .....config.database import get_db
from .....models.platform.user import User
from . import logic
from .schemas import TimeSessionStart, TimeSessionStop

router = APIRouter()


@router.get("/time-entries")
async def my_time_entries(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(30, ge=1, le=100),
    employee_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
):
    return logic.list_time_entries(
        db, current_user, tenant_context, start_date, end_date, page, limit, employee_id
    )


@router.get("/time-tracking/current-session")
async def current_time_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
):
    return logic.get_current_session(db, current_user, tenant_context)


@router.post("/time-tracking/start")
async def start_time_session(
    body: TimeSessionStart,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
):
    return logic.start_time_session(body, db, current_user, tenant_context)


@router.post("/time-tracking/stop/{session_id}")
async def stop_time_session(
    session_id: str,
    body: TimeSessionStop,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
):
    return logic.stop_time_session(session_id, body, db, current_user, tenant_context)
