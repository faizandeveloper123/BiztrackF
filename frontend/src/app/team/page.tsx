"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Alert, AlertDescription } from "../../components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Search,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  RefreshCw,
  Mail,
  Shield,
  Loader2,
  Users,
  Crown,
} from "lucide-react";
import { apiService } from "../../services/ApiService";
import { extractErrorMessage } from "../../utils/errorUtils";
import { User } from "../../models/auth";
import { DashboardLayout } from "../../components/layout";
import { useConfirm } from "@/src/contexts/ConfirmContext";
import { cn, getInitials } from "../../lib/utils";
import AddMemberModal from "../../components/team/AddMemberModal";
import { useCrudPermissions } from "@/src/hooks/usePermissions";

export default function TeamPage() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "projects:team_members",
  );
  const confirm = useConfirm();
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    userName: "",
    userRole: "",
  });

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = teamMembers.filter(
        (member) =>
          member.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${member.firstName} ${member.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(teamMembers);
    }
  }, [teamMembers, searchTerm]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try multiple ways to get tenant ID
      let tenantId = null;

      // Method 1: From selectedTenant
      const selectedTenant = localStorage.getItem("selectedTenant");
      if (selectedTenant) {
        try {
          const parsed = JSON.parse(selectedTenant);
          tenantId = parsed.id || parsed.tenantId;
        } catch (e) {}
      }

      // Method 2: From currentTenantId
      if (!tenantId) {
        tenantId = localStorage.getItem("currentTenantId");
      }

      // Method 3: From URL path if we're in workspace
      if (!tenantId && typeof window !== "undefined") {
        const pathParts = window.location.pathname.split("/");
        const workspaceIndex = pathParts.indexOf("workspace");
        if (workspaceIndex !== -1 && pathParts[workspaceIndex + 1]) {
          tenantId = pathParts[workspaceIndex + 1];
        }
      }

      if (tenantId) {
        const response = await apiService.getTenantUsers(tenantId);
        setTeamMembers(response.users || []);
      } else {
        setError("No tenant selected. Please select a workspace first.");
      }
    } catch (err) {
      setError("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "project_manager":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "team_member":
        return "bg-green-100 text-green-800 border-green-200";
      case "client":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "super_admin":
      case "admin":
        return <Crown className="h-3 w-3" />;
      case "project_manager":
        return <Shield className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  const formatRole = (role: string) => {
    return role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getTeamStats = () => {
    const totalMembers = teamMembers.length;
    const activeMembers = teamMembers.filter((m) => m.isActive).length;
    const admins = teamMembers.filter((m) =>
      ["super_admin", "admin"].includes(m.userRole),
    ).length;
    const projectManagers = teamMembers.filter(
      (m) => m.userRole === "project_manager",
    ).length;

    return { totalMembers, activeMembers, admins, projectManagers };
  };

  const stats = getTeamStats();

  const handleAddMemberSuccess = () => {
    fetchTeamMembers();
  };

  const openEditDialog = (member: User) => {
    setSelectedMember(member);
    setEditFormData({
      firstName: member.firstName || "",
      lastName: member.lastName || "",
      email: member.email || "",
      userName: member.userName || "",
      userRole: member.userRole || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    try {
      setLoading(true);
      const memberId = selectedMember.userId || selectedMember.id;

      if (!memberId) {
        setError("Member ID not found");
        return;
      }

      await apiService.updateUser(memberId, editFormData);
      setIsEditDialogOpen(false);
      setSelectedMember(null);
      fetchTeamMembers();
    } catch (err) {
      setError("Failed to update member");
    } finally {
      setLoading(false);
    }
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getCurrentTenantId = () => {
    let tenantId = null;
    const selectedTenant = localStorage.getItem("selectedTenant");
    if (selectedTenant) {
      try {
        const parsed = JSON.parse(selectedTenant);
        tenantId = parsed.id || parsed.tenantId;
      } catch (e) {
        // ignore
      }
    }
    if (!tenantId) {
      tenantId = localStorage.getItem("currentTenantId");
    }
    return tenantId;
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    const ok = await confirm({
      description: `Are you sure you want to remove ${memberName} from the team?`,
      destructive: true,
      confirmLabel: "Remove",
    });
    if (!ok) return;

    try {
      setLoading(true);
      const tenantId = getCurrentTenantId();

      if (!tenantId) {
        setError("No tenant selected");
        return;
      }

      // Call the remove user API
      await apiService.delete(`/rbac/remove-user/${memberId}`);

      // Refresh the team members list
      await fetchTeamMembers();
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to remove team member"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Team Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your team members and their roles
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchTeamMembers}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            {canCreate() && (
              <Button
                className="modern-button"
                onClick={() => setShowAddMemberModal(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            )}
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="modern-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalMembers}
                  </p>
                  <p className="text-sm text-gray-600">Total Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="modern-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.activeMembers}
                  </p>
                  <p className="text-sm text-gray-600">Active Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="modern-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Crown className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.admins}
                  </p>
                  <p className="text-sm text-gray-600">Administrators</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="modern-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Shield className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.projectManagers}
                  </p>
                  <p className="text-sm text-gray-600">Project Managers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="modern-card">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Team Members Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <Card
                key={member.userId}
                className="modern-card card-hover group"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                          {getInitials(
                            `${member.firstName} ${member.lastName}` ||
                              member.userName,
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {member.firstName && member.lastName
                            ? `${member.firstName} ${member.lastName}`
                            : member.userName}
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          @{member.userName}
                        </p>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canUpdate() && (
                          <DropdownMenuItem
                            onClick={() => openEditDialog(member)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Member
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {canDelete() && (
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => {
                              const memberId = member.userId || member.id;
                              if (memberId) {
                                handleRemoveMember(
                                  memberId,
                                  member.firstName && member.lastName
                                    ? `${member.firstName} ${member.lastName}`
                                    : member.userName,
                                );
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Member
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {member.email}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {getRoleIcon(member.userRole)}
                      <Badge
                        variant="outline"
                        className={cn("text-xs", getRoleColor(member.userRole))}
                      >
                        {formatRole(member.userRole)}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            member.isActive ? "bg-green-500" : "bg-gray-400",
                          )}
                        />
                        <span className="text-xs text-gray-500">
                          {member.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredMembers.length === 0 && (
          <Card className="modern-card">
            <CardContent className="p-8 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No team members found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Get started by inviting your first team member"}
              </p>
              {canCreate() && (
                <Button
                  className="modern-button"
                  onClick={() => setShowAddMemberModal(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit Member Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
              <DialogDescription>
                Update information for {selectedMember?.firstName}{" "}
                {selectedMember?.lastName}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">First Name *</Label>
                  <Input
                    id="edit-firstName"
                    value={editFormData.firstName}
                    onChange={(e) =>
                      handleEditInputChange("firstName", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Last Name *</Label>
                  <Input
                    id="edit-lastName"
                    value={editFormData.lastName}
                    onChange={(e) =>
                      handleEditInputChange("lastName", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) =>
                      handleEditInputChange("email", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-userName">Username *</Label>
                  <Input
                    id="edit-userName"
                    value={editFormData.userName}
                    onChange={(e) =>
                      handleEditInputChange("userName", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-userRole">Role *</Label>
                  <Select
                    value={editFormData.userRole}
                    onValueChange={(value) =>
                      handleEditInputChange("userRole", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="team_member">Team Member</SelectItem>
                      <SelectItem value="project_manager">
                        Project Manager
                      </SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Member"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Member Modal */}
        <AddMemberModal
          open={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          onSuccess={handleAddMemberSuccess}
          tenantId={getCurrentTenantId() || ""}
        />
      </div>
    </DashboardLayout>
  );
}
