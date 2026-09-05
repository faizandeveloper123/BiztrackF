"use client";

import React, { useEffect, useState } from "react";
import { ModuleGuard } from "@/src/components/guards/PermissionGuard";
import { useRouter } from "next/navigation";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/src/components/ui/tabs";
import { Banknote, Wallet, RefreshCw } from "lucide-react";
import { useAuth } from "@/src/contexts/AuthContext";
import { bankingService } from "@/src/services/BankingService";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import {
  BankingDashboard as BankingDashboardType,
  BankAccount,
  BankAccountCreate,
  BankTransaction,
  BankAccountType,
  Till,
} from "@/src/models/banking";
import { DashboardLayout } from "@/src/components/layout";
import { TillManagement } from "@/src/components/banking/TillManagement";
import { BankAccountFormDialog } from "@/src/components/banking/BankAccountFormDialog";
import { BankAccountViewDialog } from "@/src/components/banking/BankAccountViewDialog";
import { BankingDashboardHeader } from "@/src/components/banking/BankingDashboardHeader";
import { BankingSummaryCards } from "@/src/components/banking/BankingSummaryCards";
import { BankingMetricsCards } from "@/src/components/banking/BankingMetricsCards";
import { BankAccountsList } from "@/src/components/banking/BankAccountsList";
import { RecentTransactionsTable } from "@/src/components/banking/RecentTransactionsTable";
import { tillService } from "@/src/services/TillService";
import { toast } from "sonner";
import { extractErrorMessage } from "@/src/utils/errorUtils";

export default function BankingDashboard() {
  return (
    <ModuleGuard
      module="banking"
      fallback={<div>You don&apos;t have access to Banking module</div>}
    >
      <BankingDashboardContent />
    </ModuleGuard>
  );
}

function BankingDashboardContent() {
  const {} = useAuth();
  const { formatCurrency } = useCurrency();
  const router = useRouter();

  const [dashboardData, setDashboardData] =
    useState<BankingDashboardType | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<
    BankTransaction[]
  >([]);
  const [tills, setTills] = useState<Till[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("banks");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewingAccount, setViewingAccount] = useState<BankAccount | null>(
    null,
  );
  const [formData, setFormData] = useState<BankAccountCreate>({
    accountName: "",
    accountNumber: "",
    routingNumber: "",
    bankName: "",
    bankCode: "",
    accountType: BankAccountType.CHECKING,
    currency: "USD",
    currentBalance: 0,
    availableBalance: 0,
    pendingBalance: 0,
    isActive: true,
    isPrimary: false,
    supportsOnlineBanking: false,
    description: "",
    tags: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [dashboard, accounts, allTills] = await Promise.all([
        bankingService.getBankingDashboard(),
        bankingService.getBankAccounts(true),
        tillService.getTills(true),
      ]);

      setDashboardData(dashboard);
      setBankAccounts(accounts || []);
      setRecentTransactions(dashboard?.recentTransactions || []);
      setTills(allTills || []);
    } catch (error) {
      toast.error(
        extractErrorMessage(error, "Failed to load banking dashboard"),
      );
      setBankAccounts([]);
      setRecentTransactions([]);
      setTills([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadDashboardData();
      toast.success("Dashboard refreshed");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to refresh dashboard"));
    } finally {
      setRefreshing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      accountName: "",
      accountNumber: "",
      routingNumber: "",
      bankName: "",
      bankCode: "",
      accountType: BankAccountType.CHECKING,
      currency: "USD",
      currentBalance: 0,
      availableBalance: 0,
      pendingBalance: 0,
      isActive: true,
      isPrimary: false,
      supportsOnlineBanking: false,
      description: "",
      tags: [],
    });
  };

  const handleCreateAccount = async () => {
    // Validation
    if (!formData.accountName.trim()) {
      toast.error("Account Name is required");
      return;
    }
    if (!formData.accountNumber.trim()) {
      toast.error("Account Number is required");
      return;
    }
    if (!formData.bankName.trim()) {
      toast.error("Bank Name is required");
      return;
    }

    try {
      setSubmitting(true);

      await bankingService.createBankAccount(formData);

      toast.success("Bank account created successfully!");
      setShowCreateModal(false);
      resetForm();
      await loadDashboardData();
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to create bank account"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading banking dashboard...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8 space-y-6">
        <BankingDashboardHeader
          activeTab={activeTab}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onAddAccount={() => {
            resetForm();
            setShowCreateModal(true);
          }}
        />

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="banks" className="flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Bank Accounts
            </TabsTrigger>
            <TabsTrigger value="tills" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Till Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="banks" className="space-y-6">
            <BankingSummaryCards
              dashboardData={dashboardData}
              formatCurrency={formatCurrency}
            />

            <BankingMetricsCards
              dashboardData={dashboardData}
              formatCurrency={formatCurrency}
            />

            <BankAccountsList
              accounts={bankAccounts}
              formatCurrency={formatCurrency}
              onView={setViewingAccount}
            />

            <RecentTransactionsTable
              transactions={recentTransactions}
              bankAccounts={bankAccounts}
              formatCurrency={formatCurrency}
              onViewAll={() => router.push("/banking/transactions")}
            />
          </TabsContent>

          <TabsContent value="tills" className="space-y-6">
            <TillManagement tills={tills} onRefresh={loadDashboardData} />
          </TabsContent>
        </Tabs>

        <BankAccountFormDialog
          open={showCreateModal}
          mode="create"
          title="Add Bank Account"
          description="Create a new bank account to track your finances."
          formData={formData}
          submitting={submitting}
          onOpenChange={setShowCreateModal}
          onFormDataChange={setFormData}
          onSubmit={handleCreateAccount}
        />

        <BankAccountViewDialog
          account={viewingAccount}
          formatCurrency={formatCurrency}
          onClose={() => setViewingAccount(null)}
          footerActionLabel="Manage Account"
          onFooterAction={() => {
            setViewingAccount(null);
            router.push("/banking/accounts");
          }}
        />
      </div>
    </DashboardLayout>
  );
}
