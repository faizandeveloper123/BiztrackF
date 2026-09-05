"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Lead } from "@/src/models/crm";
import CRMService from "@/src/services/CRMService";
import { useConfirm } from "@/src/contexts/ConfirmContext";
import type { LeadUserOption } from "@/src/components/crm/leads/leadUtils";
import { LeadAgentSelect } from "./LeadAgentSelect";

type Props = {
  lead: Lead;
  leadId: string;
  users: LeadUserOption[];
  patchLead: (data: Record<string, unknown>) => Promise<void>;
};

export function LeadAgentsPanel({ lead, leadId, users, patchLead }: Props) {
  const confirm = useConfirm();
  const router = useRouter();
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      <div className="md:col-span-7 rounded-lg border bg-card p-4">
        <div className="font-medium text-sm mb-3">Agents</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <LeadAgentSelect
            label="Main agent"
            value={lead.mainAgentId || lead.assignedTo || ""}
            users={users}
            onChange={(v) =>
              patchLead({ mainAgentId: v || null, assignedTo: v || null })
            }
          />
          <LeadAgentSelect
            label="List Agent"
            value={lead.listAgentId || ""}
            users={users}
            onChange={(v) => patchLead({ listAgentId: v || null })}
          />
          <LeadAgentSelect
            label="Mort. agent"
            value={lead.mortgageAgentId || ""}
            users={users}
            onChange={(v) => patchLead({ mortgageAgentId: v || null })}
          />
        </div>
      </div>
      <div className="md:col-span-5 rounded-lg border bg-card p-4 flex items-end justify-end">
        <Button
          variant="outline"
          className="text-destructive border-destructive/40"
          onClick={async () => {
            const ok = await confirm({
              title: "Delete lead?",
              description: "This cannot be undone.",
            });
            if (!ok) return;
            await CRMService.deleteLead(leadId);
            router.push("/crm/leads");
          }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
