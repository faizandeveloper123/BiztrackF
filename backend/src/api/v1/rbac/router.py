from fastapi import APIRouter

from .roles.api import router as roles_router
from .tenant_users.api import router as tenant_users_router
from .permissions.api import router as permissions_router

router = APIRouter(prefix="/rbac", tags=["rbac"])
router.include_router(roles_router)
router.include_router(tenant_users_router)
router.include_router(permissions_router)
