"use client";

import Link from "next/link";
import { ArrowRight, PieChart } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Progress } from "@/src/components/ui/progress";
import type { NgoSnapshot } from "@/src/types/ngoDashboard";

type NgoDonationOverviewCardProps = {
  snapshot: NgoSnapshot;
  raisedLabel: string;
  targetLabel: string;
};

export function NgoDonationOverviewCard({
  snapshot,
  raisedLabel,
  targetLabel,
}: NgoDonationOverviewCardProps) {
  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-xl">
          <PieChart className="h-5 w-5 text-emerald-500" />
          Donation Overview
        </CardTitle>
        <span className="text-sm font-medium text-emerald-600">
          Target progress: {snapshot.annualProgressPercent}%
        </span>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span>Annual target progress</span>
            <span className="font-semibold">
              {snapshot.annualProgressPercent}% ({raisedLabel} of {targetLabel})
            </span>
          </div>
          <Progress
            value={snapshot.annualProgressPercent}
            className="h-3 bg-gray-200 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-teal-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-emerald-50 p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {snapshot.activeCampaigns}
            </div>
            <div className="text-xs text-muted-foreground">
              Active campaigns
            </div>
          </div>
          <div className="rounded-xl bg-blue-50 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {snapshot.teamMembers}
            </div>
            <div className="text-xs text-muted-foreground">Team members</div>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full border-emerald-600 text-emerald-700"
          asChild
        >
          <Link href="/ledger/reports">
            View financial reports
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
