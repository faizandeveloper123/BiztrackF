import React from "react";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Paperclip, ExternalLink, Trash2 } from "lucide-react";
import { ContactCreate, ContactAttachment } from "@/src/models/crm";

type ContactFormAttachmentsSectionProps = {
  formData: ContactCreate;
  attachmentFileInputRef: React.RefObject<HTMLInputElement | null>;
  onAttachmentFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  attachmentUploading: boolean;
  onRemoveAttachment: (index: number) => void;
};

export function ContactFormAttachmentsSection({
  formData,
  attachmentFileInputRef,
  onAttachmentFile,
  attachmentUploading,
  onRemoveAttachment,
}: ContactFormAttachmentsSectionProps) {
  return (
    <div className="md:col-span-2 space-y-2">
      <Label>Attachments</Label>
      <input
        ref={attachmentFileInputRef as React.Ref<HTMLInputElement>}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={onAttachmentFile}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={attachmentUploading}
          onClick={() => attachmentFileInputRef.current?.click()}
        >
          <Paperclip className="h-4 w-4 mr-1" />
          {attachmentUploading ? "Uploading…" : "Add file"}
        </Button>
        <span className="text-xs text-muted-foreground">
          PDF, DOC, DOCX (max 10MB)
        </span>
      </div>
      {(formData.attachments || []).length > 0 && (
        <ul className="border rounded-md divide-y text-sm">
          {(formData.attachments || []).map((att: ContactAttachment, idx) => (
            <li
              key={`${att.url}-${idx}`}
              className="flex items-center justify-between gap-2 px-3 py-2"
            >
              <span
                className="truncate flex-1"
                title={att.original_filename || att.url}
              >
                {att.original_filename || "Attachment"}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center"
                  aria-label="Open file"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive"
                  onClick={() => onRemoveAttachment(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
