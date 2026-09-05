"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { MessageCircle, Loader2 } from "lucide-react";
import {
  ProfitLossPeriod,
  getProfitLossPeriodLabel,
} from "@/src/models/ledger";

interface SendProfitLossWhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  period: ProfitLossPeriod;
  startDate?: string;
  endDate?: string;
  onSend: (phoneNumber: string) => Promise<void>;
}

export function SendProfitLossWhatsAppDialog({
  open,
  onOpenChange,
  period,
  startDate,
  endDate,
  onSend,
}: SendProfitLossWhatsAppDialogProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPhoneNumber("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber || !phoneNumber.trim()) {
      setError("Phone number is required");
      return;
    }

    const cleanedPhone = phoneNumber.trim().replace(/\s+/g, "");
    if (cleanedPhone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    try {
      setSending(true);
      setError(null);
      await onSend(cleanedPhone);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to generate WhatsApp link");
    } finally {
      setSending(false);
    }
  };

  const periodLabel =
    startDate && endDate
      ? `${startDate} to ${endDate}`
      : getProfitLossPeriodLabel(period);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Send Profit/Loss Report via WhatsApp
          </DialogTitle>
          <DialogDescription>
            Send profit/loss report for {periodLabel} via WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <div className="relative">
              <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setError(null);
                }}
                placeholder="+1234567890 or 1234567890"
                className="pl-10"
                required
                disabled={sending}
              />
            </div>
            <p className="text-xs text-gray-500">
              Include country code (e.g., +1 for US, +44 for UK)
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Link...
                </>
              ) : (
                <>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Open WhatsApp
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
