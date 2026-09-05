#!/usr/bin/env python3
"""
Ledger Seeding Service
Provides functions to create default chart of accounts for tenants
"""

import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from ..config.ledger_models import (
    ChartOfAccounts, AccountType, AccountCategory
)

def create_default_chart_of_accounts(tenant_id: str, created_by: str, db: Session):
    """Create default chart of accounts for a tenant"""
    
    default_accounts = [
        # Asset Accounts (1000-1999)
        {
            "account_code": "1000",
            "account_name": "Cash",
            "account_type": AccountType.ASSET,
            "account_category": AccountCategory.CASH,
            "description": "Cash on hand and in bank accounts",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "1100",
            "account_name": "Accounts Receivable",
            "account_type": AccountType.ASSET,
            "account_category": AccountCategory.ACCOUNTS_RECEIVABLE,
            "description": "Amounts owed by customers",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "1200",
            "account_name": "Inventory",
            "account_type": AccountType.ASSET,
            "account_category": AccountCategory.INVENTORY,
            "description": "Raw materials, work in progress, and finished goods",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "1300",
            "account_name": "Equipment",
            "account_type": AccountType.ASSET,
            "account_category": AccountCategory.EQUIPMENT,
            "description": "Machinery, tools, and equipment",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "1400",
            "account_name": "Buildings",
            "account_type": AccountType.ASSET,
            "account_category": AccountCategory.BUILDINGS,
            "description": "Buildings and structures",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "1500",
            "account_name": "Vehicles",
            "account_type": AccountType.ASSET,
            "account_category": AccountCategory.VEHICLES,
            "description": "Company vehicles",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "1600",
            "account_name": "Prepaid Expenses",
            "account_type": AccountType.ASSET,
            "account_category": AccountCategory.PREPAID_EXPENSES,
            "description": "Expenses paid in advance",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        
        # Liability Accounts (2000-2999)
        {
            "account_code": "2000",
            "account_name": "Accounts Payable",
            "account_type": AccountType.LIABILITY,
            "account_category": AccountCategory.ACCOUNTS_PAYABLE,
            "description": "Amounts owed to suppliers and vendors",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "2100",
            "account_name": "Loans Payable",
            "account_type": AccountType.LIABILITY,
            "account_category": AccountCategory.LOANS_PAYABLE,
            "description": "Bank loans and other borrowings",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "2200",
            "account_name": "Credit Cards",
            "account_type": AccountType.LIABILITY,
            "account_category": AccountCategory.CREDIT_CARDS,
            "description": "Credit card balances",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "2300",
            "account_name": "Taxes Payable",
            "account_type": AccountType.LIABILITY,
            "account_category": AccountCategory.TAXES_PAYABLE,
            "description": "Sales tax, income tax, and other taxes",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "2400",
            "account_name": "Wages Payable",
            "account_type": AccountType.LIABILITY,
            "account_category": AccountCategory.WAGES_PAYABLE,
            "description": "Accrued wages and salaries",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        
        # Equity Accounts (3000-3999)
        {
            "account_code": "3000",
            "account_name": "Owner Equity",
            "account_type": AccountType.EQUITY,
            "account_category": AccountCategory.OWNER_EQUITY,
            "description": "Owner's investment in the business",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "3100",
            "account_name": "Retained Earnings",
            "account_type": AccountType.EQUITY,
            "account_category": AccountCategory.RETAINED_EARNINGS,
            "description": "Accumulated profits retained in the business",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "3200",
            "account_name": "Common Stock",
            "account_type": AccountType.EQUITY,
            "account_category": AccountCategory.COMMON_STOCK,
            "description": "Common stock issued",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        
        # Revenue Accounts (4000-4999)
        {
            "account_code": "4000",
            "account_name": "Sales Revenue",
            "account_type": AccountType.REVENUE,
            "account_category": AccountCategory.SALES_REVENUE,
            "description": "Revenue from sales of goods and services",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "4100",
            "account_name": "Service Revenue",
            "account_type": AccountType.REVENUE,
            "account_category": AccountCategory.SERVICE_REVENUE,
            "description": "Revenue from services provided",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "4200",
            "account_name": "Interest Income",
            "account_type": AccountType.REVENUE,
            "account_category": AccountCategory.INTEREST_INCOME,
            "description": "Interest earned on investments and loans",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "4900",
            "account_name": "Other Income",
            "account_type": AccountType.REVENUE,
            "account_category": AccountCategory.OTHER_INCOME,
            "description": "Miscellaneous income",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        
        # Expense Accounts (5000-5999)
        {
            "account_code": "5000",
            "account_name": "Cost of Goods Sold",
            "account_type": AccountType.EXPENSE,
            "account_category": AccountCategory.COST_OF_GOODS_SOLD,
            "description": "Direct costs of producing goods sold",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "5100",
            "account_name": "Salaries & Wages",
            "account_type": AccountType.EXPENSE,
            "account_category": AccountCategory.SALARIES_WAGES,
            "description": "Employee salaries and wages",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "5200",
            "account_name": "Rent Expense",
            "account_type": AccountType.EXPENSE,
            "account_category": AccountCategory.RENT_EXPENSE,
            "description": "Rent for office, warehouse, and equipment",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "5300",
            "account_name": "Utilities",
            "account_type": AccountType.EXPENSE,
            "account_category": AccountCategory.UTILITIES,
            "description": "Electricity, water, gas, and other utilities",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "5400",
            "account_name": "Insurance",
            "account_type": AccountType.EXPENSE,
            "account_category": AccountCategory.INSURANCE,
            "description": "Business insurance premiums",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "5500",
            "account_name": "Maintenance",
            "account_type": AccountType.EXPENSE,
            "account_category": AccountCategory.MAINTENANCE,
            "description": "Equipment and facility maintenance",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "5600",
            "account_name": "Marketing",
            "account_type": AccountType.EXPENSE,
            "account_category": AccountCategory.MARKETING,
            "description": "Advertising and marketing expenses",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "5700",
            "account_name": "Office Supplies",
            "account_type": AccountType.EXPENSE,
            "account_category": AccountCategory.OFFICE_SUPPLIES,
            "description": "Office supplies and materials",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "5800",
            "account_name": "Travel",
            "account_type": AccountType.EXPENSE,
            "account_category": AccountCategory.TRAVEL,
            "description": "Business travel expenses",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "5900",
            "account_name": "Professional Fees",
            "account_type": AccountType.EXPENSE,
            "account_category": AccountCategory.PROFESSIONAL_FEES,
            "description": "Legal, accounting, and consulting fees",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "5950",
            "account_name": "Depreciation",
            "account_type": AccountType.EXPENSE,
            "account_category": AccountCategory.DEPRECIATION,
            "description": "Depreciation of fixed assets",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "5960",
            "account_name": "Interest Expense",
            "account_type": AccountType.EXPENSE,
            "account_category": AccountCategory.INTEREST_EXPENSE,
            "description": "Interest on loans and credit",
            "opening_balance": 0.0,
            "is_system_account": True
        },
        {
            "account_code": "5999",
            "account_name": "Other Expenses",
            "account_type": AccountType.EXPENSE,
            "account_category": AccountCategory.OTHER_EXPENSES,
            "description": "Miscellaneous expenses",
            "opening_balance": 0.0,
            "is_system_account": True
        }
    ]
    
    try:
        created_accounts = []
        
        for account_data in default_accounts:
            # Check if account already exists
            existing_account = db.query(ChartOfAccounts).filter(
                ChartOfAccounts.tenant_id == tenant_id,
                ChartOfAccounts.account_code == account_data["account_code"]
            ).first()
            
            if not existing_account:
                # Create new account
                account = ChartOfAccounts(
                    id=uuid.uuid4(),
                    tenant_id=tenant_id,
                    created_by=created_by,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                    **account_data
                )
                
                db.add(account)
                created_accounts.append(account)
                print(f"Created account: {account.account_code} - {account.account_name}")
            else:
                print(f"Account already exists: {account_data['account_code']} - {account_data['account_name']}")
        
        db.commit()
        print(f"Successfully created {len(created_accounts)} new accounts")
        
        return created_accounts
        
    except Exception as e:
        db.rollback()
        print(f"Error creating accounts: {str(e)}")
        raise
