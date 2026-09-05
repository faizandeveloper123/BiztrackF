"use client";

import { RefreshCw } from "lucide-react";

export function ProjectsLoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="h-8 w-8 animate-spin" />
    </div>
  );
}
