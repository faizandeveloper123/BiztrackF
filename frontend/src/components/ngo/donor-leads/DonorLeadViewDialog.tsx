import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import type { DonorLead } from "@/src/models/ngo";
import {
  donorLeadSourceLabel,
  donorLeadStatusBadgeClass,
  donorLeadStatusLabel,
  formatDonorLeadDate,
} from "@/src/utils/ngo/donorLeadUtils";
import { DonorLeadDetailRow } from "./DonorLeadDetailRow";

type DonorLeadViewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: DonorLead | null;
  formatCurrency: (amount: number) => string;
  onEdit: () => void;
};

export function DonorLeadViewDialog({
  open,
  onOpenChange,
  lead,
  formatCurrency,
  onEdit,
}: DonorLeadViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Donor Lead Details</DialogTitle>
        </DialogHeader>
        {lead && (
          <div className="space-y-1 text-sm">
            <DonorLeadDetailRow label="Full Name" value={lead.full_name} />
            <DonorLeadDetailRow label="Email" value={lead.email || "—"} />
            <DonorLeadDetailRow label="Phone" value={lead.phone || "—"} />
            <DonorLeadDetailRow
              label="Organization"
              value={lead.organization || "—"}
            />
            <DonorLeadDetailRow
              label="Expected Donation"
              value={
                <span className="font-bold text-emerald-600">
                  {formatCurrency(lead.expected_donation ?? 0)}
                </span>
              }
            />
            <DonorLeadDetailRow
              label="Lead Status"
              value={
                <Badge className={donorLeadStatusBadgeClass(lead.status)}>
                  {donorLeadStatusLabel(lead.status)}
                </Badge>
              }
            />
            <DonorLeadDetailRow
              label="Lead Source"
              value={donorLeadSourceLabel(lead.source)}
            />
            <DonorLeadDetailRow
              label="Assigned To"
              value={lead.assigned_to || "Unassigned"}
            />
            <DonorLeadDetailRow
              label="Created Date"
              value={formatDonorLeadDate(lead.createdAt)}
            />
            <DonorLeadDetailRow
              label="Notes"
              value={<span className="italic">{lead.notes || "No notes"}</span>}
            />
          </div>
        )}
        <DialogFooter className="gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={onEdit}
          >
            Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
