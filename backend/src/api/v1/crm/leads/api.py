from fastapi import APIRouter, Depends, Query, Request, Form
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Optional, List

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from .....models.common import ModulePermission
from .schemas import (
    Lead,
    LeadCreate,
    LeadUpdate,
    CRMLeadsResponse,
    BulkLeadAction,
    PipelineUpdate,
    LeadNoteCreate,
    LeadNoteUpdate,
    LeadTaskCreate,
    LeadTaskUpdate,
    LeadEmailCompose,
    LeadSmsSend,
    LeadCampaignCreate,
    LeadCampaignAssign,
    LeadListingSearchCreate,
    LeadPropertyViewCreate,
    LeadSaleCreate,
    LeadAdditionalContactCreate,
    LeadSavedFilterCreate,
)
from ..contacts.schemas import ContactCreate
from . import logic
from . import ops as related_ops

router = APIRouter()


@router.get("/leads", response_model=CRMLeadsResponse)
async def get_crm_leads(
    status: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    pipeline: Optional[str] = Query(None),
    rating: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    lead_type: Optional[str] = Query(None),
    is_partial: Optional[bool] = Query(None),
    sort: Optional[str] = Query("newest"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_crm_leads(
        db, current_user, tenant_context, status, source, assigned_to, search,
        page, limit, pipeline, rating, priority, is_partial, lead_type, sort,
    )


@router.post("/leads", response_model=Lead)
async def create_crm_lead(
    lead_data: LeadCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value)),
):
    return logic.create_crm_lead(lead_data, current_user, db, tenant_context)


@router.post("/leads/bulk")
async def bulk_leads(
    data: BulkLeadAction,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value)),
):
    return logic.bulk_lead_action(data, current_user, db, tenant_context)


@router.get("/leads/integrations/status")
async def integrations_status(
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return related_ops.integration_status()


@router.get("/leads/saved-filters")
async def get_saved_filters(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return related_ops.ensure_default_pinned_filters(db, tenant_context, current_user)


@router.post("/leads/saved-filters")
async def create_saved_filter(
    data: LeadSavedFilterCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value)),
):
    return related_ops.create_saved_filter(data, current_user, db, tenant_context)


@router.delete("/leads/saved-filters/{filter_id}")
async def delete_saved_filter(
    filter_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_DELETE.value)),
):
    return related_ops.delete_saved_filter(filter_id, current_user, db, tenant_context)


@router.get("/leads/campaigns")
async def get_campaigns(
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return related_ops.list_campaigns(db, tenant_context)


@router.post("/leads/campaigns")
async def create_campaign(
    data: LeadCampaignCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value)),
):
    return related_ops.create_campaign(data, current_user, db, tenant_context)


@router.post("/leads/jobs/run-alerts")
async def run_alert_jobs(
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value)),
):
    listings = related_ops.process_due_listing_alerts(db)
    campaigns = related_ops.process_due_campaigns(db)
    return {"listings": listings, "campaigns": campaigns}


@router.get("/leads/email-track/{token}.gif")
async def email_track_pixel(token: str, db: Session = Depends(get_db)):
    related_ops.track_email_open(token.replace(".gif", ""), db)
    gif = (
        b"GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04"
        b"\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
    )
    return Response(content=gif, media_type="image/gif")


@router.post("/leads/twilio/sms")
async def twilio_sms_webhook(
    From: str = Form(None),
    Body: str = Form(None),
    MessageSid: str = Form(None),
    db: Session = Depends(get_db),
):
    return related_ops.inbound_sms_webhook(From or "", Body or "", MessageSid, db)


@router.post("/leads/twilio/voice")
async def twilio_voice_webhook():
    twiml = '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Connecting your call through Biztrack.</Say><Pause length="2"/></Response>'
    return Response(content=twiml, media_type="application/xml")


@router.get("/leads/{lead_id}")
async def get_crm_lead(
    lead_id: str,
    detail: bool = Query(False),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    if detail:
        return logic.get_crm_lead_detail(lead_id, db, current_user, tenant_context)
    return logic.get_crm_lead(lead_id, db, current_user, tenant_context)


@router.get("/leads/{lead_id}/detail")
async def get_crm_lead_detail(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_crm_lead_detail(lead_id, db, current_user, tenant_context)


@router.put("/leads/{lead_id}", response_model=Lead)
async def update_crm_lead(
    lead_id: str,
    lead_data: LeadUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value)),
):
    return logic.update_crm_lead(lead_id, lead_data, current_user, db, tenant_context)


@router.delete("/leads/{lead_id}")
async def delete_crm_lead(
    lead_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_DELETE.value)),
):
    return logic.delete_crm_lead(lead_id, current_user, db, tenant_context)


@router.post("/leads/{lead_id}/convert")
async def convert_lead_to_contact(
    lead_id: str,
    contact_data: ContactCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value)),
):
    return logic.convert_lead_to_contact(lead_id, contact_data, current_user, db, tenant_context)


@router.post("/leads/{lead_id}/pipeline")
async def update_pipeline(
    lead_id: str,
    data: PipelineUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value)),
):
    lead = related_ops.get_lead_or_404(lead_id, db, current_user, tenant_context)
    return related_ops.set_pipeline(lead, data.pipelineStage, current_user, db, tenant_context)


@router.get("/leads/{lead_id}/timeline")
async def get_timeline(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return related_ops.list_pipeline_history(lead_id, db, current_user, tenant_context)


@router.get("/leads/{lead_id}/notes")
async def get_notes(
    lead_id: str,
    hide_system: bool = Query(False),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return related_ops.list_notes(lead_id, db, current_user, tenant_context, hide_system)


@router.post("/leads/{lead_id}/notes")
async def create_note(
    lead_id: str,
    data: LeadNoteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value)),
):
    return related_ops.create_note(lead_id, data, current_user, db, tenant_context)


