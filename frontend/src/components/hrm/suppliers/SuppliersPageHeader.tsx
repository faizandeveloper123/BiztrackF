"use client";

import { Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import type { SuppliersPageHeaderProps } from "./types";

export function SuppliersPageHeader({
  onAddSupplier,
}: SuppliersPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
        <p className="text-muted-foreground">
          Manage your supplier relationships and vendor information
        </p>
      </div>
      {onAddSupplier && (
        <Button onClick={onAddSupplier}>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      )}
    </div>
  );
}
