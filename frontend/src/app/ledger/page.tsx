"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ModuleGuard } from "@/src/components/guards/PermissionGuard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Calculator,
  BookOpen,
  FileText,
  PieChart,
  Plus,
  Eye,
  X,
  BarChart3,
} from "lucide-react";
import { LedgerService } from "@/src/services/ledgerService";
import DashboardLayout from "@/src/components/layout/DashboardLayout";
import { toast } from "sonner";
import {
  LedgerTransactionResponse,
  BudgetResponse,
  TrialBalanceResponse,
  TrialBalanceAccount,
  IncomeStatementResponse,
  AccountType,
  TransactionType,
  getAccountTypeLabel,
  getTransactionTypeLabel,
  getAccountTypeColor,
} from "@/src/models/ledger";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { useCachedApi, useCacheManager } from "../../hooks/useCachedApi";
import { useCrudPermissions } from "@/src/hooks/usePermissions";
import {
  DEFAULT_CHART_OF_ACCOUNTS,
  getAccountTypeCount as getAccountTypeCountFromConstants,
  getTotalBalanceByType,
} from "../../constants/chartOfAccounts";

export default function LedgerDashboard() {
  return (
    <ModuleGuard
      module="ledger"
      fallback={<div>You don&apos;t have access to Ledger module</div>}
    >
      <LedgerDashboardContent />
    </ModuleGuard>
  );
}

