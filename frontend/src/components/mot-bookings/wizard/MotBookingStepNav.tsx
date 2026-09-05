"use client";

import { cn } from "@/src/lib/utils";
import { Check } from "lucide-react";
import { MOT_WIZARD_STEPS, type MotWizardStep } from "./wizardTypes";

type MotBookingStepNavProps = {
  currentStep: MotWizardStep;
  maxAvailableStep: MotWizardStep;
  onStepClick?: (step: MotWizardStep) => void;
};

export function MotBookingStepNav({
  currentStep,
  maxAvailableStep,
  onStepClick,
}: MotBookingStepNavProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      {MOT_WIZARD_STEPS.map(({ step, label }) => {
        const isActive = step === currentStep;
        const isComplete = step < currentStep;
        const isAvailable = step <= maxAvailableStep;

        return (
          <button
            key={step}
            type="button"
            disabled={!isAvailable}
            onClick={() => isAvailable && onStepClick?.(step)}
            className={cn(
              "group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300",
              isActive &&
                "scale-[1.02] border-transparent bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/25",
              isComplete &&
                !isActive &&
                "border-emerald-200 bg-emerald-50/80 hover:border-emerald-300",
              !isActive &&
                !isComplete &&
                isAvailable &&
                "border-border bg-card hover:border-primary/40 hover:shadow-md",
              !isAvailable &&
                !isComplete &&
                "cursor-not-allowed border-dashed border-muted bg-muted/30 opacity-60",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  "text-xs font-bold tracking-widest",
                  isActive ? "text-white/80" : "text-muted-foreground",
                )}
              >
                {String(step).padStart(2, "0")}
              </span>
              {isComplete && !isActive && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </div>
            <p
              className={cn(
                "mt-2 text-sm font-semibold uppercase tracking-wide",
                isActive ? "text-white" : "text-foreground",
              )}
            >
              {label}
            </p>
          </button>
        );
      })}
    </div>
  );
}
