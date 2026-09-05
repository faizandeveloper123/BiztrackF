"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { SupplierFormFields } from "./SupplierFormFields";
import type { SupplierFormDialogProps } from "./types";

export function SupplierFormDialog({
  open,
  editingSupplier,
  formData,
  submitting,
  onOpenChange,
  onFormChange,
  onSubmit,
  onCancel,
}: SupplierFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingSupplier ? "Edit Supplier" : "Add Supplier"}
          </DialogTitle>
          <DialogDescription>
            {editingSupplier
              ? "Update the supplier information below."
              : "Add a new supplier to your vendor network."}
          </DialogDescription>
        </DialogHeader>

        <SupplierFormFields formData={formData} onChange={onFormChange} />

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={submitting} className="w-full sm:w-auto">
            {submitting
              ? editingSupplier
                ? "Updating..."
                : "Creating..."
              : editingSupplier
                ? "Update Supplier"
                : "Create Supplier"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
