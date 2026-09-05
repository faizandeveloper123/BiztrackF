"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/src/hooks/useAuth";
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { Separator } from "@/src/components/ui/separator";
import { Badge } from "@/src/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
  User,
  Save,
  Lock,
  Loader2,
  AlertCircle,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/src/contexts/ConfirmContext";
import { apiService } from "@/src/services/ApiService";
import { extractErrorMessage } from "@/src/utils/errorUtils";
import { getInitials } from "@/src/lib/utils";

export default function ProfilePage() {
  const confirm = useConfirm();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    userName: "",
    email: "",
    firstName: "",
    lastName: "",
    avatar: "",
  });
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (user) {
      const initialData = {
        userName: user.userName || "",
        email: user.email || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        avatar: user.avatar || "",
      };
      setProfileData(initialData);
      setAvatarPreview(null);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMyProfile();
      const profile = response;
      setProfileData({
        userName: profile.userName || "",
        email: profile.email || "",
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        avatar: profile.avatar || "",
      });
      setAvatarPreview(null);
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to load profile"));
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setAvatarUploading(true);

      const updateData: any = {};
      if (profileData.userName !== user?.userName)
        updateData.userName = profileData.userName;
      if (profileData.email !== user?.email)
        updateData.email = profileData.email;
      if (profileData.firstName !== user?.firstName)
        updateData.firstName = profileData.firstName;
      if (profileData.lastName !== user?.lastName)
        updateData.lastName = profileData.lastName;

      if (profileData.avatar !== user?.avatar) {
        if (
          profileData.avatar &&
          user?.avatar &&
          user.avatar.startsWith("http") &&
          user.avatar.includes("avatars/")
        ) {
          try {
            await apiService.deleteAvatar();
          } catch (deleteError) {
            console.warn(
              "Failed to delete old avatar, continuing with upload:",
              deleteError,
            );
          }
        }
        updateData.avatar = profileData.avatar;
      }

      await apiService.updateMyProfile(updateData);
      await refreshUser();
      setHasChanges(false);
      setAvatarPreview(null);
      toast.success("Profile updated successfully!");
    } catch (error) {
      const errorMessage = extractErrorMessage(
        error,
        "Failed to update profile",
      );
      toast.error(errorMessage);
      console.error("Profile update error:", error);
    } finally {
      setSaving(false);
      setAvatarUploading(false);
    }
  };

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
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
      reader.onerror = () => {
        toast.error("Failed to read image file. Please try again.");
        event.target.value = "";
      };

      reader.onload = (e) => {
        try {
          const base64 = e.target?.result as string;
          if (!base64) {
            throw new Error("Failed to convert image to base64");
          }
          setAvatarPreview(base64);
          setProfileData((prev) => ({ ...prev, avatar: base64 }));
          setHasChanges(true);
          toast.success('Avatar selected. Click "Save Changes" to upload.');
        } catch (error) {
          console.error("Error processing avatar:", error);
          toast.error("Failed to process image. Please try a different file.");
        }
      };

      reader.readAsDataURL(file);
      event.target.value = "";
    } catch (error) {
      console.error("Avatar selection error:", error);
      toast.error(
        "An error occurred while selecting the image. Please try again.",
      );
      event.target.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.avatar) {
      setAvatarPreview(null);
      setProfileData((prev) => ({ ...prev, avatar: "" }));
      setHasChanges(true);
      return;
    }

    const ok = await confirm({
      description: "Are you sure you want to remove your avatar?",
      destructive: true,
      confirmLabel: "Remove",
    });
    if (!ok) return;

    try {
      setAvatarUploading(true);
      await apiService.deleteAvatar();
      setAvatarPreview(null);
      setProfileData((prev) => ({ ...prev, avatar: "" }));
      await refreshUser();
      setHasChanges(false);
      toast.success("Avatar removed successfully");
    } catch (error) {
      const errorMessage = extractErrorMessage(
        error,
        "Failed to remove avatar",
      );
      toast.error(errorMessage);
      console.error("Avatar deletion error:", error);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    setPasswordError("");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordError("");
      await apiService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
      );
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password changed successfully!");
    } catch (error) {
      setPasswordError(extractErrorMessage(error, "Failed to change password"));
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600">
                Manage your account information and settings
              </p>
            </div>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profile Information
              </TabsTrigger>
              <TabsTrigger value="password">
                <Lock className="h-4 w-4 mr-2" />
                Change Password
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and account details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={avatarUploading}
                    aria-hidden="true"
                  />
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="flex items-center gap-6 pb-6 border-b">
                      <div className="relative">
                        {avatarUploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full z-10">
                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                          </div>
                        )}
                        <Avatar
                          className={`h-24 w-24 ${avatarUploading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                          onClick={
                            avatarUploading ? undefined : handleAvatarClick
                          }
                        >
                          <AvatarImage
                            src={avatarPreview || profileData.avatar}
                            alt={profileData.userName}
                          />
                          <AvatarFallback className="bg-gradient-primary text-white text-2xl">
                            {getInitials(
                              `${profileData.firstName} ${profileData.lastName}` ||
                                profileData.userName,
                            )}
                          </AvatarFallback>
                        </Avatar>
                        {(avatarPreview || profileData.avatar) &&
                          !avatarUploading && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveAvatar();
                              }}
                              disabled={avatarUploading}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">
                          {profileData.firstName && profileData.lastName
                            ? `${profileData.firstName} ${profileData.lastName}`
                            : profileData.userName || "User"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {profileData.email}
                        </p>
                        {user?.userRole && (
                          <Badge variant="secondary" className="mt-2">
                            {user.userRole.replace("_", " ").toUpperCase()}
                          </Badge>
                        )}
                        <div className="mt-3 flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAvatarClick}
                            className="gap-2"
                            disabled={avatarUploading}
                          >
                            {avatarUploading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <UploadCloud className="h-4 w-4" />
                                {profileData.avatar
                                  ? "Change Avatar"
                                  : "Upload Avatar"}
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {avatarUploading
                            ? "Uploading avatar to server..."
                            : "Click avatar or button to upload. Max 5MB."}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="userName">Username</Label>
                        <Input
                          id="userName"
                          value={profileData.userName}
                          onChange={(e) =>
                            handleProfileChange("userName", e.target.value)
                          }
                          placeholder="username"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) =>
                            handleProfileChange("email", e.target.value)
                          }
                          placeholder="email@example.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={profileData.firstName}
                          onChange={(e) =>
                            handleProfileChange("firstName", e.target.value)
                          }
                          placeholder="John"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profileData.lastName}
                          onChange={(e) =>
                            handleProfileChange("lastName", e.target.value)
                          }
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    {hasChanges && (
                      <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">
                          You have unsaved changes. Don&apos;t forget to save
                          your profile.
                        </span>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={!hasChanges || saving || avatarUploading}
                        className="gap-2"
                      >
                        {saving || avatarUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {saving || avatarUploading
                          ? "Saving..."
                          : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="password" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">
                          Current Password
                        </Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            handlePasswordChange(
                              "currentPassword",
                              e.target.value,
                            )
                          }
                          placeholder="Enter your current password"
                          required
                        />
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            handlePasswordChange("newPassword", e.target.value)
                          }
                          placeholder="Enter your new password"
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Password must be at least 8 characters long
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">
                          Confirm New Password
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            handlePasswordChange(
                              "confirmPassword",
                              e.target.value,
                            )
                          }
                          placeholder="Confirm your new password"
                          required
                        />
                      </div>
                    </div>

                    {passwordError && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-800">
                          {passwordError}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={
                          changingPassword ||
                          !passwordData.currentPassword ||
                          !passwordData.newPassword ||
                          !passwordData.confirmPassword
                        }
                        className="gap-2"
                      >
                        {changingPassword ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                        {changingPassword ? "Changing..." : "Change Password"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
