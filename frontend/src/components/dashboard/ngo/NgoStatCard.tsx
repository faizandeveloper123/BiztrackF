"use client";

import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";
import type { NgoStatAccent } from "./ngoDashboardConfig";

const accentStyles: Record<
  NgoStatAccent,
  { border: string; value: string; icon: string }
> = {
  emerald: {
    border: "border-l-emerald-500",
    value: "text-emerald-600",
    icon: "bg-emerald-100 text-emerald-600",
  },
  blue: {
    border: "border-l-blue-500",
    value: "text-blue-600",
    icon: "bg-blue-100 text-blue-600",
  },
  purple: {
    border: "border-l-purple-500",
    value: "text-purple-600",
    icon: "bg-purple-100 text-purple-600",
  },
  orange: {
    border: "border-l-orange-500",
    value: "text-orange-600",
    icon: "bg-orange-100 text-orange-600",
  },
};

type NgoStatCardProps = {
  label: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
  accent: NgoStatAccent;
};

export function NgoStatCard({
  label,
  value,
  subtext,
  icon: Icon,
  accent,
}: NgoStatCardProps) {
  const styles = accentStyles[accent];

  return (
    <Card
      className={cn(
        "border-l-4 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg",
        styles.border,
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className={cn("mt-2 text-3xl font-bold", styles.value)}>
              {value}
            </p>
          </div>
          <div className={cn("rounded-xl p-3", styles.icon)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          <span className="font-medium text-emerald-600">
            <ArrowUpRight className="mr-0.5 inline h-3 w-3" />
            {subtext}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
