"use client";

import {
  CircleDollarSign,
  HeartHandshake,
  TrendingUp,
  Users,
} from "lucide-react";
import type { NgoSnapshot } from "@/src/types/ngoDashboard";
import { NgoStatCard } from "./NgoStatCard";

type NgoStatsGridProps = {
  snapshot: NgoSnapshot;
  raisedLabel: string;
  currencySymbol: string;
};

export function NgoStatsGrid({
  snapshot,
  raisedLabel,
  currencySymbol,
}: NgoStatsGridProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      <NgoStatCard
        label="Total Donations"
        value={raisedLabel}
        subtext="From recorded revenue"
        icon={CircleDollarSign}
        accent="emerald"
      />
      <NgoStatCard
        label="Active Donors"
        value={snapshot.activeDonors.toLocaleString()}
        subtext="CRM contacts"
        icon={Users}
        accent="blue"
      />
      <NgoStatCard
        label="Avg Donation"
        value={`${currencySymbol}${snapshot.avgDonation.toLocaleString()}`}
        subtext="Per supporter"
        icon={TrendingUp}
        accent="purple"
      />
      <NgoStatCard
        label="Impact Score"
        value={`${snapshot.impactScore}%`}
        subtext="Project completion"
        icon={HeartHandshake}
        accent="orange"
      />
    </div>
  );
}
