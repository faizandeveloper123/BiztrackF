import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Plus, Minus } from "lucide-react";
import { ContactCreate } from "@/src/models/crm";
import { CollapsibleFormSection } from "../CollapsibleFormSection";
import { emptyAddressRow } from "../contactUtils";

type ContactFormAddressesSectionProps = {
  formData: ContactCreate;
  setFormData: React.Dispatch<React.SetStateAction<ContactCreate>>;
  open: boolean;
  onToggle: () => void;
};

export function ContactFormAddressesSection({
  formData,
  setFormData,
  open,
  onToggle,
}: ContactFormAddressesSectionProps) {
  return (
    <CollapsibleFormSection title="Addresses" open={open} onToggle={onToggle}>
      <div className="space-y-4 border rounded-md p-4">
        {(formData.addresses || []).map((addr, idx) => (
          <div
            key={idx}
            className="relative space-y-3 rounded-md border p-3 pt-10"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 h-8 w-8 p-0 text-destructive"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  addresses: (prev.addresses || []).filter((_, i) => i !== idx),
                }))
              }
              aria-label="Remove address"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Label</Label>
                <Input
                  value={addr.label || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormData((prev) => {
                      const next = [...(prev.addresses || [])];
                      next[idx] = { ...next[idx], label: v };
                      return { ...prev, addresses: next };
                    });
                  }}
                  placeholder="e.g. Billing"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Line 1</Label>
                <Input
                  value={addr.line1 || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormData((prev) => {
                      const next = [...(prev.addresses || [])];
                      next[idx] = { ...next[idx], line1: v };
                      return { ...prev, addresses: next };
                    });
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Line 2</Label>
                <Input
                  value={addr.line2 || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormData((prev) => {
                      const next = [...(prev.addresses || [])];
                      next[idx] = { ...next[idx], line2: v };
                      return { ...prev, addresses: next };
                    });
                  }}
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={addr.city || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormData((prev) => {
                      const next = [...(prev.addresses || [])];
                      next[idx] = { ...next[idx], city: v };
                      return { ...prev, addresses: next };
                    });
                  }}
                />
              </div>
              <div>
                <Label>State / region</Label>
                <Input
                  value={addr.state || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormData((prev) => {
                      const next = [...(prev.addresses || [])];
                      next[idx] = { ...next[idx], state: v };
                      return { ...prev, addresses: next };
                    });
                  }}
                />
              </div>
              <div>
                <Label>Postal code</Label>
                <Input
                  value={addr.postalCode || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormData((prev) => {
                      const next = [...(prev.addresses || [])];
                      next[idx] = { ...next[idx], postalCode: v };
                      return { ...prev, addresses: next };
                    });
                  }}
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={addr.country || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormData((prev) => {
                      const next = [...(prev.addresses || [])];
                      next[idx] = { ...next[idx], country: v };
                      return { ...prev, addresses: next };
                    });
                  }}
                />
              </div>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setFormData((prev) => ({
              ...prev,
              addresses: [...(prev.addresses || []), emptyAddressRow()],
            }))
          }
        >
          <Plus className="h-4 w-4 mr-1" />
          Add address
        </Button>
      </div>
    </CollapsibleFormSection>
  );
}
