"use client";

import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { COMMERCE_INPUT_CLS } from "./constants";

type CommerceInvoiceInstallmentSectionProps = {
  createInstallmentPlan: boolean;
  installmentCount: number;
  installmentFrequency: string;
  installmentFirstDueDate: string;
  setCreateInstallmentPlan: (value: boolean) => void;
  setInstallmentCount: (value: number) => void;
  setInstallmentFrequency: (value: string) => void;
  setInstallmentFirstDueDate: (value: string) => void;
};

export function CommerceInvoiceInstallmentSection({
  createInstallmentPlan,
  installmentCount,
  installmentFrequency,
  installmentFirstDueDate,
  setCreateInstallmentPlan,
  setInstallmentCount,
  setInstallmentFrequency,
  setInstallmentFirstDueDate,
}: CommerceInvoiceInstallmentSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Installment Plan</h3>
          <p className="text-xs text-muted-foreground">
            Split this invoice into scheduled payments.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2 py-1.5">
          <input
            type="checkbox"
            id="createInstallmentPlan"
            checked={createInstallmentPlan}
            onChange={(e) => setCreateInstallmentPlan(e.target.checked)}
            className="rounded border-input text-primary focus:ring-ring"
          />
          <label
            htmlFor="createInstallmentPlan"
            className="text-sm font-medium"
          >
            Enable installments
          </label>
        </div>
      </div>
      {createInstallmentPlan && (
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Number of installments
            </label>
            <Input
              type="number"
              min={1}
              max={60}
              value={installmentCount}
              onChange={(e) =>
                setInstallmentCount(parseInt(e.target.value, 10) || 1)
              }
              className={COMMERCE_INPUT_CLS}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Frequency
            </label>
            <Select
              value={installmentFrequency}
              onValueChange={setInstallmentFrequency}
            >
              <SelectTrigger className={COMMERCE_INPUT_CLS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              First due date
            </label>
            <Input
              type="date"
              value={installmentFirstDueDate}
              onChange={(e) => setInstallmentFirstDueDate(e.target.value)}
              className={COMMERCE_INPUT_CLS}
            />
          </div>
        </div>
      )}
    </section>
  );
}
