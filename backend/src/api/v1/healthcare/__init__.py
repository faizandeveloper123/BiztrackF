from fastapi import APIRouter

from .doctors.api import router as doctors_router
from .patients.api import router as patients_router
from .appointments.api import router as appointments_router
from .prescriptions.api import router as prescriptions_router
from .staff.api import router as staff_router
from .expense_categories.api import router as expense_categories_router
from .daily_expenses.api import router as daily_expenses_router
from .admissions.api import router as admissions_router

router = APIRouter(prefix="/healthcare", tags=["healthcare"])
router.include_router(doctors_router)
router.include_router(patients_router)
router.include_router(appointments_router)
router.include_router(prescriptions_router)
router.include_router(staff_router)
router.include_router(expense_categories_router)
router.include_router(daily_expenses_router)
router.include_router(admissions_router)
