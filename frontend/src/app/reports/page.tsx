"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "../../components/layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  BarChart3,
  TrendingUp,
  Users,
  Package,
  FileText,
  Target,
  Download,
  Calendar,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { apiService } from "../../services/ApiService";
import { useCurrency } from "../../contexts/CurrencyContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  listSavedReports,
  uploadSavedReport,
  renameSavedReport,
  deleteSavedReport,
  type SavedReportItem,
} from "../../services/savedReportsService";
import { useConfirm } from "@/src/contexts/ConfirmContext";

interface DashboardData {
  projects: {
    total_projects: number;
    active_projects: number;
    project_success_rate: number;
    average_project_progress: number;
  };
  hrm: {
    total_employees: number;
    active_employees: number;
    employee_retention_rate: number;
    departments: number;
  };
  inventory: {
    total_products: number;
    total_stock_value: number;
    low_stock_items: number;
    out_of_stock_items: number;
  };
  financial: {
    total_revenue: number;
    net_profit: number;
    profit_margin: number;
    total_invoices: number;
  };
  pos: {
    total_transactions: number;
    total_sales: number;
    average_transaction_value: number;
  };
  monthly_trends: {
    projects: Array<{ month: string; count: number }>;
    revenue: Array<{ month: string; amount: number }>;
  };
  department_performance: Array<{
    department: string;
    employee_count: number;
    average_salary: number;
  }>;
}

