"use client";

import { Button } from "@/src/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import type { BankingDashboardHeaderProps } from "./types";

export function BankingDashboardHeader({
  activeTab,
  refreshing,
  onRefresh,
  onAddAccount,
}: BankingDashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold">Banking Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your bank accounts, transactions, and cash position
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
        {activeTab === "banks" && (
          <Button onClick={onAddAccount}>
            <Plus className="h-4 w-4 mr-2" />
            Add Bank Account
          </Button>
        )}
      </div>
    </div>
  );
}
