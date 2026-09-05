from fastapi import APIRouter

from .donors.api import router as donors_router
from .donor_leads.api import router as donor_leads_router
from .partner_organizations.api import router as partners_router

router = APIRouter(prefix="/ngo", tags=["ngo"])
router.include_router(donors_router)
router.include_router(donor_leads_router)
router.include_router(partners_router)
