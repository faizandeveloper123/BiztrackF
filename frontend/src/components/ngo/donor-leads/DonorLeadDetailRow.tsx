import type { ReactNode } from "react";

type DonorLeadDetailRowProps = {
  label: string;
  value: ReactNode;
};

export function DonorLeadDetailRow({ label, value }: DonorLeadDetailRowProps) {
  return (
    <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-4 last:border-0">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
