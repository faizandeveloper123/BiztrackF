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
import { Textarea } from "../ui/textarea";
import { Mail, Loader2 } from "lucide-react";
import { Invoice } from "../../models/sales";

interface SendInvoiceEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onSend: (
    invoiceId: string,
    toEmail: string,
    message?: string,
  ) => Promise<void>;
}

export function SendInvoiceEmailDialog({
  open,
  onOpenChange,
  invoice,
  onSend,
}: SendInvoiceEmailDialogProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && invoice) {
      setEmail(invoice.customerEmail || "");
      setMessage("");
      setError(null);
    }
  }, [open, invoice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoice) return;

    if (!email || !email.trim()) {
      setError("Email address is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setSending(true);
      setError(null);
      await onSend(invoice.id, email.trim(), message.trim() || undefined);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open && !!invoice} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {invoice && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Send Invoice via Email
              </DialogTitle>
              <DialogDescription>
                Send invoice {invoice.invoiceNumber} to the recipient below.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Recipient Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="recipient@example.com"
                    className="pl-10"
                    required
                    disabled={sending}
                  />
                </div>
                {invoice.customerEmail && invoice.customerEmail !== email && (
                  <p className="text-xs text-gray-500">
                    Customer email: {invoice.customerEmail}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Additional Message (Optional)</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a custom message to include in the email..."
                  rows={4}
                  disabled={sending}
                />
                <p className="text-xs text-gray-500">
                  This message will be included in the email body along with the
                  invoice details.
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
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Invoice
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
