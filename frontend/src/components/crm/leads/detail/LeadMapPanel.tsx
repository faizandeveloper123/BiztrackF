"use client";

import { MapPin } from "lucide-react";
import { Lead } from "@/src/models/crm";
import { mapUrl } from "@/src/components/crm/leads/leadUtils";

type Props = {
  lead: Lead;
};

export function LeadMapPanel({ lead }: Props) {
  const url = mapUrl(lead.lat, lead.lng, lead.city, lead.address);
  return (
    <div className="md:col-span-5 rounded-lg border bg-card overflow-hidden relative min-h-[280px]">
      {lead.ipAddress && (
        <div className="absolute top-0 right-0 z-10 text-[10px] bg-background/80 px-2 py-1 rounded-bl">
          IP Address: {lead.ipAddress}
        </div>
      )}
      {url ? (
        <iframe
          title="Lead map"
          src={url}
          className="w-full h-full min-h-[280px] border-0"
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full min-h-[280px] text-muted-foreground text-sm gap-2">
          <MapPin className="h-8 w-8" />
          Set city/address or lat/lng to show map
        </div>
      )}
    </div>
  );
}
