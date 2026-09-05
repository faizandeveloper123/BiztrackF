"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

type Props = {
  label: string;
  value: string;
  options: string[];
  onSave: (v: string) => void;
};

export function LeadSelectField({ label, value, options, onSave }: Props) {
  return (
    <div>
      <div className="text-muted-foreground mb-0.5">{label}</div>
      <Select
        value={value || "__none__"}
        onValueChange={(v) => onSave(v === "__none__" ? "" : v)}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Not selected" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">Not selected</SelectItem>
          {options
            .filter((o) => Boolean(String(o || "").trim()))
            .map((o) => (
              <SelectItem key={o} value={o} className="capitalize">
                {o}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}
