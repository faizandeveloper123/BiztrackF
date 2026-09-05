"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/src/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Switch } from "@/src/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { UserPlus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import healthcareService from "@/src/services/HealthcareService";
import {
  HEALTHCARE_PERMISSIONS,
  type HealthcareStaff,
  type HealthcareStaffCreate,
  type HealthcareStaffUpdate,
} from "@/src/models/healthcare";
import { useCrudPermissions } from "@/src/hooks/usePermissions";

export default function HealthcareStaffPage() {
  return (
    <DashboardLayout>
      <StaffContent />
    </DashboardLayout>
  );
}

type StaffFormState = {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  permissions: string[];
  is_active: boolean;
};

const PERMISSION_LABELS: Record<string, string> = {
  "healthcare:view": "View",
  "healthcare:create": "Create",
  "healthcare:update": "Update",
  "healthcare:delete": "Delete",
};

function StaffContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "healthcare:staff",
  );
  const [staff, setStaff] = useState<HealthcareStaff[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const totalPages = Math.ceil(total / limit) || 1;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HealthcareStaff | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<HealthcareStaff | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formData, setFormData] = useState<StaffFormState>({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "",
    permissions: ["healthcare:view"],
    is_active: true,
  });

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      const res = await healthcareService.getStaff({
        search: search || undefined,
        page,
        limit,
      });
      setStaff(res.staff);
      setTotal(res.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const openAdd = () => {
    setEditing(null);
    setFormData({
      username: "",
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      phone: "",
      role: "",
      permissions: ["healthcare:view"],
      is_active: true,
    });
    setFormOpen(true);
  };

  const openEdit = (s: HealthcareStaff) => {
    setEditing(s);
    setFormData({
      username: s.username,
      email: s.email,
      password: "",
      first_name: s.first_name ?? "",
      last_name: s.last_name ?? "",
      phone: s.phone ?? "",
      role: s.role ?? "",
      permissions: (s.permissions as string[])?.length
        ? [...(s.permissions as string[])]
        : ["healthcare:view"],
      is_active: s.is_active,
    });
    setFormOpen(true);
  };

  const openDelete = (s: HealthcareStaff) => {
    setStaffToDelete(s);
    setDeleteDialogOpen(true);
  };

  const permissionBadges = useMemo(() => {
    const map = new Map<
      string,
      { label: string; variant: "info" | "outline" }
    >();
    HEALTHCARE_PERMISSIONS.forEach((p) =>
      map.set(p, { label: PERMISSION_LABELS[p] ?? p, variant: "info" }),
    );
    return map;
  }, []);

  const togglePermission = (perm: string, checked: boolean) => {
    setFormData((prev) => {
      const current = new Set(prev.permissions);
      if (checked) {
        current.add(perm);
      } else {
        current.delete(perm);
      }
      const next = Array.from(current);
      if (!next.includes("healthcare:view")) next.push("healthcare:view");
      next.sort(
        (a, b) =>
          HEALTHCARE_PERMISSIONS.indexOf(a as any) -
          HEALTHCARE_PERMISSIONS.indexOf(b as any),
      );
      return { ...prev, permissions: next };
    });
  };

  const validate = () => {
    if (!formData.username.trim()) {
      toast.error("Username is required");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!editing && !formData.password.trim()) {
      toast.error("Password is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitLoading(true);
      if (editing) {
        const payload: HealthcareStaffUpdate = {
          username: formData.username.trim(),
          email: formData.email.trim(),
          first_name: formData.first_name.trim() || undefined,
          last_name: formData.last_name.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          role: formData.role.trim() || undefined,
          permissions: formData.permissions,
          is_active: formData.is_active,
          password: formData.password.trim() ? formData.password : undefined,
        };
        await healthcareService.updateStaff(editing.id, payload);
        toast.success("Staff updated");
      } else {
        const payload: HealthcareStaffCreate = {
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          first_name: formData.first_name.trim() || undefined,
          last_name: formData.last_name.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          role: formData.role.trim() || undefined,
          permissions: formData.permissions,
        };
        await healthcareService.createStaff(payload);
        toast.success("Staff added");
      }
      setFormOpen(false);
      loadStaff();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || "Request failed";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!staffToDelete) return;
    try {
      setDeleteLoading(true);
      await healthcareService.deleteStaff(staffToDelete.id);
      toast.success("Staff disabled");
      setDeleteDialogOpen(false);
      setStaffToDelete(null);
      loadStaff();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || "Request failed";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatName = (s: HealthcareStaff) => {
    const name = `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim();
    return name || "—";
  };

  const formatPermissions = (perms: string[]) => {
    const normalized = perms.filter((p) => p.startsWith("healthcare:"));
    if (!normalized.length) return <span className="text-gray-500">—</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {normalized.map((p) => (
          <Badge key={p} variant="info">
            {PERMISSION_LABELS[p] ?? p}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff</h1>
          <p className="text-gray-600">Manage healthcare staff access</p>
        </div>
        {canCreate() && (
        <Button onClick={openAdd}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search</CardTitle>
          <CardDescription>
            Filter by name, username, email, role, or phone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Staff</CardTitle>
          <CardDescription>
            {total} staff member{total !== 1 ? "s" : ""} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {total > 0 && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-gray-500">Loading...</div>
          ) : staff.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No staff yet. Add one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {formatName(s)}
                    </TableCell>
                    <TableCell className="font-mono">{s.username}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.phone || "—"}</TableCell>
                    <TableCell>{s.role || "—"}</TableCell>
                    <TableCell className="max-w-[220px]">
                      {formatPermissions(s.permissions as string[])}
                    </TableCell>
                    <TableCell>
                      {s.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="outline">Disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {canUpdate() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(s)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                      {canDelete() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => openDelete(s)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Disable
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Staff" : "Add Staff"}</DialogTitle>
            <DialogDescription>
              Create staff accounts and control healthcare permissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, username: e.target.value }))
                  }
                  placeholder="e.g. reception01"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="staff@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, first_name: e.target.value }))
                  }
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, last_name: e.target.value }))
                  }
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="e.g. +92 300 1234567"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input
                  value={formData.role}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, role: e.target.value }))
                  }
                  placeholder="e.g. Receptionist"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div className="space-y-2">
                <Label>
                  {editing ? "New Password (optional)" : "Password"}
                </Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, password: e.target.value }))
                  }
                  placeholder={
                    editing
                      ? "Leave empty to keep current"
                      : "Set initial password"
                  }
                />
              </div>
              {editing && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center gap-3 h-10">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(v) =>
                        setFormData((p) => ({ ...p, is_active: v }))
                      }
                    />
                    <span className="text-sm text-gray-600">
                      {formData.is_active ? "Active" : "Disabled"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Healthcare Permissions</Label>
                <div className="flex flex-wrap gap-1">
                  {formData.permissions.map((p) => (
                    <Badge
                      key={p}
                      variant={permissionBadges.get(p)?.variant ?? "outline"}
                    >
                      {PERMISSION_LABELS[p] ?? p}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {HEALTHCARE_PERMISSIONS.map((perm) => {
                  const checked = formData.permissions.includes(perm);
                  const disabled = perm === "healthcare:view";
                  return (
                    <div
                      key={perm}
                      className="flex items-start gap-3 rounded-md border p-3"
                    >
                      <Checkbox
                        checked={checked}
                        disabled={disabled}
                        onCheckedChange={(v) =>
                          togglePermission(perm, Boolean(v))
                        }
                      />
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">
                          {PERMISSION_LABELS[perm] ?? perm}
                        </div>
                        <div className="text-xs text-gray-500">{perm}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitLoading}>
              {submitLoading ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Staff</DialogTitle>
            <DialogDescription>
              Disable{" "}
              {staffToDelete
                ? `${formatName(staffToDelete)} (${staffToDelete.username})`
                : "this staff member"}
              ? They will lose healthcare access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Disabling..." : "Disable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