function LedgerDashboardContent() {
  const { canCreate } = useCrudPermissions("ledger:transactions");
  const { formatCurrency } = useCurrency();
  const { clearCache: clearAllCache } = useCacheManager();

  const chartOfAccounts = DEFAULT_CHART_OF_ACCOUNTS;
  const accountsLoading = false;

  const {
    data: recentTransactions,
    loading: transactionsLoading,
    refetch: refetchTransactions,
  } = useCachedApi<LedgerTransactionResponse[]>(
    "ledger_recent_transactions",
    () => LedgerService.getLedgerTransactions(10),
    { ttl: 60000 },
  );

  const {
    data: activeBudgets,
    loading: budgetsLoading,
    refetch: refetchBudgets,
  } = useCachedApi<BudgetResponse[]>(
    "ledger_active_budgets",
    () => LedgerService.getActiveBudgets(),
    { ttl: 300000 },
  );

  const {
    data: trialBalance,
    loading: trialBalanceLoading,
    refetch: refetchTrialBalance,
  } = useCachedApi<TrialBalanceResponse>(
    "ledger_trial_balance",
    () => LedgerService.getTrialBalance(),
    { ttl: 300000 },
  );

  const {
    data: incomeStatement,
    loading: incomeStatementLoading,
    refetch: refetchIncomeStatement,
  } = useCachedApi<IncomeStatementResponse>(
    "ledger_income_statement",
    () => LedgerService.getIncomeStatement(),
    { ttl: 300000 },
  );

  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [totalEquity, setTotalEquity] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netIncome, setNetIncome] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [showJournalEntryModal, setShowJournalEntryModal] = useState(false);
  const [showAccountBalanceModal, setShowAccountBalanceModal] = useState(false);

  const [journalEntryForm, setJournalEntryForm] = useState({
    entryNumber: "",
    description: "",
    entryDate: new Date().toISOString().split("T")[0],
  });

  const [accountBalanceForm, setAccountBalanceForm] = useState({
    accountId: "",
    asOfDate: new Date().toISOString().split("T")[0],
  });

  React.useEffect(() => {
    const assets = getTotalBalanceByType("asset");
    const liabilities = getTotalBalanceByType("liability");
    const equity = getTotalBalanceByType("equity");

    setTotalAssets(assets);
    setTotalLiabilities(liabilities);
    setTotalEquity(equity);
  }, []);

  React.useEffect(() => {
    const revenue = getTotalBalanceByType("revenue");
    const expenses = getTotalBalanceByType("expense");
    const netIncome = revenue - expenses;

    setTotalRevenue(revenue);
    setTotalExpenses(expenses);
    setNetIncome(netIncome);
  }, []);

  React.useEffect(() => {
    setError(null);
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleReset = () => {
    setError(null);
    clearAllCache("ledger");
    refetchTransactions();
    refetchBudgets();
    refetchTrialBalance();
    refetchIncomeStatement();
  };

  const handleJournalEntry = () => {
    setShowJournalEntryModal(true);
  };
  const handleAccountBalance = () => {
    setShowAccountBalanceModal(true);
  };

  const closeJournalEntryModal = () => {
    setShowJournalEntryModal(false);
    setJournalEntryForm({
      entryNumber: "",
      description: "",
      entryDate: new Date().toISOString().split("T")[0],
    });
  };

  const closeAccountBalanceModal = () => {
    setShowAccountBalanceModal(false);
    setAccountBalanceForm({
      accountId: "",
      asOfDate: new Date().toISOString().split("T")[0],
    });
  };

  const handleJournalEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!journalEntryForm.description) {
        toast.error("Please fill in the description");
        return;
      }

      const journalData = {
        description: journalEntryForm.description,
        entry_date: journalEntryForm.entryDate,
        reference_number: journalEntryForm.entryNumber || undefined,
      };

      await LedgerService.createJournalEntry(journalData);
      toast.success("Journal entry created successfully!");
      closeJournalEntryModal();
      handleRefresh();
    } catch (error) {
      toast.error("Failed to create journal entry. Please try again.");
    }
  };

  const handleAccountBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!accountBalanceForm.accountId) {
        toast.error("Please select an account");
        return;
      }

      const balance = await LedgerService.getAccountBalance(
        accountBalanceForm.accountId,
        accountBalanceForm.asOfDate,
      );

      const account = chartOfAccounts?.find(
        (acc) => acc.id === accountBalanceForm.accountId,
      );
      toast.success("Account balance", {
        description: `${account?.account_name ?? "Account"} · As of ${accountBalanceForm.asOfDate} · Balance ${formatCurrency(balance.balance)}`,
      });
      closeAccountBalanceModal();
    } catch (error) {
      toast.error("Failed to get account balance. Please try again.");
    }
  };

  const getAccountTypeCount = (type: AccountType) => {
    return getAccountTypeCountFromConstants(type.toLowerCase());
  };

  if (
    accountsLoading ||
    transactionsLoading ||
    budgetsLoading ||
    trialBalanceLoading ||
    incomeStatementLoading
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading ledger data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Ledger
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <Button onClick={handleRefresh} className="mr-2">
              Try Again
            </Button>
            <Button variant="outline" onClick={handleReset} className="mr-2">
              Reset State
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Financial Ledger
            </h1>
            <p className="text-gray-600">
              Complete financial management and accounting system
            </p>
          </div>
          <div className="flex space-x-2">
            {canCreate() && (
              <Button size="sm" asChild>
                <Link href="/ledger/transactions">
                  <Plus className="w-4 h-4 mr-2" />
                  New Transaction
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Assets
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalAssets)}
              </div>
              <p className="text-xs text-muted-foreground">
                {getAccountTypeCount(AccountType.ASSET)} asset accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Liabilities
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalLiabilities)}
              </div>
              <p className="text-xs text-muted-foreground">
                {getAccountTypeCount(AccountType.LIABILITY)} liability accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Income</CardTitle>
              <Calculator className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(netIncome)}
              </div>
              <p className="text-xs text-muted-foreground">
                Revenue: {formatCurrency(totalRevenue)} | Expenses:{" "}
                {formatCurrency(totalExpenses)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Equity
              </CardTitle>
              <Calculator className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalEquity)}
              </div>
              <p className="text-xs text-muted-foreground">
                {getAccountTypeCount(AccountType.EQUITY)} equity accounts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
            <TabsTrigger value="reports">Financial Reports</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Recent Transactions
                  </CardTitle>
                  <CardDescription>
                    Latest financial transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.isArray(recentTransactions) &&
                      recentTransactions.slice(0, 5).map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              {transaction.description}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transaction.transaction_number} •{" "}
                              {new Date(
                                transaction.transaction_date,
                              ).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {formatCurrency(transaction.amount)}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {getTransactionTypeLabel(
                                transaction.transaction_type as TransactionType,
                              )}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link href="/ledger/transactions">
                      <Eye className="w-4 h-4 mr-2" />
                      View All Transactions
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Account Types Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="w-5 h-5 mr-2" />
                    Account Distribution
                  </CardTitle>
                  <CardDescription>Chart of accounts by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.values(AccountType).map((type: AccountType) => {
                      const count = getAccountTypeCount(type);
                      const total = chartOfAccounts?.length || 0;
                      const percentage =
                        total > 0 ? ((count / total) * 100).toFixed(1) : "0";

                      return (
                        <div
                          key={String(type)}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-3 h-3 rounded-full mr-3 ${getAccountTypeColor(type).replace("text-", "bg-")}`}
                            ></div>
                            <span className="font-medium">
                              {getAccountTypeLabel(type)}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{count}</div>
                            <div className="text-sm text-gray-500">
                              {percentage}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common financial tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {canCreate() && (
                    <Button variant="outline" className="h-20 flex-col" asChild>
                      <Link href="/ledger/transactions">
                        <Plus className="w-6 h-6 mb-2" />
                        New Transaction
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={handleJournalEntry}
                  >
                    <BookOpen className="w-6 h-6 mb-2" />
                    Journal Entry
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={handleAccountBalance}
                  >
                    <Calculator className="w-6 h-6 mb-2" />
                    Account Balance
                  </Button>
                </div>

                {/* Chart of Accounts Info */}
                <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-800 mb-2">
                        Chart of Accounts Ready
                      </h3>
                      <p className="text-blue-700 mb-4">
                        Your chart of accounts is set up with{" "}
                        {chartOfAccounts.length} default accounts. All standard
                        accounting categories are available for transactions.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chart of Accounts Tab */}
          <TabsContent value="accounts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Chart of Accounts</CardTitle>
                <CardDescription>
                  Complete list of financial accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Code</th>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Category</th>
                        <th className="text-right p-2">Balance</th>
                        <th className="text-center p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(chartOfAccounts) &&
                        chartOfAccounts.map((account) => (
                          <tr
                            key={account.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-2 font-mono">
                              {account.account_code}
                            </td>
                            <td className="p-2 font-medium">
                              {account.account_name}
                            </td>
                            <td className="p-2">
                              <Badge
                                variant="outline"
                                className={getAccountTypeColor(
                                  account.account_type as AccountType,
                                )}
                              >
                                {getAccountTypeLabel(
                                  account.account_type as AccountType,
                                )}
                              </Badge>
                            </td>
                            <td className="p-2 text-sm text-gray-600">
                              {account.account_category}
                            </td>
                            <td className="p-2 text-right font-medium">
                              {formatCurrency(account.current_balance)}
                            </td>
                            <td className="p-2 text-center">
                              <Badge
                                variant={
                                  account.is_active ? "default" : "secondary"
                                }
                              >
                                {account.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  Latest financial transactions and journal entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(recentTransactions) &&
                    recentTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">
                            {transaction.description}
                          </div>
                          <Badge variant="outline">
                            {getTransactionTypeLabel(
                              transaction.transaction_type as TransactionType,
                            )}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Amount:</span>{" "}
                            {formatCurrency(transaction.amount)}
                          </div>
                          <div>
                            <span className="font-medium">Date:</span>{" "}
                            {new Date(
                              transaction.transaction_date,
                            ).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Reference:</span>{" "}
                            {transaction.reference_number || "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span>{" "}
                            {transaction.status}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profit & Loss Tab */}
          <TabsContent value="profit-loss" className="space-y-6">
            <div className="text-center py-8">
              <BarChart3 className="h-16 w-16 mx-auto text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Profit & Loss Dashboard
              </h3>
              <p className="text-muted-foreground mb-4">
                Comprehensive financial overview with sales, purchases, and
                inventory data
              </p>
              <Button
                onClick={() => window.open("/ledger/profit-loss", "_blank")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Open Profit & Loss Dashboard
              </Button>
            </div>
          </TabsContent>

          {/* Financial Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trial Balance */}
              <Card>
                <CardHeader>
                  <CardTitle>Trial Balance</CardTitle>
                  <CardDescription>
                    Account balances as of today
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {trialBalance ? (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        As of:{" "}
                        {new Date(trialBalance.as_of_date).toLocaleDateString()}
                      </div>
                      <div className="text-lg font-bold">
                        Total Debits:{" "}
                        {formatCurrency(
                          Array.isArray(trialBalance.accounts)
                            ? trialBalance.accounts.reduce(
                                (sum: number, acc: TrialBalanceAccount) =>
                                  sum + (acc.debit_balance || 0),
                                0,
                              )
                            : 0,
                        )}
                      </div>
                      <div className="text-lg font-bold">
                        Total Credits:{" "}
                        {formatCurrency(
                          Array.isArray(trialBalance.accounts)
                            ? trialBalance.accounts.reduce(
                                (sum: number, acc: TrialBalanceAccount) =>
                                  sum + (acc.credit_balance || 0),
                                0,
                              )
                            : 0,
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      No trial balance data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Income Statement Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Income Statement</CardTitle>
                  <CardDescription>
                    Revenue and expenses summary
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {incomeStatement ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Revenue:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(incomeStatement.revenue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expenses:</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(incomeStatement.expenses)}
                        </span>
                      </div>
                      <hr />
                      <div className="flex justify-between font-bold">
                        <span>Net Income:</span>
                        <span
                          className={
                            incomeStatement.net_income >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {formatCurrency(incomeStatement.net_income)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      No income statement data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Budgets Tab */}
          <TabsContent value="budgets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Budgets</CardTitle>
                <CardDescription>
                  Current budget allocations and spending
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(activeBudgets) &&
                    activeBudgets.map((budget) => (
                      <div key={budget.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">
                            {budget.budget_name}
                          </div>
                          <Badge variant="outline">{budget.budget_type}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Total Budget:</span>{" "}
                            {formatCurrency(budget.total_budget)}
                          </div>
                          <div>
                            <span className="font-medium">Spent:</span>{" "}
                            {formatCurrency(budget.spent_amount)}
                          </div>
                          <div>
                            <span className="font-medium">Remaining:</span>{" "}
                            {formatCurrency(budget.remaining_amount)}
                          </div>
                          <div>
                            <span className="font-medium">Utilization:</span>{" "}
                            {(
                              (budget.spent_amount / budget.total_budget) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${(budget.spent_amount / budget.total_budget) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Journal Entry Modal */}
        {showJournalEntryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">New Journal Entry</h3>
                <button
                  onClick={closeJournalEntryModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleJournalEntrySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entry Number
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="JE-001"
                    value={journalEntryForm.entryNumber}
                    onChange={(e) =>
                      setJournalEntryForm({
                        ...journalEntryForm,
                        entryNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Journal entry description"
                    value={journalEntryForm.description}
                    onChange={(e) =>
                      setJournalEntryForm({
                        ...journalEntryForm,
                        description: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={journalEntryForm.entryDate}
                    onChange={(e) =>
                      setJournalEntryForm({
                        ...journalEntryForm,
                        entryDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={closeJournalEntryModal}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Create Entry
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Account Balance Modal */}
        {showAccountBalanceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Check Account Balance</h3>
                <button
                  onClick={closeAccountBalanceModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAccountBalanceSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={accountBalanceForm.accountId}
                    onChange={(e) =>
                      setAccountBalanceForm({
                        ...accountBalanceForm,
                        accountId: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Select account</option>
                    {chartOfAccounts && chartOfAccounts.length > 0 ? (
                      chartOfAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.account_name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No accounts available
                      </option>
                    )}
                  </select>
                  <p className="text-xs text-green-600 mt-1">
                    {chartOfAccounts.length} accounts available
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    As of Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={accountBalanceForm.asOfDate}
                    onChange={(e) =>
                      setAccountBalanceForm({
                        ...accountBalanceForm,
                        asOfDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={closeAccountBalanceModal}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Check Balance
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
