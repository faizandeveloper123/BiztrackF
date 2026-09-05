import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { ContactCreate } from "@/src/models/crm";
import { CollapsibleFormSection } from "../CollapsibleFormSection";

type ContactFormAdditionalSectionProps = {
  formData: ContactCreate;
  setFormData: React.Dispatch<React.SetStateAction<ContactCreate>>;
  open: boolean;
  onToggle: () => void;
};

export function ContactFormAdditionalSection({
  formData,
  setFormData,
  open,
  onToggle,
}: ContactFormAdditionalSectionProps) {
  return (
    <CollapsibleFormSection title="Additional" open={open} onToggle={onToggle}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-md p-4">
        <div>
          <Label htmlFor="initials">Initials</Label>
          <Input
            id="initials"
            value={formData.initials || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                initials: e.target.value,
              })
            }
            placeholder="Initials"
          />
        </div>
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            value={formData.fullName || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                fullName: e.target.value,
              })
            }
            placeholder="Full name"
          />
        </div>
        <div>
          <Label htmlFor="birthday">Birthday</Label>
          <Input
            id="birthday"
            type="date"
            value={formData.birthday || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                birthday: e.target.value,
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="clientValue">Client value (initial deal value)</Label>
          <Input
            id="clientValue"
            type="number"
            min={0}
            step="0.01"
            value={formData.clientValue ?? ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                clientValue: e.target.value
                  ? parseFloat(e.target.value)
                  : undefined,
              })
            }
            placeholder="Expected starting business value"
          />
        </div>
        <div>
          <Label htmlFor="businessTaxId">Business tax ID</Label>
          <Input
            id="businessTaxId"
            value={formData.businessTaxId || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                businessTaxId: e.target.value,
              })
            }
            placeholder="Tax or registration ID"
          />
        </div>
      </div>
    </CollapsibleFormSection>
  );
}
