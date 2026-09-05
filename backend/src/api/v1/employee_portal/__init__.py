from fastapi import APIRouter

from .dashboard.api import router as dashboard_router
from .profile.api import router as profile_router
from .leave.api import router as leave_router
from .time.api import router as time_router
from .tasks.api import router as tasks_router
from .devices.api import router as devices_router

router = APIRouter(prefix="/employee-portal", tags=["employee-portal"])
router.include_router(dashboard_router)
router.include_router(profile_router)
router.include_router(leave_router)
router.include_router(time_router)
router.include_router(tasks_router)
router.include_router(devices_router)
