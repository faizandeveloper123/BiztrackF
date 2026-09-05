"use client";

import React from "react";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

export type ContactLabel = "work" | "personal" | "other";

export interface LabeledEmailItem {
  value: string;
  label: ContactLabel;
}

export interface LabeledPhoneItem {
  value: string;
  label: ContactLabel;
}

function normalizeEmailLabel(l: string | undefined): ContactLabel {
  const x = (l || "personal").toLowerCase();
  if (x === "work" || x === "personal" || x === "other") return x;
  return "personal";
}

function normalizePhoneLabel(l: string | undefined): ContactLabel {
  const x = (l || "work").toLowerCase();
  if (x === "work" || x === "personal" || x === "other") return x;
  return "work";
}

export function defaultEmailRowsFromEntity(entity: {
  email?: string | null;
  emails?: LabeledEmailItem[];
}): LabeledEmailItem[] {
  if (entity.emails && entity.emails.length > 0) {
    return entity.emails.map((e) => ({
      value: e.value,
      label: normalizeEmailLabel(e.label),
    }));
  }
  if (entity.email?.trim()) {
    return [{ value: entity.email.trim(), label: "personal" }];
  }
  return [{ value: "", label: "personal" }];
}

export function defaultPhoneRowsFromEntity(entity: {
  phone?: string | null;
  mobile?: string | null;
  phones?: LabeledPhoneItem[];
}): LabeledPhoneItem[] {
  if (entity.phones && entity.phones.length > 0) {
    return entity.phones.map((p) => ({
      value: p.value,
      label: normalizePhoneLabel(p.label),
    }));
  }
  const out: LabeledPhoneItem[] = [];
  if (entity.phone?.trim()) {
    out.push({ value: entity.phone.trim(), label: "work" });
  }
  if (entity.mobile?.trim()) {
    out.push({ value: entity.mobile.trim(), label: "personal" });
  }
  if (out.length === 0) {
    out.push({ value: "", label: "work" });
  }
  return out;
}

type Props = {
  emails: LabeledEmailItem[];
  phones: LabeledPhoneItem[];
  onEmailsChange: (next: LabeledEmailItem[]) => void;
  onPhonesChange: (next: LabeledPhoneItem[]) => void;
};

const LABEL_OPTIONS: { value: ContactLabel; label: string }[] = [
  { value: "work", label: "Work" },
  { value: "personal", label: "Personal" },
  { value: "other", label: "Other" },
];

export function LabeledContactFields({
  emails,
  phones,
  onEmailsChange,
  onPhonesChange,
}: Props) {
  return (
    <div className="col-span-2 space-y-6">
      <div className="space-y-2">
        <Label>Email addresses</Label>
        <div className="space-y-2">
          {emails.map((row, idx) => (
            <div key={`email-${idx}`} className="flex flex-wrap gap-2 items-center">
              <Input
                type="email"
                className="flex-1 min-w-[140px] basis-40"
                value={row.value}
                onChange={(e) => {
                  const v = e.target.value;
                  onEmailsChange(
                    emails.map((r, i) => (i === idx ? { ...r, value: v } : r)),
                  );
                }}
                placeholder="Email"
              />
              <Select
                value={row.label}
                onValueChange={(value) => {
                  onEmailsChange(
                    emails.map((r, i) =>
                      i === idx ? { ...r, label: value as ContactLabel } : r,
                    ),
                  );
                }}
              >
                <SelectTrigger className="w-[130px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LABEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                disabled={emails.length <= 1}
                onClick={() =>
                  onEmailsChange(emails.filter((_, i) => i !== idx))
                }
                aria-label="Remove email"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onEmailsChange([...emails, { value: "", label: "personal" }])
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            Add email
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Phone numbers</Label>
        <div className="space-y-2">
          {phones.map((row, idx) => (
            <div key={`phone-${idx}`} className="flex flex-wrap gap-2 items-center">
              <Input
                className="flex-1 min-w-[140px] basis-40"
                value={row.value}
                onChange={(e) => {
                  const v = e.target.value;
                  onPhonesChange(
                    phones.map((r, i) => (i === idx ? { ...r, value: v } : r)),
                  );
                }}
                placeholder="Phone number"
              />
              <Select
                value={row.label}
                onValueChange={(value) => {
                  onPhonesChange(
                    phones.map((r, i) =>
                      i === idx ? { ...r, label: value as ContactLabel } : r,
                    ),
                  );
                }}
              >
                <SelectTrigger className="w-[130px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LABEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                disabled={phones.length <= 1}
                onClick={() =>
                  onPhonesChange(phones.filter((_, i) => i !== idx))
                }
                aria-label="Remove phone"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onPhonesChange([...phones, { value: "", label: "work" }])
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            Add phone
          </Button>
        </div>
      </div>
    </div>
  );
}
