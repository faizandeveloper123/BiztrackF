"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import type { LeadUserOption } from "@/src/components/crm/leads/leadUtils";

type Props = {
  label: string;
  value: string;
  users: LeadUserOption[];
  onChange: (v: string) => void;
};

export function LeadAgentSelect({ label, value, users, onChange }: Props) {
  return (
    <div>
      <div className="text-muted-foreground mb-0.5">{label}</div>
      <Select
        value={value || "__none__"}
        onValueChange={(v) => onChange(v === "__none__" ? "" : v)}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Not selected" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">Not selected</SelectItem>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
