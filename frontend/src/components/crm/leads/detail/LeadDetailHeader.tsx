"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { Lead, PIPELINE_LABELS } from "@/src/models/crm";

type Props = {
  lead: Lead;
};

export function LeadDetailHeader({ lead }: Props) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/crm/leads")}
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>
      <h1 className="text-lg font-semibold">
        {lead.firstName} {lead.lastName}
      </h1>
      <Badge variant="outline" className="capitalize">
        {PIPELINE_LABELS[lead.pipelineStage || "new_lead"] ||
          lead.pipelineStage}
      </Badge>
    </div>
  );
}
