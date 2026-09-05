from uuid import UUID
from typing import Optional, List

from fastapi import HTTPException, status
from sqlalchemy import and_
from sqlalchemy.orm import Session

from .....models.healthcare import HealthcareStaff
from .....config.core_models import User
from .....config.database import get_user_by_email, create_user
from .....config.core_models import User as UserModel, TenantUser as TenantUserModel
from .....services.rbac_service import RBACService
from .....core.auth import get_password_hash
from ...repository import get_by_id, create_entity
from ..logic_common import update_record
from ..shared import (
    staff_to_schema,
    normalize_healthcare_permissions,
    merge_healthcare_permissions,
    ensure_healthcare_staff_role,
)
from .schemas import HealthcareStaffCreate, HealthcareStaffUpdate, HealthcareStaffResponse, HealthcareStaff as HealthcareStaffPydantic


def get_healthcare_staff_by_id(staff_id: str, db: Session, tenant_id: str = None):
    return get_by_id(HealthcareStaff, staff_id, db, tenant_id)


def get_healthcare_staff(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> List[HealthcareStaff]:
    query = (
        db.query(HealthcareStaff)
        .join(User, HealthcareStaff.user_id == User.id)
        .filter(HealthcareStaff.tenant_id == tenant_id)
    )
    if is_active is not None:
        query = query.filter(HealthcareStaff.is_active == is_active)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            User.userName.ilike(search_lower)
            | User.email.ilike(search_lower)
            | User.firstName.ilike(search_lower)
            | User.lastName.ilike(search_lower)
            | HealthcareStaff.phone.ilike(search_lower)
            | HealthcareStaff.role.ilike(search_lower)
        )
    return query.order_by(HealthcareStaff.createdAt.desc()).offset(skip).limit(limit).all()


def get_healthcare_staff_count(
    db: Session,
    tenant_id: str,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> int:
    query = (
        db.query(HealthcareStaff)
        .join(User, HealthcareStaff.user_id == User.id)
        .filter(HealthcareStaff.tenant_id == tenant_id)
    )
    if is_active is not None:
        query = query.filter(HealthcareStaff.is_active == is_active)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            User.userName.ilike(search_lower)
            | User.email.ilike(search_lower)
            | User.firstName.ilike(search_lower)
            | User.lastName.ilike(search_lower)
            | HealthcareStaff.phone.ilike(search_lower)
            | HealthcareStaff.role.ilike(search_lower)
        )
    return query.count()


def insert_healthcare_staff(staff_data: dict, db: Session) -> HealthcareStaff:
    return create_entity(HealthcareStaff, staff_data, db)


def patch_healthcare_staff(staff_id: str, update_data: dict, db: Session, tenant_id: str = None):
    return update_record(staff_id, update_data, db, tenant_id, get_healthcare_staff_by_id)


def list_healthcare_staff(
    tenant_id: str,
    db: Session,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    limit: int = 20,
) -> HealthcareStaffResponse:
    skip = (page - 1) * limit
    db_staff = get_healthcare_staff(
        db, tenant_id, skip=skip, limit=limit, search=search, is_active=is_active
    )
    total = get_healthcare_staff_count(db, tenant_id, search=search, is_active=is_active)
    out: List[HealthcareStaffPydantic] = []
    for s in db_staff:
        u = db.query(UserModel).filter(UserModel.id == s.user_id).first()
        if not u:
            continue
        perms = RBACService.get_user_permissions(db, str(u.id), tenant_id)
        healthcare_perms = [p for p in perms if p.startswith("healthcare:")]
        out.append(staff_to_schema(s, u, healthcare_perms))
    return HealthcareStaffResponse(staff=out, total=total)


