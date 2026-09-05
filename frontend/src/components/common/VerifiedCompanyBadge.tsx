"use client";

import { ShieldCheck } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { COMPANY_REGISTRATION } from "@/src/constants/companyRegistration";

type VerifiedCompanyBadgeProps = {
  className?: string;
  align?: "left" | "center";
  variant?: "full" | "icon";
  tooltipPosition?: "above" | "below" | "right";
};

export function VerifiedCompanyBadge({
  className,
  align = "center",
  variant = "full",
  tooltipPosition = "above",
}: VerifiedCompanyBadgeProps) {
  const isIconOnly = variant === "icon";
  const resolvedTooltipPosition =
    isIconOnly && tooltipPosition === "above" ? "right" : tooltipPosition;

  return (
    <div
      className={cn(
        "group relative inline-flex max-w-full",
        align === "center" && "mx-auto",
        className,
      )}
    >
      <button
        type="button"
        title={isIconOnly ? COMPANY_REGISTRATION.badgeLabel : undefined}
        className={cn(
          "border border-emerald-200/80 bg-emerald-50/90 shadow-sm transition-colors",
          "hover:border-emerald-300 hover:bg-emerald-100/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
          isIconOnly
            ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            : "inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-left",
        )}
        aria-describedby="verified-company-details"
        aria-label={isIconOnly ? COMPANY_REGISTRATION.badgeLabel : undefined}
      >
        <ShieldCheck
          className="h-4 w-4 shrink-0 text-emerald-600"
          aria-hidden
        />
        {!isIconOnly && (
          <span className="text-xs font-semibold leading-tight text-emerald-900 sm:text-sm">
            {COMPANY_REGISTRATION.badgeLabel}
          </span>
        )}
      </button>

      <div
        id="verified-company-details"
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-[100] w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white p-3 text-left shadow-xl",
          "opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100",
          resolvedTooltipPosition === "above" && "bottom-full mb-2",
          resolvedTooltipPosition === "below" && "top-full mt-2",
          resolvedTooltipPosition === "right" &&
            "left-full top-1/2 ml-2 -translate-y-1/2",
          resolvedTooltipPosition !== "right" &&
            (align === "center" ? "left-1/2 -translate-x-1/2" : "left-0"),
        )}
      >
        <p className="mb-2 text-xs font-semibold text-slate-900">
          Verified Company
        </p>
        <dl className="space-y-2 text-xs text-slate-600">
          <div>
            <dt className="font-medium text-slate-800">Registered Company</dt>
            <dd>{COMPANY_REGISTRATION.registeredCompany}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-800">Authority</dt>
            <dd>{COMPANY_REGISTRATION.authority}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-800">Company Number</dt>
            <dd>{COMPANY_REGISTRATION.companyNumber}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-800">
              Registered Office Address
            </dt>
            <dd>{COMPANY_REGISTRATION.registeredOfficeAddress}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
