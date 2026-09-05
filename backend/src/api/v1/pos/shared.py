import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from ....models.pos.enums import POSPaymentMethod, POSTransactionStatus
from ....models.pos import POSTransaction as POSTransactionORM, POSShift as POSShiftORM


def generate_transaction_number() -> str:
    return f"TXN-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"


def generate_shift_number() -> str:
    return f"SHIFT-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"


def convert_db_shift_to_pydantic(db_shift: POSShiftORM):
    from .shifts.schemas import POSShift

    return POSShift(
        id=str(db_shift.id),
        tenant_id=str(db_shift.tenant_id),
        shiftNumber=db_shift.shiftNumber,
        cashierId=str(db_shift.employeeId),
        cashierName=getattr(db_shift, "cashierName", "System User"),
        openingBalance=getattr(db_shift, "openingAmount", 0.0),
        closingBalance=getattr(db_shift, "closingAmount", None),
        totalSales=db_shift.totalSales or 0.0,
        totalTransactions=db_shift.totalTransactions or 0,
        status=db_shift.status,
        openedAt=db_shift.startTime,
        closedAt=getattr(db_shift, "endTime", None),
        notes=db_shift.notes,
        createdAt=db_shift.createdAt,
        updatedAt=db_shift.updatedAt,
    )


def convert_db_transaction_to_pydantic(db_txn: POSTransactionORM):
    from .transactions.schemas import POSTransaction

    try:
        payment_method = POSPaymentMethod(db_txn.paymentMethod)
    except ValueError:
        payment_method = POSPaymentMethod.CASH

    try:
        status = POSTransactionStatus(db_txn.paymentStatus)
    except ValueError:
        status = POSTransactionStatus.COMPLETED

    return POSTransaction(
        id=str(db_txn.id),
        tenant_id=str(db_txn.tenant_id),
        transactionNumber=db_txn.transactionNumber,
        shiftId=str(db_txn.shiftId),
        cashierId=str(getattr(db_txn, "cashierId", "")),
        cashierName=str(getattr(db_txn, "cashierName", "")),
        customerId=db_txn.customerId,
        customerName=db_txn.customerName,
        items=db_txn.items,
        subtotal=db_txn.subtotal,
        discount=db_txn.discount or 0.0,
        taxAmount=db_txn.taxAmount or 0.0,
        total=db_txn.total,
        paymentMethod=payment_method,
        cashAmount=getattr(db_txn, "cashAmount", 0.0),
        changeAmount=getattr(db_txn, "changeAmount", 0.0),
        notes=db_txn.notes,
        status=status,
        createdAt=db_txn.createdAt,
        updatedAt=db_txn.updatedAt,
    )


def calculate_transaction_totals(
    items: List,
    discount: float = 0.0,
    tax_rate: float = 0.0,
) -> dict:
    def get_item_total(item):
        if isinstance(item, dict):
            return float(item.get("total", 0.0))
        return float(getattr(item, "total", 0.0))

    subtotal = sum(get_item_total(item) for item in items)
    discount_amount = subtotal * (discount / 100) if discount > 0 else 0
    taxable_amount = subtotal - discount_amount
    tax_amount = taxable_amount * (tax_rate / 100) if tax_rate > 0 else 0
    total = taxable_amount + tax_amount

    return {
        "subtotal": round(subtotal, 2),
        "discount": round(discount_amount, 2),
        "taxAmount": round(tax_amount, 2),
        "total": round(total, 2),
    }
