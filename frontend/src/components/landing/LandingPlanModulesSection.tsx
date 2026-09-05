"use client";

import {
  Building2,
  ShoppingCart,
  Wrench,
  HeartPulse,
  HeartHandshake,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "@/src/lib/utils";

const PLAN_MODULES: {
  icon: LucideIcon;
  title: string;
  planType: string;
  description: string;
  accent: "indigo" | "emerald" | "orange" | "rose" | "violet";
}[] = [
  {
    icon: Building2,
    title: "Agency Module",
    planType: "agency",
    description:
      "CRM, sales, POS, and inventory for agencies managing clients and campaigns.",
    accent: "indigo",
  },
  {
    icon: ShoppingCart,
    title: "Commerce Module",
    planType: "commerce",
    description:
      "Retail and distribution ERP with POS, invoicing, warehouses, and analytics.",
    accent: "emerald",
  },
  {
    icon: Wrench,
    title: "Workshop Module",
    planType: "workshop",
    description: "Job cards, vehicles, quality control, and MOT booking.",
    accent: "orange",
  },
  {
    icon: HeartPulse,
    title: "Healthcare Module",
    planType: "healthcare",
    description:
      "Patients, appointments, prescriptions, admissions, and clinic billing.",
    accent: "rose",
  },
  {
    icon: HeartHandshake,
    title: "NGO Module",
    planType: "ngo",
    description:
      "Programs, donors, grants, volunteers, beneficiaries, and impact reporting for nonprofits.",
    accent: "violet",
  },
];

const accentStyles = {
  indigo: {
    card: "border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 to-white hover:border-indigo-300",
    icon: "bg-indigo-600 text-white",
    badge: "bg-indigo-100 text-indigo-800",
  },
  emerald: {
    card: "border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white hover:border-emerald-300",
    icon: "bg-emerald-600 text-white",
    badge: "bg-emerald-100 text-emerald-800",
  },
  orange: {
    card: "border-orange-200/80 bg-gradient-to-br from-orange-50/90 to-white hover:border-orange-300",
    icon: "bg-orange-600 text-white",
    badge: "bg-orange-100 text-orange-800",
  },
  rose: {
    card: "border-rose-200/80 bg-gradient-to-br from-rose-50/90 to-white hover:border-rose-300",
    icon: "bg-rose-600 text-white",
    badge: "bg-rose-100 text-rose-800",
  },
  violet: {
    card: "border-violet-200/80 bg-gradient-to-br from-violet-50/90 to-white hover:border-violet-300",
    icon: "bg-violet-600 text-white",
    badge: "bg-violet-100 text-violet-800",
  },
};

export function LandingPlanModulesSection() {
  return (
    <section
      id="modules"
      className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50/80 to-white"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700 mb-3">
            Five industry modules
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Pick the workspace that fits your organization
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Each module is a dedicated tenant with its own navigation,
            dashboard, and workflows — including nonprofits and NGOs. Start a
            free trial on the plan below.
          </p>
        </div>

        <div className="space-y-6 lg:space-y-8">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {PLAN_MODULES.slice(0, 3).map((mod) => {
              const styles = accentStyles[mod.accent];
              return (
                <Card
                  key={mod.planType}
                  className={cn(
                    "h-full border shadow-sm transition-all duration-300 hover:shadow-md",
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
                    <span
                      className={cn(
                        "mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                        styles.badge,
                      )}
                    >
                      {mod.planType}
                    </span>
                    <CardTitle className="text-lg text-slate-900">
                      {mod.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {mod.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:gap-8">
            {PLAN_MODULES.slice(3).map((mod) => {
              const styles = accentStyles[mod.accent];
              return (
                <Card
                  key={mod.planType}
                  className={cn(
                    "h-full border shadow-sm transition-all duration-300 hover:shadow-md",
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
                    <span
                      className={cn(
                        "mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                        styles.badge,
                      )}
                    >
                      {mod.planType}
                    </span>
                    <CardTitle className="text-lg text-slate-900">
                      {mod.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {mod.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
