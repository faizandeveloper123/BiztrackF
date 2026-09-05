"use client";

import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/src/components/layout";

export function MotBookingsLoadingState() {
  return (
    <DashboardLayout>
      <div className="container mx-auto flex min-h-[400px] items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </DashboardLayout>
  );
}
