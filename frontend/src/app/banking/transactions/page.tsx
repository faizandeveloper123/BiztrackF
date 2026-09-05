"use client";

import React, { useEffect, useState } from "react";
import { ModuleGuard } from "@/src/components/guards/PermissionGuard";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/src/contexts/AuthContext";
import { useCrudPermissions } from "@/src/hooks/usePermissions";
import { bankingService } from "@/src/services/BankingService";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import {
  BankTransaction,
  BankAccount,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
} from "@/src/models/banking";
import { DashboardLayout } from "@/src/components/layout";
import { toast } from "sonner";
import { extractErrorMessage } from "@/src/utils/errorUtils";
import { TransactionPageHeader } from "@/src/components/banking/TransactionPageHeader";
import { TransactionFilters } from "@/src/components/banking/TransactionFilters";
import { TransactionsTable } from "@/src/components/banking/TransactionsTable";
import { TransactionFormDialog } from "@/src/components/banking/TransactionFormDialog";
import { TransactionViewDialog } from "@/src/components/banking/TransactionViewDialog";
import { TransactionDeleteDialog } from "@/src/components/banking/TransactionDeleteDialog";
import { getBankAccountDisplay } from "@/src/components/banking/bankingUtils";
import type { TransactionFormData } from "@/src/components/banking/types";

export default function BankTransactionsPage() {
  return (
    <ModuleGuard
      module="banking"
      fallback={<div>You don&apos;t have access to Banking module</div>}
    >
      <BankTransactionsContent />
    </ModuleGuard>
  );
}

const emptyFormData = (): TransactionFormData => ({
  bank_account_id: "",
  transaction_date: new Date().toISOString().split("T")[0],
  value_date: "",
  transaction_type: TransactionType.DEPOSIT,
  status: TransactionStatus.PENDING,
  amount: 0,
  currency: "USD",
  exchange_rate: 1.0,
  base_amount: 0,
  payment_method: PaymentMethod.CASH,
  reference_number: "",
  external_reference: "",
  check_number: "",
  description: "",
  memo: "",
  category: "",
  counterparty_name: "",
  counterparty_account: "",
  counterparty_bank: "",
  is_reconciled: false,
  related_invoice_id: "",
  related_purchase_order_id: "",
  related_expense_id: "",
  tags: [],
  notes: "",
});

