"use client";

import { ChevronRight, ChevronDown } from "lucide-react";

type CollapsibleFormSectionProps = {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

export function CollapsibleFormSection({
  title,
  open,
  onToggle,
  children,
}: CollapsibleFormSectionProps) {
  return (
    <div className="md:col-span-2 space-y-2">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-medium hover:bg-muted/50"
        onClick={onToggle}
      >
        <span>{title}</span>
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
      </button>
      {open && children}
    </div>
  );
}
