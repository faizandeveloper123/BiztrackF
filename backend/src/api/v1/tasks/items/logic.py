import json
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .....models.projects import Task
from .....config.database import get_user_by_id, TenantUser
from .....api.dependencies import can_see_all_tasks
from .....services.task_time_service import (
    build_task_time_fields,
    normalize_task_duration_fields,
    process_task_time_reminders_for_tasks,
)
from .schemas import TaskCreate, TaskUpdate, TasksResponse, SubTask
from ...projects.items import logic as project_logic


def get_task_by_id(task_id: str, db: Session, tenant_id: str = None) -> Optional[Task]:
    query = db.query(Task).filter(Task.id == task_id)
    if tenant_id:
        query = query.filter(Task.tenant_id == tenant_id)
    return query.first()

def get_all_tasks(db: Session, tenant_id: str = None, project_id: str = None, skip: int = 0, limit: int = 100) -> List[Task]:
    query = db.query(Task)
    if tenant_id:
        query = query.filter(Task.tenant_id == tenant_id)
    if project_id:
        query = query.filter(Task.projectId == project_id)
    return query.order_by(Task.createdAt.desc()).offset(skip).limit(limit).all()

def get_tasks_by_project(project_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Task]:
    """Get all tasks for a specific project"""
    query = db.query(Task).filter(Task.projectId == project_id)
    if tenant_id:
        query = query.filter(Task.tenant_id == tenant_id)
    return query.order_by(Task.dueDate.asc()).offset(skip).limit(limit).all()

def get_subtasks_by_parent(parent_task_id: str, db: Session, tenant_id: str = None) -> List[Task]:
    """Get all subtasks for a specific parent task"""
    query = db.query(Task).filter(Task.parentTaskId == parent_task_id)
    if tenant_id:
        query = query.filter(Task.tenant_id == tenant_id)
    return query.order_by(Task.dueDate.asc()).all()

def get_main_tasks_by_project(project_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Task]:
    """Get only main tasks (no parent) for a specific project"""
    query = db.query(Task).filter(
        Task.projectId == project_id,
        Task.parentTaskId.is_(None)
    )
    if tenant_id:
        query = query.filter(Task.tenant_id == tenant_id)
    return query.order_by(Task.dueDate.asc()).offset(skip).limit(limit).all()

def get_task_with_subtasks(task_id: str, db: Session, tenant_id: str = None) -> Optional[Task]:
    """Get a task with all its subtasks"""
    task = get_task_by_id(task_id, db, tenant_id)
    if task:
        task.subtasks = get_subtasks_by_parent(str(task.id), db, tenant_id)
    return task

def get_tasks_by_assignee(assignee_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Task]:
    query = db.query(Task).filter(Task.assignedToId == assignee_id)
    if tenant_id:
        query = query.filter(Task.tenant_id == tenant_id)
    return query.order_by(Task.dueDate.asc()).offset(skip).limit(limit).all()

def get_tasks_by_creator(creator_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Task]:
    query = db.query(Task).filter(Task.createdById == creator_id)
    if tenant_id:
        query = query.filter(Task.tenant_id == tenant_id)
    return query.order_by(Task.createdAt.desc()).offset(skip).limit(limit).all()

def create_task(task_data: dict, db: Session) -> Task:
    db_task = Task(**task_data)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def update_task(task_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Task]:
    task = get_task_by_id(task_id, db, tenant_id)
    if task:
        for key, value in update_data.items():
            if hasattr(task, key) and value is not None:
                setattr(task, key, value)
        task.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(task)
    return task

def delete_task(task_id: str, db: Session, tenant_id: str = None) -> bool:
    task = get_task_by_id(task_id, db, tenant_id)
    if task:
        # First, delete or update related time entries
        from .....config.hrm_models import TimeEntry
        time_entries = db.query(TimeEntry).filter(
            TimeEntry.taskId == task_id,
            TimeEntry.tenant_id == tenant_id
        ).all()
        
        for time_entry in time_entries:
            time_entry.taskId = None  # Set to NULL instead of deleting
        
        # Delete subtasks first (if any)
        subtasks = db.query(Task).filter(
            Task.parentTaskId == task_id,
            Task.tenant_id == tenant_id
        ).all()
        
        for subtask in subtasks:
            subtask.parentTaskId = None  # Remove parent reference
        
        # Now delete the task
        db.delete(task)
        db.commit()
        return True
    return False

