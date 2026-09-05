"use client";

import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import type { AdminPlan } from "@/src/types/adminPlan";

type AdminPlanEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: AdminPlan | null;
  isUpdating: boolean;
  onPatchPlan: (patch: Partial<AdminPlan>) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function AdminPlanEditDialog({
  open,
  onOpenChange,
  plan,
  isUpdating,
  onPatchPlan,
  onSave,
  onCancel,
}: AdminPlanEditDialogProps) {
  if (!open || !plan) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Plan</DialogTitle>
          <DialogDescription>
            Update the plan details and settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Plan Name
              </label>
              <Input
                value={plan.name}
                onChange={(e) => onPatchPlan({ name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Price</label>
              <Input
                type="number"
                step="0.01"
                value={plan.price}
                onChange={(e) =>
                  onPatchPlan({ price: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>
            <Input
              value={plan.description}
              onChange={(e) => onPatchPlan({ description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Billing Cycle
              </label>
              <Select
                value={plan.billingCycle}
                onValueChange={(value) => onPatchPlan({ billingCycle: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Max Users
              </label>
              <Input
                type="number"
                value={plan.maxUsers ?? ""}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value, 10);
                  onPatchPlan({
                    maxUsers: Number.isNaN(parsed) ? undefined : parsed,
                  });
                }}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={plan.isActive}
              onChange={(e) => onPatchPlan({ isActive: e.target.checked })}
              className="rounded"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-gray-700"
            >
              Plan is active
            </label>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={onSave} disabled={isUpdating} className="w-full sm:w-auto">
              {isUpdating ? "Updating..." : "Update Plan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
