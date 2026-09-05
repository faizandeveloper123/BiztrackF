import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import type { Donor } from "@/src/models/ngo";
import { donorStatusLabel, donorTypeLabel } from "@/src/utils/ngo/donorUtils";
import { DonorDetailRow } from "./DonorDetailRow";

type DonorViewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donor: Donor | null;
  formatCurrency: (amount: number) => string;
  onEdit: () => void;
};

export function DonorViewDialog({
  open,
  onOpenChange,
  donor,
  formatCurrency,
  onEdit,
}: DonorViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Donor Details</DialogTitle>
        </DialogHeader>
        {donor && (
          <div className="space-y-3 text-sm">
            <DonorDetailRow label="Donor ID" value={donor.donor_code} />
            <DonorDetailRow label="Full Name" value={donor.full_name} />
            <DonorDetailRow label="Email" value={donor.email} />
            <DonorDetailRow label="Phone" value={donor.phone || "—"} />
            <DonorDetailRow
              label="Organization"
              value={donor.organization || "—"}
            />
            <DonorDetailRow
              label="Donor Type"
              value={donorTypeLabel(donor.donor_type)}
            />
            <DonorDetailRow
              label="Status"
              value={donorStatusLabel(donor.status)}
            />
            <DonorDetailRow
              label="Total Donated"
              value={formatCurrency(donor.total_donated)}
            />
            <DonorDetailRow label="Address" value={donor.address || "—"} />
            <DonorDetailRow label="Notes" value={donor.notes || "No notes"} />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {donor && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={onEdit}
            >
              Edit
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
