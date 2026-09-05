import json
import logging
import time
from datetime import datetime
from typing import List

from sqlalchemy import and_, desc, func
from sqlalchemy.orm import Session

from ....models.invoices import Invoice
from ..crm.customers.logic import get_customer_by_id
from ..crm.db_common import resolve_phone_from_customer
from .items.schemas import Invoice as PydanticInvoice, InvoiceItem

logger = logging.getLogger(__name__)


def resolve_invoice_customer_phone(db, tenant_id: str, invoice_data, customer=None) -> str:
    explicit = getattr(invoice_data, "customerPhone", None)
    if explicit and str(explicit).strip():
        return str(explicit).strip()
    if customer is None and getattr(invoice_data, "customerId", None):
        try:
            customer = get_customer_by_id(db, str(invoice_data.customerId), tenant_id)
        except Exception:
            customer = None
    if customer:
        return resolve_phone_from_customer(customer) or ""
    return ""


def generate_invoice_number(tenant_id: str, db: Session) -> str:
    now = datetime.now()
    prefix = f"INV-{now.year:04d}{now.month:02d}{now.day:02d}"
    max_retries = 100
    for attempt in range(max_retries):
        highest_invoice = db.query(Invoice).filter(
            and_(
                Invoice.tenant_id == tenant_id,
                Invoice.invoiceNumber.like(f"{prefix}-%"),
            )
        ).order_by(desc(Invoice.invoiceNumber)).first()

        if highest_invoice and highest_invoice.invoiceNumber:
            try:
                new_number = int(highest_invoice.invoiceNumber.split("-")[-1]) + 1
            except (ValueError, IndexError):
                count = db.query(Invoice).filter(
                    and_(
                        Invoice.tenant_id == tenant_id,
                        Invoice.invoiceNumber.like(f"{prefix}-%"),
                    )
                ).count()
                new_number = count + 1
        else:
            new_number = 1

        candidate = f"{prefix}-{new_number:04d}"
        existing_invoice = db.query(Invoice).filter(
            and_(
                Invoice.tenant_id == tenant_id,
                Invoice.invoiceNumber == candidate,
            )
        ).first()

        if not existing_invoice:
            return candidate

        if attempt < max_retries - 1:
            continue
        timestamp = int(time.time() * 1000) % 10000
        return f"{prefix}-{timestamp:04d}"

    timestamp = int(time.time() * 1000) % 10000
    return f"{prefix}-{timestamp:04d}"


def generate_order_number(tenant_id: str, db: Session) -> str:
    now = datetime.now()
    prefix = f"ORD-{now.year:04d}{now.month:02d}{now.day:02d}"
    max_retries = 100
    for attempt in range(max_retries):
        highest_order = db.query(Invoice).filter(
            and_(
                Invoice.tenant_id == tenant_id,
                Invoice.orderNumber.like(f"{prefix}-%"),
            )
        ).order_by(desc(Invoice.orderNumber)).first()

        if highest_order and highest_order.orderNumber:
            try:
                new_number = int(highest_order.orderNumber.split("-")[-1]) + 1
            except (ValueError, IndexError):
                count = db.query(Invoice).filter(
                    and_(
                        Invoice.tenant_id == tenant_id,
                        Invoice.orderNumber.like(f"{prefix}-%"),
                    )
                ).count()
                new_number = count + 1
        else:
            new_number = 1

        candidate = f"{prefix}-{new_number:04d}"
        existing = db.query(Invoice).filter(
            and_(
                Invoice.tenant_id == tenant_id,
                Invoice.orderNumber == candidate,
            )
        ).first()
        if not existing:
            return candidate

        if attempt < max_retries - 1:
            continue
        timestamp = int(time.time() * 1000) % 10000
        return f"{prefix}-{timestamp:04d}"

    timestamp = int(time.time() * 1000) % 10000
    return f"{prefix}-{timestamp:04d}"


