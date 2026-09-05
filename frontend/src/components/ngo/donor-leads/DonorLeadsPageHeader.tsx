import { Plus, UserPlus } from "lucide-react";
import { Button } from "@/src/components/ui/button";

type DonorLeadsPageHeaderProps = {
  onAdd: () => void;
};

export function DonorLeadsPageHeader({ onAdd }: DonorLeadsPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-3xl font-bold text-transparent">
          Donor Leads
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage and track potential donor leads
        </p>
      </div>
      <Button
        onClick={onAdd}
        className="bg-emerald-600 shadow-md hover:bg-emerald-700"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add New Lead
      </Button>
    </div>
  );
}

export function DonorLeadsSectionTitle({ count }: { count: number }) {
  return (
    <h2 className="flex items-center text-lg font-semibold text-gray-800">
      <UserPlus className="mr-2 h-5 w-5 text-emerald-500" />
      Donor Leads
      <span className="ml-1 text-emerald-600">({count})</span>
    </h2>
  );
}
