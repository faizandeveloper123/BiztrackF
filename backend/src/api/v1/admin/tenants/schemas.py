from pydantic import BaseModel


class TenantStatusUpdate(BaseModel):
    is_active: bool


class TenantStripeToggle(BaseModel):
    stripe_required: bool


class TenantDeleteRequest(BaseModel):
    deleteAllData: bool = False
