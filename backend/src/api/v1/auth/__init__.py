from fastapi import APIRouter

from .login.api import router as login_router
from .register.api import router as register_router
from .tenants.api import router as tenants_router
from .session.api import router as session_router
from .users.api import router as users_router
from .password_reset.api import router as password_reset_router

router = APIRouter(prefix="/auth", tags=["authentication"])
router.include_router(login_router)
router.include_router(register_router)
router.include_router(tenants_router)
router.include_router(session_router)
router.include_router(users_router)
router.include_router(password_reset_router)
