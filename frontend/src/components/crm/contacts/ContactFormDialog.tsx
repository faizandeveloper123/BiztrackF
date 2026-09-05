"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { Contact, ContactCreate } from "@/src/models/crm";
import { CustomOption } from "@/src/services/CustomOptionsService";
import { ContactFormCoreFields } from "./contact-form/ContactFormCoreFields";
import { ContactFormNotesSection } from "./contact-form/ContactFormNotesSection";
import { ContactFormAdditionalSection } from "./contact-form/ContactFormAdditionalSection";
import { ContactFormAddressesSection } from "./contact-form/ContactFormAddressesSection";
import { ContactFormSocialSection } from "./contact-form/ContactFormSocialSection";
import { ContactFormAttachmentsSection } from "./contact-form/ContactFormAttachmentsSection";
import { User } from "@/src/models";
import { type UserSearchItem } from "@/src/components/ui/user-search";

type CompanyOption = { id: string; name: string };

type ContactFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingContact: Contact | null;
  formData: ContactCreate;
  setFormData: React.Dispatch<React.SetStateAction<ContactCreate>>;
  companies: CompanyOption[];
  customContactTypes: CustomOption[];
  onRequestCustomContactType: () => void;
  users: User[];
  selectedAssignee: UserSearchItem | null;
  openAdditional: boolean;
  onToggleAdditional: () => void;
  openAddresses: boolean;
  onToggleAddresses: () => void;
  openContactDetails: boolean;
  onToggleContactDetails: () => void;
  errorMessage: string;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  onCancel: () => void;
  attachmentFileInputRef: React.RefObject<HTMLInputElement | null>;
  onAttachmentFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  attachmentUploading: boolean;
  onRemoveAttachment: (index: number) => void;
};

export function ContactFormDialog({
  open,
  onOpenChange,
  editingContact,
  formData,
  setFormData,
  companies,
  customContactTypes,
  onRequestCustomContactType,
  users,
  selectedAssignee,
  openAdditional,
  onToggleAdditional,
  openAddresses,
  onToggleAddresses,
  openContactDetails,
  onToggleContactDetails,
  errorMessage,
  onSubmit,
  submitting,
  onCancel,
  attachmentFileInputRef,
  onAttachmentFile,
  attachmentUploading,
  onRemoveAttachment,
}: ContactFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingContact ? "Edit Contact" : "Create New Contact"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ContactFormCoreFields
              formData={formData}
              setFormData={setFormData}
              companies={companies}
              customContactTypes={customContactTypes}
              onRequestCustomContactType={onRequestCustomContactType}
              users={users}
              selectedAssignee={selectedAssignee}
            />

            <ContactFormNotesSection
              formData={formData}
              setFormData={setFormData}
            />

            <ContactFormAdditionalSection
              formData={formData}
              setFormData={setFormData}
              open={openAdditional}
              onToggle={onToggleAdditional}
            />

            <ContactFormAddressesSection
              formData={formData}
              setFormData={setFormData}
              open={openAddresses}
              onToggle={onToggleAddresses}
            />

            <ContactFormSocialSection
              formData={formData}
              setFormData={setFormData}
              open={openContactDetails}
              onToggle={onToggleContactDetails}
            />

            <ContactFormAttachmentsSection
              formData={formData}
              attachmentFileInputRef={attachmentFileInputRef}
              onAttachmentFile={onAttachmentFile}
              attachmentUploading={attachmentUploading}
              onRemoveAttachment={onRemoveAttachment}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Saving..."
                : editingContact
                  ? "Update Contact"
                  : "Create Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
