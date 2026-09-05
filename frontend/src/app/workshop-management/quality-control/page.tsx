"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ModuleGuard } from "../../../components/guards/PermissionGuard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { Progress } from "../../../components/ui/progress";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../../../components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Clock,
  Loader2,
  RefreshCw,
  CheckSquare,
  Play,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Target,
  Search,
  ClipboardList,
  ClipboardCheck,
  Bug,
  FileText,
  User,
  ShieldCheck,
  CheckCheck,
  AlertTriangle,
  ListChecks,
  PlusCircle,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  QualityCheckResponse as QualityCheck,
  QualityInspectionResponse as QualityInspection,
  QualityDefectResponse as QualityDefect,
  QualityReportResponse as QualityReport,
  QualityStatus,
  QualityPriority,
  QualityStandard,
  InspectionType,
  DefectSeverity,
  getQualityStatusColor,
  getQualityPriorityColor,
} from "../../../models/qualityControl";
import QualityControlService from "../../../services/QualityControlService";
import { DashboardLayout } from "../../../components/layout";
import { useCrudPermissions } from "../../../hooks/usePermissions";
import { cn, formatDate } from "../../../lib/utils";
import { apiService } from "../../../services/ApiService";
import { SessionManager } from "../../../services/SessionManager";

// ===================== Types & helpers =====================

interface TeamUser {
  id?: string;
  userId?: string;
  userName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

type CheckDialogMode = "create" | "edit" | "view";

const statusLabels: Record<QualityStatus, string> = {
  [QualityStatus.PENDING]: "Pending",
  [QualityStatus.IN_PROGRESS]: "In Progress",
  [QualityStatus.PASSED]: "Passed",
  [QualityStatus.FAILED]: "Failed",
  [QualityStatus.CONDITIONAL_PASS]: "Conditional Pass",
  [QualityStatus.REQUIRES_REVIEW]: "Requires Review",
};

const defectStatusMeta: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-red-100 text-red-800" },
  in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-800" },
  resolved: { label: "Resolved", className: "bg-green-100 text-green-800" },
  closed: { label: "Closed", className: "bg-gray-100 text-gray-800" },
};

const severityMeta: Record<
  DefectSeverity,
  { label: string; className: string }
> = {
  [DefectSeverity.MINOR]: {
    label: "Minor",
    className: "bg-gray-100 text-gray-800",
  },
  [DefectSeverity.MAJOR]: {
    label: "Major",
    className: "bg-yellow-100 text-yellow-800",
  },
  [DefectSeverity.CRITICAL]: {
    label: "Critical",
    className: "bg-orange-100 text-orange-800",
  },
  [DefectSeverity.BLOCKER]: {
    label: "Blocker",
    className: "bg-red-100 text-red-800",
  },
};

function getUserKey(u: TeamUser | undefined | null): string {
  return u?.id || u?.userId || "";
}

function displayName(u: TeamUser | undefined | null): string {
  if (!u) return "Unassigned";
  if (u.firstName || u.lastName)
    return `${u.firstName || ""} ${u.lastName || ""}`.trim();
  return u.userName || u.email || "Unassigned";
}

function StatusBadge({ status }: { status: QualityStatus }) {
  return (
    <Badge className={getQualityStatusColor(status)}>
      {statusLabels[status] || status.replace("_", " ")}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: QualityPriority }) {
  return (
    <Badge className={getQualityPriorityColor(priority)}>{priority}</Badge>
  );
}

function SeverityBadge({ severity }: { severity: DefectSeverity }) {
  const meta = severityMeta[severity] || severityMeta[DefectSeverity.MINOR];
  return <Badge className={meta.className}>{meta.label}</Badge>;
}

function DefectStatusBadge({ status }: { status: string }) {
  const meta = defectStatusMeta[status] || {
    label: status.replace("_", " "),
    className: "bg-gray-100 text-gray-800",
  };
  return <Badge className={meta.className}>{meta.label}</Badge>;
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-3 rounded-full bg-muted">{icon}</div>
      <h3 className="mt-3 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 max-w-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ===================== Quality Check Dialog =====================

interface QualityCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: CheckDialogMode;
  check: QualityCheck | null;
  users: TeamUser[];
  onSuccess: () => void;
}

