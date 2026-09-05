"use client";

import type { ReactNode } from "react";

type MotPublicLayoutProps = {
  children: ReactNode;
  tenantName?: string;
  tenantLogoUrl?: string | null;
};

export function MotPublicLayout({
  children,
  tenantName,
  tenantLogoUrl,
}: MotPublicLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="border-b bg-white/80 backdrop-blur dark:bg-slate-950/80">
        <div className="container mx-auto flex items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            {tenantLogoUrl && (
              <img
                src={tenantLogoUrl}
                alt={tenantName || "Workshop logo"}
                className="h-12 w-12 rounded-xl object-cover"
              />
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                MOT Booking
              </p>
              {tenantName && (
                <p className="text-sm font-medium text-muted-foreground">
                  {tenantName}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto space-y-6 p-4 sm:p-6">{children}</main>
    </div>
  );
}
