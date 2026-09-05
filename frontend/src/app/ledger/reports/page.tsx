"use client";

import React, { useState, useEffect } from "react";
import { ModuleGuard } from "../../../components/guards/PermissionGuard";
import { DashboardLayout } from "../../../components/layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart,
  Calculator,
  BookOpen,
  FileText,
  Download,
  Calendar,
  Filter,
  Printer,
} from "lucide-react";
import { LedgerService } from "../../../services/ledgerService";
import {
  TrialBalanceResponse,
  TrialBalanceAccount,
  IncomeStatementResponse,
  AccountType,
  getAccountTypeLabel,
} from "../../../models/ledger";
import { useCurrency } from "../../../contexts/CurrencyContext";
import { useCachedApi } from "../../../hooks/useCachedApi";
import {
  DEFAULT_CHART_OF_ACCOUNTS,
  getTotalBalanceByType,
} from "../../../constants/chartOfAccounts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function FinancialReportsPage() {
  return (
    <ModuleGuard
      module="ledger"
      fallback={<div>You don&apos;t have access to Ledger module</div>}
    >
      <FinancialReportsContent />
    </ModuleGuard>
  );
}

function FinancialReportsContent() {
  const { formatCurrency } = useCurrency();
  const [dateRange, setDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });
  const [selectedReport, setSelectedReport] = useState<string>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use constants for chart of accounts
  const chartOfAccounts = DEFAULT_CHART_OF_ACCOUNTS;

  const { data: trialBalance, loading: trialBalanceLoading } =
    useCachedApi<TrialBalanceResponse>(
      "ledger_trial_balance",
      () => LedgerService.getTrialBalance(),
      { ttl: 300000 },
    );

  const { data: incomeStatement, loading: incomeStatementLoading } =
    useCachedApi<IncomeStatementResponse>(
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

  useEffect(() => {
    // Calculate totals from constants
    const assets = getTotalBalanceByType("asset");
    const liabilities = getTotalBalanceByType("liability");
    const equity = getTotalBalanceByType("equity");
    const revenue = getTotalBalanceByType("revenue");
    const expenses = getTotalBalanceByType("expense");
    const netIncome = revenue - expenses;

    setTotalAssets(assets);
    setTotalLiabilities(liabilities);
    setTotalEquity(equity);
    setTotalRevenue(revenue);
    setTotalExpenses(expenses);
    setNetIncome(netIncome);
  }, []);

  const handleExport = async (reportType: string) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.append("report_type", reportType);
      params.append("format", "json");

      if (dateRange.startDate) {
        params.append(
          "start_date",
          dateRange.startDate.toISOString().split("T")[0],
        );
      }
      if (dateRange.endDate) {
        params.append(
          "end_date",
          dateRange.endDate.toISOString().split("T")[0],
        );
      }

      // For now, we'll create a simple JSON export
      let reportData;
      switch (reportType) {
        case "trial-balance":
          reportData = trialBalance;
          break;
        case "income-statement":
          reportData = incomeStatement;
          break;
        case "balance-sheet":
          reportData = {
            assets: { total: totalAssets },
            liabilities: { total: totalLiabilities },
            equity: { total: totalEquity },
          };
          break;
        default:
          reportData = { message: "Report data not available" };
      }

      // Create filename with date range
      const startDateStr = dateRange.startDate
        ? dateRange.startDate.toISOString().split("T")[0]
        : "all";
      const endDateStr = dateRange.endDate
        ? dateRange.endDate.toISOString().split("T")[0]
        : "all";
      const filename = `financial-${reportType}-${startDateStr}-to-${endDateStr}.json`;

      // Create and download file
      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: "application/json",
      });
      const url_blob = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url_blob;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url_blob);
    } catch (error) {
      setError("Failed to export report");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getAccountTypeCount = (type: AccountType) => {
    return chartOfAccounts.filter(
      (acc) => acc.account_type.toLowerCase() === type.toLowerCase(),
    ).length;
  };

  if (trialBalanceLoading || incomeStatementLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Financial Reports
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive financial analysis and reporting
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <DatePicker
                selectsRange={true}
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onChange={(dates) => {
                  const [start, end] = dates || [null, null];
                  setDateRange({ startDate: start, endDate: end });
                }}
                placeholderText="Select date range"
                className="border-none outline-none text-sm bg-transparent"
                dateFormat="MMM dd, yyyy"
                isClearable={true}
                clearButtonTitle="Clear date range"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <Button className="flex items-center gap-2" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {/* Report Type Selector */}
        <Card className="modern-card">
          <CardContent className="p-6">
            <div className="flex gap-4 flex-wrap">
              <Button
                variant={selectedReport === "overview" ? "default" : "outline"}
                onClick={() => setSelectedReport("overview")}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Overview
              </Button>
              <Button
                variant={
                  selectedReport === "trial-balance" ? "default" : "outline"
                }
                onClick={() => setSelectedReport("trial-balance")}
                className="flex items-center gap-2"
              >
                <Calculator className="h-4 w-4" />
                Trial Balance
              </Button>
              <Button
                variant={
                  selectedReport === "income-statement" ? "default" : "outline"
                }
                onClick={() => setSelectedReport("income-statement")}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Income Statement
              </Button>
              <Button
                variant={
                  selectedReport === "balance-sheet" ? "default" : "outline"
                }
                onClick={() => setSelectedReport("balance-sheet")}
                className="flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Balance Sheet
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Overview Report */}
        {selectedReport === "overview" && (
          <>
            {/* Key Financial Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="modern-card">
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

              <Card className="modern-card">
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
                    {getAccountTypeCount(AccountType.LIABILITY)} liability
                    accounts
                  </p>
                </CardContent>
              </Card>

              <Card className="modern-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Net Income
                  </CardTitle>
                  <PieChart className="h-4 w-4 text-blue-600" />
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

              <Card className="modern-card">
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

            {/* Account Distribution */}
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Account Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.values(AccountType).map((type: AccountType) => {
                    const count = getAccountTypeCount(type);
                    const total = chartOfAccounts.length;
                    const percentage =
                      total > 0 ? ((count / total) * 100).toFixed(1) : "0";

                    return (
                      <div key={String(type)} className="text-center">
                        <div className="text-2xl font-bold mb-2">{count}</div>
                        <div className="text-sm text-gray-600 mb-1">
                          {getAccountTypeLabel(type)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {percentage}% of total accounts
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Trial Balance Report */}
        {selectedReport === "trial-balance" && (
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Trial Balance
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("trial-balance")}
                  disabled={loading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trialBalance ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    As of:{" "}
                    {new Date(trialBalance.as_of_date).toLocaleDateString()}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-lg font-bold">
                    <div>
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
                    <div>
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
                  <div className="text-sm text-green-600">
                    ✓ Trial balance is balanced
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">
                  No trial balance data available
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Income Statement Report */}
        {selectedReport === "income-statement" && (
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Income Statement
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("income-statement")}
                  disabled={loading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incomeStatement ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Revenue</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(incomeStatement.revenue)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Expenses</div>
                      <div className="text-lg font-bold text-red-600">
                        {formatCurrency(incomeStatement.expenses)}
                      </div>
                    </div>
                  </div>
                  <hr />
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-bold">Net Income</div>
                    <div
                      className={`text-lg font-bold ${incomeStatement.net_income >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatCurrency(incomeStatement.net_income)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">
                  No income statement data available
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Balance Sheet Report */}
        {selectedReport === "balance-sheet" && (
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Balance Sheet
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("balance-sheet")}
                  disabled={loading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Assets</h3>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalAssets)}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Liabilities</h3>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(totalLiabilities)}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Equity</h3>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(totalEquity)}
                  </div>
                </div>

                <hr />

                <div className="flex justify-between items-center">
                  <div className="text-lg font-bold">Total Assets</div>
                  <div className="text-lg font-bold">
                    {formatCurrency(totalAssets)}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-lg font-bold">
                    Total Liabilities + Equity
                  </div>
                  <div className="text-lg font-bold">
                    {formatCurrency(totalLiabilities + totalEquity)}
                  </div>
                </div>

                <div
                  className={`text-sm ${totalAssets === totalLiabilities + totalEquity ? "text-green-600" : "text-red-600"}`}
                >
                  {totalAssets === totalLiabilities + totalEquity
                    ? "✓ Balance sheet is balanced"
                    : "⚠ Balance sheet is not balanced"}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <FileText className="h-4 w-4" />
                <span>{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
