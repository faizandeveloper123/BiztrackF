from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .....config.database import get_db
from .schemas import PasswordResetRequest, PasswordResetConfirm, PasswordResetResponse
from . import logic

router = APIRouter()


@router.post("/reset-password", response_model=PasswordResetResponse)
async def request_password_reset(
    request: PasswordResetRequest,
    db: Session = Depends(get_db),
):
    return await logic.request_password_reset(request, db)


@router.post("/reset-password/confirm", response_model=PasswordResetResponse)
async def confirm_password_reset(
    request: PasswordResetConfirm,
    db: Session = Depends(get_db),
):
    return await logic.confirm_password_reset(request, db)
