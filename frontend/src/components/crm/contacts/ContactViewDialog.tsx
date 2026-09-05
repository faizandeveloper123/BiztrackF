"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Label } from "@/src/components/ui/label";
import { ExternalLink } from "lucide-react";
import CRMService from "@/src/services/CRMService";
import { Contact } from "@/src/models/crm";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import agentPortalService, {
  ContactLedger,
} from "@/src/services/AgentPortalService";
import {
  contactTypeDisplayLabel,
  mergeSocialFromApi,
  nonEmptyAddressRows,
  CONTACT_SOCIAL_LABELS,
} from "./contactUtils";

type CompanyOption = { id: string; name: string };

type ContactViewDialogProps = {
  contact: Contact | null;
  companies: CompanyOption[];
  onClose: () => void;
  onEdit?: (contact: Contact) => void;
};

export function ContactViewDialog({
  contact,
  companies,
  onClose,
  onEdit,
}: ContactViewDialogProps) {
  const { formatCurrency } = useCurrency();
  const [showFullWebsite, setShowFullWebsite] = useState(false);
  const [ledger, setLedger] = useState<ContactLedger | null>(null);

  useEffect(() => {
    setShowFullWebsite(false);
    setLedger(null);
    if (contact?.id) {
      agentPortalService
        .getContactLedger(contact.id)
        .then(setLedger)
        .catch(() => setLedger(null));
    }
  }, [contact?.id]);

  const websiteValue = contact?.website?.trim() || "";
  const websiteHref = websiteValue
    ? /^https?:\/\//i.test(websiteValue)
      ? websiteValue
      : `https://${websiteValue}`
    : "";
  const isLongWebsite = websiteValue.length > 48;

  return (
    <Dialog open={!!contact} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contact Details</DialogTitle>
        </DialogHeader>

        {contact && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  First Name
                </Label>
                <p className="text-lg font-semibold">{contact.firstName}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Last Name
                </Label>
                <p className="text-lg font-semibold">{contact.lastName}</p>
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-500">
                  Email addresses
                </Label>
                <div className="mt-1 space-y-1">
                  {(() => {
                    const ev = (contact.emails || []).filter((e) =>
                      e.value.trim(),
                    );
                    const list =
                      ev.length > 0
                        ? ev
                        : contact.email?.trim()
                          ? [
                              {
                                value: contact.email.trim(),
                                label: "personal" as const,
                              },
                            ]
                          : [];
                    if (list.length === 0) {
                      return (
                        <p className="text-muted-foreground">Not specified</p>
                      );
                    }
                    return list.map((e, i) => (
                      <p key={i}>
                        {e.value}{" "}
                        <span className="text-muted-foreground text-sm">
                          ({e.label})
                        </span>
                      </p>
                    ));
                  })()}
                </div>
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-500">
                  Phone numbers
                </Label>
                <div className="mt-1 space-y-1">
                  {(() => {
                    const pv = (contact.phones || []).filter((p) =>
                      p.value.trim(),
                    );
                    const list =
                      pv.length > 0
                        ? pv
                        : [
                            ...(contact.phone
                              ? [
                                  {
                                    value: contact.phone,
                                    label: "work" as const,
                                  },
                                ]
                              : []),
                            ...(contact.mobile
                              ? [
                                  {
                                    value: contact.mobile,
                                    label: "personal" as const,
                                  },
                                ]
                              : []),
                          ];
                    if (list.length === 0) {
                      return (
                        <p className="text-muted-foreground">Not specified</p>
                      );
                    }
                    return list.map((p, i) => (
                      <p key={i}>
                        {p.value}{" "}
                        <span className="text-muted-foreground text-sm">
                          ({p.label})
                        </span>
                      </p>
                    ));
                  })()}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Job Title
                </Label>
                <p>{contact.jobTitle || "Not specified"}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Department
                </Label>
                <p>{contact.department || "Not specified"}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Website
                </Label>
                {websiteValue ? (
                  <div className="mt-1 space-y-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        isLongWebsite && setShowFullWebsite((prev) => !prev)
                      }
                      className={`block text-left text-blue-600 hover:underline ${
                        !showFullWebsite
                          ? "max-w-[320px] truncate"
                          : "break-all"
                      }`}
                      title={websiteValue}
                    >
                      {websiteValue}
                    </button>
                    <div className="flex items-center gap-3 text-sm">
                      {isLongWebsite && (
                        <button
                          type="button"
                          onClick={() => setShowFullWebsite((prev) => !prev)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {showFullWebsite ? "Show less" : "Show full"}
                        </button>
                      )}
                      <a
                        href={websiteHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        Open link
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <p>Not specified</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Company
                </Label>
                <p>
                  {contact.companyId
                    ? companies.find((c) => c.id === contact.companyId)?.name ||
                      "Company ID: " + contact.companyId
                    : "Not specified"}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Contact Type
                </Label>
                <p>{contactTypeDisplayLabel(contact)}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Status
                </Label>
                <Badge variant={contact.isActive ? "default" : "secondary"}>
                  {contact.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Client Value
                </Label>
                <p>
                  {contact.clientValue != null
                    ? formatCurrency(contact.clientValue)
                    : "—"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Deal Closed Value
                </Label>
                <p>
                  {contact.dealClosedValue != null
                    ? formatCurrency(contact.dealClosedValue)
                    : "—"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Remaining Payable
                </Label>
                <p>
                  {contact.remainingPayable != null
                    ? formatCurrency(contact.remainingPayable)
                    : "—"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Lifetime Value
                </Label>
                <p className="font-semibold">
                  {contact.lifetimeValue != null
                    ? formatCurrency(contact.lifetimeValue)
                    : "—"}
                </p>
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-500">
                  Notes
                </Label>
                <p>{contact.notes || "No notes"}</p>
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-500">
                  Description
                </Label>
                <p className="whitespace-pre-wrap">
                  {contact.description?.trim() ? contact.description : "—"}
                </p>
              </div>

              {ledger && ledger.entries.length > 0 && (
                <div className="md:col-span-2 border-t pt-4">
                  <p className="text-sm font-semibold mb-2">Payment Ledger</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Paid {formatCurrency(ledger.totalPaid)} · Pending{" "}
                    {formatCurrency(ledger.totalPending)}
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {ledger.entries.map((e) => (
                      <div
                        key={e.id}
                        className="flex justify-between text-sm border rounded px-3 py-2"
                      >
                        <span>{e.description || e.entryType}</span>
                        <span
                          className={
                            e.revenueType === "realized"
                              ? "text-green-600"
                              : "text-amber-600"
                          }
                        >
                          {formatCurrency(e.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="md:col-span-2 border-t pt-4">
                <p className="text-sm font-semibold mb-2">Additional</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Initials</span>
                    <p>{contact.initials?.trim() || "—"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Full name</span>
                    <p>{contact.fullName?.trim() || "—"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Birthday</span>
                    <p>
                      {contact.birthday
                        ? CRMService.formatDate(contact.birthday)
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Business tax ID</span>
                    <p>{contact.businessTaxId?.trim() || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 border-t pt-4">
                <p className="text-sm font-semibold mb-2">Addresses</p>
                {nonEmptyAddressRows(contact.addresses).length === 0 ? (
                  <p className="text-sm text-muted-foreground">—</p>
                ) : (
                  <div className="space-y-3">
                    {nonEmptyAddressRows(contact.addresses).map((a, idx) => (
                      <div
                        key={idx}
                        className="rounded-md border p-3 text-sm space-y-1"
                      >
                        {a.label?.trim() && (
                          <p className="font-medium">{a.label}</p>
                        )}
                        {[a.line1, a.line2]
                          .filter((x) => x?.trim())
                          .map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        <p className="text-muted-foreground">
                          {[a.city, a.state, a.postalCode, a.country]
                            .filter((x) => x?.trim())
                            .join(", ")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 border-t pt-4">
                <p className="text-sm font-semibold mb-2">Contact details</p>
                {(() => {
                  const s = mergeSocialFromApi(contact.socialLinks);
                  const rows = CONTACT_SOCIAL_LABELS.filter(([k]) =>
                    (s[k] || "").trim(),
                  );
                  if (rows.length === 0) {
                    return <p className="text-sm text-muted-foreground">—</p>;
                  }
                  return (
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {rows.map(([k, label]) => (
                        <div key={k}>
                          <dt className="text-gray-500">{label}</dt>
                          <dd className="break-all">{s[k]}</dd>
                        </div>
                      ))}
                    </dl>
                  );
                })()}
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-500">
                  Attachments
                </Label>
                {(contact.attachments || []).length > 0 ? (
                  <ul className="mt-1 border rounded-md divide-y text-sm">
                    {(contact.attachments || []).map((att, idx) => (
                      <li
                        key={`${att.url}-${idx}`}
                        className="flex items-center justify-between gap-2 px-3 py-2"
                      >
                        <span className="truncate">
                          {att.original_filename || "File"}
                        </span>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary inline-flex items-center shrink-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>None</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-500">
                  Tags
                </Label>
                <div className="flex flex-wrap gap-2">
                  {contact.tags && contact.tags.length > 0 ? (
                    contact.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <p>No tags</p>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-500">
                  Created
                </Label>
                <p>{CRMService.formatDate(contact.createdAt)}</p>
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-500">
                  Last Updated
                </Label>
                <p>{CRMService.formatDate(contact.updatedAt)}</p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
              {onEdit && (
                <Button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(contact);
                  }}
                >
                  Edit Contact
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
