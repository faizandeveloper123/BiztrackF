"use client";

import { UserPlus } from "lucide-react";
import { cn } from "@/src/lib/utils";

type AddCustomerButtonProps = {
  onClick: () => void;
  className?: string;
};

export function AddCustomerButton({
  onClick,
  className,
}: AddCustomerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Add new customer"
      aria-label="Add new customer"
      className={cn(
        "group relative flex h-10 shrink-0 items-center gap-2.5 overflow-hidden rounded-lg px-4",
        "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white",
        "shadow-md shadow-emerald-500/25",
        "transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/35",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2",
        className,
      )}
    >
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
        <UserPlus className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
      </span>
      <span className="relative whitespace-nowrap text-sm font-bold uppercase tracking-wide">
        New
      </span>
    </button>
  );
}
