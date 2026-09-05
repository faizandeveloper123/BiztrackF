"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ModuleGuard } from "../../../../components/guards/PermissionGuard";
import { DashboardLayout } from "../../../../components/layout";
import InvestmentForm from "../../../../components/investments/InvestmentForm";
import { Button } from "@/src/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewInvestmentPage() {
  return (
    <ModuleGuard
      module="ledger"
      fallback={<div>You don&apos;t have access to Ledger module</div>}
    >
      <NewInvestmentContent />
    </ModuleGuard>
  );
}

function NewInvestmentContent() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/ledger/investments");
  };

  const handleClose = () => {
    router.push("/ledger/investments");
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/ledger/investments")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Investments
          </Button>
        </div>

        <InvestmentForm
          isOpen={true}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      </div>
    </DashboardLayout>
  );
}
