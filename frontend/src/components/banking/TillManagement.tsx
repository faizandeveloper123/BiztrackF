"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
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
import { Switch } from "@/src/components/ui/switch";
import { Badge } from "@/src/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { toast } from "sonner";
import { tillService } from "@/src/services/TillService";
import { bankingService } from "@/src/services/BankingService";
import {
  getTillTransactionTypeLabel,
  getTillTransactionTypeColor,
  type BankAccount,
  type Till,
  type TillCreate,
  type TillTransaction,
  type TillTransactionCreate,
  type TillTransactionType,
  type TillUpdate,
} from "@/src/models/banking";
import { formatDate } from "@/src/lib/utils";

function getTillApiErrorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { detail?: unknown } } };
  const d = err.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) {
    const msgs = d
      .map((x: { msg?: string }) => x?.msg)
      .filter((m): m is string => Boolean(m));
    if (msgs.length) return msgs.join(", ");
  }
  return fallback;
}

function validateTillCreate(data: TillCreate): string | null {
  const name = (data.name ?? "").trim();
  if (!name) return "Till name is required";
  if (name.length > 200) return "Till name must be 200 characters or less";
  const bal = data.initialBalance ?? 0;
  if (typeof bal !== "number" || !Number.isFinite(bal)) {
    return "Initial balance must be a valid number";
  }
  if (bal < -1e15 || bal > 1e15)
    return "Initial balance is out of allowed range";
  if (data.location != null && String(data.location).length > 500)
    return "Location is too long";
  if (data.description != null && String(data.description).length > 2000) {
    return "Description is too long";
  }
  const cur = (data.currency ?? "USD").trim();
  if (!cur || cur.length > 10) return "Currency is invalid";
  return null;
}

function validateTillUpdate(data: TillUpdate): string | null {
  if (data.name !== undefined && data.name !== null) {
    const name = String(data.name).trim();
    if (!name) return "Till name cannot be empty";
    if (name.length > 200) return "Till name must be 200 characters or less";
  }
  if (data.initialBalance !== undefined && data.initialBalance !== null) {
    const bal = data.initialBalance;
    if (typeof bal !== "number" || !Number.isFinite(bal)) {
      return "Initial balance must be a valid number";
    }
    if (bal < -1e15 || bal > 1e15)
      return "Initial balance is out of allowed range";
  }
  if (data.location != null && String(data.location).length > 500)
    return "Location is too long";
  if (data.description != null && String(data.description).length > 2000) {
    return "Description is too long";
  }
  return null;
}

interface TillManagementProps {
  tills: Till[];
  onRefresh: () => void;
}

