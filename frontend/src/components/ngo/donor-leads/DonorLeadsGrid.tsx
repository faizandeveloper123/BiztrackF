import { Button } from "@/src/components/ui/button";
import type { DonorLead } from "@/src/models/ngo";
import { DonorLeadCard } from "./DonorLeadCard";
import { DonorLeadsSectionTitle } from "./DonorLeadsPageHeader";

type DonorLeadsGridProps = {
  leads: DonorLead[];
  loading: boolean;
  total: number;
  page: number;
  limit: number;
  formatCurrency: (amount: number) => string;
  onPageChange: (page: number) => void;
  onView: (lead: DonorLead) => void;
  onEdit: (lead: DonorLead) => void;
  onDelete: (lead: DonorLead) => void;
};

export function DonorLeadsGrid({
  leads,
  loading,
  total,
  page,
  limit,
  formatCurrency,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: DonorLeadsGridProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Loading donor leads...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <DonorLeadsSectionTitle count={total} />
      </div>
      {leads.length === 0 ? (
        <div className="rounded-xl bg-white py-16 text-center text-muted-foreground shadow-md">
          No donor leads found. Add a lead to get started.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead) => (
            <DonorLeadCard
              key={lead.id}
              lead={lead}
              formatCurrency={formatCurrency}
              onView={() => onView(lead)}
              onEdit={() => onEdit(lead)}
              onDelete={() => onDelete(lead)}
            />
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
