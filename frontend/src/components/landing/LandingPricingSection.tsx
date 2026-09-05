"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const PLAN_DISPLAY_ORDER = [
  "agency",
  "commerce",
  "workshop",
  "healthcare",
  "ngo",
] as const;

function sortPlansForDisplay(plans: LandingPlan[]): LandingPlan[] {
  return [...plans].sort((a, b) => {
    const ai = PLAN_DISPLAY_ORDER.indexOf(
      a.planType as (typeof PLAN_DISPLAY_ORDER)[number],
    );
    const bi = PLAN_DISPLAY_ORDER.indexOf(
      b.planType as (typeof PLAN_DISPLAY_ORDER)[number],
    );
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

function splitPlansRows(plans: LandingPlan[]) {
  const sorted = sortPlansForDisplay(plans);
  if (sorted.length <= 3) {
    return { topRow: sorted, bottomRow: [] as LandingPlan[] };
  }
  return {
    topRow: sorted.slice(0, 3),
    bottomRow: sorted.slice(3),
  };
}

export type LandingPlan = {
  id: string;
  name: string;
  planType: string;
  price: number;
  maxProjects: number;
  maxUsers: number;
  features: string[];
  description: string;
};

type LandingPricingSectionProps = {
  plans: LandingPlan[];
  currencySymbol: string;
  isAuthenticated: boolean;
  onSubscribe: (plan: LandingPlan) => void;
};

type LandingPlanCardProps = {
  plan: LandingPlan;
  currencySymbol: string;
  isAuthenticated: boolean;
  onSubscribe: (plan: LandingPlan) => void;
};

function LandingPlanCard({
  plan,
  currencySymbol,
  isAuthenticated,
  onSubscribe,
}: LandingPlanCardProps) {
  const highlightBadge =
    plan.planType === "ngo" ? (
      <Badge className="bg-violet-600 px-4 py-1.5 text-white">
        For Nonprofits
      </Badge>
    ) : plan.planType === "enterprise" ? (
      <Badge className="bg-blue-600 px-4 py-1.5 text-white">Most Popular</Badge>
    ) : null;

  return (
    <Card
      className={cn(
        "relative flex h-full flex-col border shadow-sm transition-all duration-300 hover:shadow-lg",
        plan.planType === "ngo" &&
          "border-violet-400 ring-2 ring-violet-200/60",
        plan.planType === "enterprise" &&
          "border-blue-400 ring-2 ring-blue-200/60 lg:scale-[1.02]",
        plan.planType !== "ngo" &&
          plan.planType !== "enterprise" &&
          "border-slate-200 hover:border-blue-200",
      )}
    >
      <CardHeader
        className={cn(
          "pb-4 text-center",
          highlightBadge ? "space-y-3 pt-6" : "pt-8",
        )}
      >
        {highlightBadge && (
          <div className="flex justify-center">{highlightBadge}</div>
        )}
        <CardTitle className="text-2xl text-slate-900">{plan.name}</CardTitle>
        <div className="mt-2 text-4xl font-bold text-slate-900">
          {currencySymbol}
          {plan.price}
          <span className="text-lg font-normal text-slate-500">/month</span>
        </div>
        <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col space-y-6 pb-8">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Projects</span>
            <span className="font-medium">{plan.maxProjects}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Team members</span>
            <span className="font-medium">{plan.maxUsers}</span>
          </div>
        </div>

        <ul className="space-y-2">
          {plan.features.slice(0, 6).map((feature, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-sm text-slate-600"
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              {feature}
            </li>
          ))}
        </ul>

        <Button
          className="mt-auto w-full bg-blue-600 hover:bg-blue-700"
          onClick={() => onSubscribe(plan)}
        >
          {isAuthenticated ? "Create Workspace" : "Start Free Trial"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function LandingPricingSection({
  plans,
  currencySymbol,
  isAuthenticated,
  onSubscribe,
}: LandingPricingSectionProps) {
  const { topRow, bottomRow } = splitPlansRows(plans);

  return (
    <section
      id="pricing"
      className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/80"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700 mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Choose Your Plan
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Start free and scale as you grow. All plans include a 14-day free
            trial.
          </p>
        </div>

        {plans.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-8 lg:space-y-10">
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
              {topRow.map((plan) => (
                <LandingPlanCard
                  key={plan.id}
                  plan={plan}
                  currencySymbol={currencySymbol}
                  isAuthenticated={isAuthenticated}
                  onSubscribe={onSubscribe}
                />
              ))}
            </div>

            {bottomRow.length > 0 && (
              <div
                className={cn(
                  "mx-auto grid max-w-6xl grid-cols-1 gap-6 pt-1 sm:gap-8",
                  bottomRow.length === 1 && "max-w-md",
                  bottomRow.length === 2 &&
                    "max-w-4xl sm:grid-cols-2 lg:max-w-5xl",
                  bottomRow.length >= 3 && "sm:grid-cols-2 lg:grid-cols-3",
                )}
              >
                {bottomRow.map((plan) => (
                  <LandingPlanCard
                    key={plan.id}
                    plan={plan}
                    currencySymbol={currencySymbol}
                    isAuthenticated={isAuthenticated}
                    onSubscribe={onSubscribe}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
