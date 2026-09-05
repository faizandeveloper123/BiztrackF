"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import type { BankingMetricsCardsProps } from "./types";

export function BankingMetricsCards({
  dashboardData,
  formatCurrency,
}: BankingMetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Outstanding Receivables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(dashboardData?.outstandingReceivables || 0)}
          </div>
          <p className="text-xs text-muted-foreground">Money owed to you</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Outstanding Payables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(dashboardData?.outstandingPayables || 0)}
          </div>
          <p className="text-xs text-muted-foreground">Money you owe</p>
        </CardContent>
      </Card>
    </div>
  );
}
