from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from typing import Optional

from ...config.database import get_db
from ...api.dependencies import get_current_user, get_tenant_context
from ...models.user_models import User

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])


class WhatsAppSendRequest(BaseModel):
    phone_number: str
    message: str


@router.get("/config")
def whatsapp_config(
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    from ...services.whatsapp_service import whatsapp_service

    return {
        "configured": whatsapp_service.configured,
        "provider": "BotLinkd",
        "note": "Set BOTLINKD_APP_KEY and BOTLINKD_AUTH_KEY in environment variables",
    }


@router.post("/send")
def whatsapp_send(
    body: WhatsAppSendRequest,
    db=Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    from ...services.whatsapp_service import whatsapp_service

    if not body.phone_number.strip():
        raise HTTPException(status_code=400, detail="Phone number is required")
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message is required")

    success, provider_status, error = whatsapp_service.send_message(body.phone_number, body.message)
    if not success:
        raise HTTPException(status_code=502, detail=error or "WhatsApp send failed")
    return {
        "message": "WhatsApp message sent successfully",
        "to": body.phone_number,
        "provider_status": provider_status,
    }