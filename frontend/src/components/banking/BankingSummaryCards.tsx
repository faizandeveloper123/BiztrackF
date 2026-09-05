"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Banknote,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import type { BankingSummaryCardsProps } from "./types";

export function BankingSummaryCards({
  dashboardData,
  formatCurrency,
}: BankingSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Bank Balance
          </CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(dashboardData?.totalBankBalance || 0)}
          </div>
          <p className="text-xs text-muted-foreground">Across all accounts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Available Balance
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(dashboardData?.totalAvailableBalance || 0)}
          </div>
          <p className="text-xs text-muted-foreground">Ready to use</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(dashboardData?.totalPendingBalance || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Processing transactions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              (dashboardData?.netCashFlow || 0) >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {formatCurrency(dashboardData?.netCashFlow || 0)}
          </div>
          <p className="text-xs text-muted-foreground">Today&apos;s flow</p>
        </CardContent>
      </Card>
    </div>
  );
}
