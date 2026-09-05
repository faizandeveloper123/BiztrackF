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
import { ShieldCheck } from "lucide-react";

type MotPrivacyConfirmModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function MotPrivacyConfirmModal({
  open,
  onOpenChange,
  onConfirm,
}: MotPrivacyConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <DialogTitle className="text-center text-xl">
            Privacy & Data Notice
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-2 text-center text-sm leading-relaxed">
            <p>
              We will use your personal details to process your MOT booking and
              contact you about your appointment.
            </p>
            <p>
              Your data is stored securely and handled in accordance with our
              Privacy Policy. You can update your communication preferences at
              any time.
            </p>
            <p className="font-medium text-foreground">
              By confirming, you acknowledge that you have read and accept our
              privacy practices for this booking.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={onConfirm}
            className="h-12 w-full bg-gradient-to-r from-blue-600 to-purple-600 font-bold uppercase tracking-wider"
          >
            Confirm & Continue
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Go Back
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
