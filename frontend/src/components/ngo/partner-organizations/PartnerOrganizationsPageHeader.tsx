import { Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";

type PartnerOrganizationsPageHeaderProps = {
  onAdd: () => void;
};

export function PartnerOrganizationsPageHeader({
  onAdd,
}: PartnerOrganizationsPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-3xl font-bold text-transparent">
          Partner Organizations
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage your partner organizations and collaborations
        </p>
      </div>
      <Button onClick={onAdd} className="bg-emerald-600 hover:bg-emerald-700">
        <Plus className="mr-2 h-4 w-4" />
        Add Partner Organization
      </Button>
    </div>
  );
}
