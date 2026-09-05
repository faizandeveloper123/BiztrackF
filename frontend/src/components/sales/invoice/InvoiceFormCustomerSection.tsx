"use client";

import { CustomerSearch } from "@/src/components/ui/customer-search";
import { AddCustomerButton } from "../commerce-invoice/AddCustomerButton";
import { usePermissions } from "@/src/hooks/usePermissions";
import type { Customer } from "@/src/services/CustomerService";
import type { InvoiceFormMode } from "@/src/types/sales/invoiceForm";

type InvoiceFormCustomerSectionProps = {
  mode: InvoiceFormMode;
  selectedCustomer: Customer | null;
  customerError?: string;
  onCustomerSelect: (customer: Customer | null) => void;
  onNewCustomer: () => void;
};

export function InvoiceFormCustomerSection({
  mode,
  selectedCustomer,
  customerError,
  onCustomerSelect,
  onNewCustomer,
}: InvoiceFormCustomerSectionProps) {
  const { hasPermission } = usePermissions();
  const canCreateCustomer =
    hasPermission("crm:customers:create") ||
    hasPermission("crm:create");
  return (
    <div className="border-t border-border/60 pt-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start">
        <span className="shrink-0 pt-2 text-sm font-medium text-muted-foreground lg:w-[108px] lg:text-right">
          Customer Name: *
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-col gap-2 md:flex-row md:items-end">
            <div className="min-w-0 flex-1 [&_label]:sr-only [&>div>div.mt-2]:hidden [&_input]:h-10">
              <CustomerSearch
                value={selectedCustomer}
                onSelect={onCustomerSelect}
                placeholder="Search by name, email, phone..."
                label="Customer"
                required
                error={customerError}
              />
            </div>
            {mode !== "view" && canCreateCustomer && (
              <AddCustomerButton
                onClick={onNewCustomer}
                className="w-full shrink-0 md:w-auto"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
