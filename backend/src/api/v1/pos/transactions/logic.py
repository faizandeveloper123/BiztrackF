from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from .....models.pos import POSTransaction as POSTransactionORM


def get_pos_transaction_by_id(
    db: Session,
    transaction_id: str,
    tenant_id: str = None,
) -> Optional[POSTransactionORM]:
    query = db.query(POSTransactionORM).filter(POSTransactionORM.id == transaction_id)
    if tenant_id:
        query = query.filter(POSTransactionORM.tenant_id == tenant_id)
    return query.first()


def get_all_pos_transactions(
    db: Session,
    tenant_id: str = None,
    skip: int = 0,
    limit: int = 100,
) -> List[POSTransactionORM]:
    query = db.query(POSTransactionORM)
    if tenant_id:
        query = query.filter(POSTransactionORM.tenant_id == tenant_id)
    return query.order_by(POSTransactionORM.createdAt.desc()).offset(skip).limit(limit).all()


def get_pos_transactions(
    db: Session,
    tenant_id: str = None,
    skip: int = 0,
    limit: int = 100,
) -> List[POSTransactionORM]:
    return get_all_pos_transactions(db, tenant_id, skip, limit)


def get_pos_transactions_by_shift(
    db: Session,
    shift_id: str,
    tenant_id: str = None,
    skip: int = 0,
    limit: int = 100,
) -> List[POSTransactionORM]:
    query = db.query(POSTransactionORM).filter(POSTransactionORM.shiftId == shift_id)
    if tenant_id:
        query = query.filter(POSTransactionORM.tenant_id == tenant_id)
    return query.order_by(POSTransactionORM.createdAt.desc()).offset(skip).limit(limit).all()


def get_pos_transactions_by_date_range(
    db: Session,
    start_date: datetime,
    end_date: datetime,
    tenant_id: str = None,
    skip: int = 0,
    limit: int = 100,
) -> List[POSTransactionORM]:
    query = db.query(POSTransactionORM).filter(
        POSTransactionORM.createdAt >= start_date,
        POSTransactionORM.createdAt <= end_date,
    )
    if tenant_id:
        query = query.filter(POSTransactionORM.tenant_id == tenant_id)
    return query.order_by(POSTransactionORM.createdAt.desc()).offset(skip).limit(limit).all()


def create_pos_transaction(db: Session, transaction_data: dict) -> POSTransactionORM:
    db_transaction = POSTransactionORM(**transaction_data)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


def update_pos_transaction(
    db: Session,
    transaction_id: str,
    update_data: dict,
    tenant_id: str = None,
) -> Optional[POSTransactionORM]:
    transaction = get_pos_transaction_by_id(db, transaction_id, tenant_id)
    if transaction:
        for key, value in update_data.items():
            if hasattr(transaction, key) and value is not None:
                setattr(transaction, key, value)
        transaction.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(transaction)
    return transaction


def delete_pos_transaction(
    db: Session,
    transaction_id: str,
    tenant_id: str = None,
) -> bool:
    transaction = get_pos_transaction_by_id(db, transaction_id, tenant_id)
    if transaction:
        db.delete(transaction)
        db.commit()
        return True
    return False


