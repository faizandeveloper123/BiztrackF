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
import type { DonorCreate, DonorStatus, DonorType } from "@/src/models/ngo";
import { DONOR_TYPE_OPTIONS } from "@/src/utils/ngo/donorUtils";

type DonorFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  formData: DonorCreate;
  onFormChange: (data: DonorCreate) => void;
  onSubmit: () => void;
  submitLoading: boolean;
};

export function DonorFormDialog({
  open,
  onOpenChange,
  editing,
  formData,
  onFormChange,
  onSubmit,
  submitLoading,
}: DonorFormDialogProps) {
  const patch = (partial: Partial<DonorCreate>) =>
    onFormChange({ ...formData, ...partial });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Donor" : "Add New Donor"}</DialogTitle>
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
            <Label>Donor Type *</Label>
            <Select
              value={formData.donor_type}
              onValueChange={(v) => patch({ donor_type: v as DonorType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DONOR_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => patch({ status: v as DonorStatus })}
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
          <div className="space-y-2 md:col-span-2">
            <Label>Address</Label>
            <Textarea
              rows={2}
              value={formData.address ?? ""}
              onChange={(e) => patch({ address: e.target.value })}
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitLoading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {submitLoading ? "Saving..." : "Save Donor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
