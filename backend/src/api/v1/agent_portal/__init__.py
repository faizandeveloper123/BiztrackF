from fastapi import APIRouter

from .api import router as portal_router

router = APIRouter(prefix="/agent-portal", tags=["agent-portal"])
router.include_router(portal_router)
