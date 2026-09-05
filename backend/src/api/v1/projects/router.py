from fastapi import APIRouter

from .items.api import router as items_router
from .time_tracking.api import router as time_tracking_router

router = APIRouter()
router.include_router(time_tracking_router)
router.include_router(items_router)
