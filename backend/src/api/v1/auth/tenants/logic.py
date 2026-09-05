from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .....config.database import get_user_tenants, get_all_tenants, get_tenant_by_id
from .....core.auth import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from .schemas import TenantSelectionRequest, TenantSelectionResponse, TenantInfo, MyTenantsResponse

IS_SUPER_ADMIN_ROLE = "super_admin"


async def select_tenant(tenant_request: TenantSelectionRequest, current_user, db: Session):
    user_tenants = get_user_tenants(str(current_user.id), db)
    selected_tenant = None
    user_role = None

    for tenant_user in user_tenants:
        if str(tenant_user.tenant.id) == tenant_request.tenant_id and tenant_user.tenant.isActive:
            selected_tenant = tenant_user.tenant
            user_role = tenant_user.role
            break

    if not selected_tenant and getattr(current_user, "userRole", None) == IS_SUPER_ADMIN_ROLE:
        tenant = get_tenant_by_id(tenant_request.tenant_id, db)
        if tenant and tenant.isActive:
            selected_tenant = tenant
            user_role = "super_admin"

    if not selected_tenant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this tenant or tenant not found"
        )

    access_token = create_access_token(
        data={
            "sub": current_user.email,
            "tenant_id": str(selected_tenant.id),
            "tenant_role": user_role
        },
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return TenantSelectionResponse(
        success=True,
        message=f"Successfully selected tenant: {selected_tenant.name}",
        tenant=TenantInfo(
            id=str(selected_tenant.id),
            name=selected_tenant.name,
            domain=selected_tenant.domain,
            role=user_role,
            isActive=selected_tenant.isActive
        ),
        access_token=access_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


async def get_my_tenants(current_user, db: Session):
    available_tenants = []

    if getattr(current_user, "userRole", None) == IS_SUPER_ADMIN_ROLE:
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
        user_tenants = get_user_tenants(str(current_user.id), db)
        for tenant_user in user_tenants:
            if tenant_user.tenant and tenant_user.tenant.isActive:
                available_tenants.append(TenantInfo(
                    id=str(tenant_user.tenant.id),
                    name=tenant_user.tenant.name,
                    domain=tenant_user.tenant.domain,
                    role=tenant_user.role_obj.name if tenant_user.role_obj else "member",
                    isActive=tenant_user.tenant.isActive
                ))

    return MyTenantsResponse(
        success=True,
        tenants=available_tenants,
        total=len(available_tenants)
    )
