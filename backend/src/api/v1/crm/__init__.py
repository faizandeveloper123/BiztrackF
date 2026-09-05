from fastapi import APIRouter

from .customers.api import router as customers_router
from .guarantors.api import router as guarantors_router
from .leads.api import router as leads_router
from .contacts.api import router as contacts_router
from .companies.api import router as companies_router
from .opportunities.api import router as opportunities_router
from .activities.api import router as activities_router
from .dashboard.api import router as dashboard_router

router = APIRouter(prefix="/crm", tags=["crm"])
router.include_router(customers_router)
router.include_router(guarantors_router)
router.include_router(leads_router)
router.include_router(contacts_router)
router.include_router(companies_router)
router.include_router(opportunities_router)
router.include_router(activities_router)
router.include_router(dashboard_router)
