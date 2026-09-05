import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { ContactCreate } from "@/src/models/crm";

type ContactFormNotesSectionProps = {
  formData: ContactCreate;
  setFormData: React.Dispatch<React.SetStateAction<ContactCreate>>;
};

export function ContactFormNotesSection({
  formData,
  setFormData,
}: ContactFormNotesSectionProps) {
  return (
    <>
      <div className="md:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes about the contact"
          rows={3}
        />
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          value={formData.tags?.join(", ") || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              tags: e.target.value
                ? e.target.value.split(",").map((tag) => tag.trim())
                : [],
            })
          }
          placeholder="tag1, tag2, tag3"
        />
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="contactDescription">Description</Label>
        <Textarea
          id="contactDescription"
          value={formData.description || ""}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Profile or summary for this contact"
          rows={4}
          className="resize-y min-h-[80px]"
        />
      </div>
    </>
  );
}
