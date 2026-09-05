# This file imports all the split database components
# This file imports all the split database components

# Import database configuration
from .database_config import (
    engine, SessionLocal, Base, create_tables, get_db
)

from .core_models import (
    User, Tenant, Plan, Subscription, TenantUser, project_team_members
)

from ..models.projects import (
    Project, Task, TaskMessage
)

from ..models.crm import (
    Lead, Contact, Company, Opportunity, SalesActivity, Customer, CustomerGuarantor
)

from .sales_models import (
    Quote, Contract
)

from .hrm_models import (
    Employee, JobPosting, PerformanceReview, TimeEntry, LeaveRequest, Payroll, Benefits,
    Training, TrainingEnrollment, Application, Supplier
)

from .notification_models import (
    Notification, NotificationPreference, MobilePushDevice
)

from .inventory_models import (
    Product, Warehouse, PurchaseOrder, Receiving,
    StorageLocation, StockMovement
)

from .job_card_models import JobCard
from .vehicle_models import Vehicle

from ..models.invoices import (
    Invoice, Payment, DeliveryNote, InvoiceShareLink
)

from .installment_models import (
    InstallmentPlan, Installment
)

from .invoice_customization_models import (
    InvoiceCustomization
)

from .ledger_models import (
    ChartOfAccounts, LedgerTransaction, JournalEntry, 
    FinancialPeriod, Budget, BudgetItem, AccountReceivable
)

from ..models.banking import (
    BankAccount, BankTransaction, CashPosition, Till, TillTransaction
)

from .investment_models import (
    Investment, EquipmentInvestment, InvestmentTransaction
)

from ..models.pos import (
    POSShift, POSTransaction, PosProductCategory
)

from .custom_options_models import (
    CustomEventType, CustomDepartment, CustomLeaveType, CustomLeadSource,
    CustomContactSource, CustomCompanyIndustry, CustomContactType, CustomIndustry
)

from .audit_models import (
    AuditLog, Permission, CustomRole
)

from .event_models import (
    Event, EventType, EventStatus, RecurrenceType
)

from .saved_reports_models import SavedReport

# Import all CRUD functions
from .core_crud import (
    # User functions
    get_user_by_email, get_user_by_username, get_user_by_id, get_all_users,
    create_user, update_user, delete_user,
    
    # Tenant functions
    get_tenant_by_id, get_tenant_by_domain, get_all_tenants,
    create_tenant, update_tenant, delete_tenant,
    
    # Plan functions
    get_plan_by_id, get_plans, get_all_plans, create_plan, update_plan, delete_plan,
    
    # Subscription functions
    get_subscription_by_id, get_tenant_subscription, get_subscription_by_tenant, get_all_subscriptions,
    create_subscription, update_subscription, delete_subscription,
    
)

from ..api.v1.rbac.tenant_users.logic import (
    get_tenant_user, get_tenant_users, get_user_tenants,
    create_tenant_user, update_tenant_user, delete_tenant_user,
)
from ..api.v1.projects.items.logic import (
    get_project_by_id, get_all_projects, get_projects_by_manager, get_project_ids_with_tasks_assigned_to,
    create_project, update_project, delete_project, get_project_stats,
)
from ..api.v1.tasks.items.logic import (
    get_task_by_id, get_all_tasks, get_tasks_by_project, get_subtasks_by_parent, get_main_tasks_by_project, get_task_with_subtasks, get_tasks_by_assignee, get_tasks_by_creator,
    create_task, update_task, delete_task, get_task_stats,
)

