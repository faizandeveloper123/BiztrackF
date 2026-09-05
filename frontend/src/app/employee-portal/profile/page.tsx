"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { Textarea } from "@/src/components/ui/textarea";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/src/contexts/ConfirmContext";
import { useApiService } from "@/src/hooks/useApiService";
import { useAuth } from "@/src/hooks/useAuth";
import { EmployeePortalService } from "@/src/services/EmployeePortalService";
import { apiService } from "@/src/services/ApiService";
import { extractErrorMessage } from "@/src/utils/errorUtils";
import { getInitials } from "@/src/lib/utils";
import type { Employee } from "@/src/models/hrm";

function formatDepartmentLabel(department: string) {
  return (
    department.charAt(0).toUpperCase() + department.slice(1).replace(/_/g, " ")
  );
}

export default function EmployeePortalProfilePage() {
  const confirm = useConfirm();
  const { refreshUser } = useAuth();
  const api = useApiService();
  const portalService = React.useMemo(
    () => new EmployeePortalService(api),
    [api],
  );
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const p = await portalService.getMyEmployeeProfile();
      setProfile(p);
      setPhone(p.phone ?? "");
      setAddress(p.address ?? "");
      setEmergencyContact(p.emergencyContact ?? "");
      setEmergencyPhone(p.emergencyPhone ?? "");
      setAvatarPreview(p.avatar ?? null);
    } catch (error) {
      toast.error(
        extractErrorMessage(error, "Failed to load employee profile"),
      );
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [portalService]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, GIF, or WEBP)");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        toast.error("Failed to process image");
        return;
      }
      setAvatarPreview(dataUrl);
      setAvatarBusy(true);
      try {
        const updated = await portalService.updateMyEmployeeProfile({
          avatar: dataUrl,
        });
        setProfile(updated);
        setAvatarPreview(updated.avatar ?? dataUrl);
        await refreshUser();
        toast.success("Profile photo updated");
      } catch (error) {
        setAvatarPreview(profile?.avatar ?? null);
        toast.error(extractErrorMessage(error, "Failed to upload photo"));
      } finally {
        setAvatarBusy(false);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleRemoveAvatar = async () => {
    const ok = await confirm({
      description: "Remove your profile photo?",
      destructive: true,
      confirmLabel: "Remove",
    });
    if (!ok) return;

    setAvatarBusy(true);
    try {
      await apiService.deleteAvatar();
      setAvatarPreview(null);
      setProfile((prev) => (prev ? { ...prev, avatar: null } : prev));
      await refreshUser();
      toast.success("Profile photo removed");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to remove photo"));
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await portalService.updateMyEmployeeProfile({
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
        emergencyPhone: emergencyPhone.trim() || undefined,
      });
      setProfile(updated);
      setAvatarPreview(updated.avatar ?? avatarPreview);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to save profile"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto flex h-64 items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>My Profile</CardTitle>
              <CardDescription>
                No employee record is linked to your account. Ask an admin to
                link your user to an HRM employee.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const initials = getInitials(`${profile.firstName} ${profile.lastName}`);

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-3xl space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">
            Personal information and contact details
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile photo</CardTitle>
            <CardDescription>
              This photo appears on your employee profile across BizTrack.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="hidden"
              onChange={(e) => void handleAvatarChange(e)}
              disabled={avatarBusy}
            />
            <Avatar
              className={`h-24 w-24 ${avatarBusy ? "opacity-50" : "cursor-pointer"}`}
              onClick={avatarBusy ? undefined : handleAvatarClick}
            >
              <AvatarImage
                src={avatarPreview || undefined}
                alt={`${profile.firstName} ${profile.lastName}`}
              />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={avatarBusy}
                >
                  {avatarBusy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UploadCloud className="mr-2 h-4 w-4" />
                  )}
                  {avatarPreview ? "Change photo" : "Add photo"}
                </Button>
                {avatarPreview ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleRemoveAvatar()}
                    disabled={avatarBusy}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                ) : null}
              </div>
              <p className="text-sm text-gray-500">
                PNG, JPG, GIF, or WEBP. Max 5MB.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {profile.firstName} {profile.lastName}
            </CardTitle>
            <CardDescription>{profile.position}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-sm text-gray-500">Email</Label>
                <p className="text-sm font-medium">{profile.email}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Department</Label>
                <p className="text-sm font-medium">
                  {formatDepartmentLabel(profile.department)}
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Employee ID</Label>
                <p className="text-sm font-medium">{profile.employeeId}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Hire date</Label>
                <p className="text-sm font-medium">
                  {profile.hireDate?.slice(0, 10) || "—"}
                </p>
              </div>
            </div>

            <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Address"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency contact</Label>
                <Input
                  id="emergencyContact"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="Contact name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Emergency phone</Label>
                <Input
                  id="emergencyPhone"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="Emergency phone"
                />
              </div>
              <Button type="submit" disabled={saving || avatarBusy}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
