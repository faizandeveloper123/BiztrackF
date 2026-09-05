from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from .schemas import TaskCreate, TaskUpdate, TasksResponse, SubTask
from .messages import (
    TaskMessageCreate,
    TaskMessageResponse,
    list_task_messages,
    create_task_message,
)
from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from . import logic as task_logic

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=TasksResponse)
async def get_tasks(
    project: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    assignedTo: Optional[str] = Query(None),
    include_subtasks: bool = Query(True),
    main_tasks_only: bool = Query(False),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    return task_logic.list_tasks_response(
        db, tenant_context, current_user,
        project, status, assignedTo, include_subtasks, main_tasks_only, page, limit
    )


@router.get("/{task_id}", response_model=SubTask)
async def get_task(
    task_id: str,
    include_subtasks: bool = Query(True),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    return task_logic.get_task_response(task_id, db, tenant_context, current_user, include_subtasks)


@router.post("", response_model=SubTask)
async def create_new_task(
    task_data: TaskCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("projects:tasks:create"))
):
    """Create a new task or subtask"""
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    return task_logic.create_task_and_notify(task_data, current_user, tenant_context, db)


@router.put("/{task_id}", response_model=SubTask)
async def update_existing_task(
    task_id: str,
    task_data: TaskUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("projects:tasks:update"))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    return task_logic.update_task_and_notify(task_id, task_data, current_user, tenant_context, db)


@router.delete("/{task_id}")
async def delete_existing_task(
    task_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("projects:tasks:delete"))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    return task_logic.remove_task(task_id, db, tenant_context)


@router.get("/{task_id}/subtasks", response_model=List[SubTask])
async def get_subtasks(
    task_id: str,
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    return task_logic.list_subtasks_response(task_id, db, tenant_context)


@router.post("/{task_id}/subtasks", response_model=SubTask)
async def create_subtask(
    task_id: str,
    subtask_data: TaskCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("projects:tasks:create"))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    return task_logic.create_subtask_and_notify(task_id, subtask_data, current_user, tenant_context, db)


@router.get("/{task_id}/messages", response_model=List[TaskMessageResponse])
async def get_task_messages(
    task_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
):
    return list_task_messages(task_id, db, current_user, tenant_context or {})


@router.post("/{task_id}/messages", response_model=TaskMessageResponse)
async def post_task_message(
    task_id: str,
    body: TaskMessageCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
):
    return create_task_message(task_id, body, db, current_user, tenant_context or {})
