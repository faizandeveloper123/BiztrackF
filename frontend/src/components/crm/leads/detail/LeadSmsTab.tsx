"use client";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";
import { Lead, LeadSmsItem } from "@/src/models/crm";
import CRMService from "@/src/services/CRMService";

type Props = {
  lead: Lead;
  leadId: string;
  sms: LeadSmsItem[];
  smsBody: string;
  setSmsBody: (v: string) => void;
  patchLead: (data: Record<string, unknown>) => Promise<void>;
  loadTabData: () => Promise<void>;
  reload: () => Promise<void>;
};

export function LeadSmsTab({
  lead,
  leadId,
  sms,
  smsBody,
  setSmsBody,
  patchLead,
  loadTabData,
  reload,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 border-b pb-3 text-sm">
        <span>Receive SMS</span>
        <Switch
          checked={!!lead.receiveSms}
          onCheckedChange={(v) => patchLead({ receiveSms: v })}
        />
      </div>
      {!lead.integrations?.twilioConfigured && (
        <p className="text-xs text-muted-foreground">
          You cannot send SMS messages until Twilio is configured. Set
          TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.
        </p>
      )}
      <div className="space-y-3 max-h-[360px] overflow-y-auto">
        {sms.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.direction === "outgoing" ? "items-end" : "items-start"}`}
          >
            <div className="text-[10px] text-emerald-600 mb-1">{m.status}</div>
            <div
              className={`rounded-xl p-3 max-w-[90%] text-sm ${m.direction === "outgoing" ? "bg-blue-100 rounded-tr-none" : "bg-muted rounded-tl-none"}`}
            >
              {m.body}
              <div className="text-[10px] text-muted-foreground text-right mt-1">
                {m.sentAt || m.createdAt
                  ? new Date(m.sentAt || m.createdAt || "").toLocaleString()
                  : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 border-t pt-3">
        <Input
          placeholder="SMS message..."
          value={smsBody}
          onChange={(e) => setSmsBody(e.target.value)}
        />
        <Button
          onClick={async () => {
            if (!smsBody.trim()) return;
            await CRMService.sendLeadSms(leadId, { body: smsBody });
            setSmsBody("");
            loadTabData();
            reload();
          }}
        >
          Send
        </Button>
      </div>
    </div>
  );
}
