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
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Switch } from "@/src/components/ui/switch";
import {
  BankAccountCreate,
  BankAccountType,
  getAccountTypeLabel,
} from "@/src/models/banking";

interface BankAccountFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  title: string;
  description: string;
  formData: BankAccountCreate;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onFormDataChange: (data: BankAccountCreate) => void;
  onSubmit: () => void;
}

const inputId = (prefix: string, field: string) => `${prefix}-${field}`;

export function BankAccountFormDialog({
  open,
  mode,
  title,
  description,
  formData,
  submitting,
  onOpenChange,
  onFormDataChange,
  onSubmit,
}: BankAccountFormDialogProps) {
  const update = (field: keyof BankAccountCreate, value: unknown) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  const prefix = mode === "edit" ? "edit" : "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "accountName")}>
              Account Name *
            </Label>
            <Input
              id={inputId(prefix, "accountName")}
              value={formData.accountName}
              onChange={(e) => update("accountName", e.target.value)}
              placeholder="e.g., Main Business Account"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "accountNumber")}>
              Account Number *
            </Label>
            <Input
              id={inputId(prefix, "accountNumber")}
              value={formData.accountNumber}
              onChange={(e) => update("accountNumber", e.target.value)}
              placeholder="1234567890"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "bankName")}>Bank Name *</Label>
            <Input
              id={inputId(prefix, "bankName")}
              value={formData.bankName}
              onChange={(e) => update("bankName", e.target.value)}
              placeholder="e.g., Chase Bank"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "routingNumber")}>
              Routing Number
            </Label>
            <Input
              id={inputId(prefix, "routingNumber")}
              value={formData.routingNumber || ""}
              onChange={(e) => update("routingNumber", e.target.value)}
              placeholder="123456789"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "bankCode")}>Bank Code</Label>
            <Input
              id={inputId(prefix, "bankCode")}
              value={formData.bankCode || ""}
              onChange={(e) => update("bankCode", e.target.value)}
              placeholder="Bank code"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "accountType")}>
              Account Type *
            </Label>
            <Select
              value={formData.accountType}
              onValueChange={(value) =>
                update("accountType", value as BankAccountType)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(BankAccountType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {getAccountTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "currency")}>Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => update("currency", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="CAD">CAD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "currentBalance")}>
              Current Balance
            </Label>
            <Input
              id={inputId(prefix, "currentBalance")}
              type="number"
              step="0.01"
              value={formData.currentBalance ?? 0}
              onChange={(e) =>
                update("currentBalance", parseFloat(e.target.value) || 0)
              }
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "availableBalance")}>
              Available Balance
            </Label>
            <Input
              id={inputId(prefix, "availableBalance")}
              type="number"
              step="0.01"
              value={formData.availableBalance ?? 0}
              onChange={(e) =>
                update("availableBalance", parseFloat(e.target.value) || 0)
              }
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={inputId(prefix, "pendingBalance")}>
              Pending Balance
            </Label>
            <Input
              id={inputId(prefix, "pendingBalance")}
              type="number"
              step="0.01"
              value={formData.pendingBalance ?? 0}
              onChange={(e) =>
                update("pendingBalance", parseFloat(e.target.value) || 0)
              }
              placeholder="0.00"
            />
          </div>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-3 md:col-span-2">
            <div className="flex items-center space-x-2">
              <Switch
                id={inputId(prefix, "isActive")}
                checked={formData.isActive ?? true}
                onCheckedChange={(checked) => update("isActive", checked)}
              />
              <Label htmlFor={inputId(prefix, "isActive")}>
                Active Account
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id={inputId(prefix, "isPrimary")}
                checked={formData.isPrimary ?? false}
                onCheckedChange={(checked) => update("isPrimary", checked)}
              />
              <Label htmlFor={inputId(prefix, "isPrimary")}>
                Primary Account
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id={inputId(prefix, "supportsOnlineBanking")}
                checked={formData.supportsOnlineBanking ?? false}
                onCheckedChange={(checked) =>
                  update("supportsOnlineBanking", checked)
                }
              />
              <Label htmlFor={inputId(prefix, "supportsOnlineBanking")}>
                Supports Online Banking
              </Label>
            </div>
          </div>

          <div className="space-y-2 md:col-span-3">
            <Label htmlFor={inputId(prefix, "description")}>Description</Label>
            <Textarea
              id={inputId(prefix, "description")}
              value={formData.description || ""}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Optional description for this account"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting
              ? mode === "edit"
                ? "Updating..."
                : "Creating..."
              : mode === "edit"
                ? "Update Account"
                : "Create Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
