"use client";

import { useState } from "react";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Lead } from "@/src/models/crm";
import { LeadField } from "./LeadField";
import { LeadSelectField } from "./LeadSelectField";

type Props = {
  lead: Lead;
  patchLead: (data: Record<string, unknown>) => Promise<void>;
};

export function LeadDataPanel({ lead, patchLead }: Props) {
  const [dataTab, setDataTab] = useState("lead");

  return (
    <div className="md:col-span-7 rounded-lg border bg-card">
      <div className="flex border-b overflow-x-auto">
        {[
          ["lead", "Lead Data"],
          ["more", "More Details"],
          ["buyer", "Buyer Info"],
          ["seller", "Seller Info"],
          ["custom", "Custom Fields"],
        ].map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={`px-3 py-2 text-xs whitespace-nowrap ${dataTab === k ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
            onClick={() => setDataTab(k)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {(dataTab === "lead" || dataTab === "more") && (
          <>
            <LeadField
              label="Status"
              value={lead.status || "open"}
              onSave={(v) => patchLead({ status: v })}
            />
            <LeadSelectField
              label="Lead Rating"
              value={lead.leadRating || ""}
              options={["hot", "warm", "cold"]}
              onSave={(v) => patchLead({ leadRating: v || null })}
            />
            <LeadField
              label="Ref. source"
              value={lead.refSource || ""}
              onSave={(v) => patchLead({ refSource: v })}
            />
            <LeadField
              label="Source"
              value={lead.campaignSource || lead.leadSource || ""}
              onSave={(v) => patchLead({ campaignSource: v })}
            />
            <LeadField
              label="Lead type"
              value={lead.leadType || ""}
              onSave={(v) => patchLead({ leadType: v })}
            />
            <LeadField
              label="House to sell"
              value={lead.houseToSell || ""}
              onSave={(v) => patchLead({ houseToSell: v })}
            />
          </>
        )}
        {(dataTab === "buyer" || dataTab === "lead") && (
          <>
            <LeadField
              label="Buying in"
              value={lead.buyingIn || ""}
              onSave={(v) => patchLead({ buyingIn: v })}
            />
            <LeadField
              label="Mortgage type"
              value={lead.mortgageType || ""}
              onSave={(v) => patchLead({ mortgageType: v })}
            />
            <LeadField
              label="Owns/Rents"
              value={lead.ownsRents || ""}
              onSave={(v) => patchLead({ ownsRents: v })}
            />
            <LeadField
              label="Work phone"
              value={lead.workPhone || ""}
              onSave={(v) => patchLead({ workPhone: v })}
            />
            <LeadField
              label="Home phone"
              value={lead.homePhone || ""}
              onSave={(v) => patchLead({ homePhone: v })}
            />
            <LeadField
              label="Price min"
              value={String(lead.priceMin ?? "")}
              onSave={(v) => patchLead({ priceMin: v ? Number(v) : null })}
            />
            <LeadField
              label="Price max"
              value={String(lead.priceMax ?? "")}
              onSave={(v) => patchLead({ priceMax: v ? Number(v) : null })}
            />
          </>
        )}
        {(dataTab === "seller" || dataTab === "lead") && (
          <LeadField
            label="Selling in"
            value={lead.sellingIn || ""}
            onSave={(v) => patchLead({ sellingIn: v })}
          />
        )}
        {dataTab === "custom" && (
          <div className="col-span-1 sm:col-span-2">
            <Label>Custom JSON</Label>
            <Textarea
              defaultValue={JSON.stringify(lead.customFields || {}, null, 2)}
              onBlur={(e) => {
                try {
                  patchLead({
                    customFields: JSON.parse(e.target.value || "{}"),
                  });
                } catch {}
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
