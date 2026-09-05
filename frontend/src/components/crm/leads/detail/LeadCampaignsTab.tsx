"use client";

import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Lead,
  LeadCampaignItem,
  LeadCampaignAssignment,
} from "@/src/models/crm";
import CRMService from "@/src/services/CRMService";

type Props = {
  lead: Lead;
  leadId: string;
  campaigns: LeadCampaignItem[];
  assignments: LeadCampaignAssignment[];
  selectedCampaign: string;
  setSelectedCampaign: (v: string) => void;
  loadTabData: () => Promise<void>;
};

export function LeadCampaignsTab({
  lead,
  leadId,
  campaigns,
  assignments,
  selectedCampaign,
  setSelectedCampaign,
  loadTabData,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end gap-3">
        <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select Campaign" />
          </SelectTrigger>
          <SelectContent>
            {campaigns.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const name = window.prompt("Campaign name");
              if (!name) return;
              await CRMService.createLeadCampaign({
                name,
                steps: [
                  {
                    type: "email",
                    subject: `Hello from ${name}`,
                    body: `Hi ${lead.firstName}, following up from ${name}.`,
                  },
                  {
                    type: "email",
                    subject: `${name} check-in`,
                    body: `Hi ${lead.firstName}, just checking in.`,
                  },
                ],
              });
              loadTabData();
            }}
          >
            New campaign
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!selectedCampaign}
            onClick={async () => {
              await CRMService.assignLeadCampaign(leadId, selectedCampaign);
              loadTabData();
            }}
          >
            Assign
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="text-left pb-2">Campaign</th>
            <th className="text-left pb-2">Status</th>
            <th className="text-left pb-2">Progress</th>
            <th className="text-left pb-2">Assigned By</th>
            <th className="text-center pb-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((a) => (
            <tr key={a.id} className="border-b">
              <td className="py-2">{a.campaignName}</td>
              <td className="py-2 text-primary">{a.status}</td>
              <td className="py-2">
                {a.progress}% ({a.currentStep}/{a.totalSteps})
              </td>
              <td className="py-2">{a.assignedByName}</td>
              <td className="py-2 text-center space-x-2">
                <button
                  className="text-primary"
                  onClick={() =>
                    CRMService.leadCampaignAction(leadId, a.id, "stop").then(
                      loadTabData,
                    )
                  }
                >
                  Stop
                </button>
                <button
                  className="text-primary"
                  onClick={() =>
                    CRMService.leadCampaignAction(leadId, a.id, "start").then(
                      loadTabData,
                    )
                  }
                >
                  Start
                </button>
                <button
                  className="text-primary"
                  onClick={() =>
                    CRMService.leadCampaignAction(leadId, a.id, "force").then(
                      loadTabData,
                    )
                  }
                >
                  Force
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