export default function ReportsPage() {
  const confirm = useConfirm();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [savedReports, setSavedReports] = useState<SavedReportItem[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [saveBusy, setSaveBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [dateRange, setDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });
  const { formatCurrency } = useCurrency();

  const loadSavedReports = useCallback(async () => {
    try {
      setSavedLoading(true);
      const list = await listSavedReports();
      setSavedReports(list);
    } catch {
      setSavedReports([]);
    } finally {
      setSavedLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSavedReports();
  }, [loadSavedReports]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (
        (dateRange.startDate && dateRange.endDate) ||
        (!dateRange.startDate && !dateRange.endDate)
      ) {
        fetchDashboardData();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setDashboardLoading(true);
      setDashboardError(null);

      const params = new URLSearchParams();
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

      const queryString = params.toString();
      const url = `/reports/dashboard${queryString ? `?${queryString}` : ""}`;

      const response = await apiService.get(url);
      setDashboardData(response);
    } catch {
      setDashboardError("Failed to load reports data");
    } finally {
      setDashboardLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const handleExport = async () => {
    try {
      setExportBusy(true);

      const params = new URLSearchParams();
      params.append("report_type", "dashboard");
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

      const queryString = params.toString();
      const url = `/reports/export?${queryString}`;

      const response = await apiService.get(url);

      const startDateStr = dateRange.startDate
        ? dateRange.startDate.toISOString().split("T")[0]
        : "all";
      const endDateStr = dateRange.endDate
        ? dateRange.endDate.toISOString().split("T")[0]
        : "all";
      const filename = `reports-dashboard-${startDateStr}-to-${endDateStr}.json`;

      const blob = new Blob([JSON.stringify(response, null, 2)], {
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
    } catch {
      setDashboardError("Failed to export reports");
    } finally {
      setExportBusy(false);
    }
  };

  const handleAddSaved = async () => {
    if (!newTitle.trim() || !newFile) return;
    setSaveBusy(true);
    try {
      await uploadSavedReport(newTitle.trim(), newFile);
      setAddOpen(false);
      setNewTitle("");
      setNewFile(null);
      await loadSavedReports();
    } catch {
      setDashboardError("Failed to upload report");
    } finally {
      setSaveBusy(false);
    }
  };

  const handleRenameSaved = async () => {
    if (!renameId || !renameTitle.trim()) return;
    setSaveBusy(true);
    try {
      await renameSavedReport(renameId, renameTitle.trim());
      setRenameOpen(false);
      setRenameId(null);
      await loadSavedReports();
    } catch {
      setDashboardError("Failed to rename report");
    } finally {
      setSaveBusy(false);
    }
  };

  const handleDeleteSaved = async (id: string) => {
    const ok = await confirm({
      description: "Delete this stored report?",
      destructive: true,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await deleteSavedReport(id);
      await loadSavedReports();
    } catch {
      setDashboardError("Failed to delete report");
    }
  };

  const openRename = (r: SavedReportItem) => {
    setRenameId(r.id);
    setRenameTitle(r.title);
    setRenameOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive business insights and performance metrics
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
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
            <Button
              className="flex items-center gap-2"
              onClick={handleExport}
              disabled={exportBusy || dashboardLoading}
            >
              <Download className="h-4 w-4" />
              {exportBusy ? "Exporting..." : "Export"}
            </Button>
          </div>
        </div>

        {dashboardError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm flex items-center justify-between gap-4">
            <span>{dashboardError}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDashboardError(null);
                fetchDashboardData();
              }}
            >
              Retry
            </Button>
          </div>
        )}

        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Stored reports (PDF & CSV)
            </CardTitle>
            <Button
              size="sm"
              onClick={() => {
                setNewTitle("");
                setNewFile(null);
                setAddOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add report
            </Button>
          </CardHeader>
          <CardContent>
            {savedLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            ) : savedReports.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No stored reports yet. Upload a PDF or CSV to keep it here for
                later download.
              </p>
            ) : (
              <div className="space-y-2">
                {savedReports.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 border rounded-lg px-4 py-3 bg-gray-50/80"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{r.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString()} ·{" "}
                        {r.original_filename || "file"}
                        {typeof r.file_size === "number"
                          ? ` · ${(r.file_size / 1024).toFixed(1)} KB`
                          : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary">
                        {r.file_type.toUpperCase()}
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={r.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRename(r)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDeleteSaved(r.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add stored report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="sr-title">Title</Label>
                <Input
                  id="sr-title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Q4 sales summary"
                />
              </div>
              <div>
                <Label htmlFor="sr-file">File (PDF or CSV, max 10MB)</Label>
                <Input
                  id="sr-file"
                  type="file"
                  accept=".pdf,.csv,application/pdf,text/csv"
                  onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddSaved}
                disabled={saveBusy || !newTitle.trim() || !newFile}
              >
                {saveBusy ? "Uploading…" : "Upload"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename report</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <Label htmlFor="sr-rename">Title</Label>
              <Input
                id="sr-rename"
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenameOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleRenameSaved}
                disabled={saveBusy || !renameTitle.trim()}
              >
                {saveBusy ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {dashboardLoading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
          </div>
        )}

        {!dashboardLoading && !dashboardData && !dashboardError && (
          <div className="text-center py-8 text-muted-foreground">
            No dashboard data available
          </div>
        )}

        {!dashboardLoading && dashboardData && (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Projects */}
              <Card className="modern-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Projects
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(dashboardData.projects?.total_projects || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.projects?.active_projects || 0} active
                  </p>
                  <div className="flex items-center mt-2">
                    <Badge variant="secondary">
                      {(
                        dashboardData.projects?.project_success_rate || 0
                      ).toFixed(1)}
                      % success rate
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Employees */}
              <Card className="modern-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Employees
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(dashboardData.hrm?.total_employees || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.hrm?.active_employees || 0} active
                  </p>
                  <div className="flex items-center mt-2">
                    <Badge variant="secondary">
                      {(
                        dashboardData.hrm?.employee_retention_rate || 0
                      ).toFixed(1)}
                      % retention
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue */}
              <Card className="modern-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      dashboardData.financial?.total_revenue || 0,
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(dashboardData.financial?.net_profit || 0)}{" "}
                    net profit
                  </p>
                  <div className="flex items-center mt-2">
                    <Badge variant="secondary">
                      {(dashboardData.financial?.profit_margin || 0).toFixed(1)}
                      % margin
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Inventory Status */}
              <Card className="modern-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Inventory Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Products</span>
                    <span className="font-semibold">
                      {formatNumber(
                        dashboardData.inventory?.total_products || 0,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Stock Value</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        dashboardData.inventory?.total_stock_value || 0,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Low Stock Items</span>
                    <Badge
                      variant={
                        (dashboardData.inventory?.low_stock_items || 0) > 0
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {dashboardData.inventory?.low_stock_items || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Out of Stock</span>
                    <Badge
                      variant={
                        (dashboardData.inventory?.out_of_stock_items || 0) > 0
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {dashboardData.inventory?.out_of_stock_items || 0}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* POS Sales */}
              <Card className="modern-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    POS Sales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Transactions</span>
                    <span className="font-semibold">
                      {formatNumber(dashboardData.pos?.total_transactions || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Sales</span>
                    <span className="font-semibold">
                      {formatCurrency(dashboardData.pos?.total_sales || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Transaction</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        dashboardData.pos?.average_transaction_value || 0,
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Department Performance */}
            {(dashboardData.department_performance?.length || 0) > 0 && (
              <Card className="modern-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Department Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(dashboardData.department_performance || []).map(
                      (dept, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <div className="font-semibold">
                              {dept.department}
                            </div>
                            <div className="text-sm text-gray-600">
                              {dept.employee_count} employees
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {formatCurrency(dept.average_salary)}
                            </div>
                            <div className="text-sm text-gray-600">
                              avg salary
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Monthly Trends */}
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Monthly Trends (Last 6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Project Trends */}
                  <div>
                    <h4 className="font-semibold mb-3">Projects Created</h4>
                    <div className="space-y-2">
                      {(dashboardData.monthly_trends?.projects || [])
                        .slice(-6)
                        .map((trend, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center"
                          >
                            <span className="text-sm">
                              {new Date(trend.month).toLocaleDateString(
                                "en-US",
                                { month: "short", year: "2-digit" },
                              )}
                            </span>
                            <Badge variant="outline">{trend.count}</Badge>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Revenue Trends */}
                  <div>
                    <h4 className="font-semibold mb-3">Revenue</h4>
                    <div className="space-y-2">
                      {(dashboardData.monthly_trends?.revenue || [])
                        .slice(-6)
                        .map((trend, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center"
                          >
                            <span className="text-sm">
                              {new Date(trend.month).toLocaleDateString(
                                "en-US",
                                { month: "short", year: "2-digit" },
                              )}
                            </span>
                            <Badge variant="outline">
                              {formatCurrency(trend.amount)}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
