from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional
import json
import uuid
from datetime import datetime, timedelta

from .schemas import Project, ProjectCreate, ProjectUpdate, ProjectsResponse
from ...tasks.items.schemas import TasksResponse, SubTask
from .....models.user_models import TeamMember
from .....config.database import get_db, get_user_by_id, User, TenantUser
from .....models.projects import Project as DBProject, Task as DBTask
from .....api.dependencies import get_current_user, get_tenant_context, require_permission, can_see_all_tasks, can_see_all_projects, can_edit_project
from .....models.common import ModulePermission
from . import logic as project_logic
from ...tasks.items import logic as task_logic

router = APIRouter(prefix="/projects", tags=["projects"])

def transform_user_to_team_member(user: User) -> TeamMember:
    """Transform a User to TeamMember format"""
    return TeamMember(
        id=str(user.id),
        name=f"{user.firstName or ''} {user.lastName or ''}".strip() or user.userName,
        email=user.email,
        role=user.userRole,
        avatar=user.avatar
    )

def transform_project_to_response(project: DBProject) -> Project:
    """Transform database project to response format"""
    return Project(
        id=str(project.id),
        tenant_id=str(project.tenant_id),
        name=project.name,
        description=project.description,
        status=project.status.value if hasattr(project.status, 'value') else project.status,
        priority=project.priority.value if hasattr(project.priority, 'value') else project.priority,
        startDate=project.startDate,
        endDate=project.endDate,
        completionPercent=project.completionPercent,
        budget=project.budget,
        actualCost=project.actualCost,
        notes=project.notes,
        clientEmail=project.clientEmail,
        projectManagerId=str(project.projectManagerId),
        createdById=str(project.createdById) if project.createdById else None,
        projectManager=transform_user_to_team_member(project.projectManager),
        teamMembers=[transform_user_to_team_member(member) for member in project.teamMembers],
        deletionStatus=project.deletionStatus or "none",
        deletionRequestedById=str(project.deletionRequestedById) if project.deletionRequestedById else None,
        deletionRequestedAt=project.deletionRequestedAt,
        createdAt=project.createdAt,
        updatedAt=project.updatedAt,
        activities=[]  # TODO: Implement activities
    )

@router.get("", response_model=ProjectsResponse)
async def get_projects(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PROJECTS_VIEW.value))
):
    """Get all projects with optional filtering (tenant-scoped). Only the owner sees all projects; everyone else sees only projects they manage, created, are a team member of, or have a task assigned to them."""
    skip = (page - 1) * limit
    tenant_id = tenant_context["tenant_id"] if tenant_context else None

    query = db.query(DBProject).filter(DBProject.tenant_id == tenant_id)

    if not can_see_all_projects(tenant_context or {}):
        allowed_project_ids = project_logic.get_project_ids_with_tasks_assigned_to(str(current_user.id), db, tenant_id)
        query = query.filter(DBProject.id.in_(allowed_project_ids))

    if status:
        query = query.filter(DBProject.status == status)
    if priority:
        query = query.filter(DBProject.priority == priority)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            or_(
                func.lower(DBProject.name).like(search_lower),
                func.lower(DBProject.description).like(search_lower)
            )
        )

    total = query.count()

    projects = query.order_by(DBProject.createdAt.desc()).offset(skip).limit(limit).all()
    
    project_list = [transform_project_to_response(project) for project in projects]
    
    return ProjectsResponse(
        projects=project_list,
        pagination={
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    )

@router.get("/team-members")
async def get_project_team_members(
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PROJECTS_VIEW.value))
):
    from .....models.common import UserRole
    from .....config.database import get_all_users

    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    users = get_all_users(db, tenant_id=tenant_id)
    team_members = []

    for user in users:
        if user.isActive and user.userRole in [UserRole.PROJECT_MANAGER.value, UserRole.TEAM_MEMBER.value]:
            team_members.append({
                "id": str(user.id),
                "name": f"{user.firstName or ''} {user.lastName or ''}".strip() or user.userName,
                "email": user.email,
                "role": user.userRole,
                "avatar": user.avatar
            })

    return {"teamMembers": team_members}

