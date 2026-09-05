from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date
import uuid

from ..dependencies import get_current_user, get_tenant_context
from ...config.database import get_db
from ...models.ledger_models import (
    InvestmentCreate, InvestmentUpdate, InvestmentResponse, InvestmentsListResponse,
    EquipmentInvestmentCreate, EquipmentInvestmentUpdate, EquipmentInvestmentResponse, EquipmentInvestmentsListResponse,
    InvestmentTransactionCreate, InvestmentTransactionUpdate, InvestmentTransactionResponse,
    InvestmentDashboardStats, InvestmentType, InvestmentStatus
)
from ...config.investment_models import (
    Investment, EquipmentInvestment, InvestmentTransaction
)
from ...config.ledger_models import ChartOfAccounts, AccountCategory

router = APIRouter(prefix="/investments", tags=["Investment Management"])

def generate_investment_number():
    return f"INV-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

def get_or_create_investment_accounts(db: Session, tenant_id: str, created_by: str):
    cash_account = db.query(ChartOfAccounts).filter(
        ChartOfAccounts.tenant_id == tenant_id,
        ChartOfAccounts.account_category == AccountCategory.CASH
    ).first()
    
    equity_account = db.query(ChartOfAccounts).filter(
        ChartOfAccounts.tenant_id == tenant_id,
        ChartOfAccounts.account_category == AccountCategory.OWNER_EQUITY
    ).first()
    
    equipment_account = db.query(ChartOfAccounts).filter(
        ChartOfAccounts.tenant_id == tenant_id,
        ChartOfAccounts.account_category == AccountCategory.EQUIPMENT
    ).first()
    
    return cash_account, equity_account, equipment_account