def list_pos_transactions_endpoint(
    db: Session,
    tenant_context: dict,
    status: Optional[str],
    payment_method: Optional[str],
    date_from: Optional[str],
    date_to: Optional[str],
    amount_from: Optional[float],
    amount_to: Optional[float],
    search: Optional[str],
    page: int,
    limit: int,
):
    from fastapi import HTTPException
    from ..shared import convert_db_transaction_to_pydantic
    from .schemas import POSTransactionsResponse

    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    try:
        skip = (page - 1) * limit
        transactions = get_pos_transactions(db, tenant_context["tenant_id"], skip, limit)

        if status or payment_method or date_from or date_to or amount_from or amount_to or search:
            filtered_transactions = []
            for transaction in transactions:
                pydantic_txn = convert_db_transaction_to_pydantic(transaction)
                if status and pydantic_txn.status.value != status:
                    continue
                if payment_method and pydantic_txn.paymentMethod.value != payment_method:
                    continue
                if date_from:
                    transaction_date = datetime.fromisoformat(pydantic_txn.createdAt.replace("Z", "+00:00"))
                    from_date = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
                    if transaction_date < from_date:
                        continue
                if date_to:
                    transaction_date = datetime.fromisoformat(pydantic_txn.createdAt.replace("Z", "+00:00"))
                    to_date = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
                    if transaction_date > to_date:
                        continue
                if amount_from and pydantic_txn.total < amount_from:
                    continue
                if amount_to and pydantic_txn.total > amount_to:
                    continue
                if search:
                    search_lower = search.lower()
                    if not any([
                        search_lower in pydantic_txn.transactionNumber.lower(),
                        search_lower in (pydantic_txn.customerName or "").lower(),
                        search_lower in pydantic_txn.cashierName.lower(),
                    ]):
                        continue
                filtered_transactions.append(transaction)
            transactions = filtered_transactions

        pydantic_transactions = [convert_db_transaction_to_pydantic(t) for t in transactions]
        total = len(pydantic_transactions)

        return POSTransactionsResponse(
            transactions=pydantic_transactions,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit,
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching transactions: {str(e)}")


def get_pos_transaction_endpoint(db: Session, tenant_context: dict, transaction_id: str):
    from fastapi import HTTPException
    from ..shared import convert_db_transaction_to_pydantic
    from .schemas import POSTransactionResponse

    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    try:
        transaction = get_pos_transaction_by_id(db, transaction_id, tenant_context["tenant_id"])
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return POSTransactionResponse(transaction=convert_db_transaction_to_pydantic(transaction))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching transaction: {str(e)}")


def create_pos_transaction_endpoint(
    db: Session,
    tenant_context: dict,
    current_user,
    transaction_data,
):
    import uuid as uuid_lib
    from fastapi import HTTPException
    from ..shared import (
        calculate_transaction_totals,
        convert_db_transaction_to_pydantic,
        generate_transaction_number,
    )
    from ..shifts.logic import get_open_pos_shift
    from .schemas import POSTransactionResponse

    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    try:
        open_shift = get_open_pos_shift(db, tenant_context["tenant_id"], str(current_user.id))
        if not open_shift:
            raise HTTPException(status_code=400, detail="No open shift found. Please open a shift first.")

        totals = calculate_transaction_totals(transaction_data.items, transaction_data.discount, 0.0)

        db_txn_data = {
            "id": str(uuid_lib.uuid4()),
            "transactionNumber": generate_transaction_number(),
            "tenant_id": tenant_context["tenant_id"],
            "shiftId": str(open_shift.id),
            "customerId": transaction_data.customerId,
            "customerName": transaction_data.customerName,
            "items": [item.dict() for item in transaction_data.items],
            "subtotal": totals["subtotal"],
            "discount": totals["discount"],
            "taxAmount": totals["taxAmount"],
            "total": totals["total"],
            "paymentMethod": transaction_data.paymentMethod.value,
            "paymentStatus": "completed",
            "notes": transaction_data.notes,
            "createdAt": datetime.now(),
            "updatedAt": datetime.now(),
        }

        db_transaction = create_pos_transaction(db, db_txn_data)

        open_shift.totalSales += totals["total"]
        open_shift.totalTransactions += 1
        db.commit()
        db.refresh(open_shift)

        return POSTransactionResponse(transaction=convert_db_transaction_to_pydantic(db_transaction))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating transaction: {str(e)}")


def update_pos_transaction_endpoint(
    db: Session,
    tenant_context: dict,
    transaction_id: str,
    transaction_data,
):
    from fastapi import HTTPException
    from ..shared import convert_db_transaction_to_pydantic
    from .schemas import POSTransactionResponse

    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    try:
        update_dict = transaction_data.dict(exclude_unset=True)
        if "status" in update_dict:
            update_dict["paymentStatus"] = update_dict.pop("status")

        db_transaction = update_pos_transaction(
            db,
            transaction_id,
            update_dict,
            tenant_context["tenant_id"],
        )
        if not db_transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return POSTransactionResponse(transaction=convert_db_transaction_to_pydantic(db_transaction))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating transaction: {str(e)}")
