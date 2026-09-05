from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from fastapi import HTTPException

from .....config.database import get_products
from ..shared import convert_db_shift_to_pydantic, convert_db_transaction_to_pydantic
from ..transactions.logic import get_pos_transactions
from ..shifts.logic import get_pos_shifts


def get_pos_sales_report_endpoint(
    db: Session,
    tenant_context: dict,
    date_from: Optional[str],
    date_to: Optional[str],
    payment_method: Optional[str],
    cashier_id: Optional[str],
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    try:
        db_transactions = get_pos_transactions(db, tenant_context["tenant_id"], 0, 1000)
        transactions = [convert_db_transaction_to_pydantic(t) for t in db_transactions]

        if not transactions:
            return {
                "summary": {
                    "totalSales": 0.0,
                    "totalTransactions": 0,
                    "averageTransaction": 0.0,
                    "dateRange": {"from": date_from, "to": date_to},
                },
                "paymentMethods": {},
                "dailySales": {},
                "transactions": [],
            }

        if date_from or date_to:
            filtered_transactions = []
            for transaction in transactions:
                try:
                    transaction_date = datetime.fromisoformat(transaction.createdAt.replace("Z", "+00:00"))
                    if date_from:
                        from_date = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
                        if transaction_date < from_date:
                            continue
                    if date_to:
                        to_date = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
                        if transaction_date > to_date:
                            continue
                    filtered_transactions.append(transaction)
                except (ValueError, AttributeError):
                    continue
            transactions = filtered_transactions

        if payment_method:
            transactions = [t for t in transactions if t.paymentMethod.value == payment_method]

        if cashier_id:
            transactions = [t for t in transactions if t.cashierId == cashier_id]

        total_sales = sum(t.total for t in transactions)
        total_transactions = len(transactions)
        avg_transaction = total_sales / total_transactions if total_transactions > 0 else 0

        payment_methods = {}
        for transaction in transactions:
            method = transaction.paymentMethod.value
            if method not in payment_methods:
                payment_methods[method] = {"count": 0, "total": 0}
            payment_methods[method]["count"] += 1
            payment_methods[method]["total"] += transaction.total

        daily_sales = {}
        for transaction in transactions:
            try:
                date = transaction.createdAt.isoformat()[:10] if hasattr(transaction.createdAt, "isoformat") else str(transaction.createdAt)[:10]
                if date not in daily_sales:
                    daily_sales[date] = {"sales": 0, "transactions": 0}
                daily_sales[date]["sales"] += transaction.total
                daily_sales[date]["transactions"] += 1
            except (AttributeError, TypeError):
                continue

        return {
            "summary": {
                "totalSales": round(total_sales, 2),
                "totalTransactions": total_transactions,
                "averageTransaction": round(avg_transaction, 2),
                "dateRange": {"from": date_from, "to": date_to},
            },
            "paymentMethods": payment_methods,
            "dailySales": daily_sales,
            "transactions": transactions[:100],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating sales report: {str(e)}")


def get_pos_inventory_report_endpoint(
    db: Session,
    tenant_context: dict,
    low_stock_only: bool,
    category: Optional[str],
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    try:
        products = get_products(db, tenant_context["tenant_id"], 0, 1000)

        def get_price(product):
            return float(getattr(product, "salePrice", getattr(product, "unitPrice", getattr(product, "price", 0.0))) or 0.0)

        def get_low_stock_threshold(product):
            return int(getattr(product, "minStockLevel", getattr(product, "lowStockThreshold", 0)) or 0)

        if not products:
            return {
                "summary": {
                    "totalProducts": 0,
                    "totalInventoryValue": 0.0,
                    "lowStockItems": 0,
                    "outOfStockItems": 0,
                },
                "categorySummary": {},
                "lowStockProducts": [],
                "products": [],
            }

        if low_stock_only:
            products = [p for p in products if p.stockQuantity <= get_low_stock_threshold(p)]

        if category:
            products = [p for p in products if p.category == category]

        total_products = len(products)
        total_value = sum(get_price(p) * p.stockQuantity for p in products)
        low_stock_count = len([p for p in products if p.stockQuantity <= get_low_stock_threshold(p)])
        out_of_stock_count = len([p for p in products if p.stockQuantity == 0])

        category_summary = {}
        for product in products:
            cat = product.category
            if cat not in category_summary:
                category_summary[cat] = {"count": 0, "totalValue": 0, "lowStock": 0}
            category_summary[cat]["count"] += 1
            category_summary[cat]["totalValue"] += get_price(product) * product.stockQuantity
            if product.stockQuantity <= get_low_stock_threshold(product):
                category_summary[cat]["lowStock"] += 1

        return {
            "summary": {
                "totalProducts": total_products,
                "totalInventoryValue": round(total_value, 2),
                "lowStockItems": low_stock_count,
                "outOfStockItems": out_of_stock_count,
            },
            "categorySummary": category_summary,
            "lowStockProducts": [p for p in products if p.stockQuantity <= get_low_stock_threshold(p)],
            "products": products[:100],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating inventory report: {str(e)}")


def get_pos_shifts_report_endpoint(
    db: Session,
    tenant_context: dict,
    date_from: Optional[str],
    date_to: Optional[str],
    cashier_id: Optional[str],
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    try:
        db_shifts = get_pos_shifts(db, tenant_context["tenant_id"], 0, 1000)
        shifts = [convert_db_shift_to_pydantic(s) for s in db_shifts]

        if not shifts:
            return {
                "summary": {
                    "totalShifts": 0,
                    "openShifts": 0,
                    "closedShifts": 0,
                    "totalSales": 0.0,
                    "totalTransactions": 0,
                    "dateRange": {"from": date_from, "to": date_to},
                },
                "cashierSummary": {},
                "shifts": [],
            }

        if date_from or date_to:
            filtered_shifts = []
            for shift in shifts:
                try:
                    shift_date = datetime.fromisoformat(shift.openedAt.replace("Z", "+00:00"))
                    if date_from:
                        from_date = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
                        if shift_date < from_date:
                            continue
                    if date_to:
                        to_date = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
                        if shift_date > to_date:
                            continue
                    filtered_shifts.append(shift)
                except (ValueError, AttributeError):
                    continue
            shifts = filtered_shifts

        if cashier_id:
            shifts = [s for s in shifts if s.cashierId == cashier_id]

        total_shifts = len(shifts)
        open_shifts = len([s for s in shifts if s.status == "open"])
        closed_shifts = len([s for s in shifts if s.status == "closed"])
        total_sales = sum(s.totalSales for s in shifts)
        total_transactions = sum(s.totalTransactions for s in shifts)

        cashier_summary = {}
        for shift in shifts:
            cashier = shift.cashierName
            if cashier not in cashier_summary:
                cashier_summary[cashier] = {"shifts": 0, "totalSales": 0, "totalTransactions": 0}
            cashier_summary[cashier]["shifts"] += 1
            cashier_summary[cashier]["totalSales"] += shift.totalSales
            cashier_summary[cashier]["totalTransactions"] += shift.totalTransactions

        return {
            "summary": {
                "totalShifts": total_shifts,
                "openShifts": open_shifts,
                "closedShifts": closed_shifts,
                "totalSales": round(total_sales, 2),
                "totalTransactions": total_transactions,
                "dateRange": {"from": date_from, "to": date_to},
            },
            "cashierSummary": cashier_summary,
            "shifts": shifts[:100],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating shifts report: {str(e)}")
