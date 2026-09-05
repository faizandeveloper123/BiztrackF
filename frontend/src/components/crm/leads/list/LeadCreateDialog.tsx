"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { CustomOptionDialog } from "@/src/components/common/CustomOptionDialog";
import { LeadCreate, LeadSource } from "@/src/models/crm";
import CRMService from "@/src/services/CRMService";
import { useCustomOptions } from "@/src/hooks/useCustomOptions";

const emptyForm = (): LeadCreate => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  jobTitle: "",
  status: "open",
  source: LeadSource.WEBSITE,
  notes: "",
  tags: [],
  score: 0,
  pipelineStage: "new_lead",
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LeadCreateDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const { customLeadSources, createCustomLeadSource } = useCustomOptions();
  const [formData, setFormData] = useState<LeadCreate>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [showCustomLeadSourceDialog, setShowCustomLeadSourceDialog] =
    useState(false);

  const handleCreateLead = async () => {
    const firstName = (formData.firstName || "").trim();
    const lastName = (formData.lastName || "").trim();
    const email = (formData.email || "").trim();
    if (!firstName || !lastName || !emailPattern.test(email)) {
      setFormError("First name, last name, and a valid email are required.");
      return;
    }
    try {
      const created = await CRMService.createLead({
        ...formData,
        firstName,
        lastName,
        email,
        leadSource: formData.source || formData.leadSource,
      });
      onOpenChange(false);
      setFormError(null);
      setFormData(emptyForm());
      router.push(`/crm/leads/${created.id}`);
    } catch (e: any) {
      setFormError(e?.message || "Failed to create lead");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>First name</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, firstName: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Last name</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, lastName: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={formData.email}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={formData.phone || ""}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, phone: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Lead type</Label>
                <Input
                  value={formData.leadType || ""}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, leadType: e.target.value }))
                  }
                  placeholder="Home Buyer"
                />
              </div>
              <div>
                <Label>Source</Label>
                <Select
                  value={String(formData.source || LeadSource.WEBSITE)}
                  onValueChange={(v) => {
                    if (v === "__custom__") {
                      setShowCustomLeadSourceDialog(true);
                      return;
                    }
                    setFormData((p) => ({ ...p, source: v as LeadSource }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(LeadSource).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                    {(customLeadSources || [])
                      .filter((s) => Boolean(s?.name?.trim()))
                      .map((s) => (
                        <SelectItem key={s.id} value={s.name}>
                          {s.name}
                        </SelectItem>
                      ))}
                    <SelectItem value="__custom__">+ Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, notes: e.target.value }))
                }
              />
            </div>
            <Button onClick={handleCreateLead}>Create Lead</Button>
          </div>
        </DialogContent>
      </Dialog>

      <CustomOptionDialog
        open={showCustomLeadSourceDialog}
        onOpenChange={setShowCustomLeadSourceDialog}
        title="Custom Lead Source"
        description="Create a custom lead source for your tenant."
        optionName="Lead Source"
        placeholder="e.g., Open House"
        onSubmit={async (name, description) => {
          await createCustomLeadSource(name, description);
          setFormData((p) => ({ ...p, source: name as LeadSource }));
        }}
      />
    </>
  );
}