def create_healthcare_staff(tenant_id: str, body: HealthcareStaffCreate, db: Session, current_user_id: str):
    existing = get_user_by_email(body.email, db)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )
    if not RBACService.validate_username_uniqueness(db, body.username, tenant_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken in this tenant",
        )
    role = ensure_healthcare_staff_role(db, tenant_id)
    healthcare_perms = normalize_healthcare_permissions(body.permissions)
    user_dict = {
        "tenant_id": UUID(tenant_id),
        "userName": body.username,
        "email": body.email,
        "firstName": body.first_name,
        "lastName": body.last_name,
        "hashedPassword": get_password_hash(body.password),
        "isActive": True,
    }
    try:
        db_user = create_user(user_dict, db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    tenant_user = TenantUserModel(
        tenant_id=UUID(tenant_id),
        userId=UUID(str(db_user.id)),
        role_id=UUID(str(role.id)),
        role=role.name,
        custom_permissions=healthcare_perms,
        isActive=True,
        invitedBy=UUID(str(current_user_id)),
    )
    db.add(tenant_user)
    db.commit()
    db.refresh(tenant_user)
    staff_dict = {
        "tenant_id": UUID(tenant_id),
        "user_id": UUID(str(db_user.id)),
        "phone": body.phone,
        "role": body.role,
        "is_active": True,
    }
    db_staff = insert_healthcare_staff(staff_dict, db)
    return staff_to_schema(db_staff, db_user, healthcare_perms)


def update_healthcare_staff(
    tenant_id: str, staff_id: str, body: HealthcareStaffUpdate, db: Session
):
    db_staff = get_healthcare_staff_by_id(staff_id, db, tenant_id)
    if not db_staff:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff not found")
    db_user = db.query(UserModel).filter(UserModel.id == db_staff.user_id).first()
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if body.email is not None and body.email.strip().lower() != (db_user.email or "").strip().lower():
        existing = get_user_by_email(body.email, db)
        if existing and str(existing.id) != str(db_user.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        db_user.email = body.email.strip().lower()
    if body.username is not None and body.username != db_user.userName:
        if not RBACService.validate_username_uniqueness(
            db, body.username, tenant_id, exclude_user_id=str(db_user.id)
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken in this tenant",
            )
        db_user.userName = body.username
    if body.first_name is not None:
        db_user.firstName = body.first_name
    if body.last_name is not None:
        db_user.lastName = body.last_name
    if body.password is not None and body.password.strip():
        db_user.hashedPassword = get_password_hash(body.password)
    staff_update = {}
    if body.phone is not None:
        staff_update["phone"] = body.phone
    if body.role is not None:
        staff_update["role"] = body.role
    if body.is_active is not None:
        staff_update["is_active"] = body.is_active
    if staff_update:
        db_staff = patch_healthcare_staff(staff_id, staff_update, db, tenant_id)
    if body.permissions is not None:
        healthcare_perms = normalize_healthcare_permissions(body.permissions)
        tenant_user = (
            db.query(TenantUserModel)
            .filter(
                and_(
                    TenantUserModel.tenant_id == tenant_id,
                    TenantUserModel.userId == db_user.id,
                    TenantUserModel.isActive == True,
                )
            )
            .first()
        )
        if tenant_user:
            tenant_user.custom_permissions = merge_healthcare_permissions(
                tenant_user.custom_permissions, healthcare_perms
            )
            db.commit()
        perms = RBACService.get_user_permissions(db, str(db_user.id), tenant_id)
        effective = [p for p in perms if p.startswith("healthcare:")]
        return staff_to_schema(db_staff, db_user, effective)
    perms = RBACService.get_user_permissions(db, str(db_user.id), tenant_id)
    effective = [p for p in perms if p.startswith("healthcare:")]
    db.commit()
    db.refresh(db_user)
    return staff_to_schema(db_staff, db_user, effective)


def delete_healthcare_staff(tenant_id: str, staff_id: str, db: Session) -> None:
    db_staff = get_healthcare_staff_by_id(staff_id, db, tenant_id)
    if not db_staff:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff not found")
    db_staff.is_active = False
    tenant_user = (
        db.query(TenantUserModel)
        .filter(
            and_(
                TenantUserModel.tenant_id == tenant_id,
                TenantUserModel.userId == db_staff.user_id,
                TenantUserModel.isActive == True,
            )
        )
        .first()
    )
    if tenant_user:
        tenant_user.custom_permissions = merge_healthcare_permissions(
            tenant_user.custom_permissions, []
        )
    db.commit()
