"use client";

import Link from "next/link";
import { ArrowRight, Boxes } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import type { NgoSnapshot } from "@/src/types/ngoDashboard";

type NgoInventoryStatusCardProps = {
  snapshot: NgoSnapshot;
  formatCurrency: (amount: number) => string;
};

export function NgoInventoryStatusCard({
  snapshot,
  formatCurrency,
}: NgoInventoryStatusCardProps) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Boxes className="h-5 w-5 text-blue-500" />
          Gift &amp; Inventory Status
        </CardTitle>
        <CardDescription>Stock and pending in-kind activity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3">
          <span className="text-sm font-medium">Low stock items</span>
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            {snapshot.lowStockItems} items
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-yellow-50 p-3">
          <span className="text-sm font-medium">Pending donations</span>
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
            {snapshot.pendingDonations} awaiting
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-blue-50 p-3">
          <span className="text-sm font-medium">Est. gift value (sample)</span>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            {formatCurrency(snapshot.giftDonationsToday)}
          </span>
        </div>
        <Button
          variant="outline"
          className="mt-2 w-full border-blue-600 text-blue-700"
          asChild
        >
          <Link href="/inventory">
            Manage inventory
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
