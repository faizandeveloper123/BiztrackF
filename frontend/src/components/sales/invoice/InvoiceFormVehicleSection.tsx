"use client";

import { VehicleSearch } from "@/src/components/ui/vehicle-search";
import type { InvoiceCreate } from "@/src/models/sales";
import type { Vehicle } from "@/src/models/workshop";

type InvoiceFormVehicleSectionProps = {
  selectedVehicle: Vehicle | null;
  onVehicleSelect: (vehicle: Vehicle | null) => void;
  onInputChange: (field: keyof InvoiceCreate, value: string | number) => void;
};

export function InvoiceFormVehicleSection({
  selectedVehicle,
  onVehicleSelect,
  onInputChange,
}: InvoiceFormVehicleSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card px-3 py-2">
      <p className="mb-2 text-sm font-semibold text-foreground">Vehicle</p>
      <div className="[&_label]:sr-only [&>div>div.mt-2]:hidden [&_input]:h-8">
        <VehicleSearch
          label="Vehicle"
          value={selectedVehicle}
          onSelect={(v) => {
            onVehicleSelect(v);
            onInputChange("vehicleReg", v?.registration_number ?? "");
          }}
          placeholder="Search by reg, VIN, make, model..."
        />
      </div>
    </section>
  );
}