function BankTransactionsContent() {
  const { canUpdate, canDelete } = useCrudPermissions("banking:transactions");
  const {} = useAuth();
  const { formatCurrency } = useCurrency();

  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingTransaction, setViewingTransaction] =
    useState<BankTransaction | null>(null);
  const [editingTransaction, setEditingTransaction] =
    useState<BankTransaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingTransaction, setDeletingTransaction] =
    useState<BankTransaction | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<TransactionFormData>(emptyFormData);

  // Edit form state
  const [editFormData, setEditFormData] = useState<TransactionFormData>(
    emptyFormData,
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, accountsData] = await Promise.all([
        bankingService.getBankTransactions(),
        bankingService.getBankAccounts(true),
      ]);

      setTransactions(transactionsData || []);
      setBankAccounts(accountsData || []);
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to load transactions"));
    } finally {
      setLoading(false);
    }
  };

  const buildTransactionPayload = (data: TransactionFormData) => ({
    bankAccountId: data.bank_account_id,
    transactionDate: new Date(data.transaction_date).toISOString(),
    valueDate: data.value_date
      ? new Date(data.value_date).toISOString()
      : undefined,
    transactionType: data.transaction_type,
    status: data.status,
    amount: data.amount,
    currency: data.currency,
    exchangeRate: data.exchange_rate,
    baseAmount: data.base_amount,
    paymentMethod: data.payment_method,
    referenceNumber: data.reference_number || undefined,
    externalReference: data.external_reference || undefined,
    checkNumber: data.check_number || undefined,
    description: data.description,
    memo: data.memo || undefined,
    category: data.category || undefined,
    counterpartyName: data.counterparty_name || undefined,
    counterpartyAccount: data.counterparty_account || undefined,
    counterpartyBank: data.counterparty_bank || undefined,
    isReconciled: data.is_reconciled,
    relatedInvoiceId: data.related_invoice_id || undefined,
    relatedPurchaseOrderId: data.related_purchase_order_id || undefined,
    relatedExpenseId: data.related_expense_id || undefined,
    tags: data.tags,
    notes: data.notes || undefined,
  });

  const validateForm = (data: TransactionFormData) => {
    if (!data.bank_account_id) {
      toast.error("Please select a bank account");
      return false;
    }
    if (!data.transaction_date) {
      toast.error("Please select a transaction date");
      return false;
    }
    if (!data.description.trim()) {
      toast.error("Please enter a description");
      return false;
    }
    if (data.amount <= 0) {
      toast.error("Please enter a valid amount");
      return false;
    }
    return true;
  };

  const handleCreateTransaction = async () => {
    try {
      setIsSubmitting(true);

      if (!validateForm(formData)) return;

      await bankingService.createBankTransaction(
        buildTransactionPayload(formData),
      );
      toast.success("Transaction created successfully");
      setIsCreateModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to create transaction"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyFormData());
  };

  const openEditModal = (transaction: BankTransaction) => {
    setEditingTransaction(transaction);
    setEditFormData({
      bank_account_id: transaction.bankAccountId,
      transaction_date: new Date(transaction.transactionDate)
        .toISOString()
        .split("T")[0],
      value_date: transaction.valueDate
        ? new Date(transaction.valueDate).toISOString().split("T")[0]
        : "",
      transaction_type: transaction.transactionType,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      exchange_rate: transaction.exchangeRate,
      base_amount: transaction.baseAmount,
      payment_method: transaction.paymentMethod || PaymentMethod.CASH,
      reference_number: transaction.referenceNumber || "",
      external_reference: transaction.externalReference || "",
      check_number: transaction.checkNumber || "",
      description: transaction.description,
      memo: transaction.memo || "",
      category: transaction.category || "",
      counterparty_name: transaction.counterpartyName || "",
      counterparty_account: transaction.counterpartyAccount || "",
      counterparty_bank: transaction.counterpartyBank || "",
      is_reconciled: transaction.isReconciled,
      related_invoice_id: transaction.relatedInvoiceId || "",
      related_purchase_order_id: transaction.relatedPurchaseOrderId || "",
      related_expense_id: transaction.relatedExpenseId || "",
      tags: transaction.tags || [],
      notes: transaction.notes || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateTransaction = async () => {
    if (!editingTransaction) return;

    try {
      setIsSubmitting(true);

      if (!validateForm(editFormData)) return;

      await bankingService.updateBankTransaction(
        editingTransaction.id,
        buildTransactionPayload(editFormData),
      );
      toast.success("Transaction updated successfully");
      setIsEditModalOpen(false);
      setEditingTransaction(null);
      loadData();
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to update transaction"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (transaction: BankTransaction) => {
    setDeletingTransaction(transaction);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteTransaction = async () => {
    if (!deletingTransaction) return;

    try {
      setIsDeleting(true);
      await bankingService.deleteBankTransaction(deletingTransaction.id);
      toast.success("Transaction deleted successfully");
      setIsDeleteModalOpen(false);
      setDeletingTransaction(null);
      loadData();
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to delete transaction"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReconcileTransaction = async (transactionId: string) => {
    try {
      await bankingService.reconcileTransactionSimple(
        transactionId,
        "Reconciled from transactions page",
      );
      toast.success("Transaction reconciled successfully");
      loadData();
    } catch (error) {
      toast.error(
        extractErrorMessage(error, "Failed to reconcile transaction"),
      );
    }
  };

  const handleUnreconcileTransaction = async (transactionId: string) => {
    try {
      await bankingService.unreconcileTransaction(transactionId);
      toast.success("Transaction unreconciled successfully");
      loadData();
    } catch (error) {
      toast.error(
        extractErrorMessage(error, "Failed to unreconcile transaction"),
      );
    }
  };

  const handleViewEdit = (transaction: BankTransaction) => {
    setViewingTransaction(null);
    openEditModal(transaction);
  };

  const filteredTransactions = (transactions || []).filter((transaction) => {
    const accountLabel = getBankAccountDisplay(
      transaction.bankAccountId,
      bankAccounts,
    ).toLowerCase();
    const matchesSearch =
      transaction.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.counterpartyName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.referenceNumber?.includes(searchTerm) ||
      transaction.transactionNumber.includes(searchTerm) ||
      accountLabel.includes(searchTerm.toLowerCase());

    const matchesAccount =
      selectedAccount === "all" ||
      transaction.bankAccountId === selectedAccount;
    const matchesType =
      selectedType === "all" || transaction.transactionType === selectedType;
    const matchesStatus =
      selectedStatus === "all" || transaction.status === selectedStatus;

    return matchesSearch && matchesAccount && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading transactions...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8 space-y-6">
        <TransactionPageHeader onAddTransaction={() => setIsCreateModalOpen(true)} />

        <TransactionFilters
          bankAccounts={bankAccounts}
          searchTerm={searchTerm}
          selectedAccount={selectedAccount}
          selectedType={selectedType}
          selectedStatus={selectedStatus}
          onSearchChange={setSearchTerm}
          onAccountChange={setSelectedAccount}
          onTypeChange={setSelectedType}
          onStatusChange={setSelectedStatus}
        />

        <TransactionsTable
          transactions={filteredTransactions}
          bankAccounts={bankAccounts}
          formatCurrency={formatCurrency}
          isDeleting={isDeleting}
          onView={setViewingTransaction}
          onEdit={canUpdate() ? openEditModal : undefined}
          onReconcile={handleReconcileTransaction}
          onUnreconcile={handleUnreconcileTransaction}
          onDelete={canDelete() ? openDeleteModal : undefined}
        />

        <TransactionFormDialog
          open={isCreateModalOpen}
          mode="create"
          bankAccounts={bankAccounts}
          formData={formData}
          submitting={isSubmitting}
          onOpenChange={setIsCreateModalOpen}
          onFormDataChange={setFormData}
          onSubmit={handleCreateTransaction}
        />

        <TransactionViewDialog
          transaction={viewingTransaction}
          bankAccounts={bankAccounts}
          formatCurrency={formatCurrency}
          onClose={() => setViewingTransaction(null)}
          onEdit={canUpdate() ? handleViewEdit : undefined}
        />

        <TransactionFormDialog
          open={isEditModalOpen}
          mode="edit"
          bankAccounts={bankAccounts}
          formData={editFormData}
          submitting={isSubmitting}
          onOpenChange={setIsEditModalOpen}
          onFormDataChange={setEditFormData}
          onSubmit={handleUpdateTransaction}
        />

        <TransactionDeleteDialog
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
