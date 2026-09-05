"use client";

import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Phone, Mail, Plus, Pencil } from "lucide-react";
import { Lead } from "@/src/models/crm";
import CRMService from "@/src/services/CRMService";

type Props = {
  lead: Lead;
  leadId: string;
  setLead: React.Dispatch<React.SetStateAction<Lead | null>>;
  patchLead: (data: Record<string, unknown>) => Promise<void>;
  reload: () => Promise<void>;
};

export function LeadContactCard({
  lead,
  leadId,
  setLead,
  patchLead,
  reload,
}: Props) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-b pb-2">
        <Input
          value={lead.firstName}
          onChange={(e) => setLead({ ...lead, firstName: e.target.value })}
          onBlur={() => patchLead({ firstName: lead.firstName })}
        />
        <Input
          value={lead.lastName}
          onChange={(e) => setLead({ ...lead, lastName: e.target.value })}
          onBlur={() => patchLead({ lastName: lead.lastName })}
        />
      </div>
      <div className="flex items-center justify-between py-1 border-b text-sm">
        <span className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-emerald-500" />
          <Input
            className="h-8 border-0 shadow-none px-0"
            value={lead.phone || ""}
            onChange={(e) => setLead({ ...lead, phone: e.target.value })}
            onBlur={() => patchLead({ phone: lead.phone })}
            placeholder="Phone"
          />
        </span>
        <Pencil className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex items-center justify-between py-1 border-b text-sm">
        <span className="flex items-center gap-2 flex-1">
          <Mail className="h-4 w-4 text-emerald-500" />
          <Input
            className="h-8 border-0 shadow-none px-0"
            value={lead.email}
            onChange={(e) => setLead({ ...lead, email: e.target.value })}
            onBlur={() => patchLead({ email: lead.email })}
          />
        </span>
        <a href={`mailto:${lead.email}`}>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </a>
      </div>
      <div className="flex flex-wrap gap-3 text-sm text-primary">
        <button
          type="button"
          className="flex items-center gap-1"
          onClick={async () => {
            const name = window.prompt("Contact name");
            if (!name) return;
            await CRMService.createAdditionalContact(leadId, {
              name,
              phone: window.prompt("Phone") || undefined,
              email: window.prompt("Email") || undefined,
            });
            reload();
          }}
        >
          <Plus className="h-3 w-3" /> Additional Contact
        </button>
        <button
          type="button"
          className="flex items-center gap-1"
          onClick={async () => {
            const address = window.prompt("Address", lead.address || "");
            if (address == null) return;
            await patchLead({ address });
          }}
        >
          <Plus className="h-3 w-3" /> Add an address
        </button>
      </div>
      {lead.address && (
        <p className="text-xs text-muted-foreground">{lead.address}</p>
      )}
      <Textarea
        placeholder="Lead Description..."
        value={lead.description || ""}
        onChange={(e) => setLead({ ...lead, description: e.target.value })}
        onBlur={() => patchLead({ description: lead.description })}
        className="min-h-[80px] text-xs"
      />
    </div>
  );
}
