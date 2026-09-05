from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .....models.platform import Tenant
from .....core.auth import (
    create_access_token,
    create_refresh_token,
    verify_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from ..users.schemas import UserResponse
from .schemas import RefreshTokenRequest, RefreshTokenResponse, LogoutResponse


async def refresh_access_token(refresh_request: RefreshTokenRequest):
    try:
        payload = verify_token(refresh_request.refresh_token, "refresh")

        new_access_token = create_access_token(
            data={"sub": payload.get("sub")}
        )

        new_refresh_token = create_refresh_token(
            data={"sub": payload.get("sub")}
        )

        return RefreshTokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


async def get_current_user_info(current_user, db: Session, tenant_context: Optional[dict]):
    tenant_logo_url = None
    if tenant_context:
        tenant = db.query(Tenant).filter(Tenant.id == tenant_context["tenant_id"]).first()
        if tenant:
            tenant_logo_url = tenant.logo_url

    return UserResponse(
        userId=str(current_user.id),
        userName=current_user.userName,
        email=current_user.email,
        firstName=current_user.firstName,
        lastName=current_user.lastName,
        userRole=current_user.userRole,
        avatar=current_user.avatar,
        tenantLogoUrl=tenant_logo_url,
        permissions=[]
    )


async def logout():
    return LogoutResponse(message="Logged out successfully")
