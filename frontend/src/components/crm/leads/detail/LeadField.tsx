"use client";

import { useState, useEffect } from "react";
import { Input } from "@/src/components/ui/input";

type Props = {
  label: string;
  value: string;
  onSave: (v: string) => void;
};

export function LeadField({ label, value, onSave }: Props) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <div>
      <div className="text-muted-foreground mb-0.5">{label}</div>
      <Input
        className="h-8 text-xs"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => onSave(v)}
      />
    </div>
  );
}
