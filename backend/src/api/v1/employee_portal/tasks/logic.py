from datetime import datetime, timedelta
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .....config.database import create_time_entry
from .....models.platform.user import User
from .....models.projects.enums import TaskPriority, TaskStatus
from ...tasks.items import logic as task_logic
from ...tasks.items.schemas import TaskCreate, TaskUpdate
from ...http_common import tenant_id_str
from ..shared import default_project_id, get_or_create_employee
from .schemas import EmployeeTaskCreate, EmployeeTaskLog


def list_my_tasks(
    db: Session,
    current_user: User,
    tenant_context: dict,
    status: Optional[str],
    page: int,
    limit: int,
):
    return task_logic.list_tasks_response(
        db,
        tenant_context,
        current_user,
        None,
        status,
        str(current_user.id),
        True,
        False,
        page,
        limit,
    )


def create_my_task(
    body: EmployeeTaskCreate,
    db: Session,
    current_user: User,
    tenant_context: dict,
):
    tenant_id = tenant_id_str(tenant_context)
    project_id = body.projectId or default_project_id(db, str(current_user.id), tenant_id)
    if not project_id:
        raise HTTPException(status_code=400, detail="No project available. Join a project first.")
    task_data = TaskCreate(
        title=body.title,
        description=body.description,
        projectId=project_id,
        assignedToId=str(current_user.id),
        dueDate=body.dueDate,
        priority=TaskPriority(body.priority) if body.priority else TaskPriority.MEDIUM,
        status=TaskStatus.TODO,
    )
    return task_logic.create_task_and_notify(task_data, current_user, tenant_context, db)


def log_task_time(
    task_id: str,
    body: EmployeeTaskLog,
    db: Session,
    current_user: User,
    tenant_context: dict,
) -> dict:
    tenant_id = tenant_id_str(tenant_context)
    employee = get_or_create_employee(db, current_user, tenant_id)
    task = task_logic.get_task_by_id(task_id, db, tenant_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    uid = str(current_user.id)
    if (not task.assignedToId or str(task.assignedToId) != uid) and str(task.createdById) != uid:
        raise HTTPException(status_code=403, detail="Not authorized")
    new_hours = (task.actualHours or 0) + body.hours
    update = TaskUpdate(actualHours=new_hours)
    if body.status:
        update.status = TaskStatus(body.status)
    task_logic.update_task_and_notify(task_id, update, current_user, tenant_context, db)
    time_entry_data = {
        "employeeId": str(employee.id),
        "date": datetime.utcnow().date(),
        "startTime": datetime.utcnow() - timedelta(hours=body.hours),
        "endTime": datetime.utcnow(),
        "projectId": str(task.projectId) if task.projectId else None,
        "taskId": str(task.id),
        "description": body.notes or f"Logged on task: {task.title}",
        "hours": body.hours,
        "tenant_id": tenant_id,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    create_time_entry(time_entry_data, db)
    return {"success": True, "loggedHours": body.hours}


def complete_my_task(
    task_id: str,
    db: Session,
    current_user: User,
    tenant_context: dict,
):
    tenant_id = tenant_id_str(tenant_context)
    task = task_logic.get_task_by_id(task_id, db, tenant_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    uid = str(current_user.id)
    if (not task.assignedToId or str(task.assignedToId) != uid) and str(task.createdById) != uid:
        raise HTTPException(status_code=403, detail="Not authorized")
    return task_logic.update_task_and_notify(
        task_id,
        TaskUpdate(status=TaskStatus.COMPLETED),
        current_user,
        tenant_context,
        db,
    )
