import logging
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .....config.core_models import project_team_members
from .....config.database import create_user, get_user_by_email, get_user_by_id
from .....models.projects import Project
from .....config.notification_models import Notification, NotificationPreference
from .....core.auth import get_password_hash
from .....models.common import TenantRole
from .....models.platform import User as UserORM
from .....models.rbac import Role as RoleORM, TenantUser as TenantUserORM
from .....models.user_models import User, UserCreate
from .....services.rbac_service import RBACService
from .....services.user_delete_service import force_delete_user as force_delete_user_service
from ..shared import (
    ensure_owner_role_assignment,
    get_tenant_role,
    role_orm_to_schema,
    send_user_invitation,
)
from .schemas import TenantUser, TenantUserCreate, TenantUserUpdate, UserSummary, UserWithPermissions

logger = logging.getLogger(__name__)


def get_tenant_user(tenant_id: str, user_id: str, db: Session) -> Optional[TenantUserORM]:
    return db.query(TenantUserORM).filter(
        TenantUserORM.tenant_id == tenant_id,
        TenantUserORM.userId == user_id,
    ).first()


def get_tenant_users(tenant_id: str, db: Session, skip: int = 0, limit: int = 100) -> List[TenantUserORM]:
    return db.query(TenantUserORM).filter(
        TenantUserORM.tenant_id == tenant_id,
        TenantUserORM.isActive == True,
    ).offset(skip).limit(limit).all()


def get_user_tenants(user_id: str, db: Session) -> List[TenantUserORM]:
    return db.query(TenantUserORM).filter(
        TenantUserORM.userId == user_id,
        TenantUserORM.isActive == True,
    ).all()


def create_tenant_user(tenant_user_data: dict, db: Session) -> TenantUserORM:
    db_tenant_user = TenantUserORM(**tenant_user_data)
    db.add(db_tenant_user)
    db.commit()
    db.refresh(db_tenant_user)
    return db_tenant_user


def update_tenant_user(tenant_user_id: str, update_data: dict, db: Session) -> Optional[TenantUserORM]:
    tenant_user = db.query(TenantUserORM).filter(TenantUserORM.id == tenant_user_id).first()
    if tenant_user:
        for key, value in update_data.items():
            if hasattr(tenant_user, key) and value is not None:
                setattr(tenant_user, key, value)
        tenant_user.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(tenant_user)
    return tenant_user


def delete_tenant_user(tenant_user_id: str, db: Session) -> bool:
    tenant_user = db.query(TenantUserORM).filter(TenantUserORM.id == tenant_user_id).first()
    if tenant_user:
        db.delete(tenant_user)
        db.commit()
        return True
    return False


def _tenant_joined_at(tenant_user: TenantUserORM) -> datetime:
    return (
        tenant_user.joinedAt
        or tenant_user.createdAt
        or tenant_user.updatedAt
        or datetime.utcnow()
    )


def _tenant_user_to_schema(tenant_user: TenantUserORM) -> TenantUser:
    return TenantUser(
        id=str(tenant_user.id),
        tenant_id=str(tenant_user.tenant_id),
        userId=str(tenant_user.userId),
        role_id=str(tenant_user.role_id),
        custom_permissions=tenant_user.custom_permissions,
        isActive=tenant_user.isActive,
        invitedBy=str(tenant_user.invitedBy) if tenant_user.invitedBy else None,
        joinedAt=_tenant_joined_at(tenant_user),
        createdAt=tenant_user.createdAt,
        updatedAt=tenant_user.updatedAt,
        role=role_orm_to_schema(tenant_user.role_obj) if tenant_user.role_obj else None,
        user=UserSummary(
            id=str(tenant_user.user.id),
            userName=tenant_user.user.userName,
            email=tenant_user.user.email,
            firstName=tenant_user.user.firstName,
            lastName=tenant_user.user.lastName,
            avatar=tenant_user.user.avatar,
        ) if tenant_user.user else None,
    )


def _is_owner_role(role: Optional[RoleORM]) -> bool:
    return bool(role and role.name == TenantRole.OWNER.value)


