import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";

type DonorsPageHeaderProps = {
  onAdd: () => void;
};

export function DonorsPageHeader({ onAdd }: DonorsPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-3xl font-bold text-transparent">
          Donors
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage your donor relationships and information
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link href="/ngo/donor-dashboard">Donor Dashboard</Link>
        </Button>
        <Button onClick={onAdd} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Add New Donor
        </Button>
      </div>
    </div>
  );
}
