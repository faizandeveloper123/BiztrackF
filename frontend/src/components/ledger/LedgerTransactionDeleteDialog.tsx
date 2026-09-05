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
import type { LedgerTransactionDeleteDialogProps } from "./types";

export function LedgerTransactionDeleteDialog({
  transaction,
  open,
  isDeleting,
  formatCurrency: formatMoney,
  onOpenChange,
  onConfirm,
}: LedgerTransactionDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Transaction</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this transaction? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {transaction && (
          <div className="py-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium">{transaction.transaction_number}</p>
              <p className="text-sm text-muted-foreground">
                {transaction.description}
              </p>
              <p className="text-sm font-medium">
                {formatMoney(transaction.amount)}
              </p>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
