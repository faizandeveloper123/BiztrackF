"use client";

import React, { useState, useMemo } from "react";
import { ModuleGuard } from "@/src/components/guards/PermissionGuard";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/src/contexts/AuthContext";
import { useCrudPermissions } from "@/src/hooks/usePermissions";
import { LedgerService } from "@/src/services/ledgerService";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { formatDate } from "@/src/lib/utils";
import {
  LedgerTransactionResponse,
  TransactionType,
  TransactionStatus,
  getTransactionTypeLabel,
} from "@/src/models/ledger";
import { DashboardLayout } from "@/src/components/layout";
import { toast } from "sonner";
import { useCachedApi } from "@/src/hooks/useCachedApi";
import { extractErrorMessage } from "@/src/utils/errorUtils";
import { LedgerTransactionsHeader } from "@/src/components/ledger/LedgerTransactionsHeader";
import { LedgerSummaryCards } from "@/src/components/ledger/LedgerSummaryCards";
import { LedgerTransactionFilters } from "@/src/components/ledger/LedgerTransactionFilters";
import { LedgerTransactionsTable } from "@/src/components/ledger/LedgerTransactionsTable";
import { LedgerTransactionFormDialog } from "@/src/components/ledger/LedgerTransactionFormDialog";
import { LedgerTransactionViewDialog } from "@/src/components/ledger/LedgerTransactionViewDialog";
import { LedgerTransactionDeleteDialog } from "@/src/components/ledger/LedgerTransactionDeleteDialog";
import type { LedgerTransactionFormData } from "@/src/components/ledger/types";

export default function LedgerTransactionsPage() {
  return (
    <ModuleGuard
      module="ledger"
      fallback={<div>You don&apos;t have access to Ledger module</div>}
    >
      <LedgerTransactionsContent />
    </ModuleGuard>
  );
}

const emptyFormData = (): LedgerTransactionFormData => ({
  transaction_date: new Date().toISOString().split("T")[0],
  transaction_type: TransactionType.INCOME,
  debit_account_id: "",
  credit_account_id: "",
  amount: 0,
  currency: "USD",
  reference_number: "",
  description: "",
  notes: "",
  tags: [],
});

function LedgerTransactionsContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "ledger:transactions",
  );
  const {} = useAuth();
  const { formatCurrency } = useCurrency();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingTransaction, setViewingTransaction] =
    useState<LedgerTransactionResponse | null>(null);
  const [editingTransaction, setEditingTransaction] =
    useState<LedgerTransactionResponse | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingTransaction, setDeletingTransaction] =
    useState<LedgerTransactionResponse | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] =
    useState<LedgerTransactionFormData>(emptyFormData);

  // Edit form state
  const [editFormData, setEditFormData] =
    useState<LedgerTransactionFormData>(emptyFormData);

  // Fetch transactions with caching
  const {
    data: transactions,
    loading,
    refetch,
  } = useCachedApi<LedgerTransactionResponse[]>(
    `ledger_transactions_${selectedType}_${selectedStatus}_${selectedAccount}_${dateFrom}_${dateTo}`,
    () =>
      LedgerService.getLedgerTransactions(
        0,
        1000,
        selectedType === "all" ? undefined : (selectedType as TransactionType),
        selectedAccount === "all" ? undefined : selectedAccount,
        dateFrom || undefined,
        dateTo || undefined,
      ),
    { ttl: 300000 }, // 5 minutes cache
  );

  // Get chart of accounts for account selection
  const { data: accounts } = useCachedApi(
    "chart_of_accounts",
    () => LedgerService.getChartOfAccounts(),
    { ttl: 600000 }, // 10 minutes cache
  );

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter((transaction) => {
      const matchesSearch =
        transaction.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.transaction_number
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.reference_number
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesType =
        selectedType === "all" ||
        transaction.transaction_type === selectedType;
      const matchesStatus =
        selectedStatus === "all" || transaction.status === selectedStatus;
      const matchesAccount =
        selectedAccount === "all" ||
        transaction.account_id === selectedAccount ||
        transaction.contra_account_id === selectedAccount;

      return matchesSearch && matchesType && matchesStatus && matchesAccount;
    });
  }, [transactions, searchTerm, selectedType, selectedStatus, selectedAccount]);

  const handleCreateTransaction = async () => {
    try {
      setIsSubmitting(true);

      // Validate required fields
      if (!formData.debit_account_id || !formData.credit_account_id) {
        toast.error("Please select both debit and credit accounts");
        return;
      }

      if (!formData.description.trim()) {
        toast.error("Please enter a description");
        return;
      }

      if (formData.amount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      // Transform data to match backend expectations
      const transactionData = {
        transaction_date: new Date(formData.transaction_date).toISOString(),
        transaction_type: formData.transaction_type,
        amount: formData.amount,
        description: formData.description,
        reference_number: formData.reference_number || undefined,
        account_id: formData.debit_account_id,
        contra_account_id: formData.credit_account_id,
        status: TransactionStatus.PENDING,
        meta_data: {
          currency: formData.currency,
          notes: formData.notes,
          tags: formData.tags,
        },
      };

      await LedgerService.createLedgerTransaction(transactionData);
      toast.success("Transaction created successfully");
      setIsCreateModalOpen(false);
      setFormData(emptyFormData());
      refetch();
    } catch (error) {
      toast.error(
        extractErrorMessage(
          error,
          "Failed to create transaction. Please try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTransaction = async () => {
    if (!editingTransaction) return;

    try {
      setIsSubmitting(true);

      // Prepare the update data
      const updateData = {
        transaction_date: editFormData.transaction_date,
        transaction_type: editFormData.transaction_type,
        account_id: editFormData.debit_account_id,
        contra_account_id: editFormData.credit_account_id,
        amount: editFormData.amount,
        description: editFormData.description,
        reference_number: editFormData.reference_number,
        meta_data: {
          currency: editFormData.currency,
          notes: editFormData.notes,
          tags: editFormData.tags,
        },
      };

      await LedgerService.updateLedgerTransaction(
        editingTransaction.id,
        updateData,
      );

      // Refresh the transaction list
      refetch();

      toast.success("Transaction updated successfully");
      setIsEditModalOpen(false);
      setEditingTransaction(null);
    } catch (error) {
      toast.error(
        extractErrorMessage(
          error,
          "Failed to update transaction. Please try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!deletingTransaction) return;

    try {
      setIsDeleting(true);
      await LedgerService.deleteLedgerTransaction(deletingTransaction.id);

      // Remove the transaction from the local state
      refetch();

      toast.success("Transaction deleted successfully");
      setIsDeleteModalOpen(false);
      setDeletingTransaction(null);
    } catch (error) {
      toast.error(
        extractErrorMessage(
          error,
          "Failed to delete transaction. Please try again.",
        ),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (transaction: LedgerTransactionResponse) => {
    setEditingTransaction(transaction);

    // Format the date properly for the input field without timezone issues
    const formatDateForInput = (dateString: string) => {
      if (!dateString) return "";
      // Extract just the date part (YYYY-MM-DD) without time conversion
      return dateString.split("T")[0];
    };

    setEditFormData({
      transaction_date: formatDateForInput(transaction.transaction_date),
      transaction_type: transaction.transaction_type,
      debit_account_id: transaction.account_id,
      credit_account_id: transaction.contra_account_id,
      amount: transaction.amount,
      currency: transaction.meta_data?.currency || "USD",
      reference_number: transaction.reference_number || "",
      description: transaction.description,
      notes: transaction.meta_data?.notes || "",
      tags: transaction.meta_data?.tags || [],
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (transaction: LedgerTransactionResponse) => {
    setDeletingTransaction(transaction);
    setIsDeleteModalOpen(true);
  };

  const handleExport = () => {
    if (!filteredTransactions.length) {
      toast.error("No transactions to export");
      return;
    }

    const csvContent = [
      [
        "Transaction Number",
        "Date",
        "Type",
        "Description",
        "Debit Account",
        "Credit Account",
        "Amount",
        "Status",
        "Reference",
      ],
      ...filteredTransactions.map((t) => [
        t.transaction_number,
        formatDate(t.transaction_date),
        getTransactionTypeLabel(t.transaction_type),
        t.description,
        t.account_id,
        t.contra_account_id,
        formatCurrency(t.amount),
        t.status,
        t.reference_number || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger-transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Transactions exported successfully");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading transactions...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <LedgerTransactionsHeader
          onExport={handleExport}
          onAddTransaction={
            canCreate() ? () => setIsCreateModalOpen(true) : undefined
          }
        />

        <LedgerSummaryCards
          transactions={filteredTransactions}
          formatCurrency={formatCurrency}
        />

        <LedgerTransactionFilters
          accounts={accounts ?? undefined}
          searchTerm={searchTerm}
          selectedType={selectedType}
          selectedStatus={selectedStatus}
          selectedAccount={selectedAccount}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onSearchChange={setSearchTerm}
          onTypeChange={setSelectedType}
          onStatusChange={setSelectedStatus}
          onAccountChange={setSelectedAccount}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
        />

        <LedgerTransactionsTable
          transactions={filteredTransactions}
          accounts={accounts ?? undefined}
          formatCurrency={formatCurrency}
          onView={setViewingTransaction}
          onEdit={canUpdate() ? openEditModal : undefined}
          onDelete={canDelete() ? openDeleteModal : undefined}
        />

        <LedgerTransactionFormDialog
          open={isCreateModalOpen}
          mode="create"
          accounts={accounts ?? undefined}
          formData={formData}
          submitting={isSubmitting}
          onOpenChange={setIsCreateModalOpen}
          onFormDataChange={setFormData}
          onSubmit={handleCreateTransaction}
        />

        <LedgerTransactionViewDialog
          transaction={viewingTransaction}
          accounts={accounts ?? undefined}
          formatCurrency={formatCurrency}
          onClose={() => setViewingTransaction(null)}
        />

        <LedgerTransactionFormDialog
          open={isEditModalOpen}
          mode="edit"
          accounts={accounts ?? undefined}
          formData={editFormData}
          submitting={isSubmitting}
          onOpenChange={setIsEditModalOpen}
          onFormDataChange={setEditFormData}
          onSubmit={handleEditTransaction}
        />

        <LedgerTransactionDeleteDialog
          transaction={deletingTransaction}
          open={isDeleteModalOpen}
          isDeleting={isDeleting}
          formatCurrency={formatCurrency}
          onOpenChange={setIsDeleteModalOpen}
          onConfirm={handleDeleteTransaction}
        />
      </div>
    </DashboardLayout>
  );
}
