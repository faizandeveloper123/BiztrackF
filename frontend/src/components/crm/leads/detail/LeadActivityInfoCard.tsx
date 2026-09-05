"use client";

import { Lead } from "@/src/models/crm";

type Props = {
  lead: Lead;
};

export function LeadActivityInfoCard({ lead }: Props) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="bg-primary text-primary-foreground px-4 py-2.5 text-sm flex justify-between">
        <span>Lead activity info</span>
      </div>
      <div className="p-3 text-xs flex justify-between border-t">
        <span>
          Lead activity:{" "}
          <strong>{lead.hasOpenTask ? "Active" : "Not active"}</strong>
        </span>
        <span>
          Registered:{" "}
          {new Date(lead.registeredAt || lead.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
