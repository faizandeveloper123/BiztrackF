"use client";

import { Pin } from "lucide-react";
import { LeadSavedFilter } from "@/src/models/crm";

type Props = {
  pinned: LeadSavedFilter[];
  onApply: (sf: LeadSavedFilter) => void;
};

export function LeadsPinnedFilters({ pinned, onApply }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-amber-600 font-medium flex items-center gap-1">
        <Pin className="h-3 w-3" /> Pinned:
      </span>
      {pinned.map((sf) => (
        <button
          key={sf.id}
          type="button"
          onClick={() => onApply(sf)}
          className="rounded-full px-3 py-1 text-white text-xs"
          style={{ backgroundColor: sf.color || "#3b82f6" }}
        >
          {sf.name}
        </button>
      ))}
    </div>
  );
}
