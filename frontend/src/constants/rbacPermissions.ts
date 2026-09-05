export interface PermissionOption {
  label: string;
  value: string;
}

export interface PermissionSubmodule {
  label: string;
  permissions: PermissionOption[];
}

export interface PermissionModule {
  label: string;
  permissions: PermissionOption[];
  submodules: PermissionSubmodule[];
}

const crud = (prefix: string): PermissionOption[] => [
  { label: "View", value: `${prefix}:view` },
  { label: "Create", value: `${prefix}:create` },
  { label: "Update", value: `${prefix}:update` },
  { label: "Delete", value: `${prefix}:delete` },
];

export const RBAC_PERMISSION_MODULES: PermissionModule[] = [
  {
    label: "CRM",
    permissions: crud("crm"),
    submodules: [
      {
        label: "Dashboard",
        permissions: [{ label: "View", value: "crm:dashboard:view" }],
      },
      { label: "Customers", permissions: crud("crm:customers") },
      { label: "Companies", permissions: crud("crm:companies") },
      { label: "Contacts", permissions: crud("crm:contacts") },
      { label: "Leads", permissions: crud("crm:leads") },
      { label: "Opportunities", permissions: crud("crm:opportunities") },
      { label: "Activities", permissions: crud("crm:activities") },
    ],
  },
  {
    label: "Sales",
    permissions: crud("sales"),
    submodules: [
      { label: "Quotes", permissions: crud("sales:quotes") },
      { label: "Contracts", permissions: crud("sales:contracts") },
      {
        label: "Analytics",
        permissions: [{ label: "View", value: "sales:analytics:view" }],
      },
      { label: "Invoices", permissions: crud("sales:invoices") },
      {
        label: "Invoice Dashboard",
        permissions: [{ label: "View", value: "sales:invoice_dashboard:view" }],
      },
      { label: "Installments", permissions: crud("sales:installments") },
      { label: "Delivery Notes", permissions: crud("sales:delivery_notes") },
    ],
  },
  {
    label: "HRM",
    permissions: crud("hrm"),
    submodules: [
      { label: "Employees", permissions: crud("hrm:employees") },
      { label: "Job Postings", permissions: crud("hrm:jobs") },
      { label: "Performance Reviews", permissions: crud("hrm:reviews") },
      { label: "Leave Management", permissions: crud("hrm:leave_requests") },
      { label: "Training", permissions: crud("hrm:training") },
      { label: "Payroll", permissions: crud("hrm:payroll") },
      { label: "Suppliers", permissions: crud("hrm:suppliers") },
    ],
  },
  {
    label: "Inventory",
    permissions: crud("inventory"),
    submodules: [
      { label: "Warehouses", permissions: crud("inventory:warehouses") },
      {
        label: "Storage Locations",
        permissions: crud("inventory:storage_locations"),
      },
      {
        label: "Stock Movements",
        permissions: crud("inventory:stock_movements"),
      },
      {
        label: "Purchase Orders",
        permissions: crud("inventory:purchase_orders"),
      },
      { label: "Receiving", permissions: crud("inventory:receiving") },
      { label: "Products", permissions: crud("inventory:products") },
      { label: "Stock Alerts", permissions: crud("inventory:alerts") },
      { label: "Dumps", permissions: crud("inventory:dumps") },
      {
        label: "Return from Customer",
        permissions: crud("inventory:customer_returns"),
      },
      {
        label: "Return to Supplier",
        permissions: crud("inventory:supplier_returns"),
      },
    ],
  },
  {
    label: "Projects",
    permissions: crud("projects"),
    submodules: [
      { label: "Projects", permissions: crud("projects:projects") },
      { label: "Tasks", permissions: crud("projects:tasks") },
      { label: "Team Members", permissions: crud("projects:team_members") },
      { label: "Time Tracking", permissions: crud("projects:time_tracking") },
    ],
  },
  {
    label: "Production",
    permissions: crud("production"),
    submodules: [
      { label: "Job Cards", permissions: crud("production:job_cards") },
      { label: "Vehicles", permissions: crud("production:vehicles") },
    ],
  },
  {
    label: "Quality",
    permissions: crud("quality"),
    submodules: [
      {
        label: "Quality Control",
        permissions: crud("quality:quality_control"),
      },
    ],
  },
  {
    label: "Banking",
    permissions: crud("banking"),
    submodules: [
      { label: "Accounts", permissions: crud("banking:accounts") },
      { label: "Transactions", permissions: crud("banking:transactions") },
      { label: "Reconciliation", permissions: crud("banking:reconciliation") },
    ],
  },
  {
    label: "Ledger",
    permissions: crud("ledger"),
    submodules: [
      {
        label: "Profit & Loss",
        permissions: [{ label: "View", value: "ledger:profit_loss:view" }],
      },
      { label: "Investments", permissions: crud("ledger:investments") },
      { label: "Transactions", permissions: crud("ledger:transactions") },
      {
        label: "Account Receivables",
        permissions: crud("ledger:account_receivables"),
      },
      {
        label: "Reports",
        permissions: [{ label: "View", value: "ledger:reports:view" }],
      },
    ],
  },
  {
    label: "Workshop",
    permissions: crud("workshop"),
    submodules: [
      { label: "Customers", permissions: crud("workshop:customers") },
      { label: "Job Cards", permissions: crud("workshop:job_cards") },
      { label: "Vehicles", permissions: crud("workshop:vehicles") },
      {
        label: "Quality Control",
        permissions: crud("workshop:quality_control"),
      },
    ],
  },
  {
    label: "MOT",
    permissions: [],
    submodules: [
      { label: "Bookings", permissions: crud("mot:bookings") },
      {
        label: "Settings",
        permissions: [
          { label: "View", value: "mot:settings:view" },
          { label: "Update", value: "mot:settings:update" },
        ],
      },
    ],
  },
  {
    label: "Notifications",
    permissions: [{ label: "View", value: "notifications:view" }],
    submodules: [],
  },
  {
    label: "POS",
    permissions: crud("pos"),
    submodules: [
      { label: "Sale", permissions: crud("pos:sale") },
      { label: "Products", permissions: crud("pos:products") },
      { label: "Transactions", permissions: crud("pos:transactions") },
      { label: "Shifts", permissions: crud("pos:shifts") },
      {
        label: "Reports",
        permissions: [{ label: "View", value: "pos:reports:view" }],
      },
    ],
  },
  {
    label: "Healthcare",
    permissions: crud("healthcare"),
    submodules: [
      { label: "Appointments", permissions: crud("healthcare:appointments") },
      { label: "Patients", permissions: crud("healthcare:patients") },
      { label: "Doctors", permissions: crud("healthcare:doctors") },
      { label: "Staff", permissions: crud("healthcare:staff") },
      { label: "Admissions", permissions: crud("healthcare:admissions") },
      { label: "Expenses", permissions: crud("healthcare:expenses") },
    ],
  },
  {
    label: "NGO",
    permissions: crud("ngo"),
    submodules: [
      { label: "Donors", permissions: crud("ngo:donors") },
      { label: "Donor Leads", permissions: crud("ngo:donor_leads") },
      { label: "Donor Contacts", permissions: crud("ngo:donor_contacts") },
      {
        label: "Partner Organizations",
        permissions: crud("ngo:partner-organizations"),
      },
    ],
  },
  {
    label: "Dashboard",
    permissions: [{ label: "View", value: "dashboard:view" }],
    submodules: [],
  },
  {
    label: "Users",
    permissions: crud("users"),
    submodules: [],
  },
  {
    label: "Reports",
    permissions: [
      { label: "View", value: "reports:view" },
      { label: "Export", value: "reports:export" },
    ],
    submodules: [],
  },
  {
    label: "Events",
    permissions: crud("events"),
    submodules: [],
  },
];

