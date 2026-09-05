from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from .....config.database import get_db
from .....models.platform.user import User
from ...tasks.items.messages import (
    TaskMessageCreate,
    TaskMessageResponse,
    create_task_message,
    list_task_messages,
)
from . import logic
from .schemas import EmployeeTaskCreate, EmployeeTaskLog

router = APIRouter()


@router.get("/tasks")
async def my_tasks(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("projects:tasks:view")),
):
    return logic.list_my_tasks(db, current_user, tenant_context, status, page, limit)


@router.post("/tasks")
async def create_my_task(
    body: EmployeeTaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("projects:tasks:create")),
):
    return logic.create_my_task(body, db, current_user, tenant_context)


@router.post("/tasks/{task_id}/log")
async def log_task_time(
    task_id: str,
    body: EmployeeTaskLog,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("projects:tasks:update")),
):
    return logic.log_task_time(task_id, body, db, current_user, tenant_context)


@router.put("/tasks/{task_id}/complete")
async def complete_my_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("projects:tasks:update")),
):
    return logic.complete_my_task(task_id, db, current_user, tenant_context)


@router.get("/tasks/{task_id}/messages", response_model=List[TaskMessageResponse])
async def my_task_messages(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("projects:tasks:view")),
):
    return list_task_messages(task_id, db, current_user, tenant_context)


@router.post("/tasks/{task_id}/messages", response_model=TaskMessageResponse)
async def post_my_task_message(
    task_id: str,
    body: TaskMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("projects:tasks:update")),
):
    return create_task_message(task_id, body, db, current_user, tenant_context)
