"use client";

import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import type { MotWizardVehicle } from "../wizardTypes";

type Step1VehicleDetailsProps = {
  vehicle: MotWizardVehicle;
  onChange: (patch: Partial<MotWizardVehicle>) => void;
  onConfirm: () => void;
  canConfirm: boolean;
};

export function Step1VehicleDetails({
  vehicle,
  onChange,
  onConfirm,
  canConfirm,
}: Step1VehicleDetailsProps) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Step 01
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Your Vehicle</h2>
        <p className="mt-2 text-muted-foreground">
          Tell us about your vehicle. All fields are mandatory unless otherwise
          stated.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label
            htmlFor="registration"
            className="text-sm font-semibold uppercase tracking-wide"
          >
            Car Registration
          </Label>
          <Input
            id="registration"
            value={vehicle.registration}
            onChange={(e) =>
              onChange({ registration: e.target.value.toUpperCase() })
            }
            placeholder="e.g. AB12 CDE"
            className="h-12 rounded-xl border-2 text-base uppercase"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="mileage"
            className="text-sm font-semibold uppercase tracking-wide"
          >
            Mileage
          </Label>
          <Input
            id="mileage"
            value={vehicle.mileage}
            onChange={(e) => onChange({ mileage: e.target.value })}
            placeholder="Current mileage"
            className="h-12 rounded-xl border-2"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="make"
            className="text-sm font-semibold uppercase tracking-wide"
          >
            Vehicle Make
          </Label>
          <Input
            id="make"
            value={vehicle.make}
            onChange={(e) => onChange({ make: e.target.value })}
            placeholder="e.g. Land Rover"
            className="h-12 rounded-xl border-2"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label
            htmlFor="year"
            className="text-sm font-semibold uppercase tracking-wide"
          >
            Vehicle Year
          </Label>
          <Input
            id="year"
            value={vehicle.year}
            onChange={(e) => onChange({ year: e.target.value })}
            placeholder="e.g. 2022"
            className="h-12 rounded-xl border-2"
          />
        </div>
      </div>

      <Button
        onClick={onConfirm}
        disabled={!canConfirm}
        className="h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 text-sm font-bold uppercase tracking-wider hover:from-blue-700 hover:to-purple-700"
      >
        Confirm
      </Button>
    </div>
  );
}