@router.post("", response_model=InvestmentResponse, status_code=status.HTTP_201_CREATED)
async def create_investment(
    investment: InvestmentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Create a new investment"""
    try:
        tenant_id = tenant_context["tenant_id"]
        created_by = str(current_user.id)
        
        investment_data = investment.model_dump()
        investment_data.update({
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "investment_number": generate_investment_number(),
            "status": InvestmentStatus.PENDING,
            "created_by": created_by,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        db_investment = Investment(**investment_data)
        db.add(db_investment)
        db.commit()
        db.refresh(db_investment)
        
        return InvestmentResponse(
            id=str(db_investment.id),
            tenant_id=str(db_investment.tenant_id),
            investment_number=db_investment.investment_number,
            investment_date=db_investment.investment_date,
            investment_type=db_investment.investment_type.value,
            status=db_investment.status.value,
            amount=db_investment.amount,
            currency=db_investment.currency,
            description=db_investment.description,
            notes=db_investment.notes,
            reference_number=db_investment.reference_number,
            reference_type=db_investment.reference_type,
            meta_data=db_investment.meta_data,
            tags=db_investment.tags,
            attachments=db_investment.attachments,
            created_by_id=str(db_investment.created_by),
            approved_by_id=str(db_investment.approved_by) if db_investment.approved_by else None,
            created_at=db_investment.created_at,
            updated_at=db_investment.updated_at
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create investment: {str(e)}")

@router.get("", response_model=InvestmentsListResponse)
async def get_investments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    investment_type: Optional[InvestmentType] = Query(None),
    status: Optional[InvestmentStatus] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get all investments for the tenant"""
    try:
        tenant_id = tenant_context["tenant_id"]
        
        query = db.query(Investment).filter(Investment.tenant_id == tenant_id)
        
        if investment_type:
            query = query.filter(Investment.investment_type == investment_type)
        if status:
            query = query.filter(Investment.status == status)
        if start_date:
            query = query.filter(Investment.investment_date >= datetime.combine(start_date, datetime.min.time()))
        if end_date:
            query = query.filter(Investment.investment_date <= datetime.combine(end_date, datetime.max.time()))
        
        investments = query.offset(skip).limit(limit).all()
        total = query.count()
        
        investment_responses = []
        for investment in investments:
            investment_responses.append(InvestmentResponse(
                id=str(investment.id),
                tenant_id=str(investment.tenant_id),
                investment_number=investment.investment_number,
                investment_date=investment.investment_date,
                investment_type=investment.investment_type.value,
                status=investment.status.value,
                amount=investment.amount,
                currency=investment.currency,
                description=investment.description,
                notes=investment.notes,
                reference_number=investment.reference_number,
                reference_type=investment.reference_type,
                meta_data=investment.meta_data,
                tags=investment.tags,
                attachments=investment.attachments,
                created_by_id=str(investment.created_by),
                approved_by_id=str(investment.approved_by) if investment.approved_by else None,
                created_at=investment.created_at,
                updated_at=investment.updated_at
            ))
        
        return InvestmentsListResponse(investments=investment_responses, total=total)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch investments: {str(e)}")

@router.get("/{investment_id}", response_model=InvestmentResponse)
async def get_investment(
    investment_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get a specific investment by ID"""
    try:
        tenant_id = tenant_context["tenant_id"]
        
        investment = db.query(Investment).filter(
            Investment.id == investment_id,
            Investment.tenant_id == tenant_id
        ).first()
        
        if not investment:
            raise HTTPException(status_code=404, detail="Investment not found")
        
        return InvestmentResponse(
            id=str(investment.id),
            tenant_id=str(investment.tenant_id),
            investment_number=investment.investment_number,
            investment_date=investment.investment_date,
            investment_type=investment.investment_type.value,
            status=investment.status.value,
            amount=investment.amount,
            currency=investment.currency,
            description=investment.description,
            notes=investment.notes,
            reference_number=investment.reference_number,
            reference_type=investment.reference_type,
            meta_data=investment.meta_data,
            tags=investment.tags,
            attachments=investment.attachments,
            created_by_id=str(investment.created_by),
            approved_by_id=str(investment.approved_by) if investment.approved_by else None,
            created_at=investment.created_at,
            updated_at=investment.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch investment: {str(e)}")

@router.put("/{investment_id}", response_model=InvestmentResponse)
async def update_investment(
    investment_id: str,
    investment_update: InvestmentUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Update an investment"""
    try:
        tenant_id = tenant_context["tenant_id"]
        
        investment = db.query(Investment).filter(
            Investment.id == investment_id,
            Investment.tenant_id == tenant_id
        ).first()
        
        if not investment:
            raise HTTPException(status_code=404, detail="Investment not found")
        
        update_data = {k: v for k, v in investment_update.model_dump().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        for key, value in update_data.items():
            setattr(investment, key, value)
        
        db.commit()
        db.refresh(investment)
        
        return InvestmentResponse(
            id=str(investment.id),
            tenant_id=str(investment.tenant_id),
            investment_number=investment.investment_number,
            investment_date=investment.investment_date,
            investment_type=investment.investment_type.value,
            status=investment.status.value,
            amount=investment.amount,
            currency=investment.currency,
            description=investment.description,
            notes=investment.notes,
            reference_number=investment.reference_number,
            reference_type=investment.reference_type,
            meta_data=investment.meta_data,
            tags=investment.tags,
            attachments=investment.attachments,
            created_by_id=str(investment.created_by),
            approved_by_id=str(investment.approved_by) if investment.approved_by else None,
            created_at=investment.created_at,
            updated_at=investment.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update investment: {str(e)}")

@router.post("/{investment_id}/approve", response_model=InvestmentResponse)
async def approve_investment(
    investment_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Approve an investment and create ledger transactions"""
    try:
        tenant_id = tenant_context["tenant_id"]
        approved_by = str(current_user.id)
        
        investment = db.query(Investment).filter(
            Investment.id == investment_id,
            Investment.tenant_id == tenant_id
        ).first()
        
        if not investment:
            raise HTTPException(status_code=404, detail="Investment not found")
        
        if investment.status != InvestmentStatus.PENDING:
            raise HTTPException(status_code=400, detail="Investment is not in pending status")
        
        cash_account, equity_account, equipment_account = get_or_create_investment_accounts(
            db, tenant_id, approved_by
        )
        
        if not cash_account or not equity_account:
            raise HTTPException(status_code=500, detail="Required accounts not found. Please ensure chart of accounts is set up.")
        
        investment.status = InvestmentStatus.COMPLETED
        investment.approved_by = approved_by
        investment.updated_at = datetime.utcnow()
        
        if investment.investment_type == InvestmentType.EQUIPMENT_PURCHASE:
            if not equipment_account:
                raise HTTPException(status_code=500, detail="Equipment account not found")
            
            transaction = InvestmentTransaction(
                id=str(uuid.uuid4()),
                tenant_id=tenant_id,
                investment_id=investment.id,
                transaction_date=investment.investment_date,
                transaction_type="equipment_purchase",
                amount=investment.amount,
                currency=investment.currency,
                debit_account_id=equipment_account.id,
                credit_account_id=cash_account.id,
                description=f"Equipment purchase: {investment.description}",
                reference_number=investment.investment_number,
                status="completed",
                created_by=approved_by,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
        else:
            transaction = InvestmentTransaction(
                id=str(uuid.uuid4()),
                tenant_id=tenant_id,
                investment_id=investment.id,
                transaction_date=investment.investment_date,
                transaction_type="capital_investment",
                amount=investment.amount,
                currency=investment.currency,
                debit_account_id=cash_account.id,
                credit_account_id=equity_account.id,
                description=f"Capital investment: {investment.description}",
                reference_number=investment.investment_number,
                status="completed",
                created_by=approved_by,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
        
        db.add(transaction)
        db.commit()
        db.refresh(investment)
        
        return InvestmentResponse(
            id=str(investment.id),
            tenant_id=str(investment.tenant_id),
            investment_number=investment.investment_number,
            investment_date=investment.investment_date,
            investment_type=investment.investment_type.value,
            status=investment.status.value,
            amount=investment.amount,
            currency=investment.currency,
            description=investment.description,
            notes=investment.notes,
            reference_number=investment.reference_number,
            reference_type=investment.reference_type,
            meta_data=investment.meta_data,
            tags=investment.tags,
            attachments=investment.attachments,
            created_by_id=str(investment.created_by),
            approved_by_id=str(investment.approved_by) if investment.approved_by else None,
            created_at=investment.created_at,
            updated_at=investment.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to approve investment: {str(e)}")

@router.get("/dashboard/stats", response_model=InvestmentDashboardStats)
async def get_investment_dashboard_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get investment dashboard statistics"""
    try:
        tenant_id = tenant_context["tenant_id"]
        
        total_investments = db.query(Investment).filter(Investment.tenant_id == tenant_id).count()
        
        total_amount_result = db.query(Investment).filter(
            Investment.tenant_id == tenant_id,
            Investment.status == InvestmentStatus.COMPLETED
        ).with_entities(func.sum(Investment.amount)).scalar()
        total_amount = total_amount_result or 0.0
        
        cash_investments = db.query(Investment).filter(
            Investment.tenant_id == tenant_id,
            Investment.investment_type == InvestmentType.CASH_INVESTMENT
        ).count()
        
        equipment_investments = db.query(Investment).filter(
            Investment.tenant_id == tenant_id,
            Investment.investment_type == InvestmentType.EQUIPMENT_PURCHASE
        ).count()
        
        pending_investments = db.query(Investment).filter(
            Investment.tenant_id == tenant_id,
            Investment.status == InvestmentStatus.PENDING
        ).count()
        
        completed_investments = db.query(Investment).filter(
            Investment.tenant_id == tenant_id,
            Investment.status == InvestmentStatus.COMPLETED
        ).count()
        
        current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_amount_result = db.query(Investment).filter(
            Investment.tenant_id == tenant_id,
            Investment.investment_date >= current_month,
            Investment.status == InvestmentStatus.COMPLETED
        ).with_entities(func.sum(Investment.amount)).scalar()
        monthly_investments = monthly_amount_result or 0.0
        
        current_quarter_start = datetime.now().replace(month=((datetime.now().month - 1) // 3) * 3 + 1, day=1, hour=0, minute=0, second=0, microsecond=0)
        quarterly_amount_result = db.query(Investment).filter(
            Investment.tenant_id == tenant_id,
            Investment.investment_date >= current_quarter_start,
            Investment.status == InvestmentStatus.COMPLETED
        ).with_entities(func.sum(Investment.amount)).scalar()
        quarterly_investments = quarterly_amount_result or 0.0
        
        current_year_start = datetime.now().replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        yearly_amount_result = db.query(Investment).filter(
            Investment.tenant_id == tenant_id,
            Investment.investment_date >= current_year_start,
            Investment.status == InvestmentStatus.COMPLETED
        ).with_entities(func.sum(Investment.amount)).scalar()
        yearly_investments = yearly_amount_result or 0.0
        
        return InvestmentDashboardStats(
            total_investments=total_investments,
            total_amount=total_amount,
            cash_investments=cash_investments,
            equipment_investments=equipment_investments,
            pending_investments=pending_investments,
            completed_investments=completed_investments,
            monthly_investments=monthly_investments,
            quarterly_investments=quarterly_investments,
            yearly_investments=yearly_investments
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch investment dashboard stats: {str(e)}")

@router.delete("/{investment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_investment(
    investment_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Delete an investment"""
    try:
        tenant_id = tenant_context["tenant_id"]
        
        investment = db.query(Investment).filter(
            Investment.id == investment_id,
            Investment.tenant_id == tenant_id
        ).first()
        
        if not investment:
            raise HTTPException(status_code=404, detail="Investment not found")

        inv_id = investment.id
        db.query(InvestmentTransaction).filter(
            InvestmentTransaction.investment_id == inv_id
        ).delete(synchronize_session=False)
        db.query(EquipmentInvestment).filter(
            EquipmentInvestment.investment_id == inv_id
        ).delete(synchronize_session=False)
        db.delete(investment)
        db.commit()
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete investment: {str(e)}")
