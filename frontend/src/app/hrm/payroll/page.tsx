"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ModuleGuard } from "../../../components/guards/PermissionGuard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Badge } from "@/src/components/ui/badge";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Clock,
  Users,
  CheckCircle,
  FileText,
  Calculator,
  CreditCard,
} from "lucide-react";
import HRMService from "@/src/services/HRMService";
import {
  Payroll,
  PayrollCreate,
  PayrollStatus,
  Employee,
} from "@/src/models/hrm";
import { DashboardLayout } from "@/src/components/layout";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { useCrudPermissions } from "@/src/hooks/usePermissions";

export default function HRMPayrollPage() {
  return (
    <ModuleGuard
      module="hrm"
      fallback={<div>You don&apos;t have access to HRM module</div>}
    >
      <HRMPayrollContent />
    </ModuleGuard>
  );
}

function HRMPayrollContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions("hrm:payroll");
  const { formatCurrency } = useCurrency();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    employeeId?: string;
    status?: string;
    payPeriod?: string;
    paymentDate?: string;
  }>({});
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null);
  const [viewingPayroll, setViewingPayroll] = useState<Payroll | null>(null);
  const [deletingPayroll, setDeletingPayroll] = useState<Payroll | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<PayrollCreate>({
    employeeId: "",
    payPeriod: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    basicSalary: 0,
    allowances: 0,
    deductions: 0,
    overtimePay: 0,
    bonus: 0,
    netPay: 0,
    status: PayrollStatus.DRAFT,
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const loadPayrolls = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await HRMService.getPayroll(filters, 1, 100);
      setPayrolls(response.payroll);
    } catch (err) {
      setError("Failed to load payroll records");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadEmployees = useCallback(async () => {
    try {
      const response = await HRMService.getEmployees({}, 1, 100);
      setEmployees(response.employees);
    } catch (err) {}
  }, []);

  useEffect(() => {
    loadPayrolls();
    loadEmployees();
    return;
  }, [loadPayrolls, loadEmployees]);

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search }));
  };

  const resetFilters = () => {
    setFilters({});
    setSearch("");
  };

  const resetForm = () => {
    setFormData({
      employeeId: "",
      payPeriod: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      basicSalary: 0,
      allowances: 0,
      deductions: 0,
      overtimePay: 0,
      bonus: 0,
      netPay: 0,
      status: PayrollStatus.DRAFT,
      paymentDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setEditingPayroll(null);
    setError(null);
    setSuccessMessage(null);
  };

  const calculateNetPay = () => {
    const netPay =
      (formData.basicSalary || 0) +
      (formData.allowances || 0) +
      (formData.overtimePay || 0) +
      (formData.bonus || 0) -
      (formData.deductions || 0);
    setFormData((prev) => ({ ...prev, netPay: Math.max(0, netPay) }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      if (
        !formData.employeeId ||
        !formData.payPeriod ||
        formData.basicSalary <= 0
      ) {
        setError(
          "Please fill in all required fields (Employee, Pay Period, and Basic Salary)",
        );
        return;
      }

      calculateNetPay();

      if (editingPayroll) {
        const updateData = {
          payPeriod: formData.payPeriod,
          startDate: formData.startDate,
          endDate: formData.endDate,
          basicSalary: formData.basicSalary,
          allowances: formData.allowances,
          deductions: formData.deductions,
          overtimePay: formData.overtimePay,
          bonus: formData.bonus,
          netPay: formData.netPay,
          status: formData.status,
          paymentDate: formData.paymentDate,
          notes: formData.notes,
        };
        await HRMService.updatePayroll(editingPayroll.id, updateData);
        setSuccessMessage("Payroll record updated successfully!");
      } else {
        await HRMService.createPayroll(formData);
        setSuccessMessage("Payroll record created successfully!");
      }

      setShowCreateDialog(false);
      setEditingPayroll(null);
      resetForm();
      // Add a small delay to ensure backend has processed the update
      setTimeout(async () => {
        await loadPayrolls();
      }, 100);
    } catch (err) {
      setError("Failed to save payroll record. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (payroll: Payroll) => {
    setEditingPayroll(payroll);
    setFormData({
      employeeId: payroll.employeeId,
      payPeriod: payroll.payPeriod,
      startDate:
        payroll.startDate?.split("T")[0] ||
        new Date().toISOString().split("T")[0],
      endDate:
        payroll.endDate?.split("T")[0] ||
        new Date().toISOString().split("T")[0],
      basicSalary: payroll.basicSalary,
      allowances: payroll.allowances || 0,
      deductions: payroll.deductions || 0,
      overtimePay: payroll.overtimePay || 0,
      bonus: payroll.bonus || 0,
      netPay: payroll.netPay,
      status: payroll.status,
      paymentDate:
        payroll.paymentDate?.split("T")[0] ||
        new Date().toISOString().split("T")[0],
      notes: payroll.notes || "",
    });
    setShowCreateDialog(true);
  };

  const handleView = (payroll: Payroll) => {
    setViewingPayroll(payroll);
  };

  const handleDelete = (payroll: Payroll) => {
    setDeletingPayroll(payroll);
  };

  const confirmDelete = async () => {
    if (!deletingPayroll) return;

    try {
      setDeleting(true);
      await HRMService.deletePayroll(deletingPayroll.id);
      setSuccessMessage("Payroll record deleted successfully!");
      setDeletingPayroll(null);
      loadPayrolls();
    } catch (err) {
      setError("Failed to delete payroll record. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status: PayrollStatus) => {
    const statusColors: { [key: string]: string } = {
      draft: "bg-blue-100 text-blue-800",
      processed: "bg-green-100 text-green-800",
      paid: "bg-blue-100 text-blue-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    return employee
      ? `${employee.firstName} ${employee.lastName}`
      : "Unknown Employee";
  };

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
    return;
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
    return;
  }, [error]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading payroll records...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Payroll Management
            </h1>
            <p className="text-gray-600">
              Manage employee payroll records and payments
            </p>
          </div>
          {canCreate() && (
            <Button
              onClick={() => {
                setShowCreateDialog(true);
                resetForm();
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Payroll Record
            </Button>
          )}
        </div>

        {successMessage && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="text-sm font-medium">Search</label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search records..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button onClick={handleSearch}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Employee</label>
                <Select
                  value={filters.employeeId || "all"}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      employeeId: value === "all" ? undefined : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All employees</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: value === "all" ? undefined : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {Object.values(PayrollStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Pay Period</label>
                <Input
                  placeholder="e.g., January 2024"
                  value={filters.payPeriod || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      payPeriod: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Payment Date</label>
                <Input
                  type="date"
                  value={filters.paymentDate || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      paymentDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Records
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payrolls.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  payrolls.filter(
                    (payroll) => payroll.status === PayrollStatus.DRAFT,
                  ).length
                }
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  payrolls.filter(
                    (payroll) => payroll.status === PayrollStatus.PROCESSED,
                  ).length
                }
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Net Pay
              </CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  payrolls.reduce((sum, payroll) => sum + payroll.netPay, 0),
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payroll Records ({payrolls.length})</CardTitle>
            <CardDescription>
              Manage employee payroll records and payment status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payrolls.map((payroll) => (
                <div
                  key={payroll.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="font-medium text-lg">
                            {getEmployeeName(payroll.employeeId)} -{" "}
                            {payroll.payPeriod}
                          </div>
                          <div className="text-sm text-gray-500">
                            Payment Date:{" "}
                            {payroll.paymentDate
                              ? new Date(
                                  payroll.paymentDate,
                                ).toLocaleDateString()
                              : "Not set"}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getStatusColor(payroll.status)}>
                        {payroll.status.charAt(0).toUpperCase() +
                          payroll.status.slice(1)}
                      </Badge>
                      <Badge variant="outline">
                        <Calculator className="w-3 h-3 mr-1" />
                        Net: {formatCurrency(payroll.netPay)}
                      </Badge>
                      <Badge variant="outline">
                        <Calculator className="w-3 h-3 mr-1" />
                        Basic: {formatCurrency(payroll.basicSalary)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>
                          Employee: {getEmployeeName(payroll.employeeId)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Pay Period: {payroll.payPeriod}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Payment Date:{" "}
                          {payroll.paymentDate
                            ? new Date(payroll.paymentDate).toLocaleDateString()
                            : "Not set"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          Created:{" "}
                          {new Date(payroll.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-2 text-xs">
                      <div>
                        <span className="font-medium">Allowances:</span>{" "}
                        {formatCurrency(payroll.allowances)}
                      </div>
                      <div>
                        <span className="font-medium">Deductions:</span>{" "}
                        {formatCurrency(payroll.deductions)}
                      </div>
                      <div>
                        <span className="font-medium">Overtime:</span>{" "}
                        {formatCurrency(payroll.overtimePay)}
                      </div>
                      <div>
                        <span className="font-medium">Bonus:</span>{" "}
                        {formatCurrency(payroll.bonus)}
                      </div>
                    </div>
                    {payroll.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Notes:</strong>{" "}
                        {payroll.notes.length > 100
                          ? `${payroll.notes.substring(0, 100)}...`
                          : payroll.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(payroll)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {canUpdate() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(payroll)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {canDelete() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(payroll)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {payrolls.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No payroll records found. Create your first record to get
                  started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPayroll ? "Edit Payroll Record" : "New Payroll Record"}
              </DialogTitle>
              <DialogDescription>
                {editingPayroll
                  ? "Update payroll record information"
                  : "Create a new payroll record for an employee"}
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="employeeId">Employee *</Label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, employeeId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="payPeriod">Pay Period *</Label>
                <Input
                  id="payPeriod"
                  value={formData.payPeriod}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      payPeriod: e.target.value,
                    }))
                  }
                  placeholder="e.g., January 2024"
                />
              </div>
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="basicSalary">Basic Salary *</Label>
                <Input
                  id="basicSalary"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.basicSalary}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      basicSalary: parseFloat(e.target.value) || 0,
                    }));
                    setTimeout(calculateNetPay, 100);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="allowances">Allowances</Label>
                <Input
                  id="allowances"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.allowances}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      allowances: parseFloat(e.target.value) || 0,
                    }));
                    setTimeout(calculateNetPay, 100);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="overtimePay">Overtime Pay</Label>
                <Input
                  id="overtimePay"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.overtimePay || 0}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      overtimePay: parseFloat(e.target.value) || 0,
                    }));
                    setTimeout(calculateNetPay, 100);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="bonus">Bonus</Label>
                <Input
                  id="bonus"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.bonus}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      bonus: parseFloat(e.target.value) || 0,
                    }));
                    setTimeout(calculateNetPay, 100);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="deductions">Deductions</Label>
                <Input
                  id="deductions"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.deductions}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      deductions: parseFloat(e.target.value) || 0,
                    }));
                    setTimeout(calculateNetPay, 100);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="netPay">Net Pay</Label>
                <Input
                  id="netPay"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.netPay}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: value as PayrollStatus,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(PayrollStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentDate">Payment Date</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={formData.paymentDate || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      paymentDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-span-4">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Additional notes or comments..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting
                  ? "Saving..."
                  : editingPayroll
                    ? "Update Record"
                    : "Create Record"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!viewingPayroll}
          onOpenChange={() => setViewingPayroll(null)}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>View Payroll Record</DialogTitle>
              <DialogDescription>Payroll record details</DialogDescription>
            </DialogHeader>

            {viewingPayroll && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Employee
                    </Label>
                    <p className="text-lg font-medium">
                      {getEmployeeName(viewingPayroll.employeeId)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Status
                    </Label>
                    <Badge className={getStatusColor(viewingPayroll.status)}>
                      {viewingPayroll.status.charAt(0).toUpperCase() +
                        viewingPayroll.status.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Pay Period
                    </Label>
                    <p className="text-gray-900">{viewingPayroll.payPeriod}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Payment Date
                    </Label>
                    <p className="text-gray-900">
                      {viewingPayroll.paymentDate
                        ? new Date(
                            viewingPayroll.paymentDate,
                          ).toLocaleDateString()
                        : "Not set"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Basic Salary
                    </Label>
                    <p className="text-gray-900">
                      {formatCurrency(viewingPayroll.basicSalary)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Allowances
                    </Label>
                    <p className="text-gray-900">
                      {formatCurrency(viewingPayroll.allowances)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Overtime Pay
                    </Label>
                    <p className="text-gray-900">
                      {formatCurrency(viewingPayroll.overtimePay || 0)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Bonus
                    </Label>
                    <p className="text-gray-900">
                      {formatCurrency(viewingPayroll.bonus)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Deductions
                    </Label>
                    <p className="text-gray-900">
                      {formatCurrency(viewingPayroll.deductions)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Net Pay
                    </Label>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(viewingPayroll.netPay)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Start Date
                    </Label>
                    <p className="text-gray-900">
                      {new Date(viewingPayroll.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      End Date
                    </Label>
                    <p className="text-gray-900">
                      {new Date(viewingPayroll.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {viewingPayroll.notes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Notes
                    </Label>
                    <p className="text-gray-900">{viewingPayroll.notes}</p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingPayroll(null)}>
                Close
              </Button>
              {viewingPayroll && canUpdate() && (
                <Button
                  onClick={() => {
                    setViewingPayroll(null);
                    handleEdit(viewingPayroll);
                  }}
                >
                  Edit Record
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!deletingPayroll}
          onOpenChange={() => setDeletingPayroll(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Payroll Record</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the payroll record for &quot;
                {deletingPayroll
                  ? getEmployeeName(deletingPayroll.employeeId)
                  : ""}
                &quot; ({deletingPayroll?.payPeriod})? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeletingPayroll(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Record"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
