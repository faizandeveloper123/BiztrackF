import logging
import threading
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import and_
from sqlalchemy.orm import Session

from ....models.common import TenantRole
from ....models.platform import Tenant, User
from ....models.rbac import Role, TenantUser
from ....services.email_service import EmailService
from .roles.schemas import Role as RoleSchema
from ....services.rbac_service import RBACService

logger = logging.getLogger(__name__)


def role_orm_to_schema(role: Role) -> RoleSchema:
    return RoleSchema(
        id=str(role.id),
        tenant_id=str(role.tenant_id),
        name=role.name,
        display_name=role.display_name,
        description=role.description,
        permissions=role.permissions,
        isActive=role.isActive,
        createdAt=role.createdAt,
        updatedAt=role.updatedAt,
    )


def get_tenant_role(db: Session, role_id: str, tenant_id: str) -> Optional[Role]:
    try:
        role_uuid = UUID(role_id)
        tenant_uuid = UUID(tenant_id)
    except (ValueError, TypeError):
        return None
    return db.query(Role).filter(
        and_(Role.id == role_uuid, Role.tenant_id == tenant_uuid, Role.isActive == True)
    ).first()


def ensure_owner_role_assignment(
    db: Session,
    role: Role,
    current_user_id: str,
    tenant_id: str,
) -> None:
    if role.name == TenantRole.OWNER.value and not RBACService.is_owner(db, current_user_id, tenant_id):
        raise HTTPException(status_code=403, detail="Only tenant owner can assign the owner role")


def inviter_display_name(current_user) -> str:
    if getattr(current_user, 'firstName', None):
        return f"{current_user.firstName} {current_user.lastName}".strip()
    return getattr(current_user, 'userName', None) or "A team member"


def build_invitation_payload(
    db: Session,
    tenant_id: str,
    user: User,
    role: Role,
    current_user,
) -> Optional[dict]:
    try:
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        tenant_name = tenant.name if tenant else None
        user_name = f"{user.firstName} {user.lastName}".strip() if user.firstName else user.userName
        return {
            "to_email": user.email,
            "user_name": user_name,
            "inviter_name": inviter_display_name(current_user),
            "tenant_name": tenant_name,
            "role_name": role.display_name or role.name,
        }
    except Exception as email_error:
        logger.error(f"Failed to prepare invitation email: {email_error}", exc_info=True)
        return None


def send_invitation_email_task(
    to_email: str,
    user_name: str,
    inviter_name: str,
    tenant_name: Optional[str] = None,
    role_name: Optional[str] = None,
) -> None:
    try:
        email_service = EmailService()
        email_service.send_user_invitation_email(
            to_email=to_email,
            user_name=user_name,
            inviter_name=inviter_name,
            tenant_name=tenant_name,
            role_name=role_name,
        )
    except Exception as email_error:
        logger.error(f"Failed to send invitation email: {email_error}", exc_info=True)


def _queue_invitation_email(email_payload: dict) -> None:
    threading.Thread(
        target=send_invitation_email_task,
        kwargs=email_payload,
        daemon=True,
    ).start()


def send_user_invitation(
    db: Session,
    tenant_id: str,
    user: User,
    role: Role,
    current_user,
    background_tasks=None,
) -> None:
    email_payload = build_invitation_payload(db, tenant_id, user, role, current_user)
    if not email_payload:
        return

    if background_tasks is not None:
        background_tasks.add_task(_queue_invitation_email, email_payload)
        return

    _queue_invitation_email(email_payload)
