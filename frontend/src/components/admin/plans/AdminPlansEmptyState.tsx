"use client";

import { Package } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";

type AdminPlansEmptyStateProps = {
  hasActiveFilters: boolean;
};

export function AdminPlansEmptyState({
  hasActiveFilters,
}: AdminPlansEmptyStateProps) {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          No plans found
        </h3>
        <p className="text-gray-600">
          {hasActiveFilters
            ? "Try adjusting your search or filter criteria."
            : "No plans have been created yet."}
        </p>
      </CardContent>
    </Card>
  );
}
