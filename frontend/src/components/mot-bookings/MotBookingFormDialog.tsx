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
import type { MotBooking } from "@/src/models/mot/MotBooking";
import type { MotBookingFormData } from "./types";
import { MotBookingFormFields } from "./MotBookingFormFields";

type MotBookingFormDialogProps = {
  open: boolean;
  editingBooking: MotBooking | null;
  formData: MotBookingFormData;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (patch: Partial<MotBookingFormData>) => void;
  onTimeSlotChange: (slotKey: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export function MotBookingFormDialog({
  open,
  editingBooking,
  formData,
  saving,
  onOpenChange,
  onFormChange,
  onTimeSlotChange,
  onSubmit,
}: MotBookingFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingBooking ? "Edit MOT Booking" : "New MOT Booking"}
          </DialogTitle>
          <DialogDescription>
            {editingBooking
              ? "Update the MOT checkup booking details."
              : "Schedule a new MOT test appointment."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <MotBookingFormFields
            formData={formData}
            onChange={onFormChange}
            onTimeSlotChange={onTimeSlotChange}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {editingBooking ? "Update Booking" : "Create Booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
