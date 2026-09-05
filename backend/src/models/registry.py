def register_all_models():
    from .platform import (
        PasswordResetToken,
        Plan,
        Subscription,
        Tenant,
        User,
        project_team_members,
    )
    from .rbac import Role, TenantUser

    from .projects import Project, Task
    from .crm import Lead, Contact, Company, Opportunity, SalesActivity, Customer, CustomerGuarantor
    from .crm.lead_related import (
        LeadPipelineHistory,
        LeadNote,
        LeadTask,
        LeadEmail,
        LeadSms,
        LeadCampaign,
        LeadCampaignAssignment,
        LeadListingSearch,
        LeadPropertyView,
        LeadSale,
        LeadAdditionalContact,
        LeadSavedFilter,
    )
    from .crm.agent_portal import AgentSalesTarget, AgentEarnedBadge
    from .crm.client_payment_ledger import ClientPaymentLedger
    from ..config.sales_models import Quote, Contract
    from ..config.hrm_models import (
        Employee,
        JobPosting,
        PerformanceReview,
        TimeEntry,
        LeaveRequest,
        Payroll,
        Benefits,
        Training,
        TrainingEnrollment,
        Application,
        Supplier,
        EmployeeDevice,
    )
    from ..config.notification_models import Notification, NotificationPreference, MobilePushDevice
    from ..config.inventory_models import (
        Product,
        Warehouse,
        PurchaseOrder,
        Receiving,
        StorageLocation,
        StockMovement,
    )
    from ..config.job_card_models import JobCard
    from ..config.vehicle_models import Vehicle
    from ..models.invoices import Invoice, Payment, DeliveryNote, InvoiceShareLink
    from ..config.installment_models import InstallmentPlan, Installment
    from ..config.invoice_customization_models import InvoiceCustomization
    from ..config.ledger_models import (
        ChartOfAccounts,
        LedgerTransaction,
        JournalEntry,
        FinancialPeriod,
        Budget,
        BudgetItem,
        AccountReceivable,
    )
    from ..models.banking import BankAccount, BankTransaction, CashPosition, Till, TillTransaction
    from ..config.investment_models import Investment, EquipmentInvestment, InvestmentTransaction
    from ..models.pos import POSShift, POSTransaction, PosProductCategory
    from ..config.custom_options_models import (
        CustomEventType,
        CustomDepartment,
        CustomLeaveType,
        CustomLeadSource,
        CustomContactSource,
        CustomCompanyIndustry,
        CustomContactType,
        CustomIndustry,
    )
    from ..config.audit_models import AuditLog, Permission, CustomRole
    from ..config.event_models import Event
    from ..config.saved_reports_models import SavedReport
    from ..config.quality_control_models import (
        QualityCheck,
        QualityInspection,
        QualityDefect,
        QualityReport,
    )
    from .healthcare import (
        Doctor,
        HealthcareStaff,
        Appointment,
        Prescription,
        Patient,
        ExpenseCategory,
        DailyExpense,
        Admission,
    )
    from .ngo import Donor, DonorLead, PartnerOrganization
    from .mot import MotBooking, MotSettings

    _ = (
        PasswordResetToken,
        Plan,
        Role,
        Subscription,
        Tenant,
        TenantUser,
        User,
        project_team_members,
        Project,
        Task,
        Lead,
        Contact,
        Company,
        Opportunity,
        SalesActivity,
        Customer,
        CustomerGuarantor,
        AgentSalesTarget,
        AgentEarnedBadge,
        ClientPaymentLedger,
        Quote,
        Contract,
        Employee,
        JobPosting,
        PerformanceReview,
        TimeEntry,
        LeaveRequest,
        Payroll,
        Benefits,
        Training,
        TrainingEnrollment,
        Application,
        Supplier,
        EmployeeDevice,
        Notification,
        NotificationPreference,
        MobilePushDevice,
        Product,
        Warehouse,
        PurchaseOrder,
        Receiving,
        StorageLocation,
        StockMovement,
        JobCard,
        Vehicle,
        Invoice,
        Payment,
        DeliveryNote,
        InvoiceShareLink,
        InstallmentPlan,
        Installment,
        InvoiceCustomization,
        ChartOfAccounts,
        LedgerTransaction,
        JournalEntry,
        FinancialPeriod,
        Budget,
        BudgetItem,
        AccountReceivable,
        BankAccount,
        BankTransaction,
        CashPosition,
        Till,
        TillTransaction,
        Investment,
        EquipmentInvestment,
        InvestmentTransaction,
        POSShift,
        POSTransaction,
        PosProductCategory,
        CustomEventType,
        CustomDepartment,
        CustomLeaveType,
        CustomLeadSource,
        CustomContactSource,
        CustomCompanyIndustry,
        CustomContactType,
        CustomIndustry,
        AuditLog,
        Permission,
        CustomRole,
        Event,
        SavedReport,
        QualityCheck,
        QualityInspection,
        QualityDefect,
        QualityReport,
        Doctor,
        HealthcareStaff,
        Appointment,
        Prescription,
        Patient,
        ExpenseCategory,
        DailyExpense,
        Admission,
        Donor,
        DonorLead,
        PartnerOrganization,
        MotBooking,
        MotSettings,
    )
