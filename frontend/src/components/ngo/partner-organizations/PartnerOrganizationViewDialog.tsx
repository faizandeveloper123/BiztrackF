import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import type { PartnerOrganization } from "@/src/models/ngo";
import {
  formatPartnerDate,
  partnerSectorLabel,
  partnerSizeLabel,
  partnerStatusLabel,
} from "@/src/utils/ngo/partnerOrganizationUtils";
import { PartnerOrganizationDetailRow } from "./PartnerOrganizationDetailRow";

type PartnerOrganizationViewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: PartnerOrganization | null;
  onEdit: () => void;
};

export function PartnerOrganizationViewDialog({
  open,
  onOpenChange,
  organization,
  onEdit,
}: PartnerOrganizationViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Partner Organization Details</DialogTitle>
        </DialogHeader>
        {organization && (
          <div className="space-y-3 text-sm">
            <PartnerOrganizationDetailRow
              label="Partner ID"
              value={organization.partner_code}
            />
            <PartnerOrganizationDetailRow
              label="Name"
              value={organization.name}
            />
            <PartnerOrganizationDetailRow
              label="Email"
              value={organization.email}
            />
            <PartnerOrganizationDetailRow
              label="Sector"
              value={partnerSectorLabel(organization.sector)}
            />
            <PartnerOrganizationDetailRow
              label="Size"
              value={partnerSizeLabel(organization.organization_size)}
            />
            <PartnerOrganizationDetailRow
              label="Status"
              value={partnerStatusLabel(organization.status)}
            />
            <PartnerOrganizationDetailRow
              label="Website"
              value={organization.website || "—"}
            />
            <PartnerOrganizationDetailRow
              label="Location"
              value={organization.location || "—"}
            />
            <PartnerOrganizationDetailRow
              label="Created"
              value={formatPartnerDate(organization.createdAt)}
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {organization && (
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
