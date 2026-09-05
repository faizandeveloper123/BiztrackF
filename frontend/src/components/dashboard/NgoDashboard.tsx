"use client";

import { useNgoDashboard } from "@/src/hooks/useNgoDashboard";
import { NgoDashboardContent } from "./ngo/NgoDashboardContent";
import { NgoDashboardError } from "./ngo/NgoDashboardError";
import { NgoDashboardLoading } from "./ngo/NgoDashboardLoading";

export default function NgoDashboard() {
  const { snapshot, loading, error, retry } = useNgoDashboard();

  if (loading && !snapshot) {
    return <NgoDashboardLoading />;
  }

  if (error || !snapshot) {
    return (
      <NgoDashboardError
        message={error || "Could not load dashboard data."}
        onRetry={retry}
      />
    );
  }

  return <NgoDashboardContent snapshot={snapshot} />;
}
