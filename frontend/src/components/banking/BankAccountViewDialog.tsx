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
import { Banknote } from "lucide-react";
import { formatDate } from "@/src/lib/utils";
import { getAccountTypeLabel } from "@/src/models/banking";
import type { BankAccountViewDialogProps } from "./types";

export function BankAccountViewDialog({
  account,
  formatCurrency,
  onClose,
  footerActionLabel,
  onFooterAction,
}: BankAccountViewDialogProps) {
  return (
    <Dialog open={!!account} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Bank Account Details
          </DialogTitle>
          <DialogDescription>
            Complete information about the bank account
          </DialogDescription>
        </DialogHeader>

        {account && (
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Account Name
                  </Label>
                  <p className="text-lg font-semibold">
                    {account.accountName || "Unnamed Account"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Bank Name
                  </Label>
                  <p className="text-lg font-semibold">
                    {account.bankName || "Unknown Bank"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Account Number
                  </Label>
                  <p className="text-lg font-mono">
                    ****{account.accountNumber?.slice(-4) || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Account Type
                  </Label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {getAccountTypeLabel(account.accountType)}
                    </Badge>
                  </div>
                </div>
              </div>

              {account.routingNumber && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Routing Number
                  </Label>
                  <p className="text-lg font-mono">{account.routingNumber}</p>
                </div>
              )}

              {account.bankCode && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Bank Code
                  </Label>
                  <p className="text-lg font-mono">{account.bankCode}</p>
                </div>
              )}

              {/* Balance Information */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">
                  Balance Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Current Balance
                    </Label>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(account.currentBalance || 0)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Available Balance
                    </Label>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(account.availableBalance || 0)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Pending Balance
                    </Label>
                    <p className="text-xl font-bold text-orange-600">
                      {formatCurrency(account.pendingBalance || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Settings */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">
                  Account Settings
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Currency
                    </Label>
                    <p className="text-lg">{account.currency || "USD"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Status
                    </Label>
                    <div className="mt-1">
                      <Badge
                        variant={
                          account.isActive ? "default" : "secondary"
                        }
                      >
                        {account.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Primary Account
                    </Label>
                    <div className="mt-1">
                      <Badge
                        variant={
                          account.isPrimary ? "default" : "outline"
                        }
                      >
                        {account.isPrimary ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Online Banking
                    </Label>
                    <div className="mt-1">
                      <Badge
                        variant={
                          account.supportsOnlineBanking
                            ? "default"
                            : "outline"
                        }
                      >
                        {account.supportsOnlineBanking
                          ? "Supported"
                          : "Not Supported"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {account.description && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium text-gray-600">
                    Description
                  </Label>
                  <p className="text-gray-900 mt-1">{account.description}</p>
                </div>
              )}

              {/* Tags */}
              {account.tags && account.tags.length > 0 && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium text-gray-600">
                    Tags
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {account.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">
                  Account Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Account ID
                    </Label>
                    <p className="text-sm font-mono text-gray-500">
                      {account.id}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Created
                    </Label>
                    <p className="text-sm text-gray-500">
                      {formatDate(account.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Last Updated
                    </Label>
                    <p className="text-sm text-gray-500">
                      {formatDate(account.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {footerActionLabel && onFooterAction && (
            <Button onClick={onFooterAction}>{footerActionLabel}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
