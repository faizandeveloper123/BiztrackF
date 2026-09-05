"use client";

import Link from "next/link";
import { HeartHandshake, LineChart, Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export function NgoDashboardHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-4xl font-bold text-transparent">
          Charity Dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage donations, track impact, and engage supporters
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
          <Link href="/projects">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Link>
        </Button>
        <Button
          variant="outline"
          className="border-emerald-600 text-emerald-700"
          asChild
        >
          <Link href="/sales/invoices">
            <HeartHandshake className="mr-2 h-4 w-4" />
            New Donation
          </Link>
        </Button>
        <Button
          variant="outline"
          className="border-blue-600 text-blue-700"
          asChild
        >
          <Link href="/reports">
            <LineChart className="mr-2 h-4 w-4" />
            Generate Report
          </Link>
        </Button>
      </div>
    </div>
  );
}
