"use client";

import React, { useEffect, useState } from "react";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  CUSTOM_UNIT_VALUE,
  isPresetUnit,
  PRESET_UNITS,
} from "../../constants/unitOfMeasureOptions";

interface UnitOfMeasureSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function UnitOfMeasureSelect({
  value,
  onChange,
  className = "h-8 rounded-md border-input bg-background text-sm shadow-none",
  disabled = false,
}: UnitOfMeasureSelectProps) {
  const [mode, setMode] = useState<"preset" | "custom">(() =>
    value && !isPresetUnit(value) ? "custom" : "preset",
  );
  const [customValue, setCustomValue] = useState(() =>
    value && !isPresetUnit(value) ? value : "",
  );

  useEffect(() => {
    if (value && !isPresetUnit(value)) {
      setMode("custom");
      setCustomValue(value);
    } else if (value && isPresetUnit(value)) {
      setMode("preset");
    }
  }, [value]);

  const selectValue =
    mode === "custom" || (value && !isPresetUnit(value))
      ? CUSTOM_UNIT_VALUE
      : value || PRESET_UNITS[0].value;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Select
        value={selectValue}
        disabled={disabled}
        onValueChange={(next) => {
          if (next === CUSTOM_UNIT_VALUE) {
            setMode("custom");
            if (customValue.trim()) {
              onChange(customValue.trim());
            }
            return;
          }
          setMode("preset");
          setCustomValue("");
          onChange(next);
        }}
      >
        <SelectTrigger className={`${className} w-full`}>
          <SelectValue placeholder="Select unit" />
        </SelectTrigger>
        <SelectContent>
          {PRESET_UNITS.map((unit) => (
            <SelectItem key={unit.value} value={unit.value}>
              {unit.label}
            </SelectItem>
          ))}
          <SelectItem value={CUSTOM_UNIT_VALUE}>Custom...</SelectItem>
        </SelectContent>
      </Select>
      {(mode === "custom" || selectValue === CUSTOM_UNIT_VALUE) && (
        <Input
          value={customValue}
          disabled={disabled}
          onChange={(e) => {
            const next = e.target.value;
            setCustomValue(next);
            onChange(next.trim());
          }}
          placeholder="Enter custom unit (e.g. crate, bundle)"
          className={className}
        />
      )}
    </div>
  );
}
