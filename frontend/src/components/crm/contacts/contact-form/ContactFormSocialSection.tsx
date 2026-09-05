import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { ContactCreate } from "@/src/models/crm";
import { CollapsibleFormSection } from "../CollapsibleFormSection";
import { CONTACT_SOCIAL_LABELS, mergeSocialFromApi } from "../contactUtils";

type ContactFormSocialSectionProps = {
  formData: ContactCreate;
  setFormData: React.Dispatch<React.SetStateAction<ContactCreate>>;
  open: boolean;
  onToggle: () => void;
};

export function ContactFormSocialSection({
  formData,
  setFormData,
  open,
  onToggle,
}: ContactFormSocialSectionProps) {
  return (
    <CollapsibleFormSection
      title="Contact details"
      open={open}
      onToggle={onToggle}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-md p-4">
        {CONTACT_SOCIAL_LABELS.map(([key, label]) => (
          <div key={key}>
            <Label htmlFor={`social-${key}`}>{label}</Label>
            <Input
              id={`social-${key}`}
              value={mergeSocialFromApi(formData.socialLinks)[key] || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  socialLinks: {
                    ...mergeSocialFromApi(formData.socialLinks),
                    [key]: e.target.value,
                  },
                })
              }
              placeholder="URL or handle"
            />
          </div>
        ))}
      </div>
    </CollapsibleFormSection>
  );
}
