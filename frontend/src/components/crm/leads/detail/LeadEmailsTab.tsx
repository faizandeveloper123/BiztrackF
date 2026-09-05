"use client";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Badge } from "@/src/components/ui/badge";
import { Plus, Mail } from "lucide-react";
import { Lead, LeadEmailItem } from "@/src/models/crm";
import CRMService from "@/src/services/CRMService";

type Props = {
  lead: Lead;
  leadId: string;
  emails: LeadEmailItem[];
  emailDir: "outgoing" | "incoming";
  setEmailDir: (v: "outgoing" | "incoming") => void;
  emailSubject: string;
  setEmailSubject: (v: string) => void;
  emailBody: string;
  setEmailBody: (v: string) => void;
  showCompose: boolean;
  setShowCompose: React.Dispatch<React.SetStateAction<boolean>>;
  loadTabData: () => Promise<void>;
  reload: () => Promise<void>;
};

export function LeadEmailsTab({
  lead,
  leadId,
  emails,
  emailDir,
  setEmailDir,
  emailSubject,
  setEmailSubject,
  emailBody,
  setEmailBody,
  showCompose,
  setShowCompose,
  loadTabData,
  reload,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center border-b pb-2">
        <div className="flex gap-4 text-sm">
          <button
            className={
              emailDir === "outgoing"
                ? "text-primary border-b-2 border-primary pb-2"
                : "text-muted-foreground"
            }
            onClick={() => setEmailDir("outgoing")}
          >
            Outgoing
          </button>
          <button
            className={
              emailDir === "incoming"
                ? "text-primary border-b-2 border-primary pb-2"
                : "text-muted-foreground"
            }
            onClick={() => setEmailDir("incoming")}
          >
            Incoming
          </button>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowCompose((v) => !v)}
        >
          <Plus className="h-3 w-3 mr-1" /> Compose
        </Button>
      </div>
      {showCompose && (
        <div className="space-y-2 border rounded p-3">
          {!lead.integrations?.smtpConfigured && (
            <p className="text-xs text-amber-600">
              SMTP is not configured. Email will be queued until SMTP_* env vars
              are set.
            </p>
          )}
          <Input
            placeholder="Subject"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
          />
          <Textarea
            placeholder="Body"
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
          />
          <Button
            size="sm"
            onClick={async () => {
              await CRMService.composeLeadEmail(leadId, {
                subject: emailSubject,
                body: emailBody,
              });
              setEmailSubject("");
              setEmailBody("");
              setShowCompose(false);
              loadTabData();
              reload();
            }}
          >
            Send
          </Button>
        </div>
      )}
      <div className="space-y-3">
        {emails.map((e) => (
          <div key={e.id} className="flex gap-3 border-b pb-3 text-sm">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs shrink-0">
              EM
            </div>
            <div className="flex-1">
              <div className="font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                {e.subject}
              </div>
              <div className="text-xs text-muted-foreground">
                To: {e.toEmail}
              </div>
            </div>
            <div className="text-right text-xs">
              <Badge variant="secondary" className="mb-1">
                {e.status}
                {e.openedAt ? " · opened" : ""}
              </Badge>
              <div>
                {e.sentAt
                  ? new Date(e.sentAt).toLocaleString()
                  : e.createdAt
                    ? new Date(e.createdAt).toLocaleString()
                    : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
