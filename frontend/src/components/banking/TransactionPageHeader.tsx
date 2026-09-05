"use client";

import { Button } from "@/src/components/ui/button";
import { Plus } from "lucide-react";
import type { TransactionPageHeaderProps } from "./types";

export function TransactionPageHeader({ onAddTransaction }: TransactionPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold">Bank Transactions</h1>
        <p className="text-muted-foreground">
          Track and manage all bank transactions
        </p>
      </div>
      <Button onClick={onAddTransaction}>
        <Plus className="h-4 w-4 mr-2" />
        Add Transaction
      </Button>
    </div>
  );
}
