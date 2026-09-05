"use client";

import { DashboardLayout } from "@/src/components/layout";

export function AdminPlansLoading() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
            <p className="text-gray-600">Loading plans...</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
