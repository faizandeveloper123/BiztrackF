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
import { formatDate } from "@/src/lib/utils";
import { isIncome } from "./bankingUtils";
import type { TransactionDeleteDialogProps } from "./types";

export function TransactionDeleteDialog({
  transaction,
  open,
  isDeleting,
  formatCurrency,
  onOpenChange,
  onConfirm,
}: TransactionDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete Transaction</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this transaction? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {transaction && (
          <div className="py-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Description:</span>
                  <p className="text-sm text-gray-600">
                    {transaction.description}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Amount:</span>
                  <p className="text-sm text-gray-600">
                    {isIncome(transaction.transactionType) ? "+" : "-"}
                    {formatCurrency(transaction.baseAmount)}{" "}
                    {transaction.currency}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Date:</span>
                  <p className="text-sm text-gray-600">
                    {formatDate(transaction.transactionDate)}
                  </p>
                </div>
              </div>
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