from ..api.v1.crm.leads.logic import (
    get_lead_by_id, get_all_leads, get_leads, get_leads_by_status, get_leads_by_assignee,
    create_lead, update_lead, delete_lead,
)
from ..api.v1.crm.contacts.logic import (
    get_contact_by_id, get_all_contacts, get_contacts, get_contacts_by_company,
    create_contact, update_contact, delete_contact, search_contacts,
)
from ..api.v1.crm.companies.logic import (
    get_company_by_id, get_all_companies, get_companies, get_companies_by_industry,
    create_company, update_company, delete_company,
)
from ..api.v1.crm.opportunities.logic import (
    get_opportunity_by_id, get_all_opportunities, get_opportunities, get_opportunities_by_stage, get_opportunities_by_assignee,
    create_opportunity, update_opportunity, delete_opportunity,
)
from ..api.v1.crm.activities.logic import (
    get_sales_activity_by_id, get_all_sales_activities, get_sales_activities, get_sales_activities_by_assignee,
    create_sales_activity, update_sales_activity, delete_sales_activity,
)
from ..api.v1.crm.dashboard.logic import get_crm_dashboard_data

from .hrm_crud import (
    # Employee functions
    get_employee_by_id, get_employee_by_user_id, get_all_employees, get_employees, get_employees_by_department,
    create_employee, update_employee, delete_employee,
    
    # JobPosting functions
    get_job_posting_by_id, get_all_job_postings, get_job_postings, get_active_job_postings,
    create_job_posting, update_job_posting, delete_job_posting,
    
    # PerformanceReview functions
    get_performance_review_by_id, get_all_performance_reviews, get_performance_reviews, get_performance_reviews_by_employee,
    create_performance_review, update_performance_review, delete_performance_review,
    
    # TimeEntry functions
    get_time_entry_by_id, get_all_time_entries, get_time_entries, get_time_entries_by_employee,
    create_time_entry, update_time_entry, delete_time_entry,
    
    # LeaveRequest functions
    get_leave_request_by_id, get_all_leave_requests, get_leave_requests, get_leave_requests_by_employee,
    create_leave_request, update_leave_request, delete_leave_request,
    
    # Payroll functions
    get_payroll_by_id, get_all_payrolls, get_payroll, get_payrolls_by_employee,
    create_payroll, update_payroll, delete_payroll,
    
    # Benefits functions
    get_benefit_by_id, get_all_benefits, get_benefits, get_active_benefits,
    create_benefit, update_benefit, delete_benefit,
    
    # Training functions
    get_training_by_id, get_all_trainings, get_training,
    create_training, update_training, delete_training,
    
    # Training Enrollment functions
    get_training_enrollment_by_id, get_all_training_enrollments, get_training_enrollments,
    create_training_enrollment, update_training_enrollment, delete_training_enrollment,
    
    # Application functions
    get_application_by_id, get_all_applications, get_applications,
    create_application, update_application, delete_application,
    
    # Supplier functions
    get_supplier_by_id, get_supplier_by_code, get_all_suppliers, get_suppliers, get_active_suppliers,
    create_supplier, update_supplier, delete_supplier,
    
    # HRM Dashboard functions
    get_hrm_dashboard_data
)

from ..api.v1.healthcare.doctors.logic import (
    get_doctor_by_id,
    get_doctor_by_pmdc,
    get_doctors,
    get_doctors_count,
    create_doctor,
    update_doctor,
    delete_doctor,
)
from ..api.v1.healthcare.patients.logic import (
    get_patient_by_id,
    get_patients,
    get_patients_count,
    create_patient,
    update_patient,
    delete_patient,
)
from ..api.v1.healthcare.staff.logic import (
    get_healthcare_staff_by_id,
    get_healthcare_staff,
    get_healthcare_staff_count,
    insert_healthcare_staff as create_healthcare_staff,
    patch_healthcare_staff as update_healthcare_staff,
)
from ..api.v1.healthcare.appointments.logic import (
    get_appointment_by_id,
    get_appointments,
    get_appointments_count,
    create_appointment,
    update_appointment,
    delete_appointment,
)
from ..api.v1.healthcare.prescriptions.logic import (
    get_prescription_by_id,
    get_prescriptions,
    get_prescriptions_count,
    create_prescription,
    update_prescription,
    delete_prescription,
)
from ..api.v1.healthcare.expense_categories.logic import (
    get_expense_category_by_id,
    get_expense_categories,
    get_expense_categories_count,
    create_expense_category,
    update_expense_category,
    delete_expense_category,
)
from ..api.v1.healthcare.daily_expenses.logic import (
    get_daily_expense_by_id,
    get_daily_expenses,
    get_daily_expenses_count,
    create_daily_expense,
    update_daily_expense,
    delete_daily_expense,
)
from ..api.v1.healthcare.admissions.logic import (
    get_admission_by_id,
    get_admissions,
    get_admissions_count,
    create_admission,
    update_admission,
    delete_admission,
)

