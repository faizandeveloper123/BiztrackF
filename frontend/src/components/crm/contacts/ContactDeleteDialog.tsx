"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Contact } from "@/src/models/crm";

type ContactDeleteDialogProps = {
  contact: Contact | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ContactDeleteDialog({
  contact,
  deleting,
  onClose,
  onConfirm,
}: ContactDeleteDialogProps) {
  return (
    <Dialog open={!!contact} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Contact</DialogTitle>
        </DialogHeader>

        {contact && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete{" "}
              <strong>
                &quot;{contact.firstName} {contact.lastName}&quot;
              </strong>
              ? This action cannot be undone.
            </p>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={onConfirm}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Contact"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
