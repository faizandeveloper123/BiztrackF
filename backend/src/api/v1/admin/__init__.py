from fastapi import APIRouter

from .tenants.api import router as tenants_router
from .resources.api import router as resources_router
from .stats.api import router as stats_router
from .subscriptions.api import router as subscriptions_router

router = APIRouter(prefix="/admin", tags=["admin"])
router.include_router(tenants_router)
router.include_router(resources_router)
router.include_router(stats_router)
router.include_router(subscriptions_router)