def transform_subtask_to_response(task: Task, db: Session) -> SubTask:
    time_fields = build_task_time_fields(db, task)
    return SubTask(
        id=str(task.id),
        tenant_id=str(task.tenant_id),
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        projectId=str(task.projectId),
        assignedToId=str(task.assignedToId) if task.assignedToId else None,
        createdById=str(task.createdById),
        parentTaskId=str(task.parentTaskId) if task.parentTaskId else None,
        assignedTo={
            "id": str(task.assignedTo.id),
            "name": f"{task.assignedTo.firstName or ''} {task.assignedTo.lastName or ''}".strip() or task.assignedTo.userName,
            "email": task.assignedTo.email
        } if task.assignedTo else None,
        dueDate=task.dueDate,
        actualHours=task.actualHours,
        tags=json.loads(task.tags) if task.tags else [],
        createdBy={
            "id": str(task.createdBy.id),
            "name": f"{task.createdBy.firstName or ''} {task.createdBy.lastName or ''}".strip() or task.createdBy.userName,
            "email": task.createdBy.email
        },
        completedAt=task.completedAt,
        createdAt=task.createdAt,
        updatedAt=task.updatedAt,
        **time_fields,
    )


def transform_task_to_response(task: Task, db: Session, include_subtasks: bool = True) -> SubTask:
    subtasks = []
    subtask_count = 0
    completed_subtask_count = 0

    if include_subtasks and hasattr(task, 'subtasks') and task.subtasks:
        subtasks = [transform_subtask_to_response(subtask, db) for subtask in task.subtasks]
        subtask_count = len(subtasks)
        completed_subtask_count = len([s for s in subtasks if getattr(s.status, 'value', s.status) == 'completed' or s.status == 'completed'])

    time_fields = build_task_time_fields(db, task)
    return SubTask(
        id=str(task.id),
        tenant_id=str(task.tenant_id),
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        projectId=str(task.projectId),
        assignedToId=str(task.assignedToId) if task.assignedToId else None,
        createdById=str(task.createdById),
        parentTaskId=str(task.parentTaskId) if task.parentTaskId else None,
        assignedTo={
            "id": str(task.assignedTo.id),
            "name": f"{task.assignedTo.firstName or ''} {task.assignedTo.lastName or ''}".strip() or task.assignedTo.userName,
            "email": task.assignedTo.email
        } if task.assignedTo else None,
        dueDate=task.dueDate,
        actualHours=task.actualHours,
        tags=json.loads(task.tags) if task.tags else [],
        createdBy={
            "id": str(task.createdBy.id),
            "name": f"{task.createdBy.firstName or ''} {task.createdBy.lastName or ''}".strip() or task.createdBy.userName,
            "email": task.createdBy.email
        },
        completedAt=task.completedAt,
        createdAt=task.createdAt,
        updatedAt=task.updatedAt,
        subtasks=subtasks,
        subtaskCount=subtask_count,
        completedSubtaskCount=completed_subtask_count,
        **time_fields,
    )


def _send_task_assignment_notification(db, tenant_context, assignee, current_user, entity_label, task, project_name=None, include_details=True):
    try:
        from .....services.notification_service import notify_assignment_parties
        from .....config.notification_models import NotificationCategory
        extra = None
        if include_details:
            extra = {}
            if project_name:
                extra["Project"] = project_name
            if task.description:
                desc = (task.description or "").replace("\r\n", " ").replace("\n", " ").strip()
                extra["Description"] = desc[:400] + ("..." if len(desc) > 400 else "")
            if task.dueDate:
                extra["Due date"] = str(task.dueDate)
            extra["Priority"] = getattr(task.priority, "value", str(task.priority))
            extra["Status"] = getattr(task.status, "value", str(task.status))
        notify_assignment_parties(
            db,
            str(tenant_context["tenant_id"]),
            current_user,
            [assignee] if assignee else [],
            entity_label,
            task.title,
            action_url=f"/projects/{task.projectId}",
            category=NotificationCategory.PROJECTS,
            extra_details=extra,
        )
    except Exception:
        pass


def list_tasks_response(
    db: Session,
    tenant_context: Optional[dict],
    current_user,
    project: Optional[str],
    status: Optional[str],
    assignedTo: Optional[str],
    include_subtasks: bool,
    main_tasks_only: bool,
    page: int,
    limit: int,
) -> TasksResponse:
    skip = (page - 1) * limit
    tenant_id = tenant_context["tenant_id"] if tenant_context else None

    if project:
        if main_tasks_only:
            tasks = get_main_tasks_by_project(project, db, tenant_id=tenant_id)
        else:
            tasks = get_tasks_by_project(project, db, tenant_id=tenant_id)
    else:
        tasks = get_all_tasks(db, tenant_id=tenant_id, skip=skip, limit=limit)
        if main_tasks_only:
            tasks = [t for t in tasks if not t.parentTaskId]

    if not can_see_all_tasks(tenant_context or {}):
        uid = str(current_user.id)
        tasks = [
            t for t in tasks
            if (t.assignedToId and str(t.assignedToId) == uid) or str(t.createdById) == uid
        ]

    if status:
        tasks = [t for t in tasks if t.status == status]
    if assignedTo:
        tasks = [t for t in tasks if str(t.assignedToId) == assignedTo]

    if include_subtasks:
        for task in tasks:
            if not task.parentTaskId:
                task.subtasks = get_subtasks_by_parent(str(task.id), db, tenant_id)

    process_task_time_reminders_for_tasks(db, tasks)

    task_list = [transform_task_to_response(task, db, include_subtasks) for task in tasks]

    return TasksResponse(
        tasks=task_list,
        pagination={
            "page": page,
            "limit": limit,
            "total": len(task_list),
            "pages": (len(task_list) + limit - 1) // limit
        }
    )


