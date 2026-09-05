"use client";

import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/src/components/layout";

export function NgoDashboardLoading() {
  return (
    <DashboardLayout>
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    </DashboardLayout>
  );
}
