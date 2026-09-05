"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";
import { NGO_QUICK_ACTIONS } from "./ngoDashboardConfig";

export function NgoQuickActionsCard() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Zap className="h-5 w-5 text-amber-500" />
          Quick Actions
        </CardTitle>
        <CardDescription>Common charity workflows</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {NGO_QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col items-center gap-2 rounded-xl border border-gray-200 p-4 transition-all hover:border-emerald-400 hover:shadow-md"
            >
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
                  action.iconClass,
                )}
              >
                <action.icon className="h-6 w-6" />
              </div>
              <span className="text-center text-sm font-medium text-gray-700">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
