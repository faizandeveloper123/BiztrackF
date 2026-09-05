"use client";

import type { UseInvoiceFormReturn } from "@/src/hooks/useInvoiceForm";
import type { InvoiceFormMode } from "@/src/types/sales/invoiceForm";
import { CommerceInvoiceFormHeader } from "../commerce-invoice/CommerceInvoiceFormHeader";
import { InvoiceFormDetailsSection } from "./InvoiceFormDetailsSection";
import { InvoiceFormItemsSection } from "./InvoiceFormItemsSection";
import { InvoiceFormTotalsSummary } from "./InvoiceFormTotalsSummary";
import { InvoiceFormNotesSection } from "./InvoiceFormNotesSection";
import { InvoiceInstallmentSection } from "./InvoiceInstallmentSection";
import { InvoiceFormActions } from "./InvoiceFormActions";

type WorkshopInvoiceFormProps = {
  mode: InvoiceFormMode;
  form: UseInvoiceFormReturn;
  error?: string | null;
};

export function WorkshopInvoiceForm({
  mode,
  form,
  error,
}: WorkshopInvoiceFormProps) {
  const clearNewItemErrors = () => {
    form.clearFieldError("newItemProduct");
    form.clearFieldError("newItemDescription");
    form.clearFieldError("newItemQuantity");
    form.clearFieldError("newItemUnitPrice");
  };

  return (
    <form
      onSubmit={form.handleSubmit}
      className="flex w-full min-w-0 max-w-full flex-col gap-2 text-foreground"
    >
      <CommerceInvoiceFormHeader
        mode={mode === "view" ? "create" : mode}
        onClearInvoice={form.clearInvoice}
      />

      <InvoiceFormDetailsSection
        mode={mode}
        formData={form.formData}
        errors={form.errors}
        selectedCustomer={form.selectedCustomer}
        selectedVehicle={form.selectedVehicle}
        jobCardId={form.jobCardId}
        showWorkshop={form.isWorkshop}
        onInputChange={form.handleInputChange}
        onCustomerSelect={form.handleCustomerSelect}
        onVehicleSelect={form.setSelectedVehicle}
        onJobCardSelect={form.setJobCardId}
        onNewCustomer={() => form.setShowCreateCustomerDialog(true)}
      />

      <InvoiceFormItemsSection
        mode={mode}
        loading={form.loading}
        items={form.items}
        newItem={form.newItem}
        products={form.products}
        errors={form.errors}
        onNewItemChange={form.setNewItem}
        onAddItem={form.addItem}
        onRemoveItem={form.removeItem}
        onUpdateItem={form.updateItem}
        onProductSelect={form.handleProductSelect}
        clearNewItemErrors={clearNewItemErrors}
      />

      <InvoiceFormTotalsSummary
        mode={mode}
        totals={form.totals}
        labourCost={form.formData.labourCost}
        vatRate={form.formData.vatRate}
        onLabourCostChange={form.handleInputChange}
      />

      <InvoiceFormNotesSection
        formData={form.formData}
        onInputChange={form.handleInputChange}
      />

      {form.isCommerceOrAgency && mode !== "view" && (
        <InvoiceInstallmentSection
          createInstallmentPlan={form.createInstallmentPlan}
          installmentCount={form.installmentCount}
          installmentFrequency={form.installmentFrequency}
          installmentFirstDueDate={form.installmentFirstDueDate}
          onToggle={form.setCreateInstallmentPlan}
          onCountChange={form.setInstallmentCount}
          onFrequencyChange={form.setInstallmentFrequency}
          onFirstDueDateChange={form.setInstallmentFirstDueDate}
        />
      )}

      <InvoiceFormActions
        mode={mode}
        loading={form.loading}
        error={error}
        onCancel={form.handleDismiss}
      />
    </form>
  );
}