@router.put("/leads/{lead_id}/notes/{note_id}")
async def update_note(
    lead_id: str,
    note_id: str,
    data: LeadNoteUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value)),
):
    return related_ops.update_note(lead_id, note_id, data, current_user, db, tenant_context)


@router.delete("/leads/{lead_id}/notes/{note_id}")
async def delete_note(
    lead_id: str,
    note_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_DELETE.value)),
):
    return related_ops.delete_note(lead_id, note_id, current_user, db, tenant_context)


@router.get("/leads/{lead_id}/tasks")
async def get_tasks(
    lead_id: str,
    include_completed: bool = Query(False),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return related_ops.list_tasks(lead_id, db, current_user, tenant_context, include_completed)


@router.post("/leads/{lead_id}/tasks")
async def create_task(
    lead_id: str,
    data: LeadTaskCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value)),
):
    return related_ops.create_task(lead_id, data, current_user, db, tenant_context)


@router.put("/leads/{lead_id}/tasks/{task_id}")
async def update_task(
    lead_id: str,
    task_id: str,
    data: LeadTaskUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value)),
):
    return related_ops.update_task(lead_id, task_id, data, current_user, db, tenant_context)


@router.post("/leads/{lead_id}/tasks/{task_id}/complete")
async def complete_task(
    lead_id: str,
    task_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value)),
):
    return related_ops.complete_task(lead_id, task_id, current_user, db, tenant_context)


@router.post("/leads/{lead_id}/tasks/{task_id}/push")
async def push_task(
    lead_id: str,
    task_id: str,
    hours: int = Query(24),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value)),
):
    return related_ops.push_task(lead_id, task_id, current_user, db, tenant_context, hours)


@router.delete("/leads/{lead_id}/tasks/{task_id}")
async def delete_task(
    lead_id: str,
    task_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_DELETE.value)),
):
    return related_ops.delete_task(lead_id, task_id, current_user, db, tenant_context)


@router.get("/leads/{lead_id}/emails")
async def get_emails(
    lead_id: str,
    direction: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return related_ops.list_emails(lead_id, db, current_user, tenant_context, direction)


@router.post("/leads/{lead_id}/emails")
async def compose_email(
    lead_id: str,
    data: LeadEmailCompose,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value)),
):
    base = str(request.base_url).rstrip("/")
    return related_ops.compose_email(lead_id, data, current_user, db, tenant_context, base)


@router.get("/leads/{lead_id}/sms")
async def get_sms(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return related_ops.list_sms(lead_id, db, current_user, tenant_context)


@router.post("/leads/{lead_id}/sms")
async def send_sms(
    lead_id: str,
    data: LeadSmsSend,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value)),
):
    return related_ops.send_sms(lead_id, data, current_user, db, tenant_context)


@router.get("/leads/{lead_id}/campaign-assignments")
async def get_campaign_assignments(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return related_ops.list_campaign_assignments(lead_id, db, current_user, tenant_context)


@router.post("/leads/{lead_id}/campaign-assignments")
async def assign_campaign(
    lead_id: str,
    data: LeadCampaignAssign,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value)),
):
    return related_ops.assign_campaign(lead_id, data, current_user, db, tenant_context)


@router.post("/leads/{lead_id}/campaign-assignments/{assignment_id}/{action}")
async def campaign_assignment_action(
    lead_id: str,
    assignment_id: str,
    action: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value)),
):
    return related_ops.campaign_action(lead_id, assignment_id, action, current_user, db, tenant_context)


@router.get("/leads/{lead_id}/listing-searches")
async def get_listing_searches(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return related_ops.list_listing_searches(lead_id, db, current_user, tenant_context)


@router.post("/leads/{lead_id}/listing-searches")
async def create_listing_search(
    lead_id: str,
    data: LeadListingSearchCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value)),
):
    return related_ops.create_listing_search(lead_id, data, current_user, db, tenant_context)


@router.delete("/leads/{lead_id}/listing-searches/{search_id}")
async def delete_listing_search(
    lead_id: str,
    search_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_DELETE.value)),
):
    return related_ops.delete_listing_search(lead_id, search_id, current_user, db, tenant_context)


@router.post("/leads/{lead_id}/listing-searches/{search_id}/run")
async def run_listing_search(
    lead_id: str,
    search_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value)),
):
    return related_ops.run_listing_alert(lead_id, search_id, current_user, db, tenant_context)


@router.get("/leads/{lead_id}/property-views")
async def get_property_views(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return related_ops.list_property_views(lead_id, db, current_user, tenant_context)


@router.post("/leads/{lead_id}/property-views")
async def create_property_view(
    lead_id: str,
    data: LeadPropertyViewCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value)),
):
    return related_ops.create_property_view(lead_id, data, current_user, db, tenant_context)


@router.get("/leads/{lead_id}/sales")
async def get_sales(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return related_ops.list_sales(lead_id, db, current_user, tenant_context)


@router.post("/leads/{lead_id}/sales")
async def create_sale(
    lead_id: str,
    data: LeadSaleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value)),
):
    return related_ops.create_sale(lead_id, data, current_user, db, tenant_context)


@router.get("/leads/{lead_id}/additional-contacts")
async def get_additional_contacts(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return related_ops.list_additional_contacts(lead_id, db, current_user, tenant_context)


@router.post("/leads/{lead_id}/additional-contacts")
async def create_additional_contact(
    lead_id: str,
    data: LeadAdditionalContactCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value)),
):
    return related_ops.create_additional_contact(lead_id, data, current_user, db, tenant_context)