function QualityCheckDialog({
  open,
  onOpenChange,
  mode,
  check,
  users,
  onSuccess,
}: QualityCheckDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [inspection_type, setInspectionType] = useState<InspectionType>(
    InspectionType.VISUAL,
  );
  const [priority, setPriority] = useState<QualityPriority>(
    QualityPriority.MEDIUM,
  );
  const [quality_standard, setQualityStandard] = useState<QualityStandard>(
    QualityStandard.CUSTOM,
  );
  const [criteria, setCriteria] = useState<string[]>([""]);
  const [required_equipment, setRequiredEquipment] = useState<string[]>([""]);
  const [required_skills, setRequiredSkills] = useState<string[]>([""]);
  const [estimated_duration_minutes, setEstimatedDuration] = useState(60);
  const [scheduled_date, setScheduledDate] = useState("");
  const [assigned_to_id, setAssignedToId] = useState<string>("");
  const [tags, setTags] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);

  const isView = mode === "view";
  const readOnly = isView;

  useEffect(() => {
    if (!open) return;
    if (check && mode !== "create") {
      setTitle(check.title || "");
      setDescription(check.description || "");
      setInspectionType(check.inspection_type || InspectionType.VISUAL);
      setPriority(check.priority || QualityPriority.MEDIUM);
      setQualityStandard(check.quality_standard || QualityStandard.CUSTOM);
      setCriteria(
        check.criteria && check.criteria.length ? check.criteria : [""],
      );
      setRequiredEquipment(
        check.required_equipment && check.required_equipment.length
          ? check.required_equipment
          : [""],
      );
      setRequiredSkills(
        check.required_skills && check.required_skills.length
          ? check.required_skills
          : [""],
      );
      setEstimatedDuration(check.estimated_duration_minutes || 60);
      setScheduledDate(
        check.scheduled_date ? check.scheduled_date.split("T")[0] : "",
      );
      setAssignedToId(check.assigned_to_id || "");
      setTags(check.tags && check.tags.length ? check.tags : [""]);
    } else {
      setTitle("");
      setDescription("");
      setInspectionType(InspectionType.VISUAL);
      setPriority(QualityPriority.MEDIUM);
      setQualityStandard(QualityStandard.CUSTOM);
      setCriteria([""]);
      setRequiredEquipment([""]);
      setRequiredSkills([""]);
      setEstimatedDuration(60);
      setScheduledDate("");
      setAssignedToId("");
      setTags([""]);
    }
  }, [check, mode, open]);

  const handleListField = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    values: string[],
    index: number,
    value: string,
  ) => {
    const next = [...values];
    next[index] = value;
    setter(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isView) return;
    setLoading(true);
    try {
      const service = new QualityControlService();
      const payload = {
        title,
        description: description || undefined,
        inspection_type,
        priority,
        quality_standard,
        criteria: criteria.filter((c) => c.trim()),
        acceptance_criteria: {},
        tolerance_limits: {},
        required_equipment: required_equipment.filter((c) => c.trim()),
        required_skills: required_skills.filter((c) => c.trim()),
        estimated_duration_minutes: Number(estimated_duration_minutes) || 0,
        scheduled_date: scheduled_date
          ? new Date(scheduled_date).toISOString()
          : undefined,
        assigned_to_id: assigned_to_id || undefined,
        tags: tags.filter((c) => c.trim()),
      };
      if (mode === "create") {
        await service.createQualityCheck(payload);
        toast.success("Quality check created");
      } else if (check) {
        await service.updateQualityCheck(check.id, payload);
        toast.success("Quality check updated");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail || "Failed to save quality check",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Create Quality Check"
              : mode === "edit"
                ? "Edit Quality Check"
                : "Quality Check Details"}
          </DialogTitle>
          {mode !== "view" && (
            <DialogDescription>
              Define what needs to be inspected and how to run it.
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {check && mode === "view" && (
            <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/40 p-4 text-sm sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground">Status</span>
                <div className="mt-1">
                  <StatusBadge status={check.status} />
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Completion</span>
                <p className="mt-1 font-medium flex items-center gap-2">
                  {check.completion_percentage}%
                </p>
                <Progress
                  value={check.completion_percentage}
                  className="mt-1"
                />
              </div>
              <div>
                <span className="text-muted-foreground">Inspections</span>
                <p className="mt-1 font-medium">
                  {check.passed_inspections}/{check.total_inspections} passed
                  {check.failed_inspections > 0
                    ? ` · ${check.failed_inspections} failed`
                    : ""}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Created</span>
                <p className="mt-1">{formatDate(check.created_at)}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Final quality check before handover"
                required={!readOnly}
                readOnly={readOnly}
                className={cn(readOnly && "bg-muted")}
              />
            </div>
            <div>
              <Label>Inspection Type</Label>
              <Select
                value={inspection_type}
                onValueChange={(v) => setInspectionType(v as InspectionType)}
                disabled={readOnly}
              >
                <SelectTrigger className={cn(readOnly && "bg-muted")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={InspectionType.VISUAL}>
                    Visual Inspection
                  </SelectItem>
                  <SelectItem value={InspectionType.DIMENSIONAL}>
                    Dimensional Check
                  </SelectItem>
                  <SelectItem value={InspectionType.FUNCTIONAL}>
                    Functional Test
                  </SelectItem>
                  <SelectItem value={InspectionType.MATERIAL}>
                    Material Test
                  </SelectItem>
                  <SelectItem value={InspectionType.SAFETY}>
                    Safety Check
                  </SelectItem>
                  <SelectItem value={InspectionType.ENVIRONMENTAL}>
                    Environmental Test
                  </SelectItem>
                  <SelectItem value={InspectionType.DOCUMENTATION}>
                    Documentation Review
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quality Standard</Label>
              <Select
                value={quality_standard}
                onValueChange={(v) => setQualityStandard(v as QualityStandard)}
                disabled={readOnly}
              >
                <SelectTrigger className={cn(readOnly && "bg-muted")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={QualityStandard.ISO_9001}>
                    ISO 9001
                  </SelectItem>
                  <SelectItem value={QualityStandard.ISO_14001}>
                    ISO 14001
                  </SelectItem>
                  <SelectItem value={QualityStandard.ISO_45001}>
                    ISO 45001
                  </SelectItem>
                  <SelectItem value={QualityStandard.FDA}>FDA</SelectItem>
                  <SelectItem value={QualityStandard.CE}>CE</SelectItem>
                  <SelectItem value={QualityStandard.CUSTOM}>Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as QualityPriority)}
                disabled={readOnly}
              >
                <SelectTrigger className={cn(readOnly && "bg-muted")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={QualityPriority.LOW}>Low</SelectItem>
                  <SelectItem value={QualityPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={QualityPriority.HIGH}>High</SelectItem>
                  <SelectItem value={QualityPriority.CRITICAL}>
                    Critical
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assign To</Label>
              <Select
                value={assigned_to_id}
                onValueChange={setAssignedToId}
                disabled={readOnly}
              >
                <SelectTrigger className={cn(readOnly && "bg-muted")}>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={getUserKey(u)} value={getUserKey(u)}>
                      {displayName(u)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this check about?"
                rows={3}
                readOnly={readOnly}
                className={cn(readOnly && "bg-muted resize-none")}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="flex items-center gap-1.5">
                <ListChecks className="h-4 w-4" /> Inspection Criteria
              </Label>
              {!readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCriteria([...criteria, ""])}
                >
                  <PlusCircle className="h-4 w-4 mr-1" /> Add criterion
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {criteria.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-6">
                    {i + 1}.
                  </span>
                  <Input
                    value={c}
                    onChange={(e) =>
                      handleListField(setCriteria, criteria, i, e.target.value)
                    }
                    placeholder={`Criterion ${i + 1}`}
                    readOnly={readOnly}
                    className={cn(readOnly && "bg-muted")}
                  />
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setCriteria(criteria.filter((_, idx) => idx !== i))
                      }
                      disabled={criteria.length === 1}
                    >
                      <XCircle className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Estimated Duration (min)</Label>
              <Input
                type="number"
                value={estimated_duration_minutes}
                onChange={(e) =>
                  setEstimatedDuration(parseInt(e.target.value) || 0)
                }
                min={1}
                readOnly={readOnly}
                className={cn(readOnly && "bg-muted")}
              />
            </div>
            <div>
              <Label>Scheduled Date</Label>
              <Input
                type="date"
                value={scheduled_date}
                onChange={(e) => setScheduledDate(e.target.value)}
                readOnly={readOnly}
                className={cn(readOnly && "bg-muted")}
              />
            </div>
          </div>

          <div>
            <Label>Required Equipment</Label>
            <div className="space-y-2 mt-2">
              {required_equipment.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={c}
                    onChange={(e) =>
                      handleListField(
                        setRequiredEquipment,
                        required_equipment,
                        i,
                        e.target.value,
                      )
                    }
                    placeholder={`Equipment ${i + 1}`}
                    readOnly={readOnly}
                    className={cn(readOnly && "bg-muted")}
                  />
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setRequiredEquipment(
                          required_equipment.filter((_, idx) => idx !== i),
                        )
                      }
                      disabled={required_equipment.length === 1}
                    >
                      <XCircle className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
              {!readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setRequiredEquipment([...required_equipment, ""])
                  }
                >
                  <PlusCircle className="h-4 w-4 mr-1" /> Add equipment
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {isView ? "Close" : "Cancel"}
            </Button>
            {!isView && (
              <Button type="submit" disabled={loading}>
                {loading
                  ? "Saving..."
                  : mode === "create"
                    ? "Create Check"
                    : "Save Changes"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===================== Inspection Dialog =====================

interface InspectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  check: QualityCheck | null;
  checks: QualityCheck[];
  users: TeamUser[];
  currentUser: TeamUser | null;
  onSuccess: () => void;
}

function InspectionDialog({
  open,
  onOpenChange,
  check,
  checks,
  users,
  currentUser,
  onSuccess,
}: InspectionDialogProps) {
  const [quality_check_id, setQualityCheckId] = useState("");
  const [inspector_id, setInspectorId] = useState("");
  const [inspection_date, setInspectionDate] = useState("");
  const [results, setResults] = useState<Record<string, "pass" | "fail">>({});
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedCheck = checks.find((c) => c.id === quality_check_id) || null;
  const criteria = (selectedCheck?.criteria || []).filter((c) => c && c.trim());

  const passCount = criteria.filter((c) => results[c] === "pass").length;
  const failCount = criteria.filter((c) => results[c] === "fail").length;
  const compliance =
    criteria.length > 0 ? Math.round((passCount / criteria.length) * 100) : 100;
  const computedStatus: QualityStatus =
    criteria.length === 0
      ? QualityStatus.PASSED
      : failCount === 0
        ? QualityStatus.PASSED
        : passCount === 0
          ? QualityStatus.FAILED
          : QualityStatus.CONDITIONAL_PASS;

  useEffect(() => {
    if (!open) return;
    setQualityCheckId(check?.id || "");
    setInspectorId(getUserKey(currentUser));
    setInspectionDate(new Date().toISOString().split("T")[0]);
    setResults({});
    setNotes("");
  }, [open, check, currentUser]);

  useEffect(() => {
    if (!quality_check_id) return;
    setResults({});
  }, [quality_check_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quality_check_id) {
      toast.error("Please select a quality check");
      return;
    }
    if (!inspector_id) {
      toast.error("Please select an inspector");
      return;
    }
    setLoading(true);
    try {
      const service = new QualityControlService();
      await service.createQualityInspection({
        quality_check_id,
        inspector_id,
        inspection_date: new Date(
          inspection_date || new Date().toISOString().split("T")[0],
        ).toISOString(),
        status: computedStatus,
        results: results as Record<string, any>,
        measurements: {},
        defects_found: [],
        corrective_actions: [],
        notes: notes || undefined,
        photos: [],
        documents: [],
        compliance_score: compliance,
      });
      toast.success(
        `Inspection recorded · ${passCount}/${criteria.length || 0} criteria passed`,
      );
      onSuccess();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail || "Failed to record inspection",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Inspection</DialogTitle>
          <DialogDescription>
            Run through each criterion and mark whether it passes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Quality Check *</Label>
              <Select
                value={quality_check_id}
                onValueChange={setQualityCheckId}
                disabled={!!check}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a quality check" />
                </SelectTrigger>
                <SelectContent>
                  {checks.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Inspector</Label>
              <Select value={inspector_id} onValueChange={setInspectorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select inspector" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={getUserKey(u)} value={getUserKey(u)}>
                      {displayName(u)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Inspection Date</Label>
              <Input
                type="date"
                value={inspection_date}
                onChange={(e) => setInspectionDate(e.target.value)}
              />
            </div>
          </div>

          {selectedCheck ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Criteria Results</Label>
                <span className="text-xs text-muted-foreground">
                  {passCount} pass · {failCount} fail
                </span>
              </div>
              {criteria.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 rounded-lg border bg-muted/40">
                  This check has no criteria defined. It will be recorded as
                  passed.
                </p>
              ) : (
                <div className="space-y-2">
                  {criteria.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border"
                    >
                      <div className="flex items-start gap-2 flex-1">
                        <span className="text-sm text-muted-foreground">
                          {i + 1}.
                        </span>
                        <span className="text-sm font-medium">{c}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            results[c] === "pass" ? "default" : "outline"
                          }
                          className={cn(
                            results[c] === "pass" &&
                              "bg-green-600 hover:bg-green-600",
                          )}
                          onClick={() =>
                            setResults({ ...results, [c]: "pass" })
                          }
                        >
                          <CheckCheck className="h-4 w-4 mr-1" /> Pass
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            results[c] === "fail" ? "default" : "outline"
                          }
                          className={cn(
                            results[c] === "fail" &&
                              "bg-red-600 hover:bg-red-600",
                          )}
                          onClick={() =>
                            setResults({ ...results, [c]: "fail" })
                          }
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Fail
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 p-4 rounded-lg border bg-muted/40">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Compliance Score</span>
                  <span className="font-bold">{compliance}%</span>
                </div>
                <Progress value={compliance} className="mt-2" />
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Result:</span>
                  <StatusBadge status={computedStatus} />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Select a quality check to start recording criteria.
            </div>
          )}

          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observations, remarks..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedCheck}>
              {loading ? "Saving..." : "Record Inspection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===================== Defect Dialog =====================

interface DefectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit" | "view";
  defect: QualityDefect | null;
  checks: QualityCheck[];
  currentUser: TeamUser | null;
  onSuccess: () => void;
}

function DefectDialog({
  open,
  onOpenChange,
  mode,
  defect,
  checks,
  currentUser,
  onSuccess,
}: DefectDialogProps) {
  const isView = mode === "view";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<DefectSeverity>(
    DefectSeverity.MINOR,
  );
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState<QualityPriority>(
    QualityPriority.MEDIUM,
  );
  const [quality_check_id, setQualityCheckId] = useState("");
  const [detected_date, setDetectedDate] = useState("");
  const [cost_impact, setCostImpact] = useState(0);
  const [resolution_notes, setResolutionNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (defect) {
      setTitle(defect.title || "");
      setDescription(defect.description || "");
      setSeverity(defect.severity || DefectSeverity.MINOR);
      setCategory(defect.category || "");
      setLocation(defect.location || "");
      setStatus(defect.status || "open");
      setPriority(defect.priority || QualityPriority.MEDIUM);
      setQualityCheckId(defect.quality_check_id || "");
      setDetectedDate(
        defect.detected_date
          ? defect.detected_date.split("T")[0]
          : new Date().toISOString().split("T")[0],
      );
      setCostImpact(defect.cost_impact || 0);
      setResolutionNotes(defect.resolution_notes || "");
    } else {
      setTitle("");
      setDescription("");
      setSeverity(DefectSeverity.MINOR);
      setCategory("");
      setLocation("");
      setStatus("open");
      setPriority(QualityPriority.MEDIUM);
      setQualityCheckId("");
      setDetectedDate(new Date().toISOString().split("T")[0]);
      setCostImpact(0);
      setResolutionNotes("");
    }
  }, [defect, open, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isView) return;
    setLoading(true);
    try {
      const service = new QualityControlService();
      const payload = {
        title,
        description,
        severity,
        category: category || "general",
        location: location || undefined,
        detected_date: new Date(detected_date || new Date()).toISOString(),
        detected_by_id: defect?.detected_by_id || getUserKey(currentUser),
        quality_check_id: quality_check_id || undefined,
        status,
        priority,
        assigned_to_id: defect?.assigned_to_id,
        estimated_resolution_date: defect?.estimated_resolution_date,
        actual_resolution_date:
          status === "resolved" || status === "closed"
            ? defect?.actual_resolution_date || new Date().toISOString()
            : defect?.actual_resolution_date,
        resolution_notes: resolution_notes || undefined,
        cost_impact: Number(cost_impact) || 0,
        tags: defect?.tags || [],
      };
      if (mode === "create") {
        await service.createQualityDefect(payload);
        toast.success("Defect logged");
      } else if (defect) {
        await service.updateQualityDefect(defect.id, payload);
        toast.success("Defect updated");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to save defect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Log Defect"
              : mode === "edit"
                ? "Edit Defect"
                : "Defect Details"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {defect && isView && (
            <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/40 p-4 text-sm sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground">Defect No.</span>
                <p className="font-mono text-xs break-all mt-1">
                  {defect.defect_number}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <div className="mt-1">
                  <DefectStatusBadge status={defect.status} />
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Severity</span>
                <div className="mt-1">
                  <SeverityBadge severity={defect.severity} />
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Detected</span>
                <p className="mt-1">{formatDate(defect.detected_date)}</p>
              </div>
            </div>
          )}

          <div>
            <Label>Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's wrong?"
              required={!isView}
              readOnly={isView}
              className={cn(isView && "bg-muted")}
            />
          </div>
          <div>
            <Label>Description *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the defect"
              rows={3}
              required={!isView}
              readOnly={isView}
              className={cn(isView && "bg-muted resize-none")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Severity</Label>
              <Select
                value={severity}
                onValueChange={(v) => setSeverity(v as DefectSeverity)}
                disabled={isView}
              >
                <SelectTrigger className={cn(isView && "bg-muted")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DefectSeverity.MINOR}>Minor</SelectItem>
                  <SelectItem value={DefectSeverity.MAJOR}>Major</SelectItem>
                  <SelectItem value={DefectSeverity.CRITICAL}>
                    Critical
                  </SelectItem>
                  <SelectItem value={DefectSeverity.BLOCKER}>
                    Blocker
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as QualityPriority)}
                disabled={isView}
              >
                <SelectTrigger className={cn(isView && "bg-muted")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={QualityPriority.LOW}>Low</SelectItem>
                  <SelectItem value={QualityPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={QualityPriority.HIGH}>High</SelectItem>
                  <SelectItem value={QualityPriority.CRITICAL}>
                    Critical
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Paint, Engine, Electrical"
                readOnly={isView}
                className={cn(isView && "bg-muted")}
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Front bumper"
                readOnly={isView}
                className={cn(isView && "bg-muted")}
              />
            </div>
            <div>
              <Label>Linked Check</Label>
              <Select
                value={quality_check_id}
                onValueChange={setQualityCheckId}
                disabled={isView}
              >
                <SelectTrigger className={cn(isView && "bg-muted")}>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {checks.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={setStatus}
                disabled={isView}
              >
                <SelectTrigger className={cn(isView && "bg-muted")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Detected Date</Label>
              <Input
                type="date"
                value={detected_date}
                onChange={(e) => setDetectedDate(e.target.value)}
                readOnly={isView}
                className={cn(isView && "bg-muted")}
              />
            </div>
            <div>
              <Label>Cost Impact (£)</Label>
              <Input
                type="number"
                value={cost_impact}
                onChange={(e) => setCostImpact(parseFloat(e.target.value) || 0)}
                readOnly={isView}
                className={cn(isView && "bg-muted")}
              />
            </div>
          </div>

          <div>
            <Label>Resolution Notes</Label>
            <Textarea
              value={resolution_notes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="How was this resolved?"
              rows={2}
              readOnly={isView}
              className={cn(isView && "bg-muted resize-none")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {isView ? "Close" : "Cancel"}
            </Button>
            {!isView && (
              <Button type="submit" disabled={loading}>
                {loading
                  ? "Saving..."
                  : mode === "create"
                    ? "Log Defect"
                    : "Save Changes"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===================== Report Dialog =====================

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: QualityReport | null;
  currentUser: TeamUser | null;
  onSuccess: () => void;
}

function ReportDialog({
  open,
  onOpenChange,
  report,
  currentUser,
  onSuccess,
}: ReportDialogProps) {
  const isView = !!report;
  const [title, setTitle] = useState("");
  const [report_type, setReportType] = useState("summary");
  const [period_start, setPeriodStart] = useState("");
  const [period_end, setPeriodEnd] = useState("");
  const [summary, setSummary] = useState("");
  const [key_findings, setKeyFindings] = useState<string[]>([""]);
  const [recommendations, setRecommendations] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (report) {
      setTitle(report.title || "");
      setReportType(report.report_type || "summary");
      setPeriodStart(
        report.period_start ? report.period_start.split("T")[0] : "",
      );
      setPeriodEnd(report.period_end ? report.period_end.split("T")[0] : "");
      setSummary(report.summary || "");
      setKeyFindings(
        report.key_findings && report.key_findings.length
          ? report.key_findings
          : [""],
      );
      setRecommendations(
        report.recommendations && report.recommendations.length
          ? report.recommendations
          : [""],
      );
    } else {
      setTitle("");
      setReportType("summary");
      setPeriodStart(new Date().toISOString().split("T")[0]);
      setPeriodEnd(new Date().toISOString().split("T")[0]);
      setSummary("");
      setKeyFindings([""]);
      setRecommendations([""]);
    }
  }, [report, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const service = new QualityControlService();
      await service.createQualityReport({
        title,
        report_type,
        period_start: new Date(period_start || new Date()).toISOString(),
        period_end: new Date(period_end || new Date()).toISOString(),
        summary,
        key_findings: key_findings.filter((f) => f.trim()),
        recommendations: recommendations.filter((r) => r.trim()),
        metrics: {},
        generated_by_id: getUserKey(currentUser),
        tags: [],
      });
      toast.success("Report generated");
      onSuccess();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to create report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isView ? "Report Details" : "Generate Report"}
          </DialogTitle>
        </DialogHeader>

        {isView && report ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/40 p-4 text-sm sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground">Report No.</span>
                <p className="font-mono text-xs break-all mt-1">
                  {report.report_number}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Type</span>
                <p className="mt-1 capitalize">{report.report_type}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Period</span>
                <p className="mt-1">
                  {formatDate(report.period_start)} →{" "}
                  {formatDate(report.period_end)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Generated By</span>
                <p className="mt-1">{report.generated_by_name || "—"}</p>
              </div>
            </div>
            <div>
              <Label>Title</Label>
              <p className="text-sm mt-1">{report.title}</p>
            </div>
            <div>
              <Label>Summary</Label>
              <p className="text-sm mt-1 whitespace-pre-wrap">
                {report.summary}
              </p>
            </div>
            {report.key_findings?.length > 0 && (
              <div>
                <Label>Key Findings</Label>
                <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                  {report.key_findings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.recommendations?.length > 0 && (
              <div>
                <Label>Recommendations</Label>
                <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                  {report.recommendations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Monthly quality report"
                  required
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={report_type} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary</SelectItem>
                    <SelectItem value="defect_analysis">
                      Defect Analysis
                    </SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Period</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={period_start}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                  <span className="text-muted-foreground">→</span>
                  <Input
                    type="date"
                    value={period_end}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-span-2">
                <Label>Summary *</Label>
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Overall quality summary"
                  rows={3}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Key Findings</Label>
              <div className="space-y-2 mt-2">
                {key_findings.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={f}
                      onChange={(e) => {
                        const next = [...key_findings];
                        next[i] = e.target.value;
                        setKeyFindings(next);
                      }}
                      placeholder={`Finding ${i + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setKeyFindings(
                          key_findings.filter((_, idx) => idx !== i),
                        )
                      }
                      disabled={key_findings.length === 1}
                    >
                      <XCircle className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setKeyFindings([...key_findings, ""])}
                >
                  <PlusCircle className="h-4 w-4 mr-1" /> Add finding
                </Button>
              </div>
            </div>
            <div>
              <Label>Recommendations</Label>
              <div className="space-y-2 mt-2">
                {recommendations.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={r}
                      onChange={(e) => {
                        const next = [...recommendations];
                        next[i] = e.target.value;
                        setRecommendations(next);
                      }}
                      placeholder={`Recommendation ${i + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setRecommendations(
                          recommendations.filter((_, idx) => idx !== i),
                        )
                      }
                      disabled={recommendations.length === 1}
                    >
                      <XCircle className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRecommendations([...recommendations, ""])}
                >
                  <PlusCircle className="h-4 w-4 mr-1" /> Add recommendation
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Generating..." : "Generate Report"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ===================== Page =====================

export default function QualityControlPage() {
  return (
    <ModuleGuard
      module="quality"
      fallback={<div>You don&apos;t have access to Quality Control module</div>}
    >
      <QualityControlContent />
    </ModuleGuard>
  );
}

function QualityControlContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "quality:quality_control",
  );
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [recentChecks, setRecentChecks] = useState<QualityCheck[]>([]);

  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [defects, setDefects] = useState<QualityDefect[]>([]);
  const [reports, setReports] = useState<QualityReport[]>([]);

  const [users, setUsers] = useState<TeamUser[]>([]);
  const [currentUser, setCurrentUser] = useState<TeamUser | null>(null);

  // Filters
  const [checkSearch, setCheckSearch] = useState("");
  const [checkStatusFilter, setCheckStatusFilter] = useState("all");
  const [checkPriorityFilter, setCheckPriorityFilter] = useState("all");
  const [inspectionSearch, setInspectionSearch] = useState("");
  const [inspectionStatusFilter, setInspectionStatusFilter] = useState("all");
  const [defectSearch, setDefectSearch] = useState("");
  const [defectSeverityFilter, setDefectSeverityFilter] = useState("all");
  const [defectStatusFilter, setDefectStatusFilter] = useState("all");

  // Dialog states
  const [checkDialogOpen, setCheckDialogOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<QualityCheck | null>(null);
  const [checkDialogMode, setCheckDialogMode] =
    useState<CheckDialogMode>("create");
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
  const [inspectionCheck, setInspectionCheck] = useState<QualityCheck | null>(
    null,
  );
  const [defectDialogOpen, setDefectDialogOpen] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState<QualityDefect | null>(
    null,
  );
  const [defectDialogMode, setDefectDialogMode] = useState<
    "create" | "edit" | "view"
  >("create");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<QualityReport | null>(
    null,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: string;
    item: any;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const service = useMemo(() => new QualityControlService(), []);

  const loadDashboardData = async () => {
    try {
      const dashboard = await service.getQualityDashboard();
      setDashboardData(dashboard.stats);
      setRecentChecks(dashboard.recent_checks || []);
    } catch (error) {
      setDashboardData(null);
    }
  };

  const loadQualityChecks = async () => {
    try {
      const response = await service.getQualityChecks({}, 1, 1000);
      setQualityChecks(response.quality_checks || []);
    } catch (error) {
      setQualityChecks([]);
    }
  };

  const loadInspections = async () => {
    try {
      const response = await service.getQualityInspections({}, 1, 1000);
      setInspections(response.quality_inspections || []);
    } catch (error) {
      setInspections([]);
    }
  };

  const loadDefects = async () => {
    try {
      const response = await service.getQualityDefects({}, 1, 1000);
      setDefects(response.quality_defects || []);
    } catch (error) {
      setDefects([]);
    }
  };

  const loadReports = async () => {
    try {
      const response = await service.getQualityReports(undefined, 1, 1000);
      setReports(response.quality_reports || []);
    } catch (error) {
      setReports([]);
    }
  };

  const loadUsers = async () => {
    try {
      const response: any = await apiService.getCurrentTenantUsers();
      const list = Array.isArray(response) ? response : response?.users || [];
      setUsers(list);
    } catch (error) {
      setUsers([]);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      loadDashboardData(),
      loadQualityChecks(),
      loadInspections(),
      loadDefects(),
      loadReports(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    setMounted(true);
    const session = new SessionManager().getSession();
    if (session?.user) {
      setCurrentUser(session.user as TeamUser);
    }
    loadUsers();
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Derived / filtered data =====
  const filteredChecks = qualityChecks.filter((check) => {
    const matchesSearch =
      checkSearch === "" ||
      check.title.toLowerCase().includes(checkSearch.toLowerCase()) ||
      check.description?.toLowerCase().includes(checkSearch.toLowerCase());
    const matchesStatus =
      checkStatusFilter === "all" ||
      check.status.toLowerCase() === checkStatusFilter.toLowerCase();
    const matchesPriority =
      checkPriorityFilter === "all" ||
      check.priority.toLowerCase() === checkPriorityFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const filteredInspections = inspections.filter((insp) => {
    const title = insp.quality_check_title || "";
    const inspector = insp.inspector_name || "";
    const matchesSearch =
      inspectionSearch === "" ||
      title.toLowerCase().includes(inspectionSearch.toLowerCase()) ||
      inspector.toLowerCase().includes(inspectionSearch.toLowerCase());
    const matchesStatus =
      inspectionStatusFilter === "all" ||
      insp.status.toLowerCase() === inspectionStatusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const filteredDefects = defects.filter((d) => {
    const matchesSearch =
      defectSearch === "" ||
      d.title.toLowerCase().includes(defectSearch.toLowerCase()) ||
      d.description.toLowerCase().includes(defectSearch.toLowerCase());
    const matchesSeverity =
      defectSeverityFilter === "all" ||
      d.severity.toLowerCase() === defectSeverityFilter.toLowerCase();
    const matchesStatus =
      defectStatusFilter === "all" ||
      d.status.toLowerCase() === defectStatusFilter.toLowerCase();
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    qualityChecks.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return counts;
  }, [qualityChecks]);

  // ===== Actions =====
  const handleStartCheck = async (check: QualityCheck) => {
    setActionLoading(check.id);
    try {
      await service.updateQualityCheck(check.id, {
        status: QualityStatus.IN_PROGRESS,
      });
      toast.success("Check started");
      await Promise.all([loadQualityChecks(), loadDashboardData()]);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to start check");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetCheckStatus = async (
    check: QualityCheck,
    status: QualityStatus,
  ) => {
    setActionLoading(check.id);
    try {
      await service.updateQualityCheck(check.id, { status });
      toast.success(`Check marked as ${statusLabels[status]}`);
      await Promise.all([loadQualityChecks(), loadDashboardData()]);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveDefect = async (defect: QualityDefect) => {
    setActionLoading(defect.id);
    try {
      await service.updateQualityDefect(defect.id, {
        status: "resolved",
        actual_resolution_date: new Date().toISOString(),
      });
      toast.success("Defect resolved");
      await loadDefects();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to resolve defect");
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "check") {
        await service.deleteQualityCheck(deleteTarget.item.id);
        toast.success("Quality check deleted");
        await Promise.all([loadQualityChecks(), loadDashboardData()]);
      } else if (deleteTarget.type === "defect") {
        await service.deleteQualityDefect(deleteTarget.item.id);
        toast.success("Defect deleted");
        await loadDefects();
      } else if (deleteTarget.type === "inspection") {
        await service.deleteQualityInspection(deleteTarget.item.id);
        toast.success("Inspection deleted");
        await Promise.all([
          loadInspections(),
          loadQualityChecks(),
          loadDashboardData(),
        ]);
      } else if (deleteTarget.type === "report") {
        await service.deleteQualityReport(deleteTarget.item.id);
        toast.success("Report deleted");
        await loadReports();
      }
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to delete");
    }
  };

  const handleDialogSuccess = () => {
    setCheckDialogOpen(false);
    setInspectionDialogOpen(false);
    setDefectDialogOpen(false);
    setReportDialogOpen(false);
    setSelectedCheck(null);
    setSelectedDefect(null);
    setSelectedReport(null);
    loadAll();
  };

  const openInspection = (check: QualityCheck | null = null) => {
    setInspectionCheck(check);
    setInspectionDialogOpen(true);
  };

  const openDefect = (
    mode: "create" | "edit" | "view",
    defect: QualityDefect | null = null,
  ) => {
    setDefectDialogMode(mode);
    setSelectedDefect(defect);
    setDefectDialogOpen(true);
  };

  const openReport = (report: QualityReport | null = null) => {
    setSelectedReport(report);
    setReportDialogOpen(true);
  };

  const openCheck = (
    mode: CheckDialogMode,
    check: QualityCheck | null = null,
  ) => {
    setCheckDialogMode(mode);
    setSelectedCheck(check);
    setCheckDialogOpen(true);
  };

  const requestDelete = (target: { type: string; item: any }) => {
    setDeleteTarget(target);
    setDeleteDialogOpen(true);
  };

  const statsCards = [
    {
      label: "Total Checks",
      value: dashboardData?.total_checks || 0,
      icon: <ClipboardList className="h-5 w-5 text-blue-600" />,
      bg: "bg-blue-100",
      sub: "All quality checks",
    },
    {
      label: "Pending",
      value: dashboardData?.pending_checks || 0,
      icon: <Clock className="h-5 w-5 text-yellow-600" />,
      bg: "bg-yellow-100",
      sub: "Awaiting inspection",
    },
    {
      label: "In Progress",
      value: dashboardData?.in_progress_checks || 0,
      icon: <Play className="h-5 w-5 text-blue-600" />,
      bg: "bg-blue-100",
      sub: "Being inspected",
    },
    {
      label: "Passed",
      value: dashboardData?.completed_checks || 0,
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      bg: "bg-green-100",
      sub: "Completed checks",
    },
    {
      label: "Compliance",
      value: `${dashboardData?.average_compliance_score || 0}%`,
      icon: <Target className="h-5 w-5 text-indigo-600" />,
      bg: "bg-indigo-100",
      sub: "Average score",
    },
    {
      label: "Open Defects",
      value: dashboardData?.open_defects || 0,
      icon: <Bug className="h-5 w-5 text-red-600" />,
      bg: "bg-red-100",
      sub: `Critical: ${dashboardData?.critical_defects || 0}`,
    },
  ];

  if (!mounted) return null;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Quality Control
            </h1>
            <p className="text-gray-600 mt-2">
              Run inspections, track defects and keep your workshop quality
              consistent.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canCreate() && (
              <Button onClick={() => openCheck("create")}>
                <Plus className="mr-2 h-4 w-4" /> New Check
              </Button>
            )}
            <Button variant="outline" onClick={loadAll}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 max-w-2xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="checks">
              Checks ({qualityChecks.length})
            </TabsTrigger>
            <TabsTrigger value="inspections">
              Inspections ({inspections.length})
            </TabsTrigger>
            <TabsTrigger value="defects">
              Defects ({defects.length})
            </TabsTrigger>
            <TabsTrigger value="reports">
              Reports ({reports.length})
            </TabsTrigger>
          </TabsList>

          {/* ===================== OVERVIEW ===================== */}
          <TabsContent value="overview" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  {statsCards.map((s) => (
                    <Card key={s.label}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className={cn("p-2 rounded-lg", s.bg)}>
                            {s.icon}
                          </div>
                        </div>
                        <div className="mt-3 text-2xl font-bold">{s.value}</div>
                        <p className="text-xs text-muted-foreground">{s.sub}</p>
                        <p className="text-sm font-medium mt-1">{s.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {/* Status distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" /> Check Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {qualityChecks.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-6">
                          No checks yet. Create your first quality check to get
                          started.
                        </p>
                      ) : (
                        Object.entries(statusCounts).map(([status, count]) => {
                          const total = qualityChecks.length;
                          const pct = Math.round((count / total) * 100);
                          return (
                            <div key={status}>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <StatusBadge status={status as QualityStatus} />
                                <span className="font-medium">
                                  {count} · {pct}%
                                </span>
                              </div>
                              <Progress value={pct} className="h-2" />
                            </div>
                          );
                        })
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" /> Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {canCreate() && (
                        <Button
                          className="w-full justify-start"
                          variant="outline"
                          onClick={() => openCheck("create")}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" /> Create a
                          quality check
                        </Button>
                      )}
                      {canCreate() && (
                        <Button
                          className="w-full justify-start"
                          variant="outline"
                          onClick={() => openInspection()}
                        >
                          <ClipboardCheck className="mr-2 h-4 w-4" /> Record an
                          inspection
                        </Button>
                      )}
                      {canCreate() && (
                        <Button
                          className="w-full justify-start"
                          variant="outline"
                          onClick={() => openDefect("create")}
                        >
                          <Bug className="mr-2 h-4 w-4" /> Log a defect
                        </Button>
                      )}
                      {canCreate() && (
                        <Button
                          className="w-full justify-start"
                          variant="outline"
                          onClick={() => openReport()}
                        >
                          <FileText className="mr-2 h-4 w-4" /> Generate report
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {/* Recent checks */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" /> Recent Checks
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {recentChecks.length > 0 ? (
                        recentChecks.map((check) => (
                          <div
                            key={check.id}
                            className={cn(
                              "flex items-center justify-between p-3 border rounded-lg",
                              "cursor-pointer hover:bg-gray-50",
                            )}
                            onClick={() => openCheck("view", check)}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2 bg-blue-100 rounded-full shrink-0">
                                <CheckSquare className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {check.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(check.created_at)}
                                </p>
                              </div>
                            </div>
                            <StatusBadge status={check.status} />
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4 text-sm">
                          No recent checks
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Open defects */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" /> Open Defects
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {defects.filter(
                        (d) => d.status !== "resolved" && d.status !== "closed",
                      ).length > 0 ? (
                        defects
                          .filter(
                            (d) =>
                              d.status !== "resolved" && d.status !== "closed",
                          )
                          .slice(0, 5)
                          .map((d) => (
                            <div
                              key={d.id}
                              className={cn(
                                "flex items-center justify-between p-3 border rounded-lg",
                                "cursor-pointer hover:bg-gray-50",
                              )}
                              onClick={() => openDefect("view", d)}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-red-100 rounded-full shrink-0">
                                  <Bug className="h-4 w-4 text-red-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">
                                    {d.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(d.detected_date)}
                                  </p>
                                </div>
                              </div>
                              <SeverityBadge severity={d.severity} />
                            </div>
                          ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4 text-sm">
                          No open defects — great job!
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* ===================== CHECKS ===================== */}
          <TabsContent value="checks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quality Checks</CardTitle>
                <CardDescription>
                  Create checks, start them, record inspections and track the
                  outcome.
                </CardDescription>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search checks..."
                      value={checkSearch}
                      onChange={(e) => setCheckSearch(e.target.value)}
                      className="pl-8 max-w-sm"
                    />
                  </div>
                  <Select
                    value={checkStatusFilter}
                    onValueChange={setCheckStatusFilter}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="passed">Passed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="conditional_pass">
                        Conditional Pass
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={checkPriorityFilter}
                    onValueChange={setCheckPriorityFilter}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : filteredChecks.length > 0 ? (
                  <div className="space-y-3">
                    {filteredChecks.map((check) => (
                      <div
                        key={check.id}
                        className="flex items-center justify-between gap-4 p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="p-3 bg-blue-100 rounded-full shrink-0">
                            <CheckSquare className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3
                                className="font-medium truncate cursor-pointer"
                                onClick={() => openCheck("view", check)}
                              >
                                {check.title}
                              </h3>
                              <StatusBadge status={check.status} />
                              <PriorityBadge priority={check.priority} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 capitalize">
                              {check.inspection_type.replace("_", " ")} ·{" "}
                              {check.quality_standard
                                .replace("_", " ")
                                .toUpperCase()}
                              {check.scheduled_date
                                ? ` · ${formatDate(check.scheduled_date)}`
                                : ""}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Progress
                                value={check.completion_percentage}
                                className="h-1.5 w-40"
                              />
                              <span className="text-xs text-muted-foreground">
                                {check.completion_percentage}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {check.status === QualityStatus.PENDING && (
                            <Button
                              size="sm"
                              onClick={() => handleStartCheck(check)}
                              disabled={actionLoading === check.id}
                            >
                              {actionLoading === check.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <Play className="h-4 w-4 mr-1" />
                              )}
                              Start
                            </Button>
                          )}
                          {(check.status === QualityStatus.IN_PROGRESS ||
                            check.status === QualityStatus.PENDING) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openInspection(check)}
                            >
                              <ClipboardCheck className="h-4 w-4 mr-1" />
                              Record Inspection
                            </Button>
                          )}
                          {(check.status === QualityStatus.IN_PROGRESS ||
                            check.status ===
                              QualityStatus.CONDITIONAL_PASS) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <CheckCheck className="h-4 w-4 mr-1" />
                                  Pass
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleSetCheckStatus(
                                      check,
                                      QualityStatus.PASSED,
                                    )
                                  }
                                >
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                  Pass
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleSetCheckStatus(
                                      check,
                                      QualityStatus.CONDITIONAL_PASS,
                                    )
                                  }
                                >
                                  <AlertCircle className="mr-2 h-4 w-4 text-orange-600" />
                                  Conditional Pass
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleSetCheckStatus(
                                      check,
                                      QualityStatus.FAILED,
                                    )
                                  }
                                  className="text-red-600"
                                >
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                  Fail
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openCheck("view", check)}
                              >
                                <Eye className="mr-2 h-4 w-4" /> View
                              </DropdownMenuItem>
                              {canUpdate() && (
                                <DropdownMenuItem
                                  onClick={() => openCheck("edit", check)}
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                              )}
                              {check.status !== QualityStatus.PENDING &&
                                check.status !== QualityStatus.IN_PROGRESS && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleSetCheckStatus(
                                        check,
                                        QualityStatus.IN_PROGRESS,
                                      )
                                    }
                                  >
                                    <Play className="mr-2 h-4 w-4" /> Re-open
                                  </DropdownMenuItem>
                                )}
                              <DropdownMenuSeparator />
                              {canDelete() && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    requestDelete({
                                      type: "check",
                                      item: check,
                                    })
                                  }
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<CheckSquare className="h-6 w-6 text-gray-400" />}
                    title={
                      qualityChecks.length === 0
                        ? "No quality checks yet"
                        : "No matching checks"
                    }
                    description={
                      qualityChecks.length === 0
                        ? "Create your first quality check to define what needs inspecting."
                        : "Try adjusting your search or filters."
                    }
                    action={
                      canCreate() && (
                        <Button onClick={() => openCheck("create")}>
                          <Plus className="mr-2 h-4 w-4" /> New Check
                        </Button>
                      )
                    }
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===================== INSPECTIONS ===================== */}
          <TabsContent value="inspections" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle>Inspections</CardTitle>
                    <CardDescription>
                      Records of inspections performed against your checks.
                    </CardDescription>
                  </div>
                  {canCreate() && (
                    <Button onClick={() => openInspection()}>
                      <ClipboardCheck className="mr-2 h-4 w-4" /> Record
                      Inspection
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by check or inspector..."
                      value={inspectionSearch}
                      onChange={(e) => setInspectionSearch(e.target.value)}
                      className="pl-8 max-w-sm"
                    />
                  </div>
                  <Select
                    value={inspectionStatusFilter}
                    onValueChange={setInspectionStatusFilter}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="passed">Passed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="conditional_pass">
                        Conditional Pass
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : filteredInspections.length > 0 ? (
                  <div className="space-y-3">
                    {filteredInspections.map((insp) => (
                      <div
                        key={insp.id}
                        className="flex items-center justify-between gap-4 p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="p-3 bg-indigo-100 rounded-full shrink-0">
                            <ClipboardCheck className="h-6 w-6 text-indigo-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium truncate">
                                {insp.quality_check_title || "Inspection"}
                              </h3>
                              <StatusBadge status={insp.status} />
                            </div>
                            <div
                              className={cn(
                                "flex flex-wrap items-center gap-x-4 gap-y-1",
                                "text-xs text-muted-foreground mt-1",
                              )}
                            >
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {insp.inspector_name || "Unknown"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(insp.inspection_date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Target className="h-3.5 w-3.5" />
                                {insp.compliance_score}% compliance
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  const check = qualityChecks.find(
                                    (c) => c.id === insp.quality_check_id,
                                  );
                                  openCheck("view", check || null);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" /> View Check
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  requestDelete({
                                    type: "inspection",
                                    item: insp,
                                  })
                                }
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<ClipboardCheck className="h-6 w-6 text-gray-400" />}
                    title="No inspections recorded"
                    description="Record an inspection against a quality check to start tracking results."
                    action={
                      canCreate() && (
                        <Button onClick={() => openInspection()}>
                          <ClipboardCheck className="mr-2 h-4 w-4" /> Record
                          Inspection
                        </Button>
                      )
                    }
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===================== DEFECTS ===================== */}
          <TabsContent value="defects" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle>Defects</CardTitle>
                    <CardDescription>
                      Log issues found during inspection and track them to
                      resolution.
                    </CardDescription>
                  </div>
                  {canCreate() && (
                    <Button onClick={() => openDefect("create")}>
                      <Plus className="mr-2 h-4 w-4" /> Log Defect
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search defects..."
                      value={defectSearch}
                      onChange={(e) => setDefectSearch(e.target.value)}
                      className="pl-8 max-w-sm"
                    />
                  </div>
                  <Select
                    value={defectSeverityFilter}
                    onValueChange={setDefectSeverityFilter}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="blocker">Blocker</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={defectStatusFilter}
                    onValueChange={setDefectStatusFilter}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : filteredDefects.length > 0 ? (
                  <div className="space-y-3">
                    {filteredDefects.map((defect) => (
                      <div
                        key={defect.id}
                        className="flex items-center justify-between gap-4 p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="p-3 bg-red-100 rounded-full shrink-0">
                            <Bug className="h-6 w-6 text-red-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3
                                className="font-medium truncate cursor-pointer"
                                onClick={() => openDefect("view", defect)}
                              >
                                {defect.title}
                              </h3>
                              <SeverityBadge severity={defect.severity} />
                              <DefectStatusBadge status={defect.status} />
                            </div>
                            <div
                              className={cn(
                                "flex flex-wrap items-center gap-x-4 gap-y-1",
                                "text-xs text-muted-foreground mt-1",
                              )}
                            >
                              <span>{defect.category}</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(defect.detected_date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {defect.detected_by_name || "Unknown"}
                              </span>
                              {defect.cost_impact > 0 && (
                                <span>£{defect.cost_impact}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {(defect.status === "open" ||
                            defect.status === "in_progress") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveDefect(defect)}
                              disabled={actionLoading === defect.id}
                            >
                              {actionLoading === defect.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <CheckCheck className="h-4 w-4 mr-1" />
                              )}
                              Resolve
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openDefect("view", defect)}
                              >
                                <Eye className="mr-2 h-4 w-4" /> View
                              </DropdownMenuItem>
                              {canUpdate() && (
                                <DropdownMenuItem
                                  onClick={() => openDefect("edit", defect)}
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {canDelete() && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    requestDelete({
                                      type: "defect",
                                      item: defect,
                                    })
                                  }
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Bug className="h-6 w-6 text-gray-400" />}
                    title="No defects logged"
                    description="Log defects found during inspections to track and resolve them."
                    action={
                      canCreate() && (
                        <Button onClick={() => openDefect("create")}>
                          <Plus className="mr-2 h-4 w-4" /> Log Defect
                        </Button>
                      )
                    }
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===================== REPORTS ===================== */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle>Reports</CardTitle>
                    <CardDescription>
                      Summaries of your quality performance.
                    </CardDescription>
                  </div>
                  {canCreate() && (
                    <Button onClick={() => openReport()}>
                      <Plus className="mr-2 h-4 w-4" /> Generate Report
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : reports.length > 0 ? (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className={cn(
                          "flex items-center justify-between gap-4 p-4 border rounded-lg",
                          "hover:bg-gray-50 cursor-pointer",
                        )}
                        onClick={() => openReport(report)}
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="p-3 bg-green-100 rounded-full shrink-0">
                            <FileText className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium truncate">
                              {report.title}
                            </h3>
                            <div
                              className={cn(
                                "flex flex-wrap items-center gap-x-4 gap-y-1",
                                "text-xs text-muted-foreground mt-1",
                              )}
                            >
                              <span className="capitalize">
                                {report.report_type}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(report.period_start)} →{" "}
                                {formatDate(report.period_end)}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {report.generated_by_name || "Unknown"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openReport(report)}
                            >
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                requestDelete({ type: "report", item: report })
                              }
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<FileText className="h-6 w-6 text-gray-400" />}
                    title="No reports yet"
                    description="Generate a quality report to summarise checks, inspections and defects."
                    action={
                      canCreate() && (
                        <Button onClick={() => openReport()}>
                          <Plus className="mr-2 h-4 w-4" /> Generate Report
                        </Button>
                      )
                    }
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ===================== Dialogs ===================== */}
        <QualityCheckDialog
          open={checkDialogOpen}
          onOpenChange={setCheckDialogOpen}
          mode={checkDialogMode}
          check={selectedCheck}
          users={users}
          onSuccess={handleDialogSuccess}
        />

        <InspectionDialog
          open={inspectionDialogOpen}
          onOpenChange={setInspectionDialogOpen}
          check={inspectionCheck}
          checks={qualityChecks}
          users={users}
          currentUser={currentUser}
          onSuccess={handleDialogSuccess}
        />

        <DefectDialog
          open={defectDialogOpen}
          onOpenChange={setDefectDialogOpen}
          mode={defectDialogMode}
          defect={selectedDefect}
          checks={qualityChecks}
          currentUser={currentUser}
          onSuccess={handleDialogSuccess}
        />

        <ReportDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          report={selectedReport}
          currentUser={currentUser}
          onSuccess={handleDialogSuccess}
        />

        {/* Delete confirmation */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Delete{" "}
                {deleteTarget?.type === "check"
                  ? "Quality Check"
                  : deleteTarget?.type === "defect"
                    ? "Defect"
                    : deleteTarget?.type === "inspection"
                      ? "Inspection"
                      : "Report"}
                ?
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-medium">
                  {deleteTarget?.item?.title ||
                    deleteTarget?.item?.quality_check_title}
                </span>
                ? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
