"use client";

import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import type { Customer } from "@/src/services/CustomerService";
import type { InvoiceCreate } from "@/src/models/sales";
import { getCustomerDisplayName } from "@/src/utils/customerUtils";
import { COMMERCE_INPUT_CLS } from "./constants";
import { AddCustomerButton } from "./AddCustomerButton";
import { InlineField } from "./InlineField";
import { usePermissions } from "@/src/hooks/usePermissions";

type CommerceInvoiceDetailsSectionProps = {
  formData: InvoiceCreate;
  errors: Record<string, string>;
  selectedCustomer: Customer | null;
  customerSearch: string;
  customerOptions: Customer[];
  onInputChange: (field: keyof InvoiceCreate, value: string | number) => void;
  onCustomerSearchChange: (value: string) => void;
  onCustomerPick: (customerId: string) => void;
  onOrderTimeChange: (value: string) => void;
  onNewCustomer?: () => void;
};

export function CommerceInvoiceDetailsSection({
  formData,
  errors,
  selectedCustomer,
  customerSearch,
  customerOptions,
  onInputChange,
  onCustomerSearchChange,
  onCustomerPick,
  onOrderTimeChange,
  onNewCustomer,
}: CommerceInvoiceDetailsSectionProps) {
  const { hasPermission } = usePermissions();
  const canCreateCustomer =
    hasPermission("crm:customers:create") || hasPermission("crm:create");
  return (
    <section className="rounded-lg border border-border bg-card px-3 pb-3 pt-2">
      <div className="grid grid-cols-1 gap-x-6 gap-y-2 lg:grid-cols-2">
        <div className="space-y-1.5">
          <InlineField label="Order Number:">
            <Input
              id="orderNumber"
              value={formData.orderNumber || ""}
              readOnly
              placeholder="Auto-generated (ORD-YYYYMMDD-0001)"
              className={`${COMMERCE_INPUT_CLS} bg-muted`}
            />
          </InlineField>
        </div>

        <div className="space-y-1.5">
          <InlineField label="Date & Time:">
            <Input
              id="orderTime"
              type="datetime-local"
              value={formData.orderTime || ""}
              onChange={(e) => onOrderTimeChange(e.target.value)}
              className={COMMERCE_INPUT_CLS}
            />
          </InlineField>
          <InlineField
            label="Due Date:"
            labelClassName="text-destructive"
            required
          >
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => onInputChange("dueDate", e.target.value)}
              className={`${COMMERCE_INPUT_CLS} ${errors.dueDate ? "border-destructive" : ""}`}
            />
          </InlineField>
          {errors.dueDate && (
            <p className="pl-[116px] text-xs text-destructive">
              {errors.dueDate}
            </p>
          )}
          {errors.issueDate && (
            <p className="pl-[116px] text-xs text-destructive">
              {errors.issueDate}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 border-t border-border/60 pt-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start">
          <span className="shrink-0 pt-2 text-sm font-medium text-muted-foreground lg:w-[108px] lg:text-right">
            Customer Name: *
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <Input
                value={customerSearch}
                onChange={(e) => onCustomerSearchChange(e.target.value)}
                placeholder="Search by name, email, phone..."
                className={`${COMMERCE_INPUT_CLS} h-10 min-w-0 flex-1`}
              />
              <Select
                value={selectedCustomer?.id || ""}
                onValueChange={onCustomerPick}
              >
                <SelectTrigger
                  className={`${COMMERCE_INPUT_CLS} h-10 w-full shrink-0 md:w-[220px] ${errors.customer ? "border-destructive" : ""}`}
                >
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCustomer &&
                    !customerOptions.some(
                      (c) => c.id === selectedCustomer.id,
                    ) && (
                      <SelectItem value={selectedCustomer.id}>
                        {getCustomerDisplayName(selectedCustomer)}
                      </SelectItem>
                    )}
                  {customerOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {getCustomerDisplayName(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {onNewCustomer && canCreateCustomer ? (
                <AddCustomerButton
                  onClick={onNewCustomer}
                  className="w-full shrink-0 md:w-auto"
                />
              ) : null}
            </div>
            {errors.customer ? (
              <p className="text-xs text-destructive">{errors.customer}</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
