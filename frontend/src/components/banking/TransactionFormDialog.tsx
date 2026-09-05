"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
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
import { Switch } from "@/src/components/ui/switch";
import {
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  getTransactionTypeLabel,
  getTransactionStatusLabel,
  getPaymentMethodLabel,
} from "@/src/models/banking";
import type { TransactionFormDialogProps } from "./types";

const inputId = (prefix: string, field: string) => `${prefix}-${field}`;

export function TransactionFormDialog({
  open,
  mode,
  bankAccounts,
  formData,
  submitting,
  onOpenChange,
  onFormDataChange,
  onSubmit,
}: TransactionFormDialogProps) {
  const update = (field: keyof typeof formData, value: unknown) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  const handleAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    onFormDataChange({
      ...formData,
      amount,
      base_amount: amount * formData.exchange_rate,
    });
  };

  const handleExchangeRateChange = (value: string) => {
    const exchangeRate = parseFloat(value) || 0;
    onFormDataChange({
      ...formData,
      exchange_rate: exchangeRate,
      base_amount: formData.amount * exchangeRate,
    });
  };

  const prefix = mode === "edit" ? "edit" : "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Bank Transaction" : "Edit Bank Transaction"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Record a new bank transaction."
              : "Update the transaction details."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "bankAccountId")}>
              Bank Account *
            </Label>
            <Select
              value={formData.bank_account_id}
              onValueChange={(value) => update("bank_account_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.accountName} - {account.bankName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "transactionDate")}>
              Transaction Date *
            </Label>
            <Input
              id={inputId(prefix, "transactionDate")}
              type="date"
              value={formData.transaction_date}
              onChange={(e) => update("transaction_date", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "valueDate")}>Value Date</Label>
            <Input
              id={inputId(prefix, "valueDate")}
              type="date"
              value={formData.value_date}
              onChange={(e) => update("value_date", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "transactionType")}>
              Transaction Type *
            </Label>
            <Select
              value={formData.transaction_type}
              onValueChange={(value) =>
                update("transaction_type", value as TransactionType)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(TransactionType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {getTransactionTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "status")}>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                update("status", value as TransactionStatus)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(TransactionStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {getTransactionStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "paymentMethod")}>
              Payment Method
            </Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) =>
                update("payment_method", value as PaymentMethod)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(PaymentMethod).map((method) => (
                  <SelectItem key={method} value={method}>
                    {getPaymentMethodLabel(method)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "amount")}>Amount *</Label>
            <Input
              id={inputId(prefix, "amount")}
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "currency")}>Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => update("currency", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="CAD">CAD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "exchangeRate")}>
              Exchange Rate
            </Label>
            <Input
              id={inputId(prefix, "exchangeRate")}
              type="number"
              step="0.0001"
              value={formData.exchange_rate}
              onChange={(e) => handleExchangeRateChange(e.target.value)}
              placeholder="1.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "baseAmount")}>Base Amount</Label>
            <Input
              id={inputId(prefix, "baseAmount")}
              type="number"
              step="0.01"
              value={formData.base_amount}
              onChange={(e) =>
                update("base_amount", parseFloat(e.target.value) || 0)
              }
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "referenceNumber")}>
              Reference Number
            </Label>
            <Input
              id={inputId(prefix, "referenceNumber")}
              value={formData.reference_number}
              onChange={(e) => update("reference_number", e.target.value)}
              placeholder="Transaction reference"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "category")}>Category</Label>
            <Input
              id={inputId(prefix, "category")}
              value={formData.category}
              onChange={(e) => update("category", e.target.value)}
              placeholder="Transaction category"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "checkNumber")}>Check Number</Label>
            <Input
              id={inputId(prefix, "checkNumber")}
              value={formData.check_number}
              onChange={(e) => update("check_number", e.target.value)}
              placeholder="Check number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "externalReference")}>
              External Reference
            </Label>
            <Input
              id={inputId(prefix, "externalReference")}
              value={formData.external_reference}
              onChange={(e) => update("external_reference", e.target.value)}
              placeholder="External reference"
            />
          </div>
          <div className="flex items-end">
            <div className="flex items-center space-x-2 pb-1">
              <Switch
                id={inputId(prefix, "isReconciled")}
                checked={formData.is_reconciled}
                onCheckedChange={(checked) =>
                  update("is_reconciled", checked)
                }
              />
              <Label htmlFor={inputId(prefix, "isReconciled")}>
                Reconciled
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "counterpartyName")}>
              Counterparty Name
            </Label>
            <Input
              id={inputId(prefix, "counterpartyName")}
              value={formData.counterparty_name}
              onChange={(e) => update("counterparty_name", e.target.value)}
              placeholder="Who is this transaction with?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "counterpartyAccount")}>
              Counterparty Account
            </Label>
            <Input
              id={inputId(prefix, "counterpartyAccount")}
              value={formData.counterparty_account}
              onChange={(e) => update("counterparty_account", e.target.value)}
              placeholder="Counterparty account"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "counterpartyBank")}>
              Counterparty Bank
            </Label>
            <Input
              id={inputId(prefix, "counterpartyBank")}
              value={formData.counterparty_bank}
              onChange={(e) => update("counterparty_bank", e.target.value)}
              placeholder="Counterparty bank"
            />
          </div>

          <div className="space-y-2 md:col-span-3">
            <Label htmlFor={inputId(prefix, "description")}>
              Description *
            </Label>
            <Input
              id={inputId(prefix, "description")}
              value={formData.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Transaction description"
            />
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor={inputId(prefix, "memo")}>Memo</Label>
            <Textarea
              id={inputId(prefix, "memo")}
              value={formData.memo}
              onChange={(e) => update("memo", e.target.value)}
              placeholder="Additional notes"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting
              ? mode === "edit"
                ? "Updating..."
                : "Creating..."
              : mode === "edit"
                ? "Update Transaction"
                : "Create Transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
