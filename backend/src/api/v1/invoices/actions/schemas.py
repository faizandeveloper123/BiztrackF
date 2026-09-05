from pydantic import BaseModel
from typing import Optional


class SendInvoiceRequest(BaseModel):
    to_email: Optional[str] = None
    message: Optional[str] = None
