from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .....config.database import get_db
from .....api.dependencies import get_current_user
from .schemas import AdminStatsResponse
from . import logic

router = APIRouter()


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await logic.get_admin_stats(db, current_user)
