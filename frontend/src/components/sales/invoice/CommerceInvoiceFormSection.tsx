"use client";

import { CommerceInvoiceForm } from "../CommerceInvoiceForm";
import type { UseInvoiceFormReturn } from "@/src/hooks/useInvoiceForm";
import type { InvoiceFormMode } from "@/src/types/sales/invoiceForm";

type CommerceInvoiceFormSectionProps = {
  mode: InvoiceFormMode;
  form: UseInvoiceFormReturn;
  error?: string | null;
};

export function CommerceInvoiceFormSection({
  mode,
  form,
  error,
}: CommerceInvoiceFormSectionProps) {
  return (
    <form onSubmit={form.handleSubmit}>
      <CommerceInvoiceForm
        key={form.commerceFormKey}
        mode={mode === "view" ? "create" : mode}
        formData={form.formData}
        errors={form.errors}
        items={form.items}
        newItem={form.newItem}
        products={form.products}
        selectedCustomer={form.selectedCustomer}
        totals={form.totals}
        loading={form.loading}
        error={error}
        createInstallmentPlan={form.createInstallmentPlan}
        installmentCount={form.installmentCount}
        installmentFrequency={form.installmentFrequency}
        installmentFirstDueDate={form.installmentFirstDueDate}
        onInputChange={form.handleInputChange}
        onCustomerSelect={form.handleCustomerSelect}
        onNewItemChange={form.setNewItem}
        onProductSelect={form.handleProductSelect}
        onAddItem={form.addItem}
        onAddExtraItem={form.addExtraItem}
        onRemoveItem={form.removeItem}
        onUpdateItem={form.updateItem}
        onClearInvoice={form.clearInvoice}
        onCancel={form.handleDismiss}
        onNewCustomer={() => form.setShowCreateCustomerDialog(true)}
        setCreateInstallmentPlan={form.setCreateInstallmentPlan}
        setInstallmentCount={form.setInstallmentCount}
        setInstallmentFrequency={form.setInstallmentFrequency}
        setInstallmentFirstDueDate={form.setInstallmentFirstDueDate}
        clearFieldError={form.clearFieldError}
      />
    </form>
  );
}
