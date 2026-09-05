from datetime import datetime, timezone
from typing import List, Optional
from dateutil.relativedelta import relativedelta
from sqlalchemy.orm import Session
from .installment_models import InstallmentPlan, Installment
from ..models.invoices import Invoice, Payment
from ..api.v1.invoices.items.logic import get_invoice_by_id, update_invoice


def get_installment_plan_by_id(plan_id: str, db: Session, tenant_id: str = None) -> Optional[InstallmentPlan]:
    query = db.query(InstallmentPlan).filter(InstallmentPlan.id == plan_id)
    if tenant_id:
        query = query.filter(InstallmentPlan.tenant_id == tenant_id)
    return query.first()


def get_installment_plans_by_invoice(invoice_id: str, db: Session, tenant_id: str = None) -> List[InstallmentPlan]:
    query = db.query(InstallmentPlan).filter(InstallmentPlan.invoice_id == invoice_id)
    if tenant_id:
        query = query.filter(InstallmentPlan.tenant_id == tenant_id)
    return query.order_by(InstallmentPlan.created_at.desc()).all()


def get_all_installment_plans(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 100,
    invoice_id: Optional[str] = None,
) -> List[InstallmentPlan]:
    query = db.query(InstallmentPlan).filter(InstallmentPlan.tenant_id == tenant_id)
    if invoice_id:
        query = query.filter(InstallmentPlan.invoice_id == invoice_id)
    return query.order_by(InstallmentPlan.created_at.desc()).offset(skip).limit(limit).all()


def get_active_installment_plan_for_invoice(invoice_id: str, db: Session, tenant_id: str = None) -> Optional[InstallmentPlan]:
    query = db.query(InstallmentPlan).filter(
        InstallmentPlan.invoice_id == invoice_id,
        InstallmentPlan.status == "active"
    )
    if tenant_id:
        query = query.filter(InstallmentPlan.tenant_id == tenant_id)
    return query.first()


def get_installment_by_id(installment_id: str, db: Session, tenant_id: str = None) -> Optional[Installment]:
    query = db.query(Installment).filter(Installment.id == installment_id)
    if tenant_id:
        query = query.filter(Installment.tenant_id == tenant_id)
    return query.first()


def _next_due_date(first_due_date: datetime, frequency: str, sequence_1_based: int) -> datetime:
    if frequency == "weekly":
        from datetime import timedelta
        return first_due_date + timedelta(weeks=sequence_1_based - 1)
    if frequency == "monthly":
        return first_due_date + relativedelta(months=sequence_1_based - 1)
    if frequency == "quarterly":
        return first_due_date + relativedelta(months=3 * (sequence_1_based - 1))
    from datetime import timedelta
    return first_due_date + timedelta(days=30 * (sequence_1_based - 1))


def create_installment_plan(
    tenant_id: str,
    invoice_id: str,
    total_amount: float,
    number_of_installments: int,
    frequency: str,
    first_due_date: datetime,
    currency: str = "USD",
    db: Session = None,
) -> InstallmentPlan:
    if isinstance(first_due_date, datetime) and first_due_date.tzinfo:
        first_due_date = first_due_date.astimezone(timezone.utc).replace(tzinfo=None)
    plan = InstallmentPlan(
        tenant_id=tenant_id,
        invoice_id=invoice_id,
        total_amount=total_amount,
        currency=currency,
        number_of_installments=number_of_installments,
        frequency=frequency,
        first_due_date=first_due_date,
        status="active",
    )
    db.add(plan)
    db.flush()
    per_installment = round(total_amount / number_of_installments, 2)
    remainder = round(total_amount - per_installment * number_of_installments, 2)
    now_utc = datetime.now(timezone.utc)
    for i in range(1, number_of_installments + 1):
        due = _next_due_date(first_due_date, frequency, i)
        due_utc = due.astimezone(timezone.utc) if due.tzinfo else due.replace(tzinfo=timezone.utc)
        due_naive = due_utc.replace(tzinfo=None)
        amt = per_installment + (remainder if i == number_of_installments else 0)
        inst = Installment(
            tenant_id=tenant_id,
            installment_plan_id=plan.id,
            sequence_number=i,
            due_date=due_naive,
            amount=amt,
            status="overdue" if due_utc < now_utc else "pending",
            paid_amount=0.0,
        )
        db.add(inst)
    db.commit()
    db.refresh(plan)
    return plan


def update_installment_plan(plan_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[InstallmentPlan]:
    plan = get_installment_plan_by_id(plan_id, db, tenant_id)
    if not plan:
        return None
    for key, value in update_data.items():
        if hasattr(plan, key):
            setattr(plan, key, value)
    plan.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(plan)
    return plan


def apply_payment_to_installment(
    plan_id: str,
    installment_id: str,
    amount: float,
    payment_id: Optional[str],
    db: Session,
    tenant_id: str,
) -> Optional[Installment]:
    plan = get_installment_plan_by_id(plan_id, db, tenant_id)
    if not plan:
        return None
    inst = get_installment_by_id(installment_id, db, tenant_id)
    if not inst or str(inst.installment_plan_id) != str(plan_id):
        return None
    new_paid = (inst.paid_amount or 0) + amount
    inst.paid_amount = new_paid
    if payment_id:
        inst.payment_id = payment_id
    if new_paid >= inst.amount:
        inst.status = "paid"
    else:
        inst.status = "partial"
    inst.updated_at = datetime.utcnow()
    db.commit()
    invoice = get_invoice_by_id(str(plan.invoice_id), db, tenant_id)
    if invoice:
        new_total_paid = (invoice.totalPaid or 0) + amount
        update_invoice(str(invoice.id), {"totalPaid": new_total_paid, "balance": (invoice.total or 0) - new_total_paid}, db, tenant_id)
    installments = get_installments_by_plan(plan_id, db, tenant_id)
    all_paid = all(i.status == "paid" for i in installments)
    if all_paid:
        update_installment_plan(plan_id, {"status": "completed"}, db, tenant_id)
    db.refresh(inst)
    try:
        from ..services.crm_sync_service import sync_on_installment_payment
        sync_on_installment_payment(db, inst, plan, amount, payment_id)
        db.commit()
    except Exception:
        pass
    return inst


def get_installments_by_plan(plan_id: str, db: Session, tenant_id: str = None) -> List[Installment]:
    query = db.query(Installment).filter(Installment.installment_plan_id == plan_id)
    if tenant_id:
        query = query.filter(Installment.tenant_id == tenant_id)
    return query.order_by(Installment.sequence_number.asc()).all()
