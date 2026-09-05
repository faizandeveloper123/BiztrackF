"use client";

import {
  Users,
  Target,
  FolderKanban,
  ShoppingCart,
  Package,
  LineChart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "@/src/lib/utils";

const MODULES = [
  {
    icon: Users,
    title: "CRM & Customers",
    description:
      "Manage leads, contacts, companies, and opportunities in one pipeline.",
    accent: "blue" as const,
  },
  {
    icon: Target,
    title: "Sales & Quotes",
    description:
      "Quotes, contracts, invoices, and delivery notes tied to your CRM.",
    accent: "green" as const,
  },
  {
    icon: FolderKanban,
    title: "Projects & Tasks",
    description:
      "Plan work, assign teams, track time, and deliver on schedule.",
    accent: "blue" as const,
  },
  {
    icon: Package,
    title: "Inventory & Warehouses",
    description:
      "Stock movements, purchase orders, alerts, and multi-location control.",
    accent: "green" as const,
  },
  {
    icon: ShoppingCart,
    title: "POS & Commerce",
    description:
      "Retail-ready point of sale with products, shifts, and reports.",
    accent: "blue" as const,
  },
  {
    icon: LineChart,
    title: "Analytics & Ledger",
    description:
      "Financial visibility with dashboards, ledger, and business reporting.",
    accent: "green" as const,
  },
];

const accentStyles = {
  blue: {
    card: "border-blue-200/70 bg-gradient-to-br from-blue-50/90 to-white hover:border-blue-300",
    icon: "bg-blue-600 text-white",
  },
  green: {
    card: "border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-white hover:border-emerald-300",
    icon: "bg-emerald-600 text-white",
  },
};

export function ProductCrmOverviewSection() {
  return (
    <section
      id="overview"
      className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50/40"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700 mb-3">
            Product Overview
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            One Platform for CRM &amp; Operations
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            BizTrack connects customer relationships, sales, projects, and
            inventory so your team works from a single trusted system.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {MODULES.map((mod) => {
            const styles = accentStyles[mod.accent];
            return (
              <Card
                key={mod.title}
                className={cn(
                  "border shadow-sm transition-all duration-300 hover:shadow-md",
                  styles.card,
                )}
              >
                <CardHeader className="pb-2">
                  <div
                    className={cn(
                      "mb-3 flex h-11 w-11 items-center justify-center rounded-xl",
                      styles.icon,
                    )}
                  >
                    <mod.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <CardTitle className="text-lg text-slate-900">
                    {mod.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {mod.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
