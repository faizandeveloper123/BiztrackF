"use client";

import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { MotWizardVehicle } from "../wizardTypes";

type Step1VehicleModelProps = {
  vehicle: MotWizardVehicle;
  onChange: (patch: Partial<MotWizardVehicle>) => void;
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
};

export function Step1VehicleModel({
  vehicle,
  onChange,
  onBack,
  onNext,
  canNext,
}: Step1VehicleModelProps) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Step 01
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">
          Vehicle Model
        </h2>
        <p className="mt-2 text-muted-foreground">
          Almost there — what model is your {vehicle.make || "vehicle"}?
        </p>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-blue-50/50 to-purple-50/50 p-4 dark:from-blue-950/20 dark:to-purple-950/20">
        <p className="text-sm text-muted-foreground">
          {vehicle.registration && (
            <span className="font-semibold text-foreground">
              {vehicle.registration}
            </span>
          )}
          {vehicle.make && ` · ${vehicle.make}`}
          {vehicle.year && ` · ${vehicle.year}`}
          {vehicle.mileage && ` · ${vehicle.mileage} miles`}
        </p>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="model"
          className="text-sm font-semibold uppercase tracking-wide"
        >
          Vehicle Model
        </Label>
        <Input
          id="model"
          value={vehicle.model}
          onChange={(e) => onChange({ model: e.target.value })}
          placeholder="e.g. Defender, Discovery, Range Rover"
          className="h-12 rounded-xl border-2 text-base"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="h-12 rounded-xl gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canNext}
          className="h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 text-sm font-bold uppercase tracking-wider hover:from-blue-700 hover:to-purple-700"
        >
          Next Step
        </Button>
      </div>
    </div>
  );
}
