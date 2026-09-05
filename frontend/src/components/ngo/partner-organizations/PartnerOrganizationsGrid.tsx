import { Building2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import type { PartnerOrganization } from "@/src/models/ngo";
import { PartnerOrganizationCard } from "./PartnerOrganizationCard";

type PartnerOrganizationsGridProps = {
  organizations: PartnerOrganization[];
  loading: boolean;
  total: number;
  page: number;
  showingStart: number;
  showingEnd: number;
  onPageChange: (page: number) => void;
  onView: (org: PartnerOrganization) => void;
  onEdit: (org: PartnerOrganization) => void;
  onDelete: (org: PartnerOrganization) => void;
};

export function PartnerOrganizationsGrid({
  organizations,
  loading,
  total,
  page,
  showingStart,
  showingEnd,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: PartnerOrganizationsGridProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
          <Building2 className="h-5 w-5 text-emerald-500" />
          Partner Organizations
          <span className="text-emerald-600">({total})</span>
        </h2>
      </div>
      {loading ? (
        <div className="py-16 text-center text-muted-foreground">
          Loading partner organizations...
        </div>
      ) : organizations.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          No partner organizations found
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <PartnerOrganizationCard
              key={org.id}
              organization={org}
              onView={() => onView(org)}
              onEdit={() => onEdit(org)}
              onDelete={() => onDelete(org)}
            />
          ))}
        </div>
      )}
      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {showingStart} to {showingEnd} of {total} organizations
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={showingEnd >= total}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
