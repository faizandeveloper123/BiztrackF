from typing import Optional

from fastapi import HTTPException
from sqlalchemy import and_
from sqlalchemy.orm import Session

from .....models.common import Pagination, TenantRole
from .....models.rbac import Role as RoleORM, TenantUser as TenantUserORM
from .....services.rbac_service import validate_permissions
from ..shared import role_orm_to_schema
from .schemas import Role, RoleCreate, RoleUpdate, RolesResponse


def get_roles(db: Session, tenant_id: Optional[str]) -> RolesResponse:
    if not tenant_id:
        return RolesResponse(
            roles=[],
            pagination=Pagination(page=1, limit=0, total=0, pages=0),
        )
    roles = db.query(RoleORM).filter(
        and_(RoleORM.tenant_id == tenant_id, RoleORM.isActive == True)
    ).all()
    role_list = [role_orm_to_schema(role) for role in roles]
    return RolesResponse(
        roles=role_list,
        pagination=Pagination(page=1, limit=len(role_list), total=len(role_list), pages=1),
    )


def create_role(db: Session, tenant_id: str, role_data: RoleCreate) -> Role:
    if role_data.name and role_data.name.lower() == TenantRole.OWNER.value:
        raise HTTPException(status_code=400, detail="Role name 'owner' is reserved")
    validation_error = validate_permissions(role_data.permissions)
    if validation_error:
        raise HTTPException(status_code=400, detail=validation_error)
    role = RoleORM(
        tenant_id=tenant_id,
        name=role_data.name,
        display_name=role_data.display_name,
        description=role_data.description,
        permissions=role_data.permissions,
        isActive=role_data.isActive,
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role_orm_to_schema(role)


def update_role(db: Session, tenant_id: str, role_id: str, role_data: RoleUpdate) -> Role:
    role = db.query(RoleORM).filter(
        and_(RoleORM.id == role_id, RoleORM.tenant_id == tenant_id)
    ).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    if role.name == TenantRole.OWNER.value:
        raise HTTPException(status_code=400, detail="Cannot modify the owner role")
    update_dict = role_data.dict(exclude_unset=True)
    if "permissions" in update_dict and update_dict["permissions"] is not None:
        validation_error = validate_permissions(update_dict["permissions"])
        if validation_error:
            raise HTTPException(status_code=400, detail=validation_error)
    for key, value in update_dict.items():
        if hasattr(role, key) and value is not None:
            setattr(role, key, value)
    db.commit()
    db.refresh(role)
    return role_orm_to_schema(role)


def delete_role(db: Session, tenant_id: str, role_id: str) -> dict:
    role = db.query(RoleORM).filter(
        and_(RoleORM.id == role_id, RoleORM.tenant_id == tenant_id)
    ).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    if role.name == TenantRole.OWNER.value:
        raise HTTPException(status_code=400, detail="Cannot delete owner role")
    active_users_count = db.query(TenantUserORM).filter(
        and_(TenantUserORM.role_id == role_id, TenantUserORM.isActive == True)
    ).count()
    if active_users_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete role: {active_users_count} active user(s) are assigned to this role",
        )
    role.isActive = False
    db.commit()
    return {"message": "Role deleted successfully"}