from .inventory_crud import (
    # Product functions
    get_product_by_id, get_product_by_sku, get_product_by_barcode, get_all_products, get_products, get_products_by_category, get_low_stock_products,
    create_product, update_product, delete_product,
    
    # Warehouse functions
    get_warehouse_by_id, get_warehouse_by_code, get_all_warehouses, get_warehouses, get_active_warehouses,
    create_warehouse, update_warehouse, delete_warehouse,
    
    # StorageLocation functions
    get_storage_locations, get_storage_locations_by_warehouse, get_storage_location_by_id, create_storage_location, update_storage_location, delete_storage_location,
    
    # Stock Movement functions
    get_stock_movements, get_stock_movement_by_id, create_stock_movement, update_stock_movement, delete_stock_movement,
    
    # PurchaseOrder functions
    get_purchase_order_by_id, get_purchase_order_by_number, get_all_purchase_orders, get_purchase_orders,
    get_purchase_orders_by_status, get_purchase_orders_by_supplier,
    create_purchase_order, update_purchase_order, delete_purchase_order,
    
    # Receiving functions
    get_receiving_by_id, get_receiving_by_number, get_all_receivings, get_receivings, get_receivings_by_purchase_order,
    create_receiving, update_receiving, delete_receiving,
    
    # Inventory dashboard functions
    get_inventory_dashboard_stats
)

from ..api.v1.invoices.items.logic import (
    get_invoice_by_id, get_invoice_by_number, get_all_invoices, get_invoices, get_invoices_by_status,
    get_invoices_by_customer, get_overdue_invoices, create_invoice, update_invoice, delete_invoice,
)
from ..api.v1.invoices.payments.logic import (
    get_payment_by_id, get_all_payments, get_payments, get_payments_by_invoice, get_payments_by_status,
    create_payment, update_payment, delete_payment,
)
from ..api.v1.invoices.dashboard.logic import get_invoice_dashboard_data

from ..api.v1.pos.shifts.logic import (
    get_pos_shift_by_id, get_all_pos_shifts, get_pos_shifts, get_open_pos_shift,
    create_pos_shift, update_pos_shift, delete_pos_shift,
)
from ..api.v1.pos.transactions.logic import (
    get_pos_transaction_by_id, get_all_pos_transactions, get_pos_transactions,
    get_pos_transactions_by_shift, get_pos_transactions_by_date_range,
    create_pos_transaction, update_pos_transaction, delete_pos_transaction,
)
from ..api.v1.pos.categories.logic import (
    get_pos_categories, get_pos_category_by_id, get_pos_category_by_name,
    create_pos_category, delete_pos_category,
)
from ..api.v1.pos.dashboard.logic import get_pos_dashboard_data

from .reports_crud import (
    get_reports_dashboard_data,
    get_project_analytics, get_financial_analytics
)

