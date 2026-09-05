import type { ReactNode } from "react";

type InvoiceDetailFieldProps = {
  label: string;
  value: ReactNode;
  className?: string;
};

export function InvoiceDetailField({
  label,
  value,
  className,
}: InvoiceDetailFieldProps) {
  return (
    <div className={className}>
      <p className="text-sm text-gray-500">{label}</p>
      <div className="font-medium">{value}</div>
    </div>
  );
}
