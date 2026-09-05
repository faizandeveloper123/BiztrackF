"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import type { SupplierDeleteDialogProps } from "./types";

export function SupplierDeleteDialog({
  open,
  supplier,
  onOpenChange,
  onConfirm,
  onCancel,
}: SupplierDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Supplier</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{supplier?.name}</strong>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={onConfirm} className="w-full sm:w-auto bg-red-600 hover:bg-red-700">
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
