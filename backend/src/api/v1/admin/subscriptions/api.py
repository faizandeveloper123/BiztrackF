from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .....config.database import get_db
from .....api.dependencies import get_current_user
from .schemas import AdminSubscriptionsResponse
from . import logic

router = APIRouter()


@router.get("/subscriptions", response_model=AdminSubscriptionsResponse)
async def get_all_subscriptions(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await logic.get_all_subscriptions(db, current_user)
