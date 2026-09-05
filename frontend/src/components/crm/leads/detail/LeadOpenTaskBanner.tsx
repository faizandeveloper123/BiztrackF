"use client";

import { Clock } from "lucide-react";
import { Lead } from "@/src/models/crm";

type Props = {
  lead: Lead;
};

export function LeadOpenTaskBanner({ lead }: Props) {
  if (!lead.openTask) return null;
  return (
    <div className="rounded-lg bg-red-500 text-white p-4 flex gap-3">
      <Clock className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="text-sm">
        <div className="font-medium">
          {lead.openTask.dueAt
            ? new Date(lead.openTask.dueAt).toLocaleString()
            : "No due date"}
        </div>
        <div>Title: {lead.openTask.title}</div>
        <div>Status: {lead.openTask.status}</div>
        <div>User: {lead.openTask.assignedToName || "—"}</div>
      </div>
    </div>
  );
}
