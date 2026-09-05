"use client";

import { DashboardLayout } from "@/src/components/layout";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { NGO_ANNUAL_TARGET, type NgoSnapshot } from "@/src/types/ngoDashboard";
import { NgoDashboardHeader } from "./NgoDashboardHeader";
import { NgoDonationOverviewCard } from "./NgoDonationOverviewCard";
import { NgoInventoryStatusCard } from "./NgoInventoryStatusCard";
import { NgoQuickActionsCard } from "./NgoQuickActionsCard";
import { NgoQuickLinksCard } from "./NgoQuickLinksCard";
import { NgoStatsGrid } from "./NgoStatsGrid";

type NgoDashboardContentProps = {
  snapshot: NgoSnapshot;
};

export function NgoDashboardContent({ snapshot }: NgoDashboardContentProps) {
  const { formatCurrency, getCurrencySymbol } = useCurrency();
  const raisedLabel = formatCurrency(snapshot.totalDonations);
  const targetLabel = formatCurrency(NGO_ANNUAL_TARGET);

  return (
    <DashboardLayout>
      <div className="container mx-auto space-y-8 px-6 py-8">
        <NgoDashboardHeader />
        <NgoStatsGrid
          snapshot={snapshot}
          raisedLabel={raisedLabel}
          currencySymbol={getCurrencySymbol()}
        />
        <div className="grid gap-6 md:grid-cols-2">
          <NgoDonationOverviewCard
            snapshot={snapshot}
            raisedLabel={raisedLabel}
            targetLabel={targetLabel}
          />
          <NgoInventoryStatusCard
            snapshot={snapshot}
            formatCurrency={formatCurrency}
          />
        </div>
        <NgoQuickActionsCard />
        <NgoQuickLinksCard />
      </div>
    </DashboardLayout>
  );
}
