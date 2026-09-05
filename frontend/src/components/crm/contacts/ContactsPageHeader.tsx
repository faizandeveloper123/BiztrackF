import { Button } from "@/src/components/ui/button";
import { Plus } from "lucide-react";

type ContactsPageHeaderProps = {
  successMessage: string;
  onNewContact?: () => void;
};

export function ContactsPageHeader({
  successMessage,
  onNewContact,
}: ContactsPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">CRM Contacts</h1>
        <p className="text-gray-600">
          Manage your customer contacts and relationships
        </p>
        {successMessage && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 text-sm">{successMessage}</p>
          </div>
        )}
      </div>
      {onNewContact && (
        <Button onClick={onNewContact}>
          <Plus className="w-4 h-4 mr-2" />
          New Contact
        </Button>
      )}
    </div>
  );
}
