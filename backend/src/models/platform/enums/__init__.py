from enum import Enum


class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    PROJECT_MANAGER = "project_manager"
    TEAM_MEMBER = "team_member"
    CLIENT = "client"
    SALES_MANAGER = "sales_manager"
    SALES_REPRESENTATIVE = "sales_representative"


class TenantRole(str, Enum):
    OWNER = "owner"
    CRM_MANAGER = "crm_manager"
    HRM_MANAGER = "hrm_manager"
    INVENTORY_MANAGER = "inventory_manager"
    FINANCE_MANAGER = "finance_manager"
    PROJECT_MANAGER = "project_manager"
    PRODUCTION_MANAGER = "production_manager"
    QUALITY_MANAGER = "quality_manager"


class ModulePermission(str, Enum):
    CRM_VIEW = "crm:view"
    CRM_CREATE = "crm:create"
    CRM_UPDATE = "crm:update"
    CRM_DELETE = "crm:delete"
    HRM_VIEW = "hrm:view"
    HRM_CREATE = "hrm:create"
    HRM_UPDATE = "hrm:update"
    HRM_DELETE = "hrm:delete"
    INVENTORY_VIEW = "inventory:view"
    INVENTORY_CREATE = "inventory:create"
    INVENTORY_UPDATE = "inventory:update"
    INVENTORY_DELETE = "inventory:delete"
    FINANCE_VIEW = "finance:view"
    FINANCE_CREATE = "finance:create"
    FINANCE_UPDATE = "finance:update"
    FINANCE_DELETE = "finance:delete"
    SALES_VIEW = "sales:view"
    SALES_CREATE = "sales:create"
    SALES_UPDATE = "sales:update"
    SALES_DELETE = "sales:delete"
    PROJECTS_VIEW = "projects:view"
    PROJECTS_CREATE = "projects:create"
    PROJECTS_UPDATE = "projects:update"
    PROJECTS_DELETE = "projects:delete"
    PRODUCTION_VIEW = "production:view"
    PRODUCTION_CREATE = "production:create"
    PRODUCTION_UPDATE = "production:update"
    PRODUCTION_DELETE = "production:delete"
    QUALITY_VIEW = "quality:view"
    QUALITY_CREATE = "quality:create"
    QUALITY_UPDATE = "quality:update"
    QUALITY_DELETE = "quality:delete"
    BANKING_VIEW = "banking:view"
    BANKING_CREATE = "banking:create"
    BANKING_UPDATE = "banking:update"
    BANKING_DELETE = "banking:delete"
    EVENTS_VIEW = "events:view"
    EVENTS_CREATE = "events:create"
    EVENTS_UPDATE = "events:update"
    EVENTS_DELETE = "events:delete"
    USERS_VIEW = "users:view"
    USERS_CREATE = "users:create"
    USERS_UPDATE = "users:update"
    USERS_DELETE = "users:delete"
    REPORTS_VIEW = "reports:view"
    REPORTS_EXPORT = "reports:export"
    HEALTHCARE_VIEW = "healthcare:view"
    HEALTHCARE_CREATE = "healthcare:create"
    HEALTHCARE_UPDATE = "healthcare:update"
    HEALTHCARE_DELETE = "healthcare:delete"
    NGO_VIEW = "ngo:view"
    NGO_CREATE = "ngo:create"
    NGO_UPDATE = "ngo:update"
    NGO_DELETE = "ngo:delete"


class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    TRIAL = "trial"


class PlanType(str, Enum):
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"
    AGENCY = "agency"
    COMMERCE = "commerce"
    WORKSHOP = "workshop"
    HEALTHCARE = "healthcare"


class PlanFeature(str, Enum):
    UNLIMITED_PROJECTS = "unlimited_projects"
    ADVANCED_REPORTING = "advanced_reporting"
    CUSTOM_INTEGRATIONS = "custom_integrations"
    PRIORITY_SUPPORT = "priority_support"
    CUSTOM_BRANDING = "custom_branding"
    API_ACCESS = "api_access"
    ADVANCED_PERMISSIONS = "advanced_permissions"
    AUDIT_LOGS = "audit_logs"
    INVENTORY_MANAGEMENT = "Inventory Management"
    POINT_OF_SALE = "Point of Sale (POS)"
    CRM = "Customer Relationship Management (CRM)"
    SALES_INVOICING = "Sales & Invoicing"
    PURCHASE_ORDERS = "Purchase Orders"
    WAREHOUSE_MANAGEMENT = "Warehouse Management"
    FINANCIAL_REPORTS = "Financial Reports"
    MULTI_LOCATION_SUPPORT = "Multi-location Support"
    ECOMMERCE_INTEGRATION = "E-commerce Integration"
    BARCODE_SCANNING = "Barcode Scanning"
    CUSTOMER_PORTAL = "Customer Portal"
    EMAIL_MARKETING = "Email Marketing"
    PROJECT_MANAGEMENT = "Project Management"
    QUALITY_CONTROL = "Quality Control"
    TIME_TRACKING = "Time Tracking"
    RESOURCE_ALLOCATION = "Resource Allocation"
    COST_ANALYSIS = "Cost Analysis"
    SUPPLIER_MANAGEMENT = "Supplier Management"
    WORKFORCE_MANAGEMENT = "Workforce Management"
    SAFETY_COMPLIANCE = "Safety Compliance"
    PATIENT_MANAGEMENT = "Patient Management"
    APPOINTMENT_SCHEDULING = "Appointment Scheduling"
    ELECTRONIC_HEALTH_RECORDS = "Electronic Health Records (EHR)"
    BILLING_INSURANCE = "Billing & Insurance"
    STAFF_MANAGEMENT = "Staff Management"
    COMPLIANCE_HIPAA = "Compliance & HIPAA"
    REPORTING_ANALYTICS = "Reporting & Analytics"
    TELEMEDICINE_SUPPORT = "Telemedicine Support"
    LAB_MANAGEMENT = "Lab Management"
    PHARMACY_INTEGRATION = "Pharmacy Integration"
    MEDICAL_DEVICE_TRACKING = "Medical Device Tracking"


__all__ = [
    "UserRole",
    "TenantRole",
    "ModulePermission",
    "SubscriptionStatus",
    "PlanType",
    "PlanFeature",
]
