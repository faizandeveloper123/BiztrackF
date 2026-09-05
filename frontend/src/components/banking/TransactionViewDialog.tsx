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
import { Label } from "@/src/components/ui/label";
import { Clock, CheckCircle } from "lucide-react";
import { formatDate } from "@/src/lib/utils";
import {
  getTransactionTypeLabel,
  getPaymentMethodLabel,
} from "@/src/models/banking";
import {
  getBankAccountDisplay,
  getStatusBadge,
  getTransactionIcon,
  isIncome,
} from "./bankingUtils";
import type { TransactionViewDialogProps } from "./types";

export function TransactionViewDialog({
  transaction,
  bankAccounts,
  formatCurrency,
  onClose,
  onEdit,
}: TransactionViewDialogProps) {
  return (
    <Dialog open={!!transaction} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            View detailed information about this transaction.
          </DialogDescription>
        </DialogHeader>

        {transaction && (
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Transaction Number
                  </Label>
                  <p className="text-sm font-medium">
                    {transaction.transactionNumber}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Status
                  </Label>
                  <div className="mt-1">{getStatusBadge(transaction.status)}</div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Bank Account
                </Label>
                <p className="text-sm font-medium mt-1">
                  {getBankAccountDisplay(
                    transaction.bankAccountId,
                    bankAccounts,
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Transaction Date
                  </Label>
                  <p className="text-sm">
                    {formatDate(transaction.transactionDate)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Value Date
                  </Label>
                  <p className="text-sm">
                    {transaction.valueDate
                      ? formatDate(transaction.valueDate)
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Type
                  </Label>
                  <div className="flex items-center space-x-2 mt-1">
                    {getTransactionIcon(transaction.transactionType)}
                    <span className="text-sm">
                      {getTransactionTypeLabel(transaction.transactionType)}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Payment Method
                  </Label>
                  <p className="text-sm">
                    {transaction.paymentMethod
                      ? getPaymentMethodLabel(transaction.paymentMethod)
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Description
                </Label>
                <p className="text-sm">{transaction.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Amount
                  </Label>
                  <p
                    className={`text-sm font-medium ${
                      isIncome(transaction.transactionType)
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {isIncome(transaction.transactionType) ? "+" : "-"}
                    {formatCurrency(transaction.baseAmount)}{" "}
                    {transaction.currency}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Base Amount
                  </Label>
                  <p className="text-sm">
                    {formatCurrency(transaction.baseAmount)}
                  </p>
                </div>
              </div>

              {transaction.counterpartyName && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Counterparty
                  </Label>
                  <div>
                    <p className="text-sm font-medium">
                      {transaction.counterpartyName}
                    </p>
                    {transaction.counterpartyAccount && (
                      <p className="text-sm text-muted-foreground">
                        {transaction.counterpartyAccount}
                      </p>
                    )}
                    {transaction.counterpartyBank && (
                      <p className="text-sm text-muted-foreground">
                        {transaction.counterpartyBank}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {transaction.referenceNumber && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Reference Number
                  </Label>
                  <p className="text-sm">{transaction.referenceNumber}</p>
                </div>
              )}

              {transaction.memo && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Memo
                  </Label>
                  <p className="text-sm">{transaction.memo}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Reconciled
                  </Label>
                  <div className="flex items-center space-x-2 mt-1">
                    {transaction.isReconciled ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className="text-sm">
                      {transaction.isReconciled ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Created
                  </Label>
                  <p className="text-sm">{formatDate(transaction.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </Label>
                  <p className="text-sm">{formatDate(transaction.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {transaction && onEdit && (
            <Button onClick={() => onEdit(transaction)}>Edit Transaction</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
