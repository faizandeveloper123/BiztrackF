"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2, Shield, Check } from "lucide-react";
import apiService from "../../services/ApiService";
import { extractErrorMessage } from "../../utils/errorUtils";

interface Permission {
  code: string;
  label: string;
}

interface CustomRole {
  id?: string;
  name: string;
  permissions: string[];
}

interface CustomRoleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (role: CustomRole) => void;
  role?: CustomRole;
  tenantId: string;
}

export default function CustomRoleModal({
  open,
  onClose,
  onSave,
  role,
  tenantId,
}: CustomRoleModalProps) {
  const [formData, setFormData] = useState<CustomRole>({
    name: "",
    permissions: [],
  });
  const [availablePermissions, setAvailablePermissions] = useState<
    Permission[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchPermissions();
      if (role) {
        setFormData(role);
      } else {
        setFormData({ name: "", permissions: [] });
      }
    }
  }, [open, role]);

  const fetchPermissions = async () => {
    try {
      const response = await apiService.getPermissions();
      setAvailablePermissions(response || []);
    } catch (err) {
      setError("Failed to load permissions");
    }
  };

  const handlePermissionToggle = (permissionCode: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionCode)
        ? prev.permissions.filter((p) => p !== permissionCode)
        : [...prev.permissions, permissionCode],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setLoading(true);
      setError(null);

      let savedRole;
      if (role?.id) {
        savedRole = await apiService.updateCustomRole(
          tenantId,
          role.id,
          formData,
        );
      } else {
        savedRole = await apiService.createCustomRole(tenantId, formData);
      }

      onSave(savedRole);
      onClose();
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to save role"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {role ? "Edit Custom Role" : "Create Custom Role"}
          </DialogTitle>
          <DialogDescription>
            Define a custom role with specific permissions for your team
            members.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="roleName">Role Name</Label>
            <Input
              id="roleName"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter role name"
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Permissions</Label>
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {availablePermissions.map((permission) => (
                <div
                  key={permission.code}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handlePermissionToggle(permission.code)}
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {permission.label}
                    </p>
                    <p className="text-sm text-gray-500">{permission.code}</p>
                  </div>
                  <div className="flex items-center">
                    {formData.permissions.includes(permission.code) && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {formData.permissions.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Permissions</Label>
              <div className="flex flex-wrap gap-2">
                {formData.permissions.map((permCode) => {
                  const permission = availablePermissions.find(
                    (p) => p.code === permCode,
                  );
                  return (
                    <Badge
                      key={permCode}
                      variant="secondary"
                      className="text-xs"
                    >
                      {permission?.label || permCode}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : role ? (
                "Update Role"
              ) : (
                "Create Role"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
