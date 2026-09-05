from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .....config.database import get_user_by_email, get_user_tenants, get_all_tenants
from .....core.auth import (
    verify_password,
    create_access_token,
    create_refresh_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from ..tenants.schemas import TenantInfo
from ..users.schemas import UserResponse
from .schemas import LoginCredentials, AuthResponse

IS_SUPER_ADMIN_ROLE = "super_admin"


async def login(credentials: LoginCredentials, db: Session):
    user = get_user_by_email(credentials.email, db)
    if not user or not verify_password(credentials.password, user.hashedPassword):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.isActive:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is inactive"
        )

    user_tenants = get_user_tenants(str(user.id), db)

    available_tenants = []
    if user.userRole == IS_SUPER_ADMIN_ROLE:
        for tenant in get_all_tenants(db):
            if tenant.isActive:
                available_tenants.append(TenantInfo(
                    id=str(tenant.id),
                    name=tenant.name,
                    domain=tenant.domain,
                    role="super_admin",
                    isActive=tenant.isActive
                ))
    else:
        for tenant_user in user_tenants:
            if tenant_user.tenant and tenant_user.tenant.isActive:
                available_tenants.append(TenantInfo(
                    id=str(tenant_user.tenant.id),
                    name=tenant_user.tenant.name,
                    domain=tenant_user.tenant.domain,
                    role=tenant_user.role_obj.name if tenant_user.role_obj else "member",
                    isActive=tenant_user.tenant.isActive
                ))

    requires_tenant_selection = len(available_tenants) > 1

    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    refresh_token = create_refresh_token(
        data={"sub": user.email}
    )

    return AuthResponse(
        success=True,
        user=UserResponse(
            userId=str(user.id),
            userName=user.userName,
            email=user.email,
            firstName=user.firstName,
            lastName=user.lastName,
            userRole=user.userRole,
            avatar=user.avatar,
            permissions=[]
        ),
        token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        available_tenants=available_tenants,
        requires_tenant_selection=requires_tenant_selection
    )
