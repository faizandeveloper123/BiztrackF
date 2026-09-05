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
import { Badge } from "@/src/components/ui/badge";
import { Label } from "@/src/components/ui/label";
import { formatDate } from "@/src/lib/utils";
import { getTransactionTypeLabel } from "@/src/models/ledger";
import { getStatusColor, getAccountName } from "./ledgerUtils";
import type { LedgerTransactionViewDialogProps } from "./types";

export function LedgerTransactionViewDialog({
  transaction,
  accounts,
  formatCurrency,
  onClose,
}: LedgerTransactionViewDialogProps) {
  return (
    <Dialog open={!!transaction} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            View transaction information and details.
          </DialogDescription>
        </DialogHeader>
        {transaction && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">
                  Transaction Number
                </Label>
                <p className="text-sm">{transaction.transaction_number}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Date</Label>
                <p className="text-sm">
                  {formatDate(transaction.transaction_date)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Type</Label>
                <p className="text-sm">
                  {getTransactionTypeLabel(transaction.transaction_type)}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="mt-1">
                  <Badge variant={getStatusColor(transaction.status)}>
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Description</Label>
              <p className="text-sm">{transaction.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Debit Account</Label>
                <p className="text-sm">
                  {getAccountName(transaction.account_id, accounts)}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Credit Account</Label>
                <p className="text-sm">
                  {getAccountName(transaction.contra_account_id, accounts)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Amount</Label>
                <p className="text-sm font-medium">
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Currency</Label>
                <p className="text-sm">
                  {transaction.meta_data?.currency || "USD"}
                </p>
              </div>
            </div>

            {transaction.reference_number && (
              <div>
                <Label className="text-sm font-medium">Reference Number</Label>
                <p className="text-sm">{transaction.reference_number}</p>
              </div>
            )}

            {transaction.meta_data?.notes && (
              <div>
                <Label className="text-sm font-medium">Notes</Label>
                <p className="text-sm">{transaction.meta_data.notes}</p>
              </div>
            )}

            {transaction.meta_data?.tags &&
              transaction.meta_data.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {transaction.meta_data.tags.map(
                      (tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ),
                    )}
                  </div>
                </div>
              )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
