import { UnitOfMeasure } from "../models/pos";

export const PRESET_UNITS: { value: string; label: string }[] = [
  { value: UnitOfMeasure.PIECE, label: "Piece" },
  { value: UnitOfMeasure.PACK, label: "Pack" },
  { value: UnitOfMeasure.BOX, label: "Box" },
  { value: "carton", label: "Carton" },
  { value: "case", label: "Case" },
  { value: "bottle", label: "Bottle" },
  { value: "bag", label: "Bag" },
  { value: UnitOfMeasure.DOZEN, label: "Dozen" },
  { value: UnitOfMeasure.KILOGRAM, label: "Kilogram (kg)" },
  { value: UnitOfMeasure.GRAM, label: "Gram (g)" },
  { value: UnitOfMeasure.LITER, label: "Litre (L)" },
  { value: UnitOfMeasure.MILLILITER, label: "Millilitre (ml)" },
  { value: UnitOfMeasure.METER, label: "Meter (m)" },
  { value: UnitOfMeasure.ROLL, label: "Roll" },
  { value: UnitOfMeasure.SET, label: "Set" },
  { value: UnitOfMeasure.PAIR, label: "Pair" },
];

export const CUSTOM_UNIT_VALUE = "__custom__";

export function formatUnitLabel(unit: string): string {
  const preset = PRESET_UNITS.find((u) => u.value === unit);
  if (preset) return preset.label;
  return unit;
}

export function isPresetUnit(unit: string): boolean {
  return PRESET_UNITS.some((u) => u.value === unit);
}
