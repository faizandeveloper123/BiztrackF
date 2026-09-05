"use client";

import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import type { MotWizardServices } from "../wizardTypes";
import { MotServiceSearchSelect } from "../MotServiceSearchSelect";
import { getSelectedMotServices } from "../wizardUtils";

type Step2ServicesProps = {
  services: MotWizardServices;
  inspectionPrice: number;
  onChange: (patch: Partial<MotWizardServices>) => void;
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
};

export function Step2Services({
  services,
  inspectionPrice,
  onChange,
  onBack,
  onNext,
  canNext,
}: Step2ServicesProps) {
  const selectedServices = getSelectedMotServices(services, inspectionPrice);
  const servicesTotal = selectedServices.reduce(
    (total, service) => total + service.price,
    0,
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Step 02
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Services</h2>
        <p className="mt-2 text-muted-foreground">
          Select the services you need for your MOT appointment.
        </p>
      </div>

      <div className="relative space-y-6">
        <div
          className={`flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-5 transition-all ${
            services.motInspection
              ? "border-primary bg-gradient-to-br from-blue-50/80 to-purple-50/80 shadow-md dark:from-blue-950/30 dark:to-purple-950/30"
              : "border-border hover:border-primary/40"
          }`}
          onClick={() => onChange({ motInspection: !services.motInspection })}
        >
          <Checkbox
            checked={services.motInspection}
            onCheckedChange={(checked) =>
              onChange({ motInspection: checked === true })
            }
            className="mt-1"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-4">
              <Label className="cursor-pointer text-base font-semibold">
                Carry Out MOT Inspection
              </Label>
              <span className="text-lg font-bold text-primary">
                £{inspectionPrice.toFixed(2)}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Standard MOT test including emissions and safety checks
            </p>
          </div>
        </div>

        <MotServiceSearchSelect
          value={services.selectedServiceIds}
          inspectionPrice={inspectionPrice}
          onChange={(selectedServiceIds) => onChange({ selectedServiceIds })}
        />

        {selectedServices.length > 0 && (
          <div className="flex items-center justify-between rounded-xl border-2 border-primary/20 bg-gradient-to-r from-blue-50/80 to-purple-50/80 px-4 py-3 dark:from-blue-950/30 dark:to-purple-950/30">
            <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Services total
            </span>
            <span className="text-xl font-bold text-primary">
              £{servicesTotal.toFixed(2)}
            </span>
          </div>
        )}

        <div className="space-y-2">
          <Label
            htmlFor="otherServices"
            className="text-sm font-semibold uppercase tracking-wide"
          >
            Other Services
          </Label>
          <Textarea
            id="otherServices"
            value={services.otherServices}
            onChange={(e) => onChange({ otherServices: e.target.value })}
            placeholder="Please let us know which other services you require"
            rows={4}
            className="resize-none rounded-xl border-2"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="h-12 gap-2 rounded-xl"
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
