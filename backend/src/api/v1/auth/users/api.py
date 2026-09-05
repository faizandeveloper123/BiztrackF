from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context
from .schemas import UserUpdate, UserResponse
from . import logic

router = APIRouter()


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user_info(
    user_id: str,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
):
    return await logic.update_user_info(user_id, user_data, db, current_user, tenant_context)
