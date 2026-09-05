import type { VehicleCreate, VehicleUpdate } from '../../models/workshop/Vehicle';

export type VehicleFormState = {
  make: string;
  model: string;
  year: string;
  color: string;
  vin: string;
  registration_number: string;
  mileage: string;
  engine_number: string;
  notes: string;
};

const REQUIRED = 'This field is required';

export function validateVehicleForm(
  isCreate: boolean,
  form: VehicleFormState,
): string | null {
  const make = form.make.trim();
  const model = form.model.trim();
  const reg = form.registration_number.trim();
  if (isCreate) {
    if (!make) return `Make: ${REQUIRED}`;
    if (!model) return `Model: ${REQUIRED}`;
    if (!reg) return `Registration number: ${REQUIRED}`;
    return null;
  }
  if (!make) return `Make: ${REQUIRED}`;
  if (!model) return `Model: ${REQUIRED}`;
  if (!reg) return `Registration number: ${REQUIRED}`;
  return null;
}

export function vehiclePayloadForSubmit(
  form: VehicleFormState,
  isCreate: boolean,
): VehicleCreate | VehicleUpdate {
  const t = (s: string) => s.trim();
  const optional = {
    year: t(form.year) || undefined,
    color: t(form.color) || undefined,
    vin: t(form.vin) || undefined,
    mileage: t(form.mileage) || undefined,
    engine_number: t(form.engine_number) || undefined,
    notes: t(form.notes) || undefined,
  };
  if (isCreate) {
    return {
      ...optional,
      make: t(form.make),
      model: t(form.model),
      registration_number: t(form.registration_number),
    };
  }
  return {
    ...optional,
    make: t(form.make) || undefined,
    model: t(form.model) || undefined,
    registration_number: t(form.registration_number) || undefined,
  };
}
