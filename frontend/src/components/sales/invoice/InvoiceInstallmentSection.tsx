"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

type InvoiceInstallmentSectionProps = {
  createInstallmentPlan: boolean;
  installmentCount: number;
  installmentFrequency: string;
  installmentFirstDueDate: string;
  onToggle: (value: boolean) => void;
  onCountChange: (value: number) => void;
  onFrequencyChange: (value: string) => void;
  onFirstDueDateChange: (value: string) => void;
};

export function InvoiceInstallmentSection({
  createInstallmentPlan,
  installmentCount,
  installmentFrequency,
  installmentFirstDueDate,
  onToggle,
  onCountChange,
  onFrequencyChange,
  onFirstDueDateChange,
}: InvoiceInstallmentSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Installments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="createInstallmentPlan"
            checked={createInstallmentPlan}
            onChange={(e) => onToggle(e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="createInstallmentPlan">
            Create installment plan for this invoice
          </Label>
        </div>
        {createInstallmentPlan && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="installmentCount">Number of installments</Label>
              <Input
                id="installmentCount"
                type="number"
                min={1}
                max={60}
                value={installmentCount}
                onChange={(e) =>
                  onCountChange(parseInt(e.target.value, 10) || 1)
                }
              />
            </div>
            <div>
              <Label htmlFor="installmentFrequency">Frequency</Label>
              <Select
                value={installmentFrequency}
                onValueChange={onFrequencyChange}
              >
                <SelectTrigger id="installmentFrequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="installmentFirstDueDate">First due date</Label>
              <Input
                id="installmentFirstDueDate"
                type="date"
                value={installmentFirstDueDate}
                onChange={(e) => onFirstDueDateChange(e.target.value)}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
