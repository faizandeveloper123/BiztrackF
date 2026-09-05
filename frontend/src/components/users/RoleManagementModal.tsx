"use client";

import React, { useState, useEffect } from "react";
import {
  useRBAC,
  CreateRoleData,
  UpdateRoleData,
} from "@/src/contexts/RBACContext";
import { extractErrorMessage } from "@/src/utils/errorUtils";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Badge } from "@/src/components/ui/badge";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { PermissionSelector } from "@/src/components/users/PermissionSelector";

interface RoleManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RoleManagementModal({
  open,
  onOpenChange,
  onSuccess,
}: RoleManagementModalProps) {
  const { roles, createRole, updateRole, deleteRole } = useRBAC();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [deletingRole, setDeletingRole] = useState<any>(null);
  const [formData, setFormData] = useState<CreateRoleData>({
    name: "",
    display_name: "",
    description: "",
    permissions: [],
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setShowCreateForm(false);
      setEditingRole(null);
      setDeletingRole(null);
      setFormData({
        name: "",
        display_name: "",
        description: "",
        permissions: [],
        isActive: true,
      });
      setError("");
    }
  }, [open]);

  const handleCreateRole = () => {
    setShowCreateForm(true);
    setEditingRole(null);
    setFormData({
      name: "",
      display_name: "",
      description: "",
      permissions: [],
      isActive: true,
    });
  };

  const handleEditRole = (role: any) => {
    setEditingRole(role);
    setShowCreateForm(false);
    setFormData({
      name: role.name,
      display_name: role.display_name,
      description: role.description || "",
      permissions: role.permissions || [],
      isActive: role.isActive,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.display_name) {
      setError("Name and display name are required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      if (editingRole) {
        const updateData: UpdateRoleData = {
          display_name: formData.display_name,
          description: formData.description,
          permissions: formData.permissions,
          isActive: formData.isActive,
        };
        await updateRole(editingRole.id, updateData);
      } else {
        await createRole(formData);
      }
      onSuccess();
    } catch (error: any) {
      setError(extractErrorMessage(error, "Failed to save role"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deletingRole) return;

    setIsDeleting(true);
    setError("");

    try {
      await deleteRole(deletingRole.id);
      setDeletingRole(null);
      onSuccess();
    } catch (error: any) {
      setError(extractErrorMessage(error, "Failed to delete role"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Role Management</DialogTitle>
          <DialogDescription>
            Create and manage roles with specific permissions for your
            organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!showCreateForm && !editingRole ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Existing Roles</h3>
                <Button onClick={handleCreateRole} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              </div>

              <div className="space-y-2">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{role.display_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {role.description}
                      </div>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {role.permissions.length} permissions
                        </Badge>
                        <Badge
                          variant={role.isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {role.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRole(role)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {role.name !== "owner" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingRole(role)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="crm_manager"
                    disabled={!!editingRole}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name *</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        display_name: e.target.value,
                      }))
                    }
                    placeholder="CRM Manager"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Manages CRM operations and customer data"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Permissions</Label>
                </div>
                <PermissionSelector
                  value={formData.permissions}
                  onChange={(permissions) =>
                    setFormData((prev) => ({ ...prev, permissions }))
                  }
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingRole(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingRole ? "Update Role" : "Create Role"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>

        <Dialog
          open={!!deletingRole}
          onOpenChange={(open) => {
            if (!open) {
              setDeletingRole(null);
              setError("");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Role</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the role &quot;
                {deletingRole?.display_name}&quot;? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeletingRole(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteRole}
                disabled={isDeleting}
              >
                {isDeleting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
