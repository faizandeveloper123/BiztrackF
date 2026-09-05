"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/src/components/layout";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Plus, Edit, Trash2, Receipt, FolderOpen } from "lucide-react";
import healthcareService from "@/src/services/HealthcareService";
import type {
  ExpenseCategory,
  ExpenseCategoryCreate,
  ExpenseCategoryUpdate,
  DailyExpense,
  DailyExpenseCreate,
  DailyExpenseUpdate,
} from "@/src/models/healthcare";
import { toast } from "sonner";
import { useCrudPermissions } from "@/src/hooks/usePermissions";

export default function HealthcareDailyExpensePage() {
  return (
    <DashboardLayout>
      <DailyExpenseContent />
    </DashboardLayout>
  );
}

function DailyExpenseContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "healthcare:expenses",
  );
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [, setCategoriesTotal] = useState(0);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ExpenseCategory | null>(null);
  const [categoryFormData, setCategoryFormData] =
    useState<ExpenseCategoryCreate>({ name: "", description: "" });
  const [categorySubmitLoading, setCategorySubmitLoading] = useState(false);
  const [categoryDeleteDialogOpen, setCategoryDeleteDialogOpen] =
    useState(false);
  const [categoryToDelete, setCategoryToDelete] =
    useState<ExpenseCategory | null>(null);
  const [categoryDeleteLoading, setCategoryDeleteLoading] = useState(false);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<DailyExpense | null>(
    null,
  );
  const [expenseFormData, setExpenseFormData] = useState<DailyExpenseCreate>({
    category_id: "",
    expense_date: new Date().toISOString().slice(0, 10),
    amount: 0,
    description: "",
  });
  const [expenseSubmitLoading, setExpenseSubmitLoading] = useState(false);
  const [expenseDeleteDialogOpen, setExpenseDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<DailyExpense | null>(
    null,
  );
  const [expenseDeleteLoading, setExpenseDeleteLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const res = await healthcareService.getExpenseCategories({ limit: 500 });
      setCategories(res.categories);
      setCategoriesTotal(res.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load categories");
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const loadExpenses = useCallback(async () => {
    try {
      setExpensesLoading(true);
      const res = await healthcareService.getDailyExpenses({
        category_id: categoryFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        limit: 500,
      });
      setExpenses(res.expenses);
      setExpensesTotal(res.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load expenses");
    } finally {
      setExpensesLoading(false);
    }
  }, [categoryFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({ name: "", description: "" });
    setCategoryFormOpen(true);
  };

  const openEditCategory = (c: ExpenseCategory) => {
    setEditingCategory(c);
    setCategoryFormData({ name: c.name, description: c.description ?? "" });
    setCategoryFormOpen(true);
  };

  const openDeleteCategory = (c: ExpenseCategory) => {
    setCategoryToDelete(c);
    setCategoryDeleteDialogOpen(true);
  };

  const handleCategorySubmit = async () => {
    if (!categoryFormData.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    try {
      setCategorySubmitLoading(true);
      if (editingCategory) {
        const payload: ExpenseCategoryUpdate = {
          name: categoryFormData.name.trim(),
          description: categoryFormData.description?.trim() || undefined,
        };
        await healthcareService.updateExpenseCategory(
          editingCategory.id,
          payload,
        );
        toast.success("Category updated");
      } else {
        await healthcareService.createExpenseCategory({
          name: categoryFormData.name.trim(),
          description: categoryFormData.description?.trim() || undefined,
        });
        toast.success("Category created");
      }
      setCategoryFormOpen(false);
      loadCategories();
      loadExpenses();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || "Request failed";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setCategorySubmitLoading(false);
    }
  };

  const handleCategoryDelete = async () => {
    if (!categoryToDelete) return;
    try {
      setCategoryDeleteLoading(true);
      await healthcareService.deleteExpenseCategory(categoryToDelete.id);
      toast.success("Category deleted");
      setCategoryDeleteDialogOpen(false);
      setCategoryToDelete(null);
      loadCategories();
      loadExpenses();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || "Delete failed";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setCategoryDeleteLoading(false);
    }
  };

  const openAddExpense = () => {
    setEditingExpense(null);
    setExpenseFormData({
      category_id: categories[0]?.id ?? "",
      expense_date: new Date().toISOString().slice(0, 10),
      amount: 0,
      description: "",
    });
    setExpenseFormOpen(true);
  };

  const openEditExpense = (e: DailyExpense) => {
    setEditingExpense(e);
    setExpenseFormData({
      category_id: e.category_id,
      expense_date: e.expense_date,
      amount: e.amount,
      description: e.description ?? "",
    });
    setExpenseFormOpen(true);
  };

  const openDeleteExpense = (e: DailyExpense) => {
    setExpenseToDelete(e);
    setExpenseDeleteDialogOpen(true);
  };

  const handleExpenseSubmit = async () => {
    if (!expenseFormData.category_id) {
      toast.error("Category is required");
      return;
    }
    if (!expenseFormData.expense_date) {
      toast.error("Date is required");
      return;
    }
    if (expenseFormData.amount == null || expenseFormData.amount < 0) {
      toast.error("Amount must be 0 or greater");
      return;
    }
    try {
      setExpenseSubmitLoading(true);
      if (editingExpense) {
        const payload: DailyExpenseUpdate = {
          category_id: expenseFormData.category_id,
          expense_date: expenseFormData.expense_date,
          amount: Number(expenseFormData.amount),
          description: expenseFormData.description?.trim() || undefined,
        };
        await healthcareService.updateDailyExpense(editingExpense.id, payload);
        toast.success("Expense updated");
      } else {
        await healthcareService.createDailyExpense({
          category_id: expenseFormData.category_id,
          expense_date: expenseFormData.expense_date,
          amount: Number(expenseFormData.amount),
          description: expenseFormData.description?.trim() || undefined,
        });
        toast.success("Expense added");
      }
      setExpenseFormOpen(false);
      loadExpenses();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || "Request failed";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setExpenseSubmitLoading(false);
    }
  };

  const handleExpenseDelete = async () => {
    if (!expenseToDelete) return;
    try {
      setExpenseDeleteLoading(true);
      await healthcareService.deleteDailyExpense(expenseToDelete.id);
      toast.success("Expense deleted");
      setExpenseDeleteDialogOpen(false);
      setExpenseToDelete(null);
      loadExpenses();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || "Delete failed";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setExpenseDeleteLoading(false);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString() : "—";

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Daily Expense</h1>
        <p className="text-gray-600">
          Manage expense categories and daily expenses in one place.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Expense Categories
            </CardTitle>
            <CardDescription>
              Create categories first, then add expenses and assign a category.
            </CardDescription>
          </div>
          {canCreate() && (
            <Button onClick={openAddCategory}>
              <Plus className="w-4 h-4 mr-2" />
              Create expense category
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="py-8 text-center text-gray-500">Loading...</div>
          ) : categories.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No categories yet. Click &quot;Create expense category&quot; to
              add one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-gray-600">
                      {c.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {canUpdate() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditCategory(c)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                      {canDelete() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => openDeleteCategory(c)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Expenses
            </CardTitle>
            <CardDescription>
              {expensesTotal} expense{expensesTotal !== 1 ? "s" : ""} total.
              Filter by category and date.
            </CardDescription>
          </div>
          {canCreate() && (
            <Button onClick={openAddExpense} disabled={categories.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Add expense
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              Create at least one expense category above before adding expenses.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Category</Label>
                  <Select
                    value={categoryFilter || "all"}
                    onValueChange={(v) =>
                      setCategoryFilter(v === "all" ? "" : v)
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">From date</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-[140px]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">To date</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-[140px]"
                  />
                </div>
              </div>
              {expensesLoading ? (
                <div className="py-8 text-center text-gray-500">Loading...</div>
              ) : expenses.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No expenses yet. Click &quot;Add expense&quot; to add one.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{formatDate(e.expense_date)}</TableCell>
                        <TableCell>{e.category_name ?? "—"}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(e.amount)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-gray-600">
                          {e.description || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {canUpdate() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditExpense(e)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          )}
                          {canDelete() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => openDeleteExpense(e)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={categoryFormOpen} onOpenChange={setCategoryFormOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit category" : "Create expense category"}
            </DialogTitle>
            <DialogDescription>
              Categories group your daily expenses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={categoryFormData.name}
                onChange={(e) =>
                  setCategoryFormData((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Utilities, Supplies"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={categoryFormData.description ?? ""}
                onChange={(e) =>
                  setCategoryFormData((p) => ({
                    ...p,
                    description: e.target.value,
                  }))
                }
                placeholder="Optional description"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCategoryFormOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCategorySubmit}
              disabled={categorySubmitLoading}
            >
              {categorySubmitLoading
                ? "Saving..."
                : editingCategory
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={categoryDeleteDialogOpen}
        onOpenChange={setCategoryDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete category</DialogTitle>
            <DialogDescription>
              Delete &quot;{categoryToDelete?.name}&quot;? Expenses in this
              category will need to be reassigned or removed first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCategoryDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCategoryDelete}
              disabled={categoryDeleteLoading}
            >
              {categoryDeleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={expenseFormOpen} onOpenChange={setExpenseFormOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Edit expense" : "Add expense"}
            </DialogTitle>
            <DialogDescription>
              Record a daily expense and assign a category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={expenseFormData.category_id}
                onValueChange={(v) =>
                  setExpenseFormData((p) => ({ ...p, category_id: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={expenseFormData.expense_date}
                onChange={(e) =>
                  setExpenseFormData((p) => ({
                    ...p,
                    expense_date: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={
                  expenseFormData.amount === 0 ? "" : expenseFormData.amount
                }
                onChange={(e) =>
                  setExpenseFormData((p) => ({
                    ...p,
                    amount:
                      e.target.value === ""
                        ? 0
                        : parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={expenseFormData.description ?? ""}
                onChange={(e) =>
                  setExpenseFormData((p) => ({
                    ...p,
                    description: e.target.value,
                  }))
                }
                placeholder="Optional notes"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExpenseSubmit}
              disabled={expenseSubmitLoading}
            >
              {expenseSubmitLoading
                ? "Saving..."
                : editingExpense
                  ? "Update"
                  : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={expenseDeleteDialogOpen}
        onOpenChange={setExpenseDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete expense</DialogTitle>
            <DialogDescription>
              Delete this expense (
              {expenseToDelete ? formatCurrency(expenseToDelete.amount) : ""} on{" "}
              {expenseToDelete ? formatDate(expenseToDelete.expense_date) : ""}
              )?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExpenseDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleExpenseDelete}
              disabled={expenseDeleteLoading}
            >
              {expenseDeleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