def calculate_invoice_totals(
    items: List,
    labour_cost: float = 0.0,
    vat_rate: float = 0.0,
) -> dict:
    subtotal = 0
    discount_amount = 0
    for item in items:
        if isinstance(item, dict):
            quantity = item.get("quantity", 0)
            unit_price = item.get("salePrice") or item.get("unitPrice", 0)
            discount = item.get("discount", 0) or 0
        else:
            quantity = item.quantity
            unit_price = item.salePrice
            discount = item.discount or 0
        gross = quantity * unit_price
        subtotal += gross
        discount_amount += gross * (discount / 100)

    labour = labour_cost or 0
    taxable_base = (subtotal - discount_amount) + labour
    vat_amount = taxable_base * (vat_rate or 0)

    total = taxable_base + vat_amount

    return {
        "subtotal": round(subtotal, 2),
        "discountAmount": round(discount_amount, 2),
        "taxAmount": round(vat_amount, 2),
        "vatRate": round(vat_rate, 4),
        "total": round(total, 2),
    }


def transform_invoice_to_pydantic(db_invoice: Invoice):
    invoice_items = []
    if db_invoice.items:
        if isinstance(db_invoice.items, str):
            items_data = json.loads(db_invoice.items)
        else:
            items_data = db_invoice.items

        for item in items_data:
            if isinstance(item, dict):
                invoice_items.append(
                    InvoiceItem(
                        id=str(item.get("id", "")),
                        description=item.get("description", ""),
                        quantity=item.get("quantity", 0),
                        salePrice=item.get("salePrice") or item.get("unitPrice", 0),
                        discount=item.get("discount", 0),
                        taxRate=item.get("taxRate", 0),
                        taxAmount=item.get("taxAmount", 0),
                        total=item.get("total", 0),
                        unit=item.get("unit"),
                        productId=str(item.get("productId")) if item.get("productId") else None,
                        projectId=str(item.get("projectId")) if item.get("projectId") else None,
                        taskId=str(item.get("taskId")) if item.get("taskId") else None,
                    )
                )

    payments = []
    if db_invoice.payments:
        if isinstance(db_invoice.payments, str):
            payments = json.loads(db_invoice.payments)
        else:
            payments = db_invoice.payments

    return PydanticInvoice(
        id=str(db_invoice.id),
        tenant_id=str(db_invoice.tenant_id),
        invoiceNumber=db_invoice.invoiceNumber,
        customerId=str(db_invoice.customerId) if db_invoice.customerId else "",
        customerName=db_invoice.customerName,
        customerEmail=db_invoice.customerEmail or "",
        customerPhone=db_invoice.customerPhone,
        billingAddress=db_invoice.billingAddress,
        shippingAddress=db_invoice.shippingAddress,
        issueDate=db_invoice.issueDate,
        dueDate=db_invoice.dueDate,
        orderNumber=db_invoice.orderNumber,
        orderTime=db_invoice.orderTime,
        subtotal=db_invoice.subtotal,
        taxAmount=db_invoice.taxAmount,
        vatRate=getattr(db_invoice, "vatRate", 0) or 0,
        labourCost=getattr(db_invoice, "labourCost", 0) or 0,
        total=db_invoice.total,
        terms=db_invoice.terms,
        status=db_invoice.status,
        items=invoice_items,
        createdBy=str(db_invoice.createdBy),
        opportunityId=str(db_invoice.opportunityId) if db_invoice.opportunityId else None,
        quoteId=str(db_invoice.quoteId) if db_invoice.quoteId else None,
        projectId=str(db_invoice.projectId) if db_invoice.projectId else None,
        sentAt=getattr(db_invoice, "sentAt", None),
        viewedAt=getattr(db_invoice, "viewedAt", None),
        paidAt=getattr(db_invoice, "paidAt", None),
        overdueAt=getattr(db_invoice, "overdueAt", None),
        createdAt=db_invoice.createdAt,
        updatedAt=db_invoice.updatedAt,
        payments=payments,
        totalPaid=db_invoice.totalPaid if hasattr(db_invoice, "totalPaid") else 0.0,
        balance=db_invoice.balance if hasattr(db_invoice, "balance") else 0.0,
        daysOverdue=db_invoice.daysOverdue if hasattr(db_invoice, "daysOverdue") else 0,
        vehicleReg=db_invoice.vehicleReg,
        jobCardId=str(db_invoice.jobCardId) if getattr(db_invoice, "jobCardId", None) else None,
    )