@router.get("/{project_id}", response_model=Project)
async def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PROJECTS_VIEW.value))
):
    """Get a specific project. Only the owner sees all projects; everyone else sees only projects they manage, created, are a team member of, or have a task assigned to them."""
    import uuid
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    try:
        uuid.UUID(str(project_id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid project_id format. Must be a UUID.")
    project = project_logic.get_project_by_id(project_id, db, tenant_id=tenant_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not can_see_all_projects(tenant_context or {}):
        allowed_project_ids = project_logic.get_project_ids_with_tasks_assigned_to(str(current_user.id), db, tenant_id)
        if project.id not in allowed_project_ids:
            raise HTTPException(status_code=404, detail="Project not found")
    return transform_project_to_response(project)

@router.post("", response_model=Project)
async def create_new_project(
    project_data: ProjectCreate, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PROJECTS_CREATE.value))
):
    """Create a new project"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        created_by = str(current_user.id)
        
        # Validate project manager ID
        if not project_data.projectManagerId or project_data.projectManagerId.strip() == '':
            raise HTTPException(status_code=400, detail="Project manager is required")
        
        # Verify project manager exists
        project_manager = get_user_by_id(project_data.projectManagerId, db)
        if not project_manager:
            raise HTTPException(status_code=400, detail="Project manager not found")
        
        # Check tenant access for project manager
        if tenant_context:
            tenant_user = db.query(TenantUser).filter(
                TenantUser.userId == project_manager.id,
                TenantUser.tenant_id == tenant_context["tenant_id"]
            ).first()
            if not tenant_user:
                raise HTTPException(status_code=400, detail="Project manager not in tenant")
        
        # Verify team members exist
        team_members = []
        for member_id in project_data.teamMemberIds:
            # Skip empty or invalid IDs
            if not member_id or member_id.strip() == '':
                continue
                
            member = get_user_by_id(member_id, db)
            if not member:
                raise HTTPException(status_code=400, detail=f"Team member {member_id} not found")
            # Check tenant access for team member
            if tenant_context:
                tenant_user = db.query(TenantUser).filter(
                    TenantUser.userId == member.id,
                    TenantUser.tenant_id == tenant_context["tenant_id"]
                ).first()
                if not tenant_user:
                    raise HTTPException(status_code=400, detail=f"Team member {member_id} not in tenant")
            team_members.append(member)
        
        # Create project data
        project_dict = project_data.model_dump()
        team_member_ids = project_dict.pop('teamMemberIds')
        
        # Set additional fields
        project_dict.update({
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "createdById": created_by,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        })
        
        # Create project
        db_project = project_logic.create_project(project_dict, db)
        
        # Add team members
        db_project.teamMembers = team_members
        db.commit()
        db.refresh(db_project)
        
        try:
            from .....services.notification_service import (
                create_project_notification_for_all_tenant_users,
                display_user_name,
                send_assigner_confirmation_notification,
                send_assignment_notification,
            )
            from .....config.notification_models import NotificationType, NotificationCategory
            user_name = f"{current_user.firstName} {current_user.lastName}".strip() if hasattr(current_user, 'firstName') else current_user.userName if hasattr(current_user, 'userName') else "A user"
            create_project_notification_for_all_tenant_users(
                db,
                str(tenant_id),
                "New Project Created",
                f"{user_name} created a new project: {project_data.name}",
                NotificationType.INFO,
                f"/projects/{str(db_project.id)}",
                {"project_id": str(db_project.id), "created_by": str(current_user.id)}
            )
            receivers = []
            if project_manager:
                receivers.append(project_manager)
                send_assignment_notification(
                    db, str(tenant_id), project_manager, user_name,
                    "Project (Manager)", project_data.name,
                    action_url=f"/projects/{str(db_project.id)}",
                    category=NotificationCategory.PROJECTS
                )
            for member in team_members:
                if not project_manager or member.id != project_manager.id:
                    receivers.append(member)
                    send_assignment_notification(
                        db, str(tenant_id), member, user_name,
                        "Project (Team)", project_data.name,
                        action_url=f"/projects/{str(db_project.id)}",
                        category=NotificationCategory.PROJECTS
                    )
            if receivers:
                assigner_id = str(current_user.id)
                unique_receivers = []
                seen = set()
                for receiver in receivers:
                    rid = str(receiver.id)
                    if rid in seen:
                        continue
                    seen.add(rid)
                    unique_receivers.append(receiver)
                only_self = len(unique_receivers) == 1 and str(unique_receivers[0].id) == assigner_id
                if not only_self:
                    receiver_names = ", ".join(
                        display_user_name(r, fallback="User") for r in unique_receivers
                    )
                    send_assigner_confirmation_notification(
                        db,
                        str(tenant_id),
                        current_user,
                        receiver_names,
                        "Project",
                        project_data.name,
                        action_url=f"/projects/{str(db_project.id)}",
                        category=NotificationCategory.PROJECTS,
                    )
        except Exception as notification_error:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to create notification: {notification_error}", exc_info=True)
        return transform_project_to_response(db_project)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")

@router.put("/{project_id}", response_model=Project)
async def update_existing_project(
    project_id: str, 
    project_data: ProjectUpdate, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PROJECTS_UPDATE.value))
):
    """Update a project"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    project = project_logic.get_project_by_id(project_id, db, tenant_id=tenant_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not can_edit_project(tenant_context or {}, project, str(current_user.id)):
        raise HTTPException(status_code=403, detail="You do not have permission to edit this project")
    
    update_dict = project_data.model_dump(exclude_unset=True)
    updated_team_members = None
    newly_added_team_members = None
    previous_team_member_ids = {str(m.id) for m in (project.teamMembers or [])}
    previous_project_manager_id = (
        str(project.projectManagerId) if project.projectManagerId else None
    )
    if 'teamMemberIds' in update_dict:
        team_member_ids = update_dict.pop('teamMemberIds')
        team_members = []
        for member_id in team_member_ids:
            member = get_user_by_id(member_id, db)
            if not member:
                raise HTTPException(status_code=400, detail=f"Team member {member_id} not found")
            if tenant_context:
                tenant_user = db.query(TenantUser).filter(
                    TenantUser.userId == member.id,
                    TenantUser.tenant_id == tenant_context["tenant_id"],
                ).first()
                if not tenant_user:
                    raise HTTPException(status_code=400, detail=f"Team member {member_id} not in tenant")
            team_members.append(member)
        updated_team_members = team_members
        newly_added_team_members = [
            member for member in team_members
            if str(member.id) not in previous_team_member_ids
        ]
        project.teamMembers = team_members
    if 'status' in update_dict and hasattr(update_dict['status'], 'value'):
        update_dict['status'] = update_dict['status'].value
    if 'priority' in update_dict and hasattr(update_dict['priority'], 'value'):
        update_dict['priority'] = update_dict['priority'].value
    # Update other fields
    updated_project = project_logic.update_project(project_id, update_dict, db, tenant_id=tenant_id)
    try:
        from .....services.notification_service import (
            display_user_name,
            notify_project_members,
            send_assigner_confirmation_notification,
            send_assignment_notification,
        )
        from .....config.notification_models import NotificationCategory
        user_name = f"{current_user.firstName} {current_user.lastName}".strip() if hasattr(current_user, 'firstName') else current_user.userName if hasattr(current_user, 'userName') else "A user"
        notify_project_members(
            db,
            str(tenant_id),
            updated_project,
            "Project Updated",
            f"{user_name} updated the project: {updated_project.name}",
            action_url=f"/projects/{project_id}",
            exclude_user_id=str(current_user.id),
            notification_data={"project_id": project_id, "updated_by": str(current_user.id)}
        )
        newly_assigned = []
        if tenant_id and 'projectManagerId' in update_dict and update_dict.get('projectManagerId'):
            new_pm_id = str(update_dict['projectManagerId'])
            if new_pm_id != previous_project_manager_id:
                new_pm = get_user_by_id(new_pm_id, db)
                if new_pm:
                    newly_assigned.append(new_pm)
                    send_assignment_notification(
                        db, str(tenant_id), new_pm, user_name,
                        "Project (Manager)", updated_project.name,
                        action_url=f"/projects/{project_id}",
                        category=NotificationCategory.PROJECTS
                    )
        if tenant_id and newly_added_team_members:
            for member in newly_added_team_members:
                newly_assigned.append(member)
                if str(member.id) == str(current_user.id):
                    continue
                send_assignment_notification(
                    db, str(tenant_id), member, user_name,
                    "Project (Team)", updated_project.name,
                    action_url=f"/projects/{project_id}",
                    category=NotificationCategory.PROJECTS
                )
        if newly_assigned:
            unique_receivers = []
            seen = set()
            for receiver in newly_assigned:
                rid = str(receiver.id)
                if rid in seen:
                    continue
                seen.add(rid)
                unique_receivers.append(receiver)
            only_self = len(unique_receivers) == 1 and str(unique_receivers[0].id) == str(current_user.id)
            if not only_self:
                send_assigner_confirmation_notification(
                    db,
                    str(tenant_id),
                    current_user,
                    ", ".join(display_user_name(r, fallback="User") for r in unique_receivers),
                    "Project",
                    updated_project.name,
                    action_url=f"/projects/{project_id}",
                    category=NotificationCategory.PROJECTS,
                )
    except Exception as notification_error:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to create notification: {notification_error}", exc_info=True)
    return transform_project_to_response(updated_project)

@router.delete("/{project_id}")
async def delete_existing_project(
    project_id: str, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PROJECTS_DELETE.value))
):
    """Delete a project. Owner can delete directly; PM/creator require owner approval first."""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    project = project_logic.get_project_by_id(project_id, db, tenant_id=tenant_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    is_owner = bool(tenant_context and tenant_context.get("is_owner"))
    if not is_owner:
        uid = str(current_user.id)
        is_requester = (
            (project.projectManagerId and str(project.projectManagerId) == uid)
            or (project.createdById and str(project.createdById) == uid)
        )
        if not is_requester:
            raise HTTPException(status_code=403, detail="You do not have permission to delete this project")
        if project.deletionStatus != "approved":
            raise HTTPException(status_code=403, detail="Project deletion requires owner approval. Please request deletion first.")

    success = project_logic.delete_project(project_id, db, tenant_id=tenant_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"message": "Project deleted successfully"}


@router.post("/{project_id}/request-deletion", response_model=Project)
async def request_project_deletion(
    project_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PROJECTS_DELETE.value))
):
    """Request deletion of a project (assigned PM or creator). Notifies owners for approval."""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    project = project_logic.get_project_by_id(project_id, db, tenant_id=tenant_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if tenant_context and tenant_context.get("is_owner"):
        raise HTTPException(status_code=400, detail="Owners can delete projects directly without approval")

    uid = str(current_user.id)
    is_requester = (
        (project.projectManagerId and str(project.projectManagerId) == uid)
        or (project.createdById and str(project.createdById) == uid)
    )
    if not is_requester:
        raise HTTPException(status_code=403, detail="Only the project manager or creator can request deletion")
    if project.deletionStatus == "pending":
        raise HTTPException(status_code=400, detail="A deletion request is already pending for this project")
    if project.deletionStatus == "approved":
        raise HTTPException(status_code=400, detail="Deletion is already approved for this project")

    project.deletionStatus = "pending"
    project.deletionRequestedById = current_user.id
    project.deletionRequestedAt = datetime.utcnow()
    db.commit()
    db.refresh(project)

    try:
        from .....services.rbac_service import RBACService
        from .....services.notification_service import NotificationService
        from .....config.notification_models import NotificationType, NotificationCategory
        user_name = f"{current_user.firstName} {current_user.lastName}".strip() if hasattr(current_user, 'firstName') else getattr(current_user, 'userName', 'A user')
        owner_ids = RBACService.get_owner_user_ids(db, str(tenant_id))
        owner_ids = [oid for oid in owner_ids if oid != uid]
        if owner_ids:
            NotificationService(db).create_bulk_notifications(
                str(tenant_id), owner_ids,
                "Project Deletion Requested",
                f"{user_name} requested approval to delete the project: {project.name}",
                NotificationCategory.PROJECTS,
                NotificationType.WARNING,
                f"/projects/{project_id}",
                {"project_id": project_id, "requested_by": uid, "action": "deletion_request"}
            )
    except Exception as notification_error:
        import logging
        logging.getLogger(__name__).error(f"Failed to notify owners of deletion request: {notification_error}", exc_info=True)

    return transform_project_to_response(project)


@router.post("/{project_id}/approve-deletion", response_model=Project)
async def approve_project_deletion(
    project_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
):
    """Approve a pending project deletion request (owner only)."""
    if not (tenant_context and tenant_context.get("is_owner")):
        raise HTTPException(status_code=403, detail="Only the owner can approve project deletion")
    tenant_id = tenant_context["tenant_id"]
    project = project_logic.get_project_by_id(project_id, db, tenant_id=tenant_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.deletionStatus != "pending":
        raise HTTPException(status_code=400, detail="There is no pending deletion request for this project")

    requester_id = str(project.deletionRequestedById) if project.deletionRequestedById else None
    project.deletionStatus = "approved"
    db.commit()
    db.refresh(project)

    try:
        from .....services.notification_service import NotificationService
        from .....config.notification_models import NotificationType, NotificationCategory
        if requester_id:
            NotificationService(db).create_notification(
                tenant_id=str(tenant_id),
                user_id=requester_id,
                title="Project Deletion Approved",
                message=f"Your request to delete the project '{project.name}' was approved. You can now delete it.",
                category=NotificationCategory.PROJECTS,
                type=NotificationType.SUCCESS,
                action_url=f"/projects/{project_id}",
                notification_data={"project_id": project_id, "action": "deletion_approved"}
            )
    except Exception as notification_error:
        import logging
        logging.getLogger(__name__).error(f"Failed to notify requester of approval: {notification_error}", exc_info=True)

    return transform_project_to_response(project)


@router.post("/{project_id}/reject-deletion", response_model=Project)
async def reject_project_deletion(
    project_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
):
    """Reject a pending project deletion request (owner only)."""
    if not (tenant_context and tenant_context.get("is_owner")):
        raise HTTPException(status_code=403, detail="Only the owner can reject project deletion")
    tenant_id = tenant_context["tenant_id"]
    project = project_logic.get_project_by_id(project_id, db, tenant_id=tenant_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.deletionStatus != "pending":
        raise HTTPException(status_code=400, detail="There is no pending deletion request for this project")

    requester_id = str(project.deletionRequestedById) if project.deletionRequestedById else None
    project.deletionStatus = "none"
    project.deletionRequestedById = None
    project.deletionRequestedAt = None
    db.commit()
    db.refresh(project)

    try:
        from .....services.notification_service import NotificationService
        from .....config.notification_models import NotificationType, NotificationCategory
        if requester_id:
            NotificationService(db).create_notification(
                tenant_id=str(tenant_id),
                user_id=requester_id,
                title="Project Deletion Rejected",
                message=f"Your request to delete the project '{project.name}' was rejected by the owner.",
                category=NotificationCategory.PROJECTS,
                type=NotificationType.INFO,
                action_url=f"/projects/{project_id}",
                notification_data={"project_id": project_id, "action": "deletion_rejected"}
            )
    except Exception as notification_error:
        import logging
        logging.getLogger(__name__).error(f"Failed to notify requester of rejection: {notification_error}", exc_info=True)

    return transform_project_to_response(project)

def transform_task_to_response(task: DBTask):
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
        estimatedHours=task.estimatedHours,
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
        subtasks=[],
        subtaskCount=0,
        completedSubtaskCount=0
    )

@router.get("/{project_id}/tasks", response_model=TasksResponse)
async def get_project_tasks(
    project_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PROJECTS_VIEW.value))
):
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    project = project_logic.get_project_by_id(project_id, db, tenant_id=tenant_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not can_see_all_projects(tenant_context or {}):
        allowed_project_ids = project_logic.get_project_ids_with_tasks_assigned_to(str(current_user.id), db, tenant_id)
        if project.id not in allowed_project_ids:
            raise HTTPException(status_code=404, detail="Project not found")
    tasks = task_logic.get_tasks_by_project(project_id, db, tenant_id=tenant_id)
    if not can_see_all_tasks(tenant_context or {}):
        uid = str(current_user.id)
        tasks = [
            t for t in tasks
            if (t.assignedToId and str(t.assignedToId) == uid) or str(t.createdById) == uid
        ]
    task_list = [transform_task_to_response(task) for task in tasks]
    
    return TasksResponse(
        tasks=task_list,
        pagination={
            "page": 1,
            "limit": len(task_list),
            "total": len(task_list),
            "pages": 1
        }
    )