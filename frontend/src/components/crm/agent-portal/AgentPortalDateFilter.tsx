"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { AgentPortalFilters } from "@/src/services/AgentPortalService";

const QUICK = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
];

type Props = {
  filters: AgentPortalFilters;
  onChange: (f: AgentPortalFilters) => void;
};

export function AgentPortalDateFilter({ filters, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Select
        value={filters.quickFilter || "all"}
        onValueChange={(v) =>
          onChange({
            ...filters,
            quickFilter:
              v === "all"
                ? undefined
                : (v as AgentPortalFilters["quickFilter"]),
            dateFrom: v === "all" ? undefined : filters.dateFrom,
            dateTo: v === "all" ? undefined : filters.dateTo,
          })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Period" />
        </SelectTrigger>
        <SelectContent>
          {QUICK.map((q) => (
            <SelectItem key={q.value} value={q.value}>
              {q.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="date"
        disabled={!!filters.quickFilter}
        value={filters.dateFrom?.slice(0, 10) || ""}
        onChange={(e) =>
          onChange({
            ...filters,
            quickFilter: undefined,
            dateFrom: e.target.value || undefined,
          })
        }
      />
      <Input
        type="date"
        disabled={!!filters.quickFilter}
        value={filters.dateTo?.slice(0, 10) || ""}
        onChange={(e) =>
          onChange({
            ...filters,
            quickFilter: undefined,
            dateTo: e.target.value || undefined,
          })
        }
      />
    </div>
  );
}
