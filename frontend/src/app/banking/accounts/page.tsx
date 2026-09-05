"use client";

import React, { useEffect, useState } from "react";
import { ModuleGuard } from "../../../components/guards/PermissionGuard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import {
  Banknote,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { bankingService } from "../../../services/BankingService";
import { useCurrency } from "../../../contexts/CurrencyContext";
import {
  BankAccount,
  BankAccountCreate,
  BankAccountType,
  getAccountTypeLabel,
} from "../../../models/banking";
import { DashboardLayout } from "../../../components/layout";
import { toast } from "sonner";
import { extractErrorMessage } from "../../../utils/errorUtils";
import { BankAccountFormDialog } from "../../../components/banking/BankAccountFormDialog";
import { BankAccountViewDialog } from "../../../components/banking/BankAccountViewDialog";
import { useCrudPermissions } from "@/src/hooks/usePermissions";

export default function BankAccountsPage() {
  return (
    <ModuleGuard
      module="banking"
      fallback={<div>You don&apos;t have access to Banking module</div>}
    >
      <BankAccountsContent />
    </ModuleGuard>
  );
}

function BankAccountsContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "banking:accounts",
  );
  const {} = useAuth();
  const { formatCurrency } = useCurrency();

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewingAccount, setViewingAccount] = useState<BankAccount | null>(
    null,
  );

  // Form state
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
    tags: [] as string[],
  });

  useEffect(() => {
    loadBankAccounts();
  }, []);

  const loadBankAccounts = async () => {
    try {
      setLoading(true);
      const accounts = await bankingService.getBankAccounts(true);
      setBankAccounts(accounts);
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to load bank accounts"));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      setIsSubmitting(true);
      await bankingService.createBankAccount(formData);
      toast.success("Bank account created successfully");
      setIsCreateModalOpen(false);
      resetForm();
      loadBankAccounts();
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to create bank account"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAccount = async () => {
    if (!selectedAccount) return;

    try {
      setIsSubmitting(true);
      await bankingService.updateBankAccount(selectedAccount.id, formData);
      toast.success("Bank account updated successfully");
      setIsEditModalOpen(false);
      resetForm();
      loadBankAccounts();
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to update bank account"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;

    try {
      setDeleteLoading(true);
      await bankingService.deleteBankAccount(selectedAccount.id);
      toast.success("Bank account deleted successfully");
      setIsDeleteModalOpen(false);
      setSelectedAccount(null);
      loadBankAccounts();
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to delete bank account"));
    } finally {
      setDeleteLoading(false);
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

  const openEditModal = (account: BankAccount) => {
    setSelectedAccount(account);
    setFormData({
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      routingNumber: account.routingNumber || "",
      bankName: account.bankName,
      bankCode: account.bankCode || "",
      accountType: account.accountType,
      currency: account.currency,
      currentBalance: account.currentBalance,
      availableBalance: account.availableBalance,
      pendingBalance: account.pendingBalance,
      isActive: account.isActive,
      isPrimary: account.isPrimary,
      supportsOnlineBanking: account.supportsOnlineBanking,
      description: account.description || "",
      tags: account.tags,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (account: BankAccount) => {
    setSelectedAccount(account);
    setIsDeleteModalOpen(true);
  };

  const filteredAccounts = bankAccounts.filter(
    (account) =>
      account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.accountNumber.includes(searchTerm),
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading bank accounts...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bank Accounts</h1>
            <p className="text-muted-foreground">
              Manage your bank accounts and track balances
            </p>
          </div>
          {canCreate() && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Bank Account
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Bank Accounts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Accounts ({filteredAccounts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Current Balance</TableHead>
                  <TableHead>Available Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {account.accountName}
                          </div>
                          {account.description && (
                            <div className="text-sm text-muted-foreground">
                              {account.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{account.bankName}</TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">
                        ****{account.accountNumber.slice(-4)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getAccountTypeLabel(account.accountType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(account.currentBalance)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(account.availableBalance)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={account.isActive ? "default" : "secondary"}
                        >
                          {account.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {account.isPrimary && (
                          <Badge variant="outline">Primary</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingAccount(account)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canUpdate() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(account)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteModal(account)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Bank Account Modal */}
        <BankAccountFormDialog
          open={isCreateModalOpen}
          mode="create"
          title="Create Bank Account"
          description="Add a new bank account to track transactions and balances."
          formData={formData}
          submitting={isSubmitting}
          onOpenChange={setIsCreateModalOpen}
          onFormDataChange={setFormData}
          onSubmit={handleCreateAccount}
        />

        {/* Edit Bank Account Modal */}
        <BankAccountFormDialog
          open={isEditModalOpen}
          mode="edit"
          title="Edit Bank Account"
          description="Update bank account information."
          formData={formData}
          submitting={isSubmitting}
          onOpenChange={setIsEditModalOpen}
          onFormDataChange={setFormData}
          onSubmit={handleEditAccount}
        />

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Bank Account</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the bank account &quot;
                {selectedAccount?.accountName}&quot;? This action will
                deactivate the account and cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleteLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Bank Account Modal */}
        <BankAccountViewDialog
          account={viewingAccount}
          formatCurrency={formatCurrency}
          onClose={() => setViewingAccount(null)}
          footerActionLabel="Edit Account"
          onFooterAction={() => {
            if (viewingAccount) openEditModal(viewingAccount);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
