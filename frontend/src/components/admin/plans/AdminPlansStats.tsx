"use client";

import { Activity, CheckCircle, CreditCard, XCircle } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import type { AdminPlanStats } from "@/src/types/adminPlan";

type AdminPlansStatsProps = {
  stats: AdminPlanStats;
};

export function AdminPlansStats({ stats }: AdminPlansStatsProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="rounded-lg bg-blue-100 p-2">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Plans</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalPlans}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="rounded-lg bg-green-100 p-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Plans</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.activePlans}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="rounded-lg bg-red-100 p-2">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Inactive Plans
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.inactivePlans}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="rounded-lg bg-purple-100 p-2">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Subscriptions
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalSubscriptions}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
