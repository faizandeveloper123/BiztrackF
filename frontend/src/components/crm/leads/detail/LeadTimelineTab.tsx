"use client";

import { PIPELINE_LABELS, LeadPipelineHistoryItem } from "@/src/models/crm";

type Props = {
  timeline: LeadPipelineHistoryItem[];
};

export function LeadTimelineTab({ timeline }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground border-b">
            <th className="text-left pb-2">Pipeline Status</th>
            <th className="text-left pb-2">Date of Change</th>
          </tr>
        </thead>
        <tbody>
          {timeline.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="py-2">
                {PIPELINE_LABELS[t.pipelineStage] || t.pipelineStage}
              </td>
              <td className="py-2">
                {t.changedAt ? new Date(t.changedAt).toLocaleString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