from .custom_options_crud import (
    # CustomEventType functions
    get_custom_event_type_by_id, get_all_custom_event_types, get_active_custom_event_types,
    create_custom_event_type, update_custom_event_type, delete_custom_event_type,
    
    # CustomDepartment functions
    get_custom_department_by_id, get_all_custom_departments, get_active_custom_departments,
    create_custom_department, update_custom_department, delete_custom_department,
    
    # CustomLeaveType functions
    get_custom_leave_type_by_id, get_all_custom_leave_types, get_active_custom_leave_types,
    create_custom_leave_type, update_custom_leave_type, delete_custom_leave_type,
    
    # CustomLeadSource functions
    get_custom_lead_source_by_id, get_all_custom_lead_sources, get_active_custom_lead_sources,
    create_custom_lead_source, update_custom_lead_source, delete_custom_lead_source,
    
    # CustomContactSource functions
    get_custom_contact_source_by_id, get_all_custom_contact_sources, get_active_custom_contact_sources,
    create_custom_contact_source, update_custom_contact_source, delete_custom_contact_source,
    
    # CustomCompanyIndustry functions
    get_custom_company_industry_by_id, get_all_custom_company_industries, get_active_custom_company_industries,
    create_custom_company_industry, update_custom_company_industry, delete_custom_company_industry,
    
    # CustomContactType functions
    get_custom_contact_type_by_id, get_all_custom_contact_types, get_active_custom_contact_types,
    create_custom_contact_type, update_custom_contact_type, delete_custom_contact_type,
    
    # CustomIndustry functions
    get_custom_industry_by_id, get_all_custom_industries, get_active_custom_industries,
    create_custom_industry, update_custom_industry, delete_custom_industry
)

from .audit_crud import (
    # AuditLog functions
    get_audit_log_by_id, get_all_audit_logs, get_audit_logs_by_event_type, get_audit_logs_by_severity,
    get_audit_logs_by_resource, create_audit_log, update_audit_log, delete_audit_log,
    get_audit_logs_by_date_range, get_audit_logs_by_action, get_failed_audit_logs,
    
    # Permission functions
    get_permission_by_code, get_all_permissions, create_permission, update_permission, delete_permission,
    get_permissions_by_codes, get_permissions,
    
    # CustomRole functions
    get_custom_role_by_id, get_custom_role_by_name, get_all_custom_roles,
    create_custom_role, update_custom_role, delete_custom_role, get_custom_roles_by_permission,
    get_custom_roles,
    
    # Audit statistics functions
    get_audit_statistics
)

from .event_crud import (
    # Event functions
    get_event_by_id, get_all_events, get_events_by_project, get_events_by_user,
    get_upcoming_events, create_event, update_event, delete_event,
    get_events_by_status, get_events_by_type, search_events
)

# Export all models and functions for backward compatibility
__all__ = [
    # Database configuration
    'engine', 'SessionLocal', 'Base', 'create_tables', 'get_db',
    
    # Models
    'User', 'Tenant', 'Plan', 'Subscription', 'TenantUser', 'project_team_members',
    'Project', 'Task',
    'Lead', 'Contact', 'Company', 'Opportunity', 'SalesActivity',
    'Quote', 'Contract',
    'Employee', 'JobPosting', 'PerformanceReview', 'TimeEntry', 'LeaveRequest', 'Payroll', 'Benefits',
    'Training', 'TrainingEnrollment', 'Application',
    'Product', 'Warehouse', 'Supplier', 'PurchaseOrder', 'Receiving',
    'StorageLocation', 'StockMovement',
    'Invoice', 'Payment',
    'POSShift', 'POSTransaction', 'PosProductCategory',
    'Vehicle',
    'CustomEventType', 'CustomDepartment', 'CustomLeaveType', 'CustomLeadSource',
    'CustomContactSource', 'CustomCompanyIndustry', 'CustomContactType', 'CustomIndustry',
    'AuditLog', 'Permission', 'CustomRole',
    'Event', 'EventType', 'EventStatus', 'RecurrenceType',
    'ChartOfAccounts', 'LedgerTransaction', 'JournalEntry', 
    'FinancialPeriod', 'Budget', 'BudgetItem',
    'Investment', 'EquipmentInvestment', 'InvestmentTransaction',
    
    # All CRUD functions are also exported
]
