from sqlalchemy.orm import Session
from sqlalchemy import func, case, desc, and_, DateTime
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from ..core.cache import cached_sync

from .hrm_models import Employee, LeaveRequest
from .inventory_models import Product, Warehouse, PurchaseOrder
from ..models.invoices import Invoice, Payment
from ..models.projects import Project, Task
from .core_models import User
from ..models.pos import POSTransaction

@cached_sync(ttl=60, key_prefix="reports_dashboard_")
def get_reports_dashboard_data(db: Session, tenant_id: str, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Get comprehensive reports dashboard data using real database queries"""
    
    if filters is None:
        filters = {}
    
    # Project Metrics
    project_date_conditions = []
    if 'start_date' in filters:
        project_date_conditions.append(func.date(Project.createdAt) >= filters['start_date'].date())
    if 'end_date' in filters:
        project_date_conditions.append(func.date(Project.createdAt) <= filters['end_date'].date())
    
    project_stats = db.query(
        func.count(Project.id).label('total'),
        func.sum(case((Project.status == 'in_progress', 1), else_=0)).label('active'),
        func.sum(case((Project.status == 'completed', 1), else_=0)).label('completed'),
        func.sum(case((Project.status == 'on_hold', 1), else_=0)).label('on_hold'),
        func.sum(case((Project.status == 'cancelled', 1), else_=0)).label('cancelled'),
        func.avg(Project.completionPercent).label('avg_progress')
    ).filter(
        Project.tenant_id == tenant_id,
        *project_date_conditions
    ).first()
    
    project_metrics = {
        "total_projects": project_stats.total or 0,
        "active_projects": project_stats.active or 0,
        "completed_projects": project_stats.completed or 0,
        "overdue_projects": 0,
        "total_project_value": 0.0,
        "average_project_duration": 0.0
    }
    
    # HRM Metrics
    employee_stats = db.query(
        func.count(Employee.id).label('total'),
        func.sum(case((Employee.isActive == True, 1), else_=0)).label('active'),
        func.sum(case((Employee.isActive == False, 1), else_=0)).label('inactive')
    ).filter(
        Employee.tenant_id == tenant_id
    ).first()
    
    hrm_metrics = {
        "total_employees": employee_stats.total or 0,
        "active_employees": employee_stats.active or 0,
        "total_job_postings": 0,
        "active_job_postings": 0,
        "pending_applications": 0,
        "pending_leave_requests": 0
    }
    
    # Inventory Metrics
    inventory_stats = db.query(
        func.count(Product.id).label('total_products'),
        func.sum(Product.stockQuantity).label('total_stock'),
        func.sum(Product.salePrice * Product.stockQuantity).label('total_value'),
        func.sum(case((Product.stockQuantity <= Product.minStockLevel, 1), else_=0)).label('low_stock'),
        func.sum(case((Product.stockQuantity == 0, 1), else_=0)).label('out_of_stock')
    ).filter(
        Product.tenant_id == tenant_id
    ).first()
    
    inventory_metrics = {
        "total_products": inventory_stats.total_products or 0,
        "low_stock_products": inventory_stats.low_stock or 0,
        "out_of_stock_products": inventory_stats.out_of_stock or 0,
        "total_warehouses": 0,
        "total_stock_value": inventory_stats.total_value or 0.0,
        "pending_purchase_orders": 0
    }
    
    # Financial Metrics
    invoice_date_conditions = []
    po_date_conditions = []
    if 'start_date' in filters:
        invoice_date_conditions.append(func.date(Invoice.createdAt) >= filters['start_date'].date())
        po_date_conditions.append(func.date(PurchaseOrder.createdAt) >= filters['start_date'].date())
    if 'end_date' in filters:
        invoice_date_conditions.append(func.date(Invoice.createdAt) <= filters['end_date'].date())
        po_date_conditions.append(func.date(PurchaseOrder.createdAt) <= filters['end_date'].date())
    
    revenue_stats = db.query(
        func.sum(Invoice.total).label('total_revenue'),
        func.sum(case((Invoice.status == 'paid', Invoice.total), else_=0)).label('paid_amount'),
        func.sum(case((Invoice.status == 'sent', Invoice.total), else_=0)).label('pending_amount'),
        func.count(Invoice.id).label('total_invoices')
    ).filter(
        Invoice.tenant_id == tenant_id,
        *invoice_date_conditions
    ).first()
    
    expense_stats = db.query(
        func.sum(PurchaseOrder.totalAmount).label('total_expenses'),
        func.count(PurchaseOrder.id).label('total_orders')
    ).filter(
        PurchaseOrder.tenant_id == tenant_id,
        *po_date_conditions
    ).first()
    
    financial_metrics = {
        "total_revenue": revenue_stats.total_revenue or 0.0,
        "total_expenses": expense_stats.total_expenses or 0.0,
        "net_profit": (revenue_stats.total_revenue or 0) - (expense_stats.total_expenses or 0),
        "outstanding_invoices": revenue_stats.pending_amount or 0.0,
        "paid_invoices": 0,
        "overdue_invoices": 0
    }
    
    # POS Metrics (if applicable)
    pos_date_conditions = []
    if 'start_date' in filters:
        pos_date_conditions.append(func.date(POSTransaction.createdAt) >= filters['start_date'].date())
    if 'end_date' in filters:
        pos_date_conditions.append(func.date(POSTransaction.createdAt) <= filters['end_date'].date())
    
    pos_stats = db.query(
        func.count(POSTransaction.id).label('total_transactions'),
        func.sum(POSTransaction.total).label('total_sales'),
        func.avg(POSTransaction.total).label('avg_transaction'),
        func.sum(case((POSTransaction.paymentMethod == 'cash', POSTransaction.total), else_=0)).label('cash_sales'),
        func.sum(case((POSTransaction.paymentMethod == 'credit_card', POSTransaction.total), else_=0)).label('card_sales')
    ).filter(
        POSTransaction.tenant_id == tenant_id,
        *pos_date_conditions
    ).first()
    
    pos_metrics = {
        "total_transactions": pos_stats.total_transactions or 0,
        "total_sales": pos_stats.total_sales or 0.0,
        "average_transaction_value": pos_stats.avg_transaction or 0.0,
        "cash_sales": pos_stats.cash_sales or 0.0,
        "card_sales": pos_stats.card_sales or 0.0,
        "sales_growth": 0.0
    }
    
    # Monthly Trends (last 6 months or date range)
    trend_start_date = filters.get('start_date', datetime.now() - timedelta(days=180))
    trend_end_date = filters.get('end_date', datetime.now())
    
    project_trends = db.query(
        func.date_trunc('month', Project.createdAt).label('month'),
        func.count(Project.id).label('count')
    ).filter(
        Project.tenant_id == tenant_id,
        Project.createdAt >= trend_start_date,
        Project.createdAt <= trend_end_date
    ).group_by(
        func.date_trunc('month', Project.createdAt)
    ).order_by('month').all()
    
    revenue_trends = db.query(
        func.date_trunc('month', Invoice.createdAt).label('month'),
        func.sum(Invoice.total).label('amount')
    ).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.createdAt >= trend_start_date,
        Invoice.createdAt <= trend_end_date
    ).group_by(
        func.date_trunc('month', Invoice.createdAt)
    ).order_by('month').all()
    
    monthly_trends = []
    
    for trend in project_trends:
        monthly_trends.append({
            "month": trend.month.isoformat(),
            "value": float(trend.count),
            "count": trend.count
        })
    
    for trend in revenue_trends:
        monthly_trends.append({
            "month": trend.month.isoformat(),
            "value": float(trend.amount or 0),
            "count": 1
        })
    
    # Department Performance
    department_performance = db.query(
        Employee.department,
        func.count(Employee.id).label('employee_count'),
        func.avg(Employee.salary).label('avg_salary')
    ).filter(
        Employee.tenant_id == tenant_id,
        Employee.department.isnot(None),
        Employee.isActive == True
    ).group_by(
        Employee.department
    ).all()
    
    dept_performance = [
        {
            "department": dept.department,
            "completed_tasks": 0,
            "total_tasks": 0,
            "completion_rate": 0.0,
            "average_time": 0.0
        }
        for dept in department_performance
    ]
    
    return {
        "projects": project_metrics,
        "hrm": hrm_metrics,
        "inventory": inventory_metrics,
        "financial": financial_metrics,
        "monthly_trends": monthly_trends,
        "department_performance": dept_performance,
        "recent_activities": []
    }

def get_project_analytics(db: Session, tenant_id: str, filters: Dict[str, Any] = None) -> Dict[str, Any]:
    """Get detailed project analytics"""
    query = db.query(Project).filter(Project.tenant_id == tenant_id)
    
    if filters:
        if 'start_date' in filters:
            query = query.filter(Project.createdAt >= filters['start_date'])
        if 'end_date' in filters:
            query = query.filter(Project.createdAt <= filters['end_date'])
    
    projects = query.all()
    
    # Calculate detailed metrics
    total_projects = len(projects)
    active_projects = len([p for p in projects if p.status == 'in_progress'])
    completed_projects = len([p for p in projects if p.status == 'completed'])
    
    # Progress distribution
    progress_ranges = {
        "0-25": len([p for p in projects if 0 <= (p.completionPercent or 0) <= 25]),
        "26-50": len([p for p in projects if 26 <= (p.completionPercent or 0) <= 50]),
        "51-75": len([p for p in projects if 51 <= (p.completionPercent or 0) <= 75]),
        "76-100": len([p for p in projects if 76 <= (p.completionPercent or 0) <= 100])
    }
    
    # Task count per project
    task_counts = []
    for project in projects:
        task_count = db.query(func.count(Task.id)).filter(
            Task.projectId == project.id,
            Task.tenant_id == tenant_id
        ).scalar()
        task_counts.append(task_count or 0)
    
    return {
        "total_projects": total_projects,
        "active_projects": active_projects,
        "completed_projects": completed_projects,
        "completion_rate": (completed_projects / total_projects * 100) if total_projects > 0 else 0,
        "progress_distribution": progress_ranges,
        "average_progress": sum(p.completionPercent or 0 for p in projects) / total_projects if total_projects > 0 else 0,
        "total_tasks": sum(task_counts),
        "average_tasks_per_project": sum(task_counts) / total_projects if total_projects > 0 else 0
    }

def get_financial_analytics(db: Session, tenant_id: str, filters: Dict[str, Any] = None) -> Dict[str, Any]:
    """Get detailed financial analytics"""
    # Revenue analysis
    invoice_query = db.query(Invoice).filter(Invoice.tenant_id == tenant_id)
    if filters:
        if 'start_date' in filters:
            invoice_query = invoice_query.filter(Invoice.createdAt >= filters['start_date'])
        if 'end_date' in filters:
            invoice_query = invoice_query.filter(Invoice.createdAt <= filters['end_date'])
    
    invoices = invoice_query.all()
    
    # Expense analysis
    expense_query = db.query(PurchaseOrder).filter(PurchaseOrder.tenant_id == tenant_id)
    if filters:
        if 'start_date' in filters:
            expense_query = expense_query.filter(PurchaseOrder.createdAt >= filters['start_date'])
        if 'end_date' in filters:
            expense_query = expense_query.filter(PurchaseOrder.createdAt <= filters['end_date'])
    
    expenses = expense_query.all()
    
    # Calculate metrics
    total_revenue = sum(inv.total or 0 for inv in invoices)
    total_expenses = sum(exp.totalAmount or 0 for exp in expenses)
    net_profit = total_revenue - total_expenses
    
    # Payment status breakdown
    payment_status = {}
    for inv in invoices:
        status = inv.status or 'draft'
        payment_status[status] = payment_status.get(status, 0) + 1
    
    # Monthly revenue trend
    monthly_revenue = {}
    for inv in invoices:
        month_key = inv.createdAt.strftime('%Y-%m') if inv.createdAt else 'unknown'
        monthly_revenue[month_key] = monthly_revenue.get(month_key, 0) + (inv.total or 0)
    
    return {
        "total_revenue": total_revenue,
        "total_expenses": total_expenses,
        "net_profit": net_profit,
        "profit_margin": (net_profit / total_revenue * 100) if total_revenue > 0 else 0,
        "total_invoices": len(invoices),
        "total_expense_orders": len(expenses),
        "payment_status_breakdown": payment_status,
        "monthly_revenue": monthly_revenue,
        "average_invoice_amount": total_revenue / len(invoices) if invoices else 0,
        "average_expense_amount": total_expenses / len(expenses) if expenses else 0
    }