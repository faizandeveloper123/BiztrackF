"use client";

import {
  Calendar,
  CheckCircle2,
  Clock,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import type { MotBookingStats } from "@/src/models/mot/MotBooking";

type MotBookingsStatsCardProps = {
  stats: MotBookingStats | null;
};

export function MotBookingsStatsCard({ stats }: MotBookingsStatsCardProps) {
  if (!stats) return null;

  const items = [
    {
      label: "Total bookings",
      value: stats.total_bookings,
      icon: ClipboardList,
      color: "text-blue-600",
    },
    {
      label: "Today",
      value: stats.today_bookings,
      icon: Calendar,
      color: "text-indigo-600",
    },
    {
      label: "Upcoming (7 days)",
      value: stats.upcoming_week,
      icon: Clock,
      color: "text-amber-600",
    },
    {
      label: "Passed",
      value: stats.passed_count,
      icon: CheckCircle2,
      color: "text-green-600",
    },
    {
      label: "Failed / Cancelled",
      value: stats.failed_count + stats.cancelled_count,
      icon: AlertTriangle,
      color: "text-red-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
