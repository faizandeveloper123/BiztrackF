"use client";

import { DashboardLayout } from "@/src/components/layout";
import { Button } from "@/src/components/ui/button";

type NgoDashboardErrorProps = {
  message: string;
  onRetry: () => void;
};

export function NgoDashboardError({
  message,
  onRetry,
}: NgoDashboardErrorProps) {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="py-12 text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            Charity Dashboard
          </h1>
          <p className="text-lg text-gray-600">{message}</p>
          <Button className="mt-4" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
