"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { Lead } from "@/src/models/crm";
import CRMService from "@/src/services/CRMService";

type Props = {
  lead: Lead;
  leadId: string;
  reload: () => Promise<void>;
};

export function LeadListingSearchesCard({ lead, leadId, reload }: Props) {
  const [searchName, setSearchName] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [searchMin, setSearchMin] = useState("");
  const [searchMax, setSearchMax] = useState("");

  return (
    <div className="rounded-lg border bg-card p-3 space-y-3">
      <div className="flex justify-between items-center">
        <div className="font-medium text-sm">Saved Listing Searches</div>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            if (!searchName.trim()) {
              setSearchName("New search");
            }
            await CRMService.createListingSearch(leadId, {
              name: searchName || `${lead.city || "Area"} Search`,
              city: searchCity || lead.city,
              priceMin: searchMin ? Number(searchMin) : lead.priceMin,
              priceMax: searchMax ? Number(searchMax) : lead.priceMax,
              propertyTypes: [],
              intervalHours: 24,
            });
            setSearchName("");
            reload();
          }}
        >
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input
          placeholder="Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <Input
          placeholder="City"
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
        />
        <Input
          placeholder="Min"
          value={searchMin}
          onChange={(e) => setSearchMin(e.target.value)}
        />
        <Input
          placeholder="Max"
          value={searchMax}
          onChange={(e) => setSearchMax(e.target.value)}
        />
      </div>
      {(lead.listingSearches || []).map((s) => (
        <div key={s.id} className="border-t pt-2 text-xs space-y-1">
          <div className="flex justify-between">
            <strong>{s.name}</strong>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2"
                onClick={() =>
                  CRMService.runListingSearch(leadId, s.id).then(reload)
                }
              >
                Run
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-destructive"
                onClick={() =>
                  CRMService.deleteListingSearch(leadId, s.id).then(reload)
                }
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div>
            {s.city} · ${s.priceMin || 0} - ${s.priceMax || 0}
          </div>
          <div className="text-muted-foreground">
            emails sent {s.emailsSent || 0} · next{" "}
            {s.nextSendAt ? new Date(s.nextSendAt).toLocaleString() : "—"}
          </div>
        </div>
      ))}
    </div>
  );
}
