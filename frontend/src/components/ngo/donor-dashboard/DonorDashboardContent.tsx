"use client";

import Link from "next/link";
import {
  ArrowUp,
  BookUser,
  Building2,
  LineChart,
  Gift,
  HeartHandshake,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { DashboardLayout } from "@/src/components/layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import {
  MOCK_DONOR_DASHBOARD_STATS,
  MOCK_DONOR_PIPELINE,
  MOCK_DONOR_QUICK_ACTIONS,
  type DonorDashboardStat,
  type DonorPipelineStage,
} from "@/src/data/ngo/mockDonorDashboard";

const statAccent: Record<DonorDashboardStat["accent"], string> = {
  emerald: "border-l-emerald-500 text-emerald-600",
  blue: "border-l-blue-500 text-blue-600",
  purple: "border-l-purple-500 text-purple-600",
  orange: "border-l-orange-500 text-orange-600",
};

const statIconBg: Record<DonorDashboardStat["accent"], string> = {
  emerald: "bg-emerald-100 text-emerald-600",
  blue: "bg-blue-100 text-blue-600",
  purple: "bg-purple-100 text-purple-600",
  orange: "bg-orange-100 text-orange-600",
};

const pipelineBorder: Record<DonorPipelineStage["accent"], string> = {
  emerald: "border-t-emerald-500",
  blue: "border-t-blue-500",
  purple: "border-t-purple-500",
  orange: "border-t-orange-500",
  green: "border-t-green-500",
  gray: "border-t-gray-400",
};

const pipelineBadge: Record<DonorPipelineStage["accent"], string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  orange: "bg-orange-100 text-orange-700",
  green: "bg-green-100 text-green-700",
  gray: "bg-gray-100 text-gray-600",
};

const quickActionStyles: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
  blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
  purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-100",
  orange: "bg-orange-50 text-orange-600 group-hover:bg-orange-100",
  teal: "bg-teal-50 text-teal-600 group-hover:bg-teal-100",
};

function StatIcon({ accent }: { accent: DonorDashboardStat["accent"] }) {
  const cls = "h-5 w-5";
  if (accent === "emerald") return <UserPlus className={cls} />;
  if (accent === "blue") return <Users className={cls} />;
  if (accent === "purple") return <HeartHandshake className={cls} />;
  return <LineChart className={cls} />;
}

function QuickActionIcon({ label }: { label: string }) {
  const cls = "h-6 w-6";
  if (label.includes("Leads")) return <UserPlus className={cls} />;
  if (label.includes("Donors")) return <Users className={cls} />;
  if (label.includes("Contacts")) return <BookUser className={cls} />;
  if (label.includes("Partner")) return <Building2 className={cls} />;
  return <Gift className={cls} />;
}

export function DonorDashboardContent() {
  return (
    <DashboardLayout>
      <div className="container mx-auto space-y-8 px-6 py-8">
        <div>
          <h1 className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-3xl font-bold text-transparent">
            Donor Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage donor relationships and donation pipeline
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {MOCK_DONOR_DASHBOARD_STATS.map((stat) => (
            <Card
              key={stat.label}
              className={cn(
                "border-l-4 shadow-md",
                statAccent[stat.accent].split(" ")[0],
              )}
            >
              <CardContent className="p-5">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p
                      className={cn(
                        "mt-2 text-3xl font-bold",
                        statAccent[stat.accent].split(" ")[1],
                      )}
                    >
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={cn("rounded-xl p-3", statIconBg[stat.accent])}
                  >
                    <StatIcon accent={stat.accent} />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="flex items-center text-green-600">
                    <ArrowUp className="mr-0.5 h-3 w-3" />
                    {stat.change}
                  </span>
                  <span className="text-muted-foreground">
                    {stat.changeLabel}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-800">
              <LineChart className="h-5 w-5 text-emerald-500" />
              Donation Pipeline
            </h2>
            <p className="text-sm text-muted-foreground">
              Track donation opportunities through pipeline stages
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {MOCK_DONOR_PIPELINE.map((stage) => (
              <Card
                key={stage.title}
                className={cn(
                  "border-t-4 shadow-md transition-shadow hover:-translate-y-0.5 hover:shadow-lg",
                  pipelineBorder[stage.accent],
                )}
              >
                <CardContent className="p-5">
                  <div className="mb-3 flex justify-between gap-2">
                    <h3 className="font-semibold text-gray-800">
                      {stage.title}
                    </h3>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs",
                        pipelineBadge[stage.accent],
                      )}
                    >
                      {stage.stage}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {stage.count}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    donation opportunities
                  </p>
                  <div className="mt-3 space-y-2 border-t pt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {stage.valueLabel}
                      </span>
                      <span className="font-semibold text-emerald-600">
                        {stage.value}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {stage.secondaryLabel}
                      </span>
                      <span className="font-medium text-amber-600">
                        {stage.secondaryValue}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Zap className="h-5 w-5 text-amber-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {MOCK_DONOR_QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.href}
                  variant="outline"
                  className="group flex h-auto flex-col gap-2 rounded-xl border-gray-200 py-4 hover:border-emerald-400"
                  asChild
                >
                  <Link href={action.href}>
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl",
                        quickActionStyles[action.accent],
                      )}
                    >
                      <QuickActionIcon label={action.label} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {action.label}
                    </span>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