def _active_owner_count(db: Session, tenant_id: str) -> int:
    return db.query(TenantUserORM).join(RoleORM).filter(
        and_(
            TenantUserORM.tenant_id == tenant_id,
            TenantUserORM.isActive == True,
            RoleORM.name == TenantRole.OWNER.value,
        )
    ).count()


def _ensure_not_demoting_last_owner(
    db: Session,
    tenant_id: str,
    tenant_user: TenantUserORM,
    new_role_id: Optional[str],
) -> None:
    if not tenant_user.isActive or not _is_owner_role(tenant_user.role_obj):
        return
    new_role = get_tenant_role(db, new_role_id, tenant_id) if new_role_id else None
    if _is_owner_role(new_role):
        return
    if _active_owner_count(db, tenant_id) <= 1:
        raise HTTPException(
            status_code=400,
            detail="Cannot demote the last owner of this workspace",
        )


def _ensure_caller_can_manage_owner(
    db: Session,
    tenant_id: str,
    tenant_user: TenantUserORM,
    current_user_id: str,
) -> None:
    if not _is_owner_role(tenant_user.role_obj):
        return
    if not RBACService.is_owner(db, current_user_id, tenant_id):
        raise HTTPException(
            status_code=403,
            detail="Only the tenant owner can modify or remove an owner",
        )


def get_tenant_users_list(db: Session, tenant_id: Optional[str]) -> List[UserWithPermissions]:
    if not tenant_id:
        return []
    tenant_users = db.query(TenantUserORM).join(UserORM).join(RoleORM).filter(
        TenantUserORM.tenant_id == tenant_id,
        TenantUserORM.isActive == True,
    ).all()
    user_list = []
    for tenant_user in tenant_users:
        user_permissions = RBACService.get_user_permissions(db, str(tenant_user.userId), tenant_id)
        user_list.append(UserWithPermissions(
            id=str(tenant_user.userId),
            tenant_user_id=str(tenant_user.id),
            userName=tenant_user.user.userName,
            email=tenant_user.user.email,
            firstName=tenant_user.user.firstName,
            lastName=tenant_user.user.lastName,
            avatar=tenant_user.user.avatar,
            isActive=tenant_user.isActive,
            role=role_orm_to_schema(tenant_user.role_obj) if tenant_user.role_obj else None,
            role_id=str(tenant_user.role_id),
            custom_permissions=tenant_user.custom_permissions or [],
            permissions=user_permissions,
            joinedAt=_tenant_joined_at(tenant_user),
        ))
    return user_list


