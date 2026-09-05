"use client";

import React from "react";

type InlineFieldProps = {
  label: string;
  labelClassName?: string;
  required?: boolean;
  children: React.ReactNode;
};

export function InlineField({
  label,
  labelClassName = "text-muted-foreground",
  required,
  children,
}: InlineFieldProps) {
  return (
    <div className="flex min-h-[34px] items-center gap-2">
      <span
        className={`w-[108px] shrink-0 text-right text-sm font-medium ${labelClassName}`}
      >
        {label}
        {required ? " *" : ""}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
