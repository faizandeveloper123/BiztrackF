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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2, UserPlus, Mail } from "lucide-react";
import { apiService } from "../../services/ApiService";
import { extractErrorMessage } from "../../utils/errorUtils";

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantId: string;
}

interface MemberData {
  email: string;
  roleId: string;
  firstName?: string;
  lastName?: string;
}

interface Role {
  id: string;
  name: string;
  display_name: string;
  isActive: boolean;
}

export default function AddMemberModal({
  open,
  onClose,
  onSuccess,
}: AddMemberModalProps) {
  const [formData, setFormData] = useState<MemberData>({
    email: "",
    roleId: "",
    firstName: "",
    lastName: "",
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchRoles();
      setFormData({
        email: "",
        roleId: "",
        firstName: "",
        lastName: "",
      });
      setError(null);
    }
  }, [open]);

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await apiService.get("/rbac/roles");
      const rolesList = response.roles || [];
      const activeRoles = rolesList.filter((r: Role) => r.isActive);
      setRoles(activeRoles);

      if (activeRoles.length > 0) {
        const defaultRole =
          activeRoles.find((r: Role) => r.name === "team_member") ||
          activeRoles[0];
        if (defaultRole) {
          setFormData((prev) => ({ ...prev, roleId: defaultRole.id }));
        }
      }
    } catch (error) {
      setError("Failed to load roles. Please try again.");
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    if (!formData.roleId) {
      setError("Please select a role");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const baseUsername = formData.email.split("@")[0];
      const timestamp = Date.now().toString().slice(-4);
      const uniqueUsername = `${baseUsername}_${timestamp}`;

      const userData = {
        userName: uniqueUsername,
        email: formData.email,
        firstName: formData.firstName || "",
        lastName: formData.lastName || "",
        password: "TempPassword123!",
      };

      await apiService.post(
        `/rbac/create-user?role_id=${formData.roleId}`,
        userData,
        { timeout: 90000 },
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMessage = extractErrorMessage(
        err,
        "Failed to create team member",
      );
      const timedOut =
        err?.isTimeout === true ||
        err?.code === "ECONNABORTED" ||
        errorMessage.toLowerCase().includes("timeout");
      if (timedOut) {
        try {
          const response = await apiService.get("/rbac/tenant-users");
          const users = Array.isArray(response)
            ? response
            : response?.success && Array.isArray(response.data)
              ? response.data
              : [];
          const normalizedEmail = formData.email.trim().toLowerCase();
          const created = users.find(
            (user: any) =>
              user?.email?.toLowerCase() === normalizedEmail ||
              user?.user?.email?.toLowerCase() === normalizedEmail,
          );
          if (created) {
            onSuccess();
            onClose();
            return;
          }
        } catch {}
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof MemberData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Team Member
          </DialogTitle>
          <DialogDescription>
            Create a new team member and add them to your workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="member@example.com"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Role *</Label>
            <Select
              value={formData.roleId}
              onValueChange={(value) => handleInputChange("roleId", value)}
              disabled={loadingRoles}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingRoles ? "Loading roles..." : "Select a role"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.display_name || role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {loadingRoles && (
              <p className="text-xs text-muted-foreground">Loading roles...</p>
            )}
          </div>

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
            <Button type="submit" disabled={loading || !formData.email.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Member
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
