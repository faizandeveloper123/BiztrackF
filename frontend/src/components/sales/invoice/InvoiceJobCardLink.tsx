"use client";

import React, { useEffect, useState } from "react";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Plus } from "lucide-react";
import { apiService } from "../../../services/ApiService";
import JobCardDialog from "../../workshop/JobCardDialog";

type JobCardOption = {
  id: string;
  job_card_number: string;
  title: string;
};

type InvoiceJobCardLinkProps = {
  value?: string;
  onChange: (jobCardId: string | undefined) => void;
  dense?: boolean;
};

export function InvoiceJobCardLink({
  value,
  onChange,
  dense = false,
}: InvoiceJobCardLinkProps) {
  const [jobCards, setJobCards] = useState<JobCardOption[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const loadJobCards = () => {
    apiService
      .get("/job-cards?limit=500")
      .then((data: any) => {
        const list = Array.isArray(data) ? data : [];
        setJobCards(
          list.map((jc: any) => ({
            id: jc.id,
            job_card_number: jc.job_card_number,
            title: jc.title,
          })),
        );
      })
      .catch(() => setJobCards([]));
  };

  useEffect(() => {
    loadJobCards();
  }, []);

  const triggerCls = dense ? "h-8 text-sm shadow-none" : undefined;

  return (
    <div
      className={
        dense
          ? "space-y-2 rounded-lg border border-border bg-card px-3 py-2"
          : "space-y-3 rounded-lg border p-4"
      }
    >
      <p className={dense ? "text-sm font-semibold" : "text-sm font-medium"}>
        Job card
      </p>
      <div className="flex items-end gap-2">
        <div
          className={
            dense ? "min-w-0 flex-1 space-y-1" : "min-w-0 flex-1 space-y-2"
          }
        >
          {dense ? (
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Job card
            </span>
          ) : (
            <Label>Job card</Label>
          )}
          <Select
            value={value || "none"}
            onValueChange={(v) => onChange(v === "none" ? undefined : v)}
          >
            <SelectTrigger className={triggerCls}>
              <SelectValue placeholder="Select job card" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {jobCards.map((jc) => (
                <SelectItem key={jc.id} value={jc.id}>
                  {jc.job_card_number} – {jc.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          size={dense ? "sm" : "default"}
          className={dense ? "h-8 shrink-0" : "shrink-0"}
          onClick={() => setShowCreate(true)}
        >
          <Plus className="mr-1 h-4 w-4" />
          New
        </Button>
      </div>

      <JobCardDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        mode="create"
        onSuccess={(created) => {
          setShowCreate(false);
          loadJobCards();
          if (created?.id) {
            onChange(created.id);
          }
        }}
      />
    </div>
  );
}
