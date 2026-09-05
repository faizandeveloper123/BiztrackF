import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
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
import {
  DONOR_LEAD_SOURCE_OPTIONS,
  DONOR_LEAD_STATUS_OPTIONS,
  type DonorLeadSource,
  type DonorLeadStatus,
} from "@/src/constants/ngo/donorLead";
import type { DonorLeadCreate } from "@/src/models/ngo";

type DonorLeadFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  formData: DonorLeadCreate;
  onFormChange: (data: DonorLeadCreate) => void;
  onSubmit: () => void;
  submitLoading: boolean;
};

export function DonorLeadFormDialog({
  open,
  onOpenChange,
  editing,
  formData,
  onFormChange,
  onSubmit,
  submitLoading,
}: DonorLeadFormDialogProps) {
  const patch = (partial: Partial<DonorLeadCreate>) =>
    onFormChange({ ...formData, ...partial });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Donor Lead" : "Add New Donor Lead"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Full Name *</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => patch({ full_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => patch({ email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={formData.phone ?? ""}
              onChange={(e) => patch({ phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Organization</Label>
            <Input
              value={formData.organization ?? ""}
              onChange={(e) => patch({ organization: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Expected Donation</Label>
            <Input
              type="number"
              min={0}
              value={formData.expected_donation ?? 0}
              onChange={(e) =>
                patch({ expected_donation: Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Lead Status</Label>
            <Select
              value={formData.status ?? "new"}
              onValueChange={(v) => patch({ status: v as DonorLeadStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DONOR_LEAD_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Lead Source</Label>
            <Select
              value={formData.source ?? "other"}
              onValueChange={(v) => patch({ source: v as DonorLeadSource })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DONOR_LEAD_SOURCE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Assigned To</Label>
            <Input
              value={formData.assigned_to ?? ""}
              onChange={(e) => patch({ assigned_to: e.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Notes</Label>
            <Textarea
              rows={2}
              value={formData.notes ?? ""}
              onChange={(e) => patch({ notes: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={onSubmit}
            disabled={submitLoading}
          >
            {submitLoading ? "Saving..." : "Save Lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
