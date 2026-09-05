"use client";

import React from "react";
import { ModuleGuard } from "../../../components/guards/PermissionGuard";
import { DashboardLayout } from "../../../components/layout";
import InvestmentList from "../../../components/investments/InvestmentList";

export default function InvestmentsPage() {
  return (
    <ModuleGuard
      module="ledger"
      fallback={<div>You don&apos;t have access to Ledger module</div>}
    >
      <InvestmentsContent />
    </ModuleGuard>
  );
}

function InvestmentsContent() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <InvestmentList />
      </div>
    </DashboardLayout>
  );
}