export const SIDEBAR_PATH_PERMISSIONS: Record<string, string> = {
  "/dashboard": "dashboard:view",
  "/crm": "crm:dashboard:view",
  "/crm/customers": "crm:customers:view",
  "/workshop-management/customers": "crm:customers:view",
  "/workshop-management/job-cards": "production:job_cards:view",
  "/workshop-management/vehicles": "production:vehicles:view",
  "/workshop-management/quality-control": "quality:quality_control:view",
  "/crm/companies": "crm:companies:view",
  "/crm/contacts": "crm:contacts:view",
  "/crm/leads": "crm:leads:view",
  "/crm/opportunities": "crm:opportunities:view",
  "/sales/quotes": "sales:quotes:view",
  "/sales/contracts": "sales:contracts:view",
  "/sales/analytics": "sales:analytics:view",
  "/sales/invoices": "sales:invoices:create",
  "/invoices": "sales:invoices:create",
  "/sales/invoice-dashboard": "sales:invoice_dashboard:view",
  "/sales/installments": "sales:installments:view",
  "/sales/delivery-notes": "sales:delivery_notes:view",
  "/inventory/warehouses": "inventory:warehouses:view",
  "/inventory/storage-locations": "inventory:storage_locations:view",
  "/inventory/stock-movements": "inventory:stock_movements:view",
  "/inventory/purchase-orders": "inventory:purchase_orders:view",
  "/inventory/receiving": "inventory:receiving:view",
  "/inventory/products": "inventory:products:view",
  "/inventory/alerts": "inventory:alerts:view",
  "/inventory/dumps": "inventory:dumps:view",
  "/inventory/customer-returns": "inventory:customer_returns:view",
  "/inventory/supplier-returns": "inventory:supplier_returns:view",
  "/hrm/employees": "hrm:employees:view",
  "/hrm/job-postings": "hrm:jobs:view",
  "/hrm/performance-reviews": "hrm:reviews:view",
  "/hrm/leave-management": "hrm:leave_requests:view",
  "/hrm/training": "hrm:training:view",
  "/hrm/payroll": "hrm:payroll:view",
  "/hrm/suppliers": "hrm:suppliers:view",
  "/projects": "projects:projects:view",
  "/tasks": "projects:tasks:view",
  "/team": "projects:team_members:view",
  "/time-tracking": "projects:time_tracking:view",
  "/banking": "banking:accounts:view",
  "/banking/accounts": "banking:accounts:view",
  "/banking/transactions": "banking:transactions:view",
  "/banking/reconciliation": "banking:reconciliation:view",
  "/ledger": "ledger:transactions:view",
  "/ledger/profit-loss": "ledger:profit_loss:view",
  "/ledger/investments": "ledger:investments:view",
  "/ledger/transactions": "ledger:transactions:view",
  "/ledger/account-receivables": "ledger:account_receivables:view",
  "/ledger/reports": "ledger:reports:view",
  "/settings": "users:view",
  "/pos/sale": "pos:sale:view",
  "/pos/products": "pos:products:view",
  "/pos/transactions": "pos:transactions:view",
  "/pos/shifts": "pos:shifts:view",
  "/pos/reports": "pos:reports:view",
  "/users": "users:view",
  "/reports": "reports:view",
  "/events": "events:view",
};
