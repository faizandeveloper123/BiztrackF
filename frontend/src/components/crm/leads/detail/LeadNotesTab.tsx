"use client";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Clock, Trash2 } from "lucide-react";
import { CALL_RESULTS, LeadNoteItem } from "@/src/models/crm";
import CRMService from "@/src/services/CRMService";

type Props = {
  leadId: string;
  notes: LeadNoteItem[];
  noteType: "note" | "call";
  setNoteType: (v: "note" | "call") => void;
  noteContent: string;
  setNoteContent: (v: string) => void;
  callResult: string;
  setCallResult: (v: string) => void;
  noteAt: string;
  setNoteAt: (v: string) => void;
  hideSystem: boolean;
  setHideSystem: React.Dispatch<React.SetStateAction<boolean>>;
  loadTabData: () => Promise<void>;
  reload: () => Promise<void>;
};

export function LeadNotesTab({
  leadId,
  notes,
  noteType,
  setNoteType,
  noteContent,
  setNoteContent,
  callResult,
  setCallResult,
  noteAt,
  setNoteAt,
  hideSystem,
  setHideSystem,
  loadTabData,
  reload,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 items-center">
        <label className="flex items-center gap-1 text-xs">
          <input
            type="radio"
            checked={noteType === "note"}
            onChange={() => setNoteType("note")}
          />{" "}
          Note
        </label>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="radio"
            checked={noteType === "call"}
            onChange={() => setNoteType("call")}
          />{" "}
          Call
        </label>
        <Input
          type="datetime-local"
          className="w-auto h-8 text-xs"
          value={noteAt}
          onChange={(e) => setNoteAt(e.target.value)}
        />
        {noteType === "call" && (
          <Select value={callResult} onValueChange={setCallResult}>
            <SelectTrigger className="w-full sm:w-[200px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CALL_RESULTS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <Textarea
        placeholder="Content..."
        value={noteContent}
        onChange={(e) => setNoteContent(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setNoteContent("")}
        >
          Clear
        </Button>
        <Button
          size="sm"
          onClick={async () => {
            await CRMService.createLeadNote(leadId, {
              commType: noteType,
              callResult: noteType === "call" ? callResult : undefined,
              content: noteContent,
              occurredAt: new Date(noteAt).toISOString(),
            });
            setNoteContent("");
            loadTabData();
            reload();
          }}
        >
          Save
        </Button>
      </div>
      <div className="space-y-3 border-t pt-3">
        {notes.map((n) => (
          <div key={n.id} className="flex gap-3 border-b pb-3">
            <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p>{n.content || "—"}</p>
              {n.callResult && (
                <p className="mt-1">
                  <span className="text-primary font-medium">CALL RESULT:</span>{" "}
                  {n.callResult}
                </p>
              )}
              <div className="flex justify-between mt-1 text-muted-foreground">
                <span>
                  CREATED BY {n.createdByName || "—"}
                  {n.isSystem ? " (system)" : ""}
                </span>
                <span>
                  {n.occurredAt ? new Date(n.occurredAt).toLocaleString() : ""}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                CRMService.deleteLeadNote(leadId, n.id).then(() => {
                  loadTabData();
                  reload();
                })
              }
            >
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        ))}
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setHideSystem((v) => !v)}
          >
            {hideSystem ? "Show system notes" : "Hide system notes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
