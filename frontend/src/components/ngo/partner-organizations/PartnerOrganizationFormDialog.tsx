import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import type {
  PartnerOrganizationCreate,
  PartnerSector,
  PartnerSize,
  PartnerStatus,
} from "@/src/models/ngo";
import {
  PARTNER_SECTOR_OPTIONS,
  PARTNER_SIZE_OPTIONS,
} from "@/src/utils/ngo/partnerOrganizationUtils";

type PartnerOrganizationFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  formData: PartnerOrganizationCreate;
  onFormChange: (data: PartnerOrganizationCreate) => void;
  onSubmit: () => void;
  submitLoading: boolean;
};

export function PartnerOrganizationFormDialog({
  open,
  onOpenChange,
  editing,
  formData,
  onFormChange,
  onSubmit,
  submitLoading,
}: PartnerOrganizationFormDialogProps) {
  const patch = (partial: Partial<PartnerOrganizationCreate>) =>
    onFormChange({ ...formData, ...partial });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Partner Organization" : "Add Partner Organization"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Organization Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Email *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => patch({ email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Sector *</Label>
            <Select
              value={formData.sector}
              onValueChange={(v) => patch({ sector: v as PartnerSector })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTNER_SECTOR_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Organization Size *</Label>
            <Select
              value={formData.organization_size}
              onValueChange={(v) =>
                patch({ organization_size: v as PartnerSize })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTNER_SIZE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input
              value={formData.website ?? ""}
              onChange={(e) => patch({ website: e.target.value })}
              placeholder="www.example.org"
            />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={formData.location ?? ""}
              onChange={(e) => patch({ location: e.target.value })}
              placeholder="City, Country"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => patch({ status: v as PartnerStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitLoading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {submitLoading ? "Saving..." : editing ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
