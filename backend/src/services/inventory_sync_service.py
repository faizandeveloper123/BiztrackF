"""
Inventory Synchronization Service

Keeps product stock in sync with sales and purchase documents.

Rules:
- Adding a product to an invoice deducts from Product.stockQuantity at
  invoice creation time.
- Creating a purchase order for a product increases Product.stockQuantity
  at purchase order creation time.
- Every adjustment is recorded as a StockMovement row keyed by the source
  document id (referenceNumber) so it can be reversed / reconciled
  idempotently (restore on delete, reconcile on update, skip on payment
  for documents that were already deducted at creation).
"""

import logging
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional

from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..models.invoices import Invoice
from ..config.inventory_models import Product, StockMovement, Warehouse, PurchaseOrder
from ..config.inventory_crud import get_product_by_id

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

INVOICE_REFERENCE_TYPE = "Invoice"
PURCHASE_ORDER_REFERENCE_TYPE = "PurchaseOrder"


class InventorySyncService:
    """Service for synchronizing invoice / purchase order stock adjustments."""

    def __init__(self, db: Session):
        self.db = db

    # ------------------------------------------------------------------ #
    # helpers
    # ------------------------------------------------------------------ #
    def _resolve_warehouse_id(self, tenant_id: str) -> Optional[str]:
        """Return the first (active) warehouse for a tenant, if any."""
        warehouse = (
            self.db.query(Warehouse)
            .filter(Warehouse.tenant_id == tenant_id, Warehouse.isActive == True)
            .order_by(Warehouse.createdAt.asc())
            .first()
        )
        if not warehouse:
            warehouse = (
                self.db.query(Warehouse)
                .filter(Warehouse.tenant_id == tenant_id)
                .order_by(Warehouse.createdAt.asc())
                .first()
            )
        return str(warehouse.id) if warehouse else None

    def _invoice_movements(self, invoice_id: str, tenant_id: str) -> List[StockMovement]:
        return (
            self.db.query(StockMovement)
            .filter(
                StockMovement.tenant_id == tenant_id,
                StockMovement.referenceNumber == invoice_id,
                StockMovement.referenceType == INVOICE_REFERENCE_TYPE,
            )
            .all()
        )

    def _purchase_order_movements(self, po_id: str, tenant_id: str) -> List[StockMovement]:
        return (
            self.db.query(StockMovement)
            .filter(
                StockMovement.tenant_id == tenant_id,
                StockMovement.referenceNumber == po_id,
                StockMovement.referenceType == PURCHASE_ORDER_REFERENCE_TYPE,
            )
            .all()
        )

    def _create_movement(
        self,
        *,
        tenant_id: str,
        product_id: str,
        warehouse_id: str,
        movement_type: str,
        quantity: int,
        unit_cost: float,
        reference_number: str,
        reference_type: str,
        notes: str,
        user_id: str,
    ) -> StockMovement:
        movement = StockMovement(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            productId=product_id,
            warehouseId=warehouse_id,
            movementType=movement_type,
            quantity=quantity,
            unitCost=unit_cost,
            referenceNumber=reference_number,
            referenceType=reference_type,
            notes=notes,
            status="completed",
            createdBy=user_id,
            createdAt=datetime.utcnow(),
            updatedAt=datetime.utcnow(),
        )
        self.db.add(movement)
        return movement

    @staticmethod
    def _product_items(items: Optional[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        return [item for item in (items or []) if item.get("productId") and item.get("quantity", 0) > 0]

    # ------------------------------------------------------------------ #
    # Invoice: deduct / restore / reconcile
    # ------------------------------------------------------------------ #
    def deduct_invoice_stock(
        self,
        invoice_id: str,
        tenant_id: str,
        user_id: str,
        items: Optional[List[Dict[str, Any]]] = None,
        skip_deducted: bool = True,
    ) -> Dict[str, Any]:
        """
        Deduct stock for the items of an invoice.

        When ``items`` is omitted the invoice is loaded from the database and
        its own items are used. When ``skip_deducted`` is True, products that
        already have a stock movement for this invoice are left untouched so
        the operation is idempotent (e.g. marking an invoice paid after its
        stock was already deducted at creation).
        """
        if items is None:
            invoice = self.db.query(Invoice).filter(
                and_(Invoice.id == invoice_id, Invoice.tenant_id == tenant_id)
            ).first()
            if not invoice:
                return {
                    "success": False,
                    "invoice_id": invoice_id,
                    "total_items_deducted": 0,
                    "items_processed": 0,
                    "sync_results": [],
                    "errors": [f"Invoice {invoice_id} not found"],
                }
            items = invoice.items or []

        item_rows = self._product_items(items)

        existing = self._invoice_movements(invoice_id, tenant_id)
        deducted_by_product = {}
        for movement in existing:
            product_key = str(movement.productId)
            deducted_by_product[product_key] = deducted_by_product.get(product_key, 0) + movement.quantity

        warehouse_id = self._resolve_warehouse_id(tenant_id)
        results = []
        errors = []
        total_deducted = 0

        for item in item_rows:
            product_id = item.get("productId")
            quantity = int(item.get("quantity", 0))

            if skip_deducted and deducted_by_product.get(product_id, 0) >= quantity:
                continue

            product = get_product_by_id(product_id, self.db, tenant_id)
            if not product:
                errors.append(f"Product {product_id} not found")
                continue

            if product.stockQuantity < quantity:
                errors.append(
                    f"Insufficient stock for product {product.name}. "
                    f"Available: {product.stockQuantity}, Required: {quantity}"
                )
                continue

            old_stock = product.stockQuantity
            product.stockQuantity -= quantity
            product.updatedAt = datetime.utcnow()

            if warehouse_id:
                self._create_movement(
                    tenant_id=tenant_id,
                    product_id=product_id,
                    warehouse_id=warehouse_id,
                    movement_type="outbound",
                    quantity=quantity,
                    unit_cost=product.costPerUnitPrice,
                    reference_number=invoice_id,
                    reference_type=INVOICE_REFERENCE_TYPE,
                    notes=f"Stock deduction for invoice {invoice_id}",
                    user_id=user_id,
                )

            results.append({
                "success": True,
                "product_id": product_id,
                "product_name": product.name,
                "quantity_deducted": quantity,
                "old_stock": old_stock,
                "new_stock": product.stockQuantity,
            })
            total_deducted += quantity

        return {
            "success": len(errors) == 0,
            "invoice_id": invoice_id,
            "total_items_deducted": total_deducted,
            "items_processed": len(item_rows),
            "sync_results": results,
            "errors": errors,
        }

    def restore_invoice_stock(self, invoice_id: str, tenant_id: str) -> Dict[str, Any]:
        """
        Restore stock for an invoice that has been deleted (or is being
        edited). Only quantities that were actually deducted (have a stock
        movement) are restored.
        """
        movements = self._invoice_movements(invoice_id, tenant_id)
        restored = 0
        for movement in movements:
            product = get_product_by_id(str(movement.productId), self.db, tenant_id)
            if product:
                product.stockQuantity += movement.quantity
                product.updatedAt = datetime.utcnow()
            self.db.delete(movement)
            restored += 1
        return {"restored": restored}

    def reconcile_invoice_stock(
        self,
        invoice_id: str,
        tenant_id: str,
        user_id: str,
        new_items: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Restore previous deductions, then apply deductions for the new items."""
        self.restore_invoice_stock(invoice_id, tenant_id)
        return self.deduct_invoice_stock(
            invoice_id,
            tenant_id,
            user_id,
            items=new_items,
            skip_deducted=False,
        )

    # ------------------------------------------------------------------ #
    # Purchase orders: increase / reverse / reconcile
    # ------------------------------------------------------------------ #
    def increase_purchase_order_stock(
        self,
        po_id: str,
        tenant_id: str,
        user_id: str,
        items: List[Dict[str, Any]],
        warehouse_id: Optional[str] = None,
        skip_existing: bool = True,
    ) -> Dict[str, Any]:
        """
        Increase stock for the items of a purchase order.

        Products that already have a stock movement for this purchase order
        are left untouched when ``skip_existing`` is True (idempotency).
        """
        item_rows = self._product_items(items)

        existing = self._purchase_order_movements(po_id, tenant_id)
        added_by_product = {}
        for movement in existing:
            product_key = str(movement.productId)
            added_by_product[product_key] = added_by_product.get(product_key, 0) + movement.quantity

        if not warehouse_id:
            po = self.db.query(PurchaseOrder).filter(
                and_(PurchaseOrder.id == po_id, PurchaseOrder.tenant_id == tenant_id)
            ).first()
            if po:
                warehouse_id = str(po.warehouseId)
        if not warehouse_id:
            warehouse_id = self._resolve_warehouse_id(tenant_id)

        results = []
        errors = []
        total_added = 0

        for item in item_rows:
            product_id = item.get("productId")
            quantity = int(item.get("quantity", 0))

            if skip_existing and added_by_product.get(product_id, 0) >= quantity:
                continue

            product = get_product_by_id(product_id, self.db, tenant_id)
            if not product:
                errors.append(f"Product {product_id} not found")
                continue

            old_stock = product.stockQuantity
            product.stockQuantity += quantity
            product.updatedAt = datetime.utcnow()

            if warehouse_id:
                self._create_movement(
                    tenant_id=tenant_id,
                    product_id=product_id,
                    warehouse_id=warehouse_id,
                    movement_type="inbound",
                    quantity=quantity,
                    unit_cost=product.costPerUnitPrice,
                    reference_number=po_id,
                    reference_type=PURCHASE_ORDER_REFERENCE_TYPE,
                    notes=f"Stock increase for purchase order {po_id}",
                    user_id=user_id,
                )

            results.append({
                "success": True,
                "product_id": product_id,
                "product_name": product.name,
                "quantity_added": quantity,
                "old_stock": old_stock,
                "new_stock": product.stockQuantity,
            })
            total_added += quantity

        return {
            "success": len(errors) == 0,
            "po_id": po_id,
            "total_items_added": total_added,
            "items_processed": len(item_rows),
            "sync_results": results,
            "errors": errors,
        }

    def reverse_purchase_order_stock(self, po_id: str, tenant_id: str) -> Dict[str, Any]:
        """
        Reverse stock increases for a purchase order that has been deleted
        (or is being edited). Only quantities that were actually added (have a
        stock movement) are reversed.
        """
        movements = self._purchase_order_movements(po_id, tenant_id)
        reversed_count = 0
        for movement in movements:
            product = get_product_by_id(str(movement.productId), self.db, tenant_id)
            if product:
                product.stockQuantity = max(0, product.stockQuantity - movement.quantity)
                product.updatedAt = datetime.utcnow()
            self.db.delete(movement)
            reversed_count += 1
        return {"reversed": reversed_count}

    def reconcile_purchase_order_stock(
        self,
        po_id: str,
        tenant_id: str,
        user_id: str,
        new_items: List[Dict[str, Any]],
        warehouse_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Reverse previous increases, then apply increases for the new items."""
        self.reverse_purchase_order_stock(po_id, tenant_id)
        return self.increase_purchase_order_stock(
            po_id,
            tenant_id,
            user_id,
            new_items,
            warehouse_id=warehouse_id,
            skip_existing=False,
        )

    # ------------------------------------------------------------------ #
    # Legacy / backwards compatible entry points
    # ------------------------------------------------------------------ #
    def sync_invoice_with_inventory(
        self, invoice_id: str, tenant_id: str, user_id: str
    ) -> Dict[str, Any]:
        """
        Synchronize an invoice with inventory.

        Kept for backwards compatibility with the payment flow. Because stock
        is now deducted at invoice creation, this is idempotent: items that
        already have a stock movement for the invoice are skipped.
        """
        try:
            return self.deduct_invoice_stock(
                invoice_id,
                tenant_id,
                user_id,
                skip_deducted=True,
            )
        except Exception as e:
            self.db.rollback()
            logger.error("Failed to sync invoice %s with inventory: %s", invoice_id, str(e))
            return {
                "success": False,
                "invoice_id": invoice_id,
                "total_items_deducted": 0,
                "items_processed": 0,
                "sync_results": [],
                "errors": [f"Failed to sync invoice {invoice_id} with inventory: {str(e)}"],
            }

    def validate_invoice_items(self, invoice_id: str, tenant_id: str) -> Dict[str, Any]:
        """Validate that all invoice items can be deducted from inventory."""
        try:
            invoice = self.db.query(Invoice).filter(
                and_(Invoice.id == invoice_id, Invoice.tenant_id == tenant_id)
            ).first()

            if not invoice:
                return {"valid": False, "error": f"Invoice {invoice_id} not found"}

            if not invoice.items or len(invoice.items) == 0:
                return {"valid": False, "error": "Invoice has no items"}

            validation_results = []
            all_valid = True

            for item in invoice.items:
                product_id = item.get("productId")
                quantity = item.get("quantity", 0)

                if not product_id:
                    validation_results.append({
                        "product_id": "unknown",
                        "valid": False,
                        "error": "Product ID is required",
                    })
                    all_valid = False
                    continue

                if quantity <= 0:
                    validation_results.append({
                        "product_id": product_id,
                        "valid": False,
                        "error": f"Invalid quantity: {quantity}",
                    })
                    all_valid = False
                    continue

                product = get_product_by_id(product_id, self.db, tenant_id)
                if not product:
                    validation_results.append({
                        "product_id": product_id,
                        "valid": False,
                        "error": "Product not found",
                    })
                    all_valid = False
                    continue

                if not product.isActive:
                    validation_results.append({
                        "product_id": product_id,
                        "product_name": product.name,
                        "valid": False,
                        "error": "Product is not active",
                    })
                    all_valid = False
                    continue

                if product.stockQuantity < quantity:
                    validation_results.append({
                        "product_id": product_id,
                        "product_name": product.name,
                        "valid": False,
                        "error": (
                            f"Insufficient stock. Available: {product.stockQuantity}, "
                            f"Required: {quantity}"
                        ),
                    })
                    all_valid = False
                    continue

                validation_results.append({
                    "product_id": product_id,
                    "product_name": product.name,
                    "valid": True,
                    "available_stock": product.stockQuantity,
                    "required_quantity": quantity,
                })

            return {
                "valid": all_valid,
                "invoice_id": invoice_id,
                "validation_results": validation_results,
            }

        except Exception as e:
            return {"valid": False, "error": f"Validation failed: {str(e)}"}
