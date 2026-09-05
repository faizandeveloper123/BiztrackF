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
import { TransactionType } from "@/src/models/ledger";
import type { LedgerTransactionFormDialogProps } from "./types";

const inputId = (prefix: string, name: string) =>
  prefix ? `${prefix}_${name}` : name;

export function LedgerTransactionFormDialog({
  open,
  mode,
  accounts,
  formData,
  submitting,
  onOpenChange,
  onFormDataChange,
  onSubmit,
}: LedgerTransactionFormDialogProps) {
  const prefix = mode === "edit" ? "edit" : "";

  const update = (field: keyof typeof formData, value: unknown) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Transaction" : "Create New Transaction"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update transaction information."
              : "Add a new transaction to the general ledger."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor={inputId(prefix, "transaction_date")}>
                Transaction Date
              </Label>
              <Input
                id={inputId(prefix, "transaction_date")}
                type="date"
                value={formData.transaction_date}
                onChange={(e) => update("transaction_date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={inputId(prefix, "transaction_type")}>
                Transaction Type
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
                  <SelectItem value={TransactionType.INCOME}>Income</SelectItem>
                  <SelectItem value={TransactionType.EXPENSE}>Expense</SelectItem>
                  <SelectItem value={TransactionType.TRANSFER}>
                    Transfer
                  </SelectItem>
                  <SelectItem value={TransactionType.ADJUSTMENT}>
                    Adjustment
                  </SelectItem>
                  <SelectItem value={TransactionType.REFUND}>Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={inputId(prefix, "amount")}>Amount</Label>
              <Input
                id={inputId(prefix, "amount")}
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  update("amount", parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor={inputId(prefix, "debit_account")}>
                Debit Account
              </Label>
              <Select
                value={formData.debit_account_id}
                onValueChange={(value) => update("debit_account_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select debit account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name} ({account.account_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={inputId(prefix, "credit_account")}>
                Credit Account
              </Label>
              <Select
                value={formData.credit_account_id}
                onValueChange={(value) => update("credit_account_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select credit account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name} ({account.account_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={inputId(prefix, "reference_number")}>
                Reference Number
              </Label>
              <Input
                id={inputId(prefix, "reference_number")}
                value={formData.reference_number}
                onChange={(e) => update("reference_number", e.target.value)}
                placeholder="Optional reference number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "description")}>Description</Label>
            <Input
              id={inputId(prefix, "description")}
              value={formData.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Enter transaction description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "notes")}>Notes</Label>
            <Textarea
              id={inputId(prefix, "notes")}
              value={formData.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Additional notes (optional)"
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
