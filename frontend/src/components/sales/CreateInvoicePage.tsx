"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { DashboardLayout } from "@/src/components/layout";
import { PermissionGuard } from "@/src/components/guards/PermissionGuard";
import { Button } from "@/src/components/ui/button";
import { CreateInvoiceSection } from "./CreateInvoiceSection";
import { InvoiceCreatedDialog } from "./InvoiceCreatedDialog";
import { InvoiceCustomizationDialog } from "./InvoiceCustomizationDialog";
import { InstallmentPlanCreateOption } from "./InvoiceDialog";
import InvoiceService from "@/src/services/InvoiceService";
import type { Invoice, InvoiceCreate } from "@/src/models/sales";
import { usePlanInfo } from "@/src/hooks/usePlanInfo";
import { usePermissions } from "@/src/hooks/usePermissions";
import { extractErrorMessage } from "@/src/utils/errorUtils";

function CreateInvoicePageContent() {
  const { planInfo } = usePlanInfo();
  const { isOwner } = usePermissions();
  const isCommerce =
    planInfo?.planType === "commerce" || planInfo?.planType === "agency";
  const [createError, setCreateError] = useState<string | null>(null);
  const [showCustomizeDialog, setShowCustomizeDialog] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const canCustomizeInvoice = isOwner();

  const handleCreateInvoice = async (
    invoiceData: InvoiceCreate,
    options?: { installmentPlan?: InstallmentPlanCreateOption },
  ) => {
    try {
      const created = await InvoiceService.createInvoice(invoiceData);
      if (options?.installmentPlan) {
        await InvoiceService.createInstallmentPlan({
          ...options.installmentPlan,
          invoice_id: created.id,
        });
      }
      setCreateError(null);
      setCreatedInvoice(created);
    } catch (err) {
      setCreateError(extractErrorMessage(err, "Failed to create invoice"));
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full min-w-0 max-w-full space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 md:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isCommerce ? "Create Sales Invoice" : "Create Invoice"}
            </h1>
            <p className="text-gray-600">
              {isCommerce
                ? "Create a new sales invoice"
                : "Create a new invoice"}
            </p>
          </div>
          {canCustomizeInvoice && (
            <Button
              onClick={() => setShowCustomizeDialog(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Customize Invoice
            </Button>
          )}
        </div>

        <CreateInvoiceSection
          onSubmit={handleCreateInvoice}
          error={createError}
        />

        <InvoiceCreatedDialog
          invoice={createdInvoice}
          onOpenChange={(open) => {
            if (!open) setCreatedInvoice(null);
          }}
        />

        {canCustomizeInvoice && (
          <InvoiceCustomizationDialog
            open={showCustomizeDialog}
            onOpenChange={setShowCustomizeDialog}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

export function CreateInvoicePage() {
  return (
    <PermissionGuard
      permission="sales:invoices:create"
      fallback={
        <DashboardLayout>
          <div className="px-3 py-12 text-center text-muted-foreground sm:px-4 md:px-5">
            You do not have permission to create invoices.
          </div>
        </DashboardLayout>
      }
      redirectTo={null}
    >
      <CreateInvoicePageContent />
    </PermissionGuard>
  );
}
