from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from ....config.database import get_db
from ....api.dependencies import get_current_user, get_tenant_context
from ....models.user_models import User
from . import logic
from .schemas import (
    WhatsAppTemplatePreviewRequest,
    WhatsAppTemplatePreviewResponse,
    WhatsAppTemplateResponse,
    WhatsAppTemplateUpdate,
)

router = APIRouter(prefix="/whatsapp/templates", tags=["WhatsApp Templates"])


def _require_tenant(tenant_context: dict):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return str(tenant_context["tenant_id"])


@router.get("", response_model=List[WhatsAppTemplateResponse])
def get_whatsapp_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = _require_tenant(tenant_context)
    return logic.list_templates(db, tenant_id)


@router.get("/{template_type}", response_model=WhatsAppTemplateResponse)
def get_whatsapp_template(
    template_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = _require_tenant(tenant_context)
    return logic.get_template(db, tenant_id, template_type)


@router.put("/{template_type}", response_model=WhatsAppTemplateResponse)
def update_whatsapp_template(
    template_type: str,
    body: WhatsAppTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = _require_tenant(tenant_context)
    return logic.update_template(db, tenant_id, template_type, body)


@router.post("/{template_type}/reset", response_model=WhatsAppTemplateResponse)
def reset_whatsapp_template(
    template_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = _require_tenant(tenant_context)
    return logic.reset_template(db, tenant_id, template_type)


@router.delete("/{template_type}", status_code=status.HTTP_204_NO_CONTENT)
def delete_whatsapp_template(
    template_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = _require_tenant(tenant_context)
    logic.delete_template(db, tenant_id, template_type)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/preview", response_model=WhatsAppTemplatePreviewResponse)
def preview_whatsapp_template(
    body: WhatsAppTemplatePreviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = _require_tenant(tenant_context)
    return logic.preview_template(db, tenant_id, body)