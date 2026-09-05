from fastapi import APIRouter

from .products.api import router as products_router
from .categories.api import router as categories_router
from .shifts.api import router as shifts_router
from .transactions.api import router as transactions_router
from .reports.api import router as reports_router
from .dashboard.api import router as dashboard_router

router = APIRouter(prefix="/pos", tags=["pos"])
router.include_router(products_router)
router.include_router(categories_router)
router.include_router(shifts_router)
router.include_router(transactions_router)
router.include_router(reports_router)
router.include_router(dashboard_router)
