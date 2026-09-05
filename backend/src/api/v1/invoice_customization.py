from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from datetime import datetime
import uuid
from sqlalchemy.orm import Session

from ...config.database import get_db
from ...api.dependencies import get_current_user, get_tenant_context
from ...models.invoice_models import (
    InvoiceCustomizationCreate, InvoiceCustomizationUpdate, 
    InvoiceCustomizationResponse, InvoiceCustomization
)
from ...config.database import User
from ...config.invoice_customization_models import InvoiceCustomization as InvoiceCustomizationModel

router = APIRouter(prefix="/invoice-customization", tags=["Invoice Customization"])

@router.get("/", response_model=InvoiceCustomizationResponse)
def get_invoice_customization(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get invoice customization for the current tenant"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
            
        tenant_id = tenant_context["tenant_id"]
        
        # Get the active customization for this tenant
        customization = db.query(InvoiceCustomizationModel).filter(
            InvoiceCustomizationModel.tenant_id == tenant_id,
            InvoiceCustomizationModel.is_active == True
        ).first()
        
        if not customization:
            # Create default customization if none exists
            default_customization = InvoiceCustomizationModel(
                id=str(uuid.uuid4()),
                tenant_id=tenant_id,
                created_by=str(current_user.id),
                company_name=tenant_context.get("tenant_name", "Your Company"),
                company_address="",
                company_phone="",
                company_email="",
                company_website="",
                bank_sort_code="",
                bank_account_number="",
                payment_instructions="Make all payments to your company name",
                default_currency="USD",
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(default_customization)
            db.commit()
            db.refresh(default_customization)
            customization = default_customization
        
        from ...models.invoice_models import InvoiceCustomization as PydanticInvoiceCustomization
        pydantic_customization = PydanticInvoiceCustomization(
            id=str(customization.id),
            tenant_id=str(customization.tenant_id),
            company_name=customization.company_name,
            company_logo_url=customization.company_logo_url,
            company_address=customization.company_address,
            company_phone=customization.company_phone,
            company_email=customization.company_email,
            company_website=customization.company_website,
            bank_sort_code=customization.bank_sort_code,
            bank_account_number=customization.bank_account_number,
            payment_instructions=customization.payment_instructions,
            primary_color=customization.primary_color,
            secondary_color=customization.secondary_color,
            accent_color=customization.accent_color,
            show_vehicle_info=customization.show_vehicle_info,
            show_parts_section=customization.show_parts_section,
            show_labour_section=customization.show_labour_section,
            show_comments_section=customization.show_comments_section,
            footer_text=customization.footer_text,
            show_contact_info_in_footer=customization.show_contact_info_in_footer,
            footer_background_color=customization.footer_background_color,
            grid_color=customization.grid_color,
            thank_you_message=customization.thank_you_message,
            enquiry_message=customization.enquiry_message,
            contact_message=customization.contact_message,
            default_payment_instructions=customization.default_payment_instructions,
            default_currency=customization.default_currency,
            custom_fields=customization.custom_fields if hasattr(customization, 'custom_fields') else {},
            created_by=str(customization.created_by),
            is_active=customization.is_active,
            created_at=customization.created_at,
            updated_at=customization.updated_at
        )
        return InvoiceCustomizationResponse(customization=pydantic_customization)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get invoice customization: {str(e)}")

@router.post("/", response_model=InvoiceCustomizationResponse)
def create_invoice_customization(
    customization_data: InvoiceCustomizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create or update invoice customization for the current tenant"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
            
        tenant_id = tenant_context["tenant_id"]
        
        # Check if customization already exists
        existing_customization = db.query(InvoiceCustomizationModel).filter(
            InvoiceCustomizationModel.tenant_id == tenant_id,
            InvoiceCustomizationModel.is_active == True
        ).first()
        
        if existing_customization:
            # Update existing customization
            for field, value in customization_data.dict(exclude_unset=True).items():
                setattr(existing_customization, field, value)
            existing_customization.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_customization)
            customization = existing_customization
        else:
            # Create new customization
            customization = InvoiceCustomizationModel(
                id=str(uuid.uuid4()),
                tenant_id=tenant_id,
                created_by=str(current_user.id),
                **customization_data.dict(),
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(customization)
            db.commit()
            db.refresh(customization)
        
        from ...models.invoice_models import InvoiceCustomization as PydanticInvoiceCustomization
        pydantic_customization = PydanticInvoiceCustomization(
            id=str(customization.id),
            tenant_id=str(customization.tenant_id),
            company_name=customization.company_name,
            company_logo_url=customization.company_logo_url,
            company_address=customization.company_address,
            company_phone=customization.company_phone,
            company_email=customization.company_email,
            company_website=customization.company_website,
            bank_sort_code=customization.bank_sort_code,
            bank_account_number=customization.bank_account_number,
            payment_instructions=customization.payment_instructions,
            primary_color=customization.primary_color,
            secondary_color=customization.secondary_color,
            accent_color=customization.accent_color,
            show_vehicle_info=customization.show_vehicle_info,
            show_parts_section=customization.show_parts_section,
            show_labour_section=customization.show_labour_section,
            show_comments_section=customization.show_comments_section,
            footer_text=customization.footer_text,
            show_contact_info_in_footer=customization.show_contact_info_in_footer,
            footer_background_color=customization.footer_background_color,
            grid_color=customization.grid_color,
            thank_you_message=customization.thank_you_message,
            enquiry_message=customization.enquiry_message,
            contact_message=customization.contact_message,
            default_payment_instructions=customization.default_payment_instructions,
            default_currency=customization.default_currency,
            custom_fields=customization.custom_fields if hasattr(customization, 'custom_fields') else {},
            created_by=str(customization.created_by),
            is_active=customization.is_active,
            created_at=customization.created_at,
            updated_at=customization.updated_at
        )
        return InvoiceCustomizationResponse(customization=pydantic_customization)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create/update invoice customization: {str(e)}")

@router.put("/", response_model=InvoiceCustomizationResponse)
def update_invoice_customization(
    customization_data: InvoiceCustomizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update invoice customization for the current tenant"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
            
        tenant_id = tenant_context["tenant_id"]
        
        # Get the active customization
        customization = db.query(InvoiceCustomizationModel).filter(
            InvoiceCustomizationModel.tenant_id == tenant_id,
            InvoiceCustomizationModel.is_active == True
        ).first()
        
        if not customization:
            raise HTTPException(status_code=404, detail="Invoice customization not found")
        
        # Update fields
        for field, value in customization_data.dict(exclude_unset=True).items():
            setattr(customization, field, value)
        
        customization.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(customization)
        
        from ...models.invoice_models import InvoiceCustomization as PydanticInvoiceCustomization
        pydantic_customization = PydanticInvoiceCustomization(
            id=str(customization.id),
            tenant_id=str(customization.tenant_id),
            company_name=customization.company_name,
            company_logo_url=customization.company_logo_url,
            company_address=customization.company_address,
            company_phone=customization.company_phone,
            company_email=customization.company_email,
            company_website=customization.company_website,
            bank_sort_code=customization.bank_sort_code,
            bank_account_number=customization.bank_account_number,
            payment_instructions=customization.payment_instructions,
            primary_color=customization.primary_color,
            secondary_color=customization.secondary_color,
            accent_color=customization.accent_color,
            show_vehicle_info=customization.show_vehicle_info,
            show_parts_section=customization.show_parts_section,
            show_labour_section=customization.show_labour_section,
            show_comments_section=customization.show_comments_section,
            footer_text=customization.footer_text,
            show_contact_info_in_footer=customization.show_contact_info_in_footer,
            footer_background_color=customization.footer_background_color,
            grid_color=customization.grid_color,
            thank_you_message=customization.thank_you_message,
            enquiry_message=customization.enquiry_message,
            contact_message=customization.contact_message,
            default_payment_instructions=customization.default_payment_instructions,
            default_currency=customization.default_currency,
            custom_fields=customization.custom_fields if hasattr(customization, 'custom_fields') else {},
            created_by=str(customization.created_by),
            is_active=customization.is_active,
            created_at=customization.created_at,
            updated_at=customization.updated_at
        )
        return InvoiceCustomizationResponse(customization=pydantic_customization)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update invoice customization: {str(e)}")

@router.delete("/")
def delete_invoice_customization(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete invoice customization for the current tenant"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
            
        tenant_id = tenant_context["tenant_id"]
        
        # Get the active customization
        customization = db.query(InvoiceCustomizationModel).filter(
            InvoiceCustomizationModel.tenant_id == tenant_id,
            InvoiceCustomizationModel.is_active == True
        ).first()
        
        if not customization:
            raise HTTPException(status_code=404, detail="Invoice customization not found")
        
        # Soft delete by setting is_active to False
        customization.is_active = False
        customization.updated_at = datetime.utcnow()
        db.commit()
        
        return {"message": "Invoice customization deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete invoice customization: {str(e)}")