export function TillManagement({ tills, onRefresh }: TillManagementProps) {
  const { formatCurrency } = useCurrency();
  const [selectedTill, setSelectedTill] = useState<Till | null>(null);
  const [transactions, setTransactions] = useState<TillTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [showCreateTillModal, setShowCreateTillModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showEditTillModal, setShowEditTillModal] = useState(false);
  const [showDeleteTillModal, setShowDeleteTillModal] = useState(false);
  const [tillToEdit, setTillToEdit] = useState<Till | null>(null);
  const [tillToDelete, setTillToDelete] = useState<Till | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  React.useEffect(() => {
    loadBankAccounts();
  }, []);

  const loadBankAccounts = async () => {
    try {
      const accounts = await bankingService.getBankAccounts(true);
      setBankAccounts(accounts);
    } catch (error) {}
  };

  const [tillFormData, setTillFormData] = useState<TillCreate>({
    name: "",
    location: "",
    initialBalance: 0,
    currency: "USD",
    description: "",
  });

  const [editTillFormData, setEditTillFormData] = useState<TillUpdate>({
    name: "",
    location: "",
    initialBalance: 0,
    isActive: true,
    description: "",
  });

  const [transactionFormData, setTransactionFormData] =
    useState<TillTransactionCreate>({
      tillId: "",
      bankAccountId: undefined,
      transactionDate: new Date().toISOString().split("T")[0],
      transactionType: "deposit" as TillTransactionType,
      amount: 0,
      currency: "USD",
      description: "",
      reason: "",
      referenceNumber: "",
      notes: "",
    });

  const handleCreateTill = async () => {
    const payload: TillCreate = {
      ...tillFormData,
      name: tillFormData.name.trim(),
      location: tillFormData.location?.trim() || undefined,
      description: tillFormData.description?.trim() || undefined,
    };
    const validationError = validateTillCreate(payload);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    try {
      setLoading(true);
      await tillService.createTill(payload);
      toast.success("Till created successfully");
      setShowCreateTillModal(false);
      setTillFormData({
        name: "",
        location: "",
        initialBalance: 0,
        currency: "USD",
        description: "",
      });
      onRefresh();
    } catch (error) {
      toast.error(getTillApiErrorMessage(error, "Failed to create till"));
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (till: Till) => {
    setTillToEdit(till);
    setEditTillFormData({
      name: till.name,
      location: till.location || "",
      initialBalance: till.initialBalance || 0,
      isActive: till.isActive,
      description: till.description || "",
    });
    setShowEditTillModal(true);
  };

  const closeEditModal = () => {
    setShowEditTillModal(false);
    setTillToEdit(null);
    setEditTillFormData({
      name: "",
      location: "",
      initialBalance: 0,
      isActive: true,
      description: "",
    });
  };

  const handleUpdateTill = async () => {
    if (!tillToEdit) return;

    const payload: TillUpdate = {
      ...editTillFormData,
      name: editTillFormData.name?.trim(),
      location: editTillFormData.location?.trim() || undefined,
      description: editTillFormData.description?.trim() || undefined,
    };
    const validationError = validateTillUpdate(payload);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    try {
      setLoading(true);
      await tillService.updateTill(tillToEdit.id, payload);
      toast.success("Till updated successfully");
      closeEditModal();
      onRefresh();
    } catch (error) {
      toast.error(getTillApiErrorMessage(error, "Failed to update till"));
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (till: Till) => {
    setTillToDelete(till);
    setShowDeleteTillModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteTillModal(false);
    setTillToDelete(null);
  };

  const handleDeleteTill = async () => {
    if (!tillToDelete) return;

    try {
      setDeleteLoading(true);
      await tillService.deleteTill(tillToDelete.id);
      toast.success("Till deleted successfully");
      closeDeleteModal();
      onRefresh();
    } catch (error) {
      toast.error("Failed to delete till");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewTransactions = async (till: Till) => {
    try {
      setLoading(true);
      setSelectedTill(till);
      const trans = await tillService.getTillTransactions(till.id);
      setTransactions(trans);
    } catch (error) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async () => {
    if (!selectedTill) return;

    try {
      setLoading(true);
      await tillService.createTillTransaction({
        ...transactionFormData,
        tillId: selectedTill.id,
      });
      toast.success("Transaction created successfully");
      setShowTransactionModal(false);
      setTransactionFormData({
        tillId: selectedTill.id,
        bankAccountId: undefined,
        transactionDate: new Date().toISOString().split("T")[0],
        transactionType: "deposit" as TillTransactionType,
        amount: 0,
        currency: "USD",
        description: "",
        reason: "",
        referenceNumber: "",
        notes: "",
      });
      await handleViewTransactions(selectedTill);
      onRefresh();
    } catch (error) {
      toast.error("Failed to create transaction");
    } finally {
      setLoading(false);
    }
  };

  const createTillError = validateTillCreate(tillFormData);
  const editTillError = validateTillUpdate(editTillFormData);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight">Till Management</h2>
          <p className="text-muted-foreground">
            Manage physical cash in the office
          </p>
        </div>
        <Button
          onClick={() => setShowCreateTillModal(true)}
          className="w-full shrink-0 sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Till
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {tills.map((till) => (
          <Card
            key={till.id}
            className="hover:shadow-lg transition-shadow overflow-hidden min-w-0"
          >
            <CardHeader className="space-y-2 pb-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <CardTitle className="text-lg leading-tight break-words pr-2">
                  {till.name}
                </CardTitle>
                {till.isActive ? (
                  <Badge className="bg-green-500">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Current Balance:
                  </span>
                  <span className="text-xl font-bold">
                    {formatCurrency(till.currentBalance)}
                  </span>
                </div>
                {till.location && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Location:
                    </span>
                    <span className="text-sm">{till.location}</span>
                  </div>
                )}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
                  <Button
                    variant="outline"
                    className="w-full min-w-0 justify-center sm:flex-1 sm:basis-[min(100%,12rem)]"
                    onClick={() => handleViewTransactions(till)}
                  >
                    <Eye className="h-4 w-4 mr-2 shrink-0" />
                    <span className="truncate">View Transactions</span>
                  </Button>
                  <div className="flex gap-2 w-full sm:w-auto sm:flex-none sm:shrink-0 justify-center sm:justify-stretch">
                    <Button
                      variant="outline"
                      size="icon"
                      className="flex-1 sm:flex-none sm:size-10"
                      onClick={() => openEditModal(till)}
                      aria-label="Edit till"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="flex-1 sm:flex-none sm:size-10"
                      onClick={() => openDeleteModal(till)}
                      aria-label="Delete till"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showCreateTillModal} onOpenChange={setShowCreateTillModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Till</DialogTitle>
            <DialogDescription>
              Create a new till for managing physical cash
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Till Name *</Label>
              <Input
                id="name"
                value={tillFormData.name}
                maxLength={200}
                onChange={(e) =>
                  setTillFormData({ ...tillFormData, name: e.target.value })
                }
                placeholder="e.g., Main Office Drawer"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={tillFormData.location}
                maxLength={500}
                onChange={(e) =>
                  setTillFormData({ ...tillFormData, location: e.target.value })
                }
                placeholder="e.g., Office Reception"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="initialBalance">Initial Balance</Label>
              <Input
                id="initialBalance"
                type="number"
                step="0.01"
                value={tillFormData.initialBalance}
                onChange={(e) => {
                  const raw = parseFloat(e.target.value);
                  setTillFormData({
                    ...tillFormData,
                    initialBalance: Number.isFinite(raw) ? raw : 0,
                  });
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={tillFormData.description}
                maxLength={2000}
                onChange={(e) =>
                  setTillFormData({
                    ...tillFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Add any notes about this till"
              />
            </div>
            {createTillError && (
              <p className="text-sm text-destructive">{createTillError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateTillModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTill}
              disabled={loading || createTillError !== null}
            >
              Create Till
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={selectedTill !== null}
        onOpenChange={() => setSelectedTill(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transactions - {selectedTill?.name}</DialogTitle>
            <DialogDescription>
              Current Balance:{" "}
              {formatCurrency(selectedTill?.currentBalance || 0)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowTransactionModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Running Balance</TableHead>
                    <TableHead>Bank Account</TableHead>
                    <TableHead>Bank Balance</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{formatDate(t.transactionDate)}</TableCell>
                      <TableCell>
                        <Badge
                          className={getTillTransactionTypeColor(
                            t.transactionType,
                          )}
                        >
                          {getTillTransactionTypeLabel(t.transactionType)}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={
                          t.transactionType === "deposit"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {t.transactionType === "deposit" ? "+" : "-"}
                        {formatCurrency(t.amount)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(t.runningBalance)}
                      </TableCell>
                      <TableCell>
                        {t.bankAccount ? (
                          <span className="text-sm">
                            {t.bankAccount.accountName ||
                              t.bankAccount.bankName}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {t.bankAccount ? (
                          <span className="font-medium text-blue-600">
                            {formatCurrency(t.bankAccount.currentBalance || 0)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{t.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showTransactionModal}
        onOpenChange={setShowTransactionModal}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>
              Record a deposit or withdrawal from the till
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="transactionType">Transaction Type *</Label>
              <Select
                value={transactionFormData.transactionType}
                onValueChange={(value) =>
                  setTransactionFormData({
                    ...transactionFormData,
                    transactionType: value as TillTransactionType,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bankAccountId">Bank Account (Optional)</Label>
              <Select
                value={transactionFormData.bankAccountId || undefined}
                onValueChange={(value) =>
                  setTransactionFormData({
                    ...transactionFormData,
                    bankAccountId: value === "none" ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bank account (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.accountName} ({account.bankName}) -{" "}
                      {formatCurrency(account.currentBalance || 0)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={transactionFormData.amount}
                onChange={(e) =>
                  setTransactionFormData({
                    ...transactionFormData,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={transactionFormData.description}
                onChange={(e) =>
                  setTransactionFormData({
                    ...transactionFormData,
                    description: e.target.value,
                  })
                }
                placeholder="What is this transaction for?"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={transactionFormData.reason}
                onChange={(e) =>
                  setTransactionFormData({
                    ...transactionFormData,
                    reason: e.target.value,
                  })
                }
                placeholder="Optional reason"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="referenceNumber">Reference Number</Label>
              <Input
                id="referenceNumber"
                value={transactionFormData.referenceNumber}
                onChange={(e) =>
                  setTransactionFormData({
                    ...transactionFormData,
                    referenceNumber: e.target.value,
                  })
                }
                placeholder="Optional reference"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={transactionFormData.notes}
                onChange={(e) =>
                  setTransactionFormData({
                    ...transactionFormData,
                    notes: e.target.value,
                  })
                }
                placeholder="Additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTransactionModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTransaction}
              disabled={loading || !transactionFormData.description}
            >
              Add Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditTillModal} onOpenChange={setShowEditTillModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Till</DialogTitle>
            <DialogDescription>Update till information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Till Name *</Label>
              <Input
                id="edit-name"
                value={editTillFormData.name}
                maxLength={200}
                onChange={(e) =>
                  setEditTillFormData({
                    ...editTillFormData,
                    name: e.target.value,
                  })
                }
                placeholder="e.g., Main Office Drawer"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={editTillFormData.location}
                maxLength={500}
                onChange={(e) =>
                  setEditTillFormData({
                    ...editTillFormData,
                    location: e.target.value,
                  })
                }
                placeholder="e.g., Office Reception"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-initialBalance">Initial Balance</Label>
              <Input
                id="edit-initialBalance"
                type="number"
                step="0.01"
                value={editTillFormData.initialBalance}
                onChange={(e) => {
                  const raw = parseFloat(e.target.value);
                  setEditTillFormData({
                    ...editTillFormData,
                    initialBalance: Number.isFinite(raw) ? raw : 0,
                  });
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editTillFormData.description}
                maxLength={2000}
                onChange={(e) =>
                  setEditTillFormData({
                    ...editTillFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Add any notes about this till"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={editTillFormData.isActive}
                onCheckedChange={(checked) =>
                  setEditTillFormData({
                    ...editTillFormData,
                    isActive: checked,
                  })
                }
              />
              <Label htmlFor="edit-isActive">Active</Label>
            </div>
            {editTillError && (
              <p className="text-sm text-destructive">{editTillError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTill}
              disabled={loading || editTillError !== null}
            >
              {loading ? "Updating..." : "Update Till"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteTillModal} onOpenChange={setShowDeleteTillModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Till</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the till &quot;
              {tillToDelete?.name}&quot;? This action will permanently delete
              the till and all its transactions. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end mt-4">
            <Button
              variant="outline"
              onClick={closeDeleteModal}
              disabled={deleteLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteTill}
              disabled={deleteLoading}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