def add_user_to_tenant(
    db: Session,
    tenant_id: str,
    user_data: TenantUserCreate,
    current_user,
    background_tasks=None,
) -> TenantUser:
    user = get_user_by_id(user_data.userId, db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    existing_tenant_user = db.query(TenantUserORM).filter(
        and_(
            TenantUserORM.userId == user_data.userId,
            TenantUserORM.tenant_id == tenant_id,
        )
    ).first()
    role = get_tenant_role(db, user_data.role_id, tenant_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    ensure_owner_role_assignment(db, role, str(current_user.id), tenant_id)
    if existing_tenant_user:
        if existing_tenant_user.isActive:
            raise HTTPException(status_code=400, detail="User already exists in this tenant")
        existing_tenant_user.isActive = True
        existing_tenant_user.role_id = user_data.role_id
        existing_tenant_user.role = role.name
        existing_tenant_user.custom_permissions = user_data.custom_permissions
        db.commit()
        db.refresh(existing_tenant_user)
        result = _tenant_user_to_schema(existing_tenant_user)
        send_user_invitation(db, tenant_id, user, role, current_user, background_tasks)
        return result
    tenant_user = TenantUserORM(
        tenant_id=tenant_id,
        userId=user_data.userId,
        role_id=user_data.role_id,
        role=role.name,
        custom_permissions=user_data.custom_permissions,
        isActive=user_data.isActive,
        invitedBy=str(current_user.id),
        joinedAt=datetime.utcnow(),
    )
    db.add(tenant_user)
    db.commit()
    db.refresh(tenant_user)
    result = _tenant_user_to_schema(tenant_user)
    send_user_invitation(db, tenant_id, user, role, current_user, background_tasks)
    return result


def update_rbac_tenant_user(
    db: Session,
    tenant_id: str,
    tenant_user_id: str,
    user_data: TenantUserUpdate,
    current_user,
) -> TenantUser:
    try:
        tenant_user_uuid = UUID(tenant_user_id)
        tenant_id_uuid = UUID(tenant_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    tenant_user = db.query(TenantUserORM).filter(
        and_(TenantUserORM.id == tenant_user_uuid, TenantUserORM.tenant_id == tenant_id_uuid)
    ).first()
    if not tenant_user:
        raise HTTPException(status_code=404, detail="Tenant user not found")
    if user_data.role_id:
        role = get_tenant_role(db, user_data.role_id, tenant_id)
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        ensure_owner_role_assignment(db, role, str(current_user.id), tenant_id)
    _ensure_caller_can_manage_owner(db, tenant_id, tenant_user, str(current_user.id))
    _ensure_not_demoting_last_owner(db, tenant_id, tenant_user, user_data.role_id)
    update_dict = user_data.dict(exclude_unset=True)
    if 'role_id' in update_dict and update_dict['role_id']:
        try:
            update_dict['role_id'] = UUID(update_dict['role_id'])
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="Invalid role ID format")
        role = get_tenant_role(db, str(update_dict['role_id']), tenant_id)
        if role:
            update_dict['role'] = role.name
    for key, value in update_dict.items():
        if hasattr(tenant_user, key) and value is not None:
            setattr(tenant_user, key, value)
    tenant_user.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(tenant_user)
    return _tenant_user_to_schema(tenant_user)


def _get_managed_project_names(db: Session, user_id, tenant_id: str) -> List[str]:
    rows = db.query(Project.name).filter(
        Project.tenant_id == tenant_id,
        Project.projectManagerId == user_id,
    ).all()
    return [row[0] for row in rows]


def _user_has_global_delete_blockers(db: Session, user_id) -> bool:
    if db.query(Project.id).filter(Project.projectManagerId == user_id).first():
        return True
    return False


def _detach_user_from_tenant_projects(db: Session, user_id, tenant_id: str) -> None:
    tenant_project_ids = db.query(Project.id).filter(Project.tenant_id == tenant_id)
    db.execute(
        project_team_members.delete().where(
            project_team_members.c.user_id == user_id,
            project_team_members.c.project_id.in_(tenant_project_ids),
        )
    )


def _remove_tenant_user_record(
    db: Session,
    tenant_user: TenantUserORM,
    tenant_id: str,
    current_user_id: str,
) -> dict:
    if str(tenant_user.userId) == str(current_user_id):
        raise HTTPException(status_code=400, detail="You cannot remove yourself from the tenant")
    if _is_owner_role(tenant_user.role_obj):
        if not RBACService.is_owner(db, current_user_id, tenant_id):
            raise HTTPException(
                status_code=403,
                detail="Only the tenant owner can remove an owner",
            )
        if _active_owner_count(db, tenant_id) <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot remove the last owner of this workspace",
            )
    user_id_uuid = tenant_user.userId
    managed_projects = _get_managed_project_names(db, user_id_uuid, tenant_id)
    if managed_projects:
        preview = ", ".join(managed_projects[:3])
        extra = f" and {len(managed_projects) - 3} more" if len(managed_projects) > 3 else ""
        raise HTTPException(
            status_code=400,
            detail=f"Cannot remove user: they are project manager on {preview}{extra}. Reassign those projects first.",
        )
    other_tenant_users_count = db.query(TenantUserORM).filter(
        and_(
            TenantUserORM.userId == user_id_uuid,
            TenantUserORM.tenant_id != tenant_id,
        )
    ).count()
    _detach_user_from_tenant_projects(db, user_id_uuid, tenant_id)
    db.delete(tenant_user)
    if other_tenant_users_count == 0 and not _user_has_global_delete_blockers(db, user_id_uuid):
        user = db.query(UserORM).filter(UserORM.id == user_id_uuid).first()
        if user:
            db.query(Notification).filter(Notification.user_id == user_id_uuid).delete()
            db.query(NotificationPreference).filter(NotificationPreference.user_id == user_id_uuid).delete()
            db.delete(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        logger.exception("Failed to remove tenant user due to database constraints")
        raise HTTPException(
            status_code=400,
            detail="Cannot remove user: they are still linked to projects or other records. Reassign or remove those assignments first.",
        )
    return {"message": "User removed from tenant successfully"}


def remove_tenant_user(
    db: Session,
    tenant_id: str,
    tenant_user_id: str,
    current_user_id: str,
) -> dict:
    tenant_user = db.query(TenantUserORM).filter(
        and_(TenantUserORM.id == tenant_user_id, TenantUserORM.tenant_id == tenant_id)
    ).first()
    if not tenant_user:
        raise HTTPException(status_code=404, detail="Tenant user not found")
    return _remove_tenant_user_record(db, tenant_user, tenant_id, current_user_id)


def remove_user_by_id(
    db: Session,
    tenant_id: str,
    user_id: str,
    current_user_id: str,
) -> dict:
    tenant_user = db.query(TenantUserORM).filter(
        and_(TenantUserORM.userId == user_id, TenantUserORM.tenant_id == tenant_id)
    ).first()
    if not tenant_user:
        raise HTTPException(status_code=404, detail="User not found in this tenant")
    return _remove_tenant_user_record(db, tenant_user, tenant_id, current_user_id)


def force_delete_user_by_id(
    db: Session,
    tenant_id: str,
    user_id: str,
    current_user_id: str,
) -> dict:
    tenant_user = db.query(TenantUserORM).filter(
        and_(TenantUserORM.userId == user_id, TenantUserORM.tenant_id == tenant_id)
    ).first()
    if not tenant_user:
        raise HTTPException(status_code=404, detail="User not found in this tenant")
    if _is_owner_role(tenant_user.role_obj):
        if not RBACService.is_owner(db, current_user_id, tenant_id):
            raise HTTPException(
                status_code=403,
                detail="Only the tenant owner can remove an owner",
            )
        if _active_owner_count(db, tenant_id) <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot remove the last owner of this workspace",
            )
    try:
        return force_delete_user_service(
            db,
            UUID(user_id),
            UUID(tenant_id),
            UUID(current_user_id),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def create_user_for_tenant(
    db: Session,
    tenant_id: str,
    user_data: UserCreate,
    role_id: str,
    current_user,
    background_tasks=None,
) -> User:
    existing_global_user = get_user_by_email(user_data.email, db)
    if existing_global_user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists. Please use a different email or add the existing user to this tenant.",
        )
    if not RBACService.validate_username_uniqueness(db, user_data.userName, tenant_id):
        raise HTTPException(status_code=400, detail="Username already taken in this tenant")
    role = get_tenant_role(db, role_id, tenant_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    ensure_owner_role_assignment(db, role, str(current_user.id), tenant_id)
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict()
    user_dict.pop('password')
    user_dict['hashedPassword'] = hashed_password
    user_dict['tenant_id'] = UUID(tenant_id)
    try:
        db_user = create_user(user_dict, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    tenant_user = TenantUserORM(
        tenant_id=UUID(tenant_id),
        userId=UUID(str(db_user.id)),
        role_id=UUID(role_id),
        role=role.name,
        custom_permissions=[],
        isActive=True,
        invitedBy=UUID(str(current_user.id)),
        joinedAt=datetime.utcnow(),
    )
    db.add(tenant_user)
    db.commit()
    result = User(
        userId=str(db_user.id),
        userName=db_user.userName,
        email=db_user.email,
        firstName=db_user.firstName,
        lastName=db_user.lastName,
        userRole=db_user.userRole,
        avatar=db_user.avatar,
        permissions=[],
    )
    send_user_invitation(db, tenant_id, db_user, role, current_user, background_tasks)
    return result
