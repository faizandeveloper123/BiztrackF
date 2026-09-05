"use client";

import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Lead, PIPELINE_LABELS } from "@/src/models/crm";
import CRMService from "@/src/services/CRMService";

type Props = {
  lead: Lead;
  leadId: string;
  reload: () => Promise<void>;
};

export function LeadPipelineIntegrations({ lead, leadId, reload }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-lg border bg-card p-3">
        <div className="font-medium text-sm mb-2">Pipeline</div>
        <Select
          value={lead.pipelineStage || "new_lead"}
          onValueChange={async (v) => {
            await CRMService.updateLeadPipeline(leadId, v);
            reload();
          }}
        >
          <SelectTrigger className="bg-red-50 text-red-700 border-red-100">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PIPELINE_LABELS).map(([v, label]) => (
              <SelectItem key={v} value={v}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-lg border bg-card p-3 flex flex-col justify-between">
        <div className="font-medium text-sm mb-2">CRM Integrations</div>
        <div className="text-[11px] text-muted-foreground mb-2">
          Twilio: {lead.integrations?.twilioConfigured ? "Ready" : "Not set"} ·
          SMTP: {lead.integrations?.smtpConfigured ? "Ready" : "Not set"}
        </div>
        <Button variant="outline" size="sm">
          Setup
        </Button>
      </div>
    </div>
  );
}
