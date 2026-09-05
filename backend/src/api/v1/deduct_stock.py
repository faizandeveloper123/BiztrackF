"""
Deduct Stock API Endpoint

This endpoint handles stock deduction requests from invoice payments.
It provides a REST API for the inventory synchronization service.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel, Field
import logging

from ...config.database import get_db
from ...api.dependencies import get_current_user, get_tenant_context
from ...config.database import User
from ...services.inventory_sync_service import InventorySyncService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/inventory", tags=["Inventory Sync"])

class InvoiceItem(BaseModel):
    """Model for invoice item data"""
    product_id: str = Field(..., description="Product ID")
    quantity: int = Field(..., gt=0, description="Quantity to deduct")
    unit_price: float = Field(..., ge=0, description="Unit price")

class DeductStockRequest(BaseModel):
    """Request model for stock deduction"""
    invoice_id: str = Field(..., description="Invoice ID")
    items: List[InvoiceItem] = Field(..., min_items=1, description="List of items to deduct")

class DeductStockResponse(BaseModel):
    """Response model for stock deduction"""
    success: bool
    message: str
    invoice_id: str
    total_items_deducted: int = 0
    items_processed: int = 0
    sync_results: List[Dict[str, Any]] = []
    errors: List[str] = []

@router.post("/deduct_stock", response_model=DeductStockResponse)
def deduct_stock(
    request: DeductStockRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """
    Deduct stock from inventory based on paid invoice items
    
    This endpoint processes stock deduction requests when an invoice is marked as paid.
    It validates the request, checks stock availability, and creates stock movement records.
    """
    try:
        if not tenant_context:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Tenant context required"
            )
        
        tenant_id = tenant_context["tenant_id"]
        user_id = str(current_user.id)
        
        logger.info(f"Processing stock deduction request for invoice {request.invoice_id}")
        
        # Initialize the inventory sync service
        sync_service = InventorySyncService(db)
        
        # Validate the request
        if not request.items or len(request.items) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one item is required"
            )
        
        # Validate each item
        for item in request.items:
            if not item.product_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Product ID is required for all items"
                )
            
            if item.quantity <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid quantity {item.quantity}. Must be greater than 0"
                )
            
            if item.unit_price < 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid unit price {item.unit_price}. Cannot be negative"
                )
        
        # Convert request items to the format expected by the sync service
        invoice_items = []
        for item in request.items:
            invoice_items.append({
                "productId": item.product_id,
                "quantity": item.quantity,
                "unitPrice": item.unit_price
            })
        
        # Create a temporary invoice object for the sync service
        # Note: In a real implementation, you might want to fetch the actual invoice
        # and use its items instead of the request items
        class TempInvoice:
            def __init__(self, invoice_id, items):
                self.id = invoice_id
                self.items = items
        
        temp_invoice = TempInvoice(request.invoice_id, invoice_items)
        
        # Perform the stock deduction
        result = sync_service.sync_invoice_with_inventory(
            invoice_id=request.invoice_id,
            tenant_id=tenant_id,
            user_id=user_id
        )
        
        # Prepare response
        if result["success"]:
            message = f"Successfully deducted {result['total_items_deducted']} items from inventory"
            logger.info(f"Stock deduction successful for invoice {request.invoice_id}")
        else:
            message = f"Stock deduction failed: {result.get('error', 'Unknown error')}"
            logger.error(f"Stock deduction failed for invoice {request.invoice_id}: {message}")
        
        response = DeductStockResponse(
            success=result["success"],
            message=message,
            invoice_id=request.invoice_id,
            total_items_deducted=result.get("total_items_deducted", 0),
            items_processed=result.get("items_processed", 0),
            sync_results=result.get("sync_results", []),
            errors=result.get("errors", [])
        )
        
        # Return appropriate HTTP status
        if result["success"]:
            return response
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=response.message
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in deduct_stock endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.post("/validate_invoice_items")
def validate_invoice_items(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """
    Validate that all items in an invoice can be deducted from inventory
    
    This endpoint checks stock availability before attempting to deduct stock.
    """
    try:
        if not tenant_context:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant context required"
            )
        
        tenant_id = tenant_context["tenant_id"]
        
        # Initialize the inventory sync service
        sync_service = InventorySyncService(db)
        
        # Validate the invoice items
        result = sync_service.validate_invoice_items(invoice_id, tenant_id)
        
        if result["valid"]:
            return {
                "valid": True,
                "message": "All invoice items can be deducted from inventory",
                "invoice_id": invoice_id,
                "validation_results": result["validation_results"]
            }
        else:
            return {
                "valid": False,
                "message": result.get("error", "Validation failed"),
                "invoice_id": invoice_id,
                "validation_results": result.get("validation_results", [])
            }
        
    except Exception as e:
        logger.error(f"Error validating invoice items: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Validation error: {str(e)}"
        )
