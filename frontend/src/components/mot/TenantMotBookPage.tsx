"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import { MotPublicLayout } from "@/src/components/mot/MotPublicLayout";
import { MotBookingWizardShell } from "@/src/components/mot/MotBookingWizardShell";
import { useMotBookingWizard } from "@/src/hooks/useMotBookingWizard";
import motBookingService from "@/src/services/MotBookingService";

function TenantMotBookContent({ tenantDomain }: { tenantDomain: string }) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const wizard = useMotBookingWizard({ tenantDomain });

  useEffect(() => {
    motBookingService
      .getPublicSettings(tenantDomain)
      .then(() => setAvailable(true))
      .catch(() => setAvailable(false));
  }, [tenantDomain]);

  if (available === false) {
    return (
      <MotPublicLayout tenantName={tenantDomain}>
        <div className="mx-auto max-w-lg rounded-3xl border bg-card p-8 text-center shadow-sm">
          <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">MOT booking unavailable</h1>
          <p className="mt-2 text-muted-foreground">
            This workshop has not enabled public MOT booking yet.
          </p>
        </div>
      </MotPublicLayout>
    );
  }

  if (wizard.loading || available === null) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <MotPublicLayout tenantName={wizard.tenantName || tenantDomain}>
      <MotBookingWizardShell wizard={wizard} />
    </MotPublicLayout>
  );
}

export function TenantMotBookPage() {
  const params = useParams();
  const tenantDomain = params.domain as string;

  return (
    <Suspense
      fallback={
        <MotPublicLayout tenantName={tenantDomain}>
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </MotPublicLayout>
      }
    >
      <TenantMotBookContent tenantDomain={tenantDomain} />
    </Suspense>
  );
}
