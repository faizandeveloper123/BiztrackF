"use client";

import { Input } from "@/src/components/ui/input";
import type { InvoiceCreate } from "@/src/models/sales";
import type {
  InvoiceFormErrors,
  InvoiceFormMode,
} from "@/src/types/sales/invoiceForm";
import { COMMERCE_INPUT_CLS } from "../commerce-invoice/constants";
import { InlineField } from "../commerce-invoice/InlineField";
import { InvoiceFormCustomerSection } from "./InvoiceFormCustomerSection";
import { InvoiceFormVehicleSection } from "./InvoiceFormVehicleSection";
import { InvoiceJobCardLink } from "./InvoiceJobCardLink";
import type { Customer } from "@/src/services/CustomerService";
import type { Vehicle } from "@/src/models/workshop";

type InvoiceFormDetailsSectionProps = {
  mode: InvoiceFormMode;
  formData: InvoiceCreate;
  errors: InvoiceFormErrors;
  selectedCustomer: Customer | null;
  selectedVehicle: Vehicle | null;
  jobCardId?: string;
  showWorkshop: boolean;
  onInputChange: (field: keyof InvoiceCreate, value: string | number) => void;
  onCustomerSelect: (customer: Customer | null) => void;
  onVehicleSelect: (vehicle: Vehicle | null) => void;
  onJobCardSelect: (jobCardId: string | undefined) => void;
  onNewCustomer: () => void;
};

export function InvoiceFormDetailsSection({
  mode,
  formData,
  errors,
  selectedCustomer,
  selectedVehicle,
  jobCardId,
  showWorkshop,
  onInputChange,
  onCustomerSelect,
  onVehicleSelect,
  onJobCardSelect,
  onNewCustomer,
}: InvoiceFormDetailsSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card px-3 pb-3 pt-2">
      <div className="grid grid-cols-1 gap-x-6 gap-y-2 lg:grid-cols-2">
        <div className="space-y-1.5">
          <InlineField label="Issue Date:" required>
            <Input
              id="issueDate"
              type="date"
              value={formData.issueDate}
              onChange={(e) => onInputChange("issueDate", e.target.value)}
              className={`${COMMERCE_INPUT_CLS} ${errors.issueDate ? "border-destructive" : ""}`}
            />
          </InlineField>
          {errors.issueDate && (
            <p className="pl-[116px] text-xs text-destructive">
              {errors.issueDate}
            </p>
          )}
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
          <InlineField label="Order Number:">
            <Input
              id="orderNumber"
              value={formData.orderNumber}
              onChange={(e) => onInputChange("orderNumber", e.target.value)}
              placeholder="Enter order number"
              className={COMMERCE_INPUT_CLS}
            />
          </InlineField>
          <InlineField label="Order Time:">
            <Input
              id="orderTime"
              type="datetime-local"
              value={formData.orderTime}
              onChange={(e) => onInputChange("orderTime", e.target.value)}
              className={COMMERCE_INPUT_CLS}
            />
          </InlineField>
        </div>

        {showWorkshop && (
          <div className="space-y-2">
            <InvoiceFormVehicleSection
              selectedVehicle={selectedVehicle}
              onVehicleSelect={onVehicleSelect}
              onInputChange={onInputChange}
            />
            <InvoiceJobCardLink
              value={jobCardId}
              onChange={onJobCardSelect}
              dense
            />
          </div>
        )}
      </div>

      <InvoiceFormCustomerSection
        mode={mode}
        selectedCustomer={selectedCustomer}
        customerError={errors.customer}
        onCustomerSelect={onCustomerSelect}
        onNewCustomer={onNewCustomer}
      />
    </section>
  );
}
