from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context
from ..users.schemas import UserResponse
from .schemas import RefreshTokenRequest, RefreshTokenResponse, LogoutResponse
from . import logic

router = APIRouter()


@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_access_token(refresh_request: RefreshTokenRequest):
    return await logic.refresh_access_token(refresh_request)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
):
    return await logic.get_current_user_info(current_user, db, tenant_context)


@router.post("/logout", response_model=LogoutResponse)
async def logout():
    return await logic.logout()