def get_task_response(
    task_id: str,
    db: Session,
    tenant_context: Optional[dict],
    current_user,
    include_subtasks: bool,
) -> SubTask:
    tenant_id = tenant_context["tenant_id"] if tenant_context else None

    if include_subtasks:
        task = get_task_with_subtasks(task_id, db, tenant_id=tenant_id)
    else:
        task = get_task_by_id(task_id, db, tenant_id=tenant_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not can_see_all_tasks(tenant_context or {}):
        uid = str(current_user.id)
        if (not task.assignedToId or str(task.assignedToId) != uid) and str(task.createdById) != uid:
            raise HTTPException(status_code=404, detail="Task not found")

    return transform_task_to_response(task, db, include_subtasks)


def create_task_and_notify(task_data: TaskCreate, current_user, tenant_context: dict, db: Session) -> SubTask:
    """Create a new task or subtask"""
    tenant_id = tenant_context["tenant_id"]

    project = project_logic.get_project_by_id(task_data.projectId, db, tenant_id=tenant_id)
    if not project:
        raise HTTPException(status_code=400, detail="Project not found")

    if task_data.parentTaskId:
        parent_task = get_task_by_id(task_data.parentTaskId, db, tenant_id=tenant_id)
        if not parent_task:
            raise HTTPException(status_code=400, detail="Parent task not found")
        if parent_task.parentTaskId:
            raise HTTPException(status_code=400, detail="Cannot create subtask of a subtask")

    if task_data.assignedToId:
        assignee = get_user_by_id(task_data.assignedToId, db)
        if not assignee:
            raise HTTPException(status_code=400, detail="Assignee not found")
        tenant_user = db.query(TenantUser).filter(
            TenantUser.userId == assignee.id,
            TenantUser.tenant_id == tenant_context["tenant_id"]
        ).first()
        if not tenant_user:
            raise HTTPException(status_code=400, detail="Assignee not in tenant")

    task_dict = normalize_task_duration_fields(task_data.model_dump())
    task_dict['createdById'] = current_user.id
    task_dict['tags'] = json.dumps(task_dict.get('tags', []))
    task_dict['tenant_id'] = tenant_context["tenant_id"]

    try:
        db_task = create_task(task_dict, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating task: {str(e)}")

    if task_data.assignedToId:
        assignee = get_user_by_id(task_data.assignedToId, db)
        if assignee:
            _send_task_assignment_notification(
                db, tenant_context, assignee, current_user, "Task", db_task, project_name=project.name
            )
    return transform_task_to_response(db_task, db, include_subtasks=False)


def update_task_and_notify(task_id: str, task_data: TaskUpdate, current_user, tenant_context: dict, db: Session) -> SubTask:
    tenant_id = tenant_context["tenant_id"]
    task = get_task_by_id(task_id, db, tenant_id=tenant_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_dict = normalize_task_duration_fields(task_data.dict(exclude_unset=True))

    assignee_for_notification = None
    previous_assignee_id = str(task.assignedToId) if task.assignedToId else None
    assignee_field_present = 'assignedToId' in update_dict or 'assignedTo' in update_dict
    if assignee_field_present:
        assignee_id = update_dict.pop('assignedToId', None)
        if assignee_id is None and 'assignedTo' in update_dict:
            assignee_id = update_dict.pop('assignedTo')
        elif 'assignedTo' in update_dict:
            update_dict.pop('assignedTo', None)
        if assignee_id:
            assignee = get_user_by_id(assignee_id, db)
            if not assignee:
                raise HTTPException(status_code=400, detail="Assignee not found")
            tenant_user = db.query(TenantUser).filter(
                TenantUser.userId == assignee.id,
                TenantUser.tenant_id == tenant_context["tenant_id"],
            ).first()
            if not tenant_user:
                raise HTTPException(status_code=400, detail="Assignee not in tenant")
            if str(assignee_id) != previous_assignee_id:
                assignee_for_notification = assignee
        elif previous_assignee_id:
            assignee_for_notification = None
        update_dict['assignedToId'] = assignee_id

    if 'tags' in update_dict:
        update_dict['tags'] = json.dumps(update_dict['tags'])

    if 'parentTaskId' in update_dict:
        parent_id = update_dict['parentTaskId']
        if parent_id:
            parent_task = get_task_by_id(parent_id, db, tenant_id=tenant_id)
            if not parent_task:
                raise HTTPException(status_code=400, detail="Parent task not found")
            if parent_task.parentTaskId:
                raise HTTPException(status_code=400, detail="Cannot make subtask of a subtask")

    if update_dict.get('status') == 'completed' and task.status != 'completed':
        update_dict['completedAt'] = datetime.utcnow()

    updated_task = update_task(task_id, update_dict, db, tenant_id=tenant_id)
    project_for_task = project_logic.get_project_by_id(updated_task.projectId, db, tenant_id=tenant_id)
    if assignee_for_notification:
        _send_task_assignment_notification(
            db, tenant_context, assignee_for_notification, current_user, "Task", updated_task,
            project_name=project_for_task.name if project_for_task else None
        )
    if project_for_task:
        try:
            from .....services.notification_service import notify_project_members
            user_name = f"{getattr(current_user, 'firstName', '') or ''} {getattr(current_user, 'lastName', '') or ''}".strip() or getattr(current_user, 'userName', 'A user')
            assignee_id = str(updated_task.assignedToId) if updated_task.assignedToId else None
            notify_project_members(
                db,
                str(tenant_id),
                project_for_task,
                "Task Updated",
                f"{user_name} updated the task: {updated_task.title}",
                action_url=f"/projects/{updated_task.projectId}",
                exclude_user_id=str(current_user.id),
                notification_data={"project_id": str(updated_task.projectId), "task_id": str(updated_task.id), "updated_by": str(current_user.id)},
                extra_user_ids=[assignee_id] if assignee_id else None,
            )
        except Exception:
            pass
    return transform_task_to_response(updated_task, db)


def remove_task(task_id: str, db: Session, tenant_context: dict) -> Dict[str, str]:
    tenant_id = tenant_context["tenant_id"]
    success = delete_task(task_id, db, tenant_id=tenant_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}


def list_subtasks_response(task_id: str, db: Session, tenant_context: Optional[dict]) -> List[SubTask]:
    tenant_id = tenant_context["tenant_id"] if tenant_context else None

    parent_task = get_task_by_id(task_id, db, tenant_id=tenant_id)
    if not parent_task:
        raise HTTPException(status_code=404, detail="Parent task not found")

    subtasks = get_subtasks_by_parent(task_id, db, tenant_id=tenant_id)
    return [transform_subtask_to_response(subtask, db) for subtask in subtasks]


def create_subtask_and_notify(task_id: str, subtask_data: TaskCreate, current_user, tenant_context: dict, db: Session) -> SubTask:
    tenant_id = tenant_context["tenant_id"]

    parent_task = get_task_by_id(task_id, db, tenant_id=tenant_id)
    if not parent_task:
        raise HTTPException(status_code=404, detail="Parent task not found")

    if parent_task.parentTaskId:
        raise HTTPException(status_code=400, detail="Cannot create subtask of a subtask")

    if subtask_data.assignedToId:
        assignee = get_user_by_id(subtask_data.assignedToId, db)
        if not assignee:
            raise HTTPException(status_code=400, detail="Assignee not found")
        if str(assignee.tenant_id) != tenant_context["tenant_id"]:
            raise HTTPException(status_code=400, detail="Assignee not in tenant")

    task_dict = normalize_task_duration_fields(subtask_data.model_dump())
    task_dict['assignedToId'] = task_dict.pop('assignedToId', None)
    task_dict['createdById'] = current_user.id
    task_dict['parentTaskId'] = task_id
    task_dict['tags'] = json.dumps(task_dict.get('tags', []))
    task_dict['tenant_id'] = tenant_context["tenant_id"]

    db_subtask = create_task(task_dict, db)
    if subtask_data.assignedToId:
        assignee = get_user_by_id(subtask_data.assignedToId, db)
        if assignee:
            _send_task_assignment_notification(
                db, tenant_context, assignee, current_user, "Subtask", db_subtask, include_details=False
            )
    return transform_subtask_to_response(db_subtask, db)


def get_task_stats(db: Session, tenant_id: str) -> Dict[str, Any]:
    total_tasks = db.query(Task).filter(Task.tenant_id == tenant_id).count()
    todo_tasks = db.query(Task).filter(
        Task.tenant_id == tenant_id,
        Task.status == "todo"
    ).count()
    in_progress_tasks = db.query(Task).filter(
        Task.tenant_id == tenant_id,
        Task.status == "in_progress"
    ).count()
    completed_tasks = db.query(Task).filter(
        Task.tenant_id == tenant_id,
        Task.status == "completed"
    ).count()
    
    return {
        "total": total_tasks,
        "todo": todo_tasks,
        "in_progress": in_progress_tasks,
        "completed": completed_tasks
    }
