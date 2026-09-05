"use client";

import React from "react";
import WorkshopDashboard from "./WorkshopDashboard";
import CommerceDashboard from "./CommerceDashboard";
import AgencyDashboard, { type AgencyStats } from "./AgencyDashboard";

interface PlanAwareDashboardProps {
  planType: string;
  stats: any;
  onNavigate: (path: string) => void;
}

export default function PlanAwareDashboard({
  planType,
  stats,
  onNavigate,
}: PlanAwareDashboardProps) {
  // Use real stats passed from parent, no fake data generation
  const enhancedStats = { ...stats };

  // Render appropriate dashboard based on plan type
  switch (planType) {
    case "workshop":
      return (
        <WorkshopDashboard stats={enhancedStats} onNavigate={onNavigate} />
      );

    case "commerce":
      return (
        <CommerceDashboard stats={enhancedStats} onNavigate={onNavigate} />
      );

    case "agency":
      return (
        <AgencyDashboard
          stats={enhancedStats as AgencyStats}
          onNavigate={onNavigate}
        />
      );

    default:
      // Fallback to generic dashboard
      return (
        <div className="space-y-8">
          <div className="text-center py-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Your Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Plan type: {planType || "Unknown"}
            </p>
            <p className="text-gray-500 mt-2">
              This is a generic dashboard view. Please contact support to
              configure your plan-specific dashboard.
            </p>
          </div>
        </div>
      );
  }
}
