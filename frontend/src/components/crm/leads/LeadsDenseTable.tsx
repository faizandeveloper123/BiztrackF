"use client";

import { useRouter } from "next/navigation";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Flag,
  CheckSquare,
  Phone,
  Mail,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { Lead, PIPELINE_LABELS } from "@/src/models/crm";
import CRMService from "@/src/services/CRMService";
import {
  pipelineClass,
  relTime,
  ageLabel,
  money,
  safePipelineValue,
  safeAssigneeValue,
  type LeadUserOption,
} from "@/src/components/crm/leads/leadUtils";

const PIPELINE_OPTIONS = Object.entries(PIPELINE_LABELS).filter(([v]) =>
  Boolean(v),
);

type Props = {
  leads: Lead[];
  totalCount: number;
  page: number;
  totalPages: number;
  pageSize: number;
  listLoading?: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[]) => void;
  onPageChange: (page: number) => void;
  onPipelineChange: (id: string, stage: string) => void;
  onAssigneeChange: (id: string, userId: string) => void;
  onDelete?: (id: string) => void;
  users: LeadUserOption[];
};

export function LeadsDenseTable({
  leads,
  totalCount,
  page,
  totalPages,
  pageSize,
  listLoading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onPageChange,
  onPipelineChange,
  onAssigneeChange,
  onDelete,
  users,
}: Props) {
  const router = useRouter();
  const rows = Array.isArray(leads) ? leads.filter((l) => l?.id) : [];
  const userIds = users.map((u) => u.id);
  const allSelected =
    rows.length > 0 && rows.every((l) => selectedIds.has(l.id));

  return (
    <div className="relative flex-1 overflow-auto bg-white border rounded-lg">
      {listLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      )}
      <table className="w-full text-left text-sm border-collapse min-w-[560px] lg:min-w-[1200px]">
        <thead className="bg-muted/50 text-xs uppercase tracking-wider sticky top-0 z-10 border-b">
          <tr>
            <th className="p-3 w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={() => onToggleSelectAll(rows.map((l) => l.id))}
              />
            </th>
            <th className="p-3 font-medium">Info</th>
            <th className="p-3 font-medium">Pipeline / Status / Type</th>
            <th className="hidden lg:table-cell p-3 font-medium">Reg / Source</th>
            <th className="hidden lg:table-cell p-3 font-medium">Price / City</th>
            <th className="hidden lg:table-cell p-3 font-medium">Timeline</th>
            <th className="hidden lg:table-cell p-3 font-medium">Activity</th>
            <th className="hidden lg:table-cell p-3 font-medium">Last Contact</th>
            <th className="hidden lg:table-cell p-3 font-medium">Tasks</th>
            <th className="hidden lg:table-cell p-3 font-medium">Assigned</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={10}
                className="p-8 text-center text-muted-foreground"
              >
                No leads found
              </td>
            </tr>
          ) : (
            rows.map((lead) => {
              const pipelineValue = safePipelineValue(lead.pipelineStage);
              const assigneeValue = safeAssigneeValue(
                lead.assignedTo,
                lead.mainAgentId,
                userIds,
              );
              const createdLabel = lead.createdAt
                ? CRMService.formatDateTime(lead.createdAt)
                : "—";
              return (
                <tr
                  key={lead.id}
                  className="hover:bg-muted/30 cursor-pointer"
                  onClick={() => router.push(`/crm/leads/${lead.id}`)}
                >
                  <td
                    className="p-3 align-top"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Checkbox
                        checked={selectedIds.has(lead.id)}
                        onCheckedChange={() => onToggleSelect(lead.id)}
                      />
                      {onDelete && (
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => onDelete(lead.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-3 align-top min-w-[150px] lg:min-w-[180px]">
                    <div className="font-medium">
                      {lead.firstName} {lead.lastName}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Phone className="h-3 w-3" /> {lead.phone || "—"}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" /> {lead.email}
                    </div>
                    {lead.leadRating && (
                      <Badge
                        variant="outline"
                        className="mt-1 text-[10px] capitalize"
                      >
                        {lead.leadRating}
                      </Badge>
                    )}
                  </td>
                  <td
                    className="p-3 align-top min-w-[140px] lg:min-w-[160px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Select
                      value={pipelineValue}
                      onValueChange={(v) => onPipelineChange(lead.id, v)}
                    >
                      <SelectTrigger
                        className={`h-8 text-xs border-0 ${pipelineClass(pipelineValue)}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PIPELINE_OPTIONS.map(([v, label]) => (
                          <SelectItem key={v} value={v}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="mt-2 text-xs">
                      Status:{" "}
                      <span className="rounded-full bg-muted px-2 py-0.5 capitalize">
                        {lead.status || "open"}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {lead.leadType || "Lead Type"}
                    </div>
                  </td>
                  <td className="hidden lg:table-cell p-3 align-top text-xs min-w-[130px]">
                    <div className="font-medium">{createdLabel}</div>
                    {lead.campaignSource && (
                      <div className="text-muted-foreground mt-1 truncate max-w-[120px]">
                        {lead.campaignSource}
                      </div>
                    )}
                    {lead.refSource && (
                      <div className="text-muted-foreground">
                        {lead.refSource}
                      </div>
                    )}
                    {lead.city && (
                      <div className="text-muted-foreground">{lead.city}</div>
                    )}
                  </td>
                  <td className="hidden lg:table-cell p-3 align-top text-xs min-w-[110px]">
                    <div>Min: {money(lead.priceMin)}</div>
                    <div>Max: {money(lead.priceMax)}</div>
                    <div className="mt-2 text-muted-foreground">
                      Buy: {lead.buyIntent || "N/A"}
                    </div>
                    <div className="text-muted-foreground">
                      Sell: {lead.sellIntent || "N/A"}
                    </div>
                  </td>
                  <td className="hidden lg:table-cell p-3 align-top text-xs min-w-[90px]">
                    <div className="font-medium">
                      {ageLabel(lead.createdAt)}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                      <Phone className="h-3 w-3" /> {lead.callCount || 0}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Mail className="h-3 w-3" /> {lead.emailCount || 0}
                    </div>
                  </td>
                  <td className="hidden lg:table-cell p-3 align-top text-xs min-w-[80px]">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="h-3 w-3" /> {lead.callCount || 0}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Mail className="h-3 w-3" /> {lead.emailCount || 0}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MessageSquare className="h-3 w-3" /> {lead.smsCount || 0}
                    </div>
                  </td>
                  <td className="hidden lg:table-cell p-3 align-top text-xs min-w-[120px]">
                    <div className="font-medium">
                      {relTime(lead.lastContactAt || lead.lastContactDate)}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                      <Phone className="h-3 w-3" /> ({lead.callCount || 0}){" "}
                      {relTime(lead.lastCallAt)}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Mail className="h-3 w-3" /> ({lead.emailCount || 0}){" "}
                      {relTime(lead.lastEmailAt)}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MessageSquare className="h-3 w-3" /> (
                      {lead.smsCount || 0}) {relTime(lead.lastSmsAt)}
                    </div>
                  </td>
                  <td className="hidden lg:table-cell p-3 align-top text-center">
                    <Flag
                      className={`h-4 w-4 mx-auto mb-1 ${
                        lead.hasFlaggedTask
                          ? "text-red-500"
                          : "text-muted-foreground/40"
                      }`}
                    />
                    <CheckSquare
                      className={`h-4 w-4 mx-auto ${
                        lead.hasOpenTask
                          ? "text-emerald-500"
                          : "text-muted-foreground/40"
                      }`}
                    />
                  </td>
                  <td
                    className="hidden lg:table-cell p-3 align-top text-xs min-w-[140px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Select
                      value={assigneeValue}
                      onValueChange={(v) =>
                        onAssigneeChange(lead.id, v === "__none__" ? "" : v)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Unassigned</SelectItem>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs text-muted-foreground">
        <span>
          Showing {(page - 1) * pageSize + 1}-
          {Math.min(page * pageSize, totalCount)} of {totalCount}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </Button>
          <span className="rounded-full bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center">
            {page}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
