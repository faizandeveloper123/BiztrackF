"use client";

import { Button } from "@/src/components/ui/button";
import { Lead } from "@/src/models/crm";
import CRMService from "@/src/services/CRMService";
import { ageDays } from "@/src/components/crm/leads/leadUtils";

type Props = {
  lead: Lead;
  leadId: string;
  reload: () => Promise<void>;
};

export function LeadStatsSection({ lead, leadId, reload }: Props) {
  const days = ageDays(lead.createdAt);
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-lg border bg-card p-3 text-xs leading-relaxed">
        <div className="font-medium mb-2">Lead Stats</div>
        {lead.firstName} {lead.lastName} is a lead from {days} day
        {days === 1 ? "" : "s"} ago who registered on{" "}
        {new Date(lead.registeredAt || lead.createdAt).toLocaleString()}. Last
        contacted{" "}
        {lead.lastContactAt
          ? new Date(lead.lastContactAt).toLocaleString()
          : "never"}
        . Lead has had a total of {lead.callCount || 0} calls,{" "}
        {lead.emailCount || 0} emails, & {lead.smsCount || 0} SMS messages.
      </div>
      <div className="rounded-lg border bg-card p-3 text-xs flex flex-col justify-between">
        <div>
          <div className="font-medium mb-1">Last property view</div>
          {lead.lastPropertyView ? (
            <p>
              Looked at {(lead.propertyViewSummary as any)?.count || 1}{" "}
              properties
              {lead.lastPropertyView.city
                ? ` in ${lead.lastPropertyView.city}`
                : ""}
              .
            </p>
          ) : (
            <p className="text-muted-foreground">No property views yet.</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={async () => {
            await CRMService.createPropertyView(leadId, {
              propertyType: "Condo",
              city: lead.city || "Unknown",
              price: lead.priceMin || 0,
              beds: 2,
              baths: 2,
            });
            reload();
          }}
        >
          Log property view
        </Button>
      </div>
    </div>
  );
}
