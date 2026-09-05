"use client";

import React, { useState } from "react";
import { useRBAC } from "@/src/contexts/RBACContext";
import { usePermissions } from "@/src/hooks/usePermissions";
import { useCrudPermissions } from "@/src/hooks/usePermissions";
import { PermissionGuard } from "@/src/components/guards/PermissionGuard";
import { DashboardLayout } from "../../components/layout";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import {
  Users,
  UserPlus,
  Shield,
  Settings,
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { CreateUserModal } from "@/src/components/users/CreateUserModal";
import { EditUserModal } from "@/src/components/users/EditUserModal";
import { RoleManagementModal } from "@/src/components/users/RoleManagementModal";
import { extractErrorMessage } from "@/src/utils/errorUtils";
import { toast } from "sonner";

export default function UserManagementPage() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions("users");
  const {
    tenantUsers,
    roles,
    loading,
    removeTenantUser,
    forceDeleteTenantUser,
  } = useRBAC();
  const { canManageUsers, hasPermission, isOwner } = usePermissions();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showForceDeleteModal, setShowForceDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isForceDeleting, setIsForceDeleting] = useState(false);

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleRemoveUser = (user: any) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleForceDeleteUser = (user: any) => {
    setUserToDelete(user);
    setShowForceDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      await removeTenantUser(userToDelete.id);
      setShowDeleteModal(false);
      setUserToDelete(null);
      toast.success("User removed successfully");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to remove user"));
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmForceDeleteUser = async () => {
    if (!userToDelete) return;

    setIsForceDeleting(true);
    try {
      await forceDeleteTenantUser(userToDelete.id);
      setShowForceDeleteModal(false);
      setUserToDelete(null);
      toast.success("User and associated records deleted successfully");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to force delete user"));
    } finally {
      setIsForceDeleting(false);
    }
  };

  const getRoleDisplayName = (roleName: string) => {
    return roleName.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getInitials = (
    firstName?: string,
    lastName?: string,
    userName?: string,
  ) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (userName) {
      return userName.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <PermissionGuard
          permission="users:view"
          fallback={
            <div className="text-center py-12 text-muted-foreground">
              You do not have permission to view user management.
            </div>
          }
          redirectTo={null}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-muted-foreground">
                Manage users and their permissions within your organization
              </p>
            </div>
            {canManageUsers() && (
              <div className="flex flex-wrap gap-2">
                {(isOwner() || hasPermission("users:update")) && (
                  <Button
                    variant="outline"
                    onClick={() => setShowRoleModal(true)}
                    className="flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Manage Roles
                  </Button>
                )}
                {canCreate() && (
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add User
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tenantUsers.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tenantUsers.filter((u) => u.isActive).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Roles</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roles.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Owners</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tenantUsers.filter((u) => u.role?.name === "owner").length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {tenantUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>
                            {getInitials(
                              user.firstName,
                              user.lastName,
                              user.userName,
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.userName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={user.isActive ? "default" : "secondary"}
                            >
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {user.role && (
                              <Badge variant="outline">
                                {getRoleDisplayName(user.role.name)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm text-muted-foreground">
                          Joined {new Date(user.joinedAt).toLocaleDateString()}
                        </div>
                        {canManageUsers() && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canUpdate() && (
                                <DropdownMenuItem
                                  onClick={() => handleEditUser(user)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit User
                                </DropdownMenuItem>
                              )}
                              {canDelete() && (
                                <DropdownMenuItem
                                  onClick={() => handleRemoveUser(user)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove User
                                </DropdownMenuItem>
                              )}
                              {canDelete() && (
                                <DropdownMenuItem
                                  onClick={() => handleForceDeleteUser(user)}
                                  className="text-destructive"
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Force Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                  {tenantUsers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No users found. Add your first user to get started.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modals */}
          <CreateUserModal
            open={showCreateModal}
            onOpenChange={setShowCreateModal}
            onSuccess={() => {
              setShowCreateModal(false);
            }}
          />

          <EditUserModal
            open={showEditModal}
            onOpenChange={setShowEditModal}
            user={selectedUser}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
          />

          <RoleManagementModal
            open={showRoleModal}
            onOpenChange={setShowRoleModal}
            onSuccess={() => {
              setShowRoleModal(false);
            }}
          />

          <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-destructive" />
                  Remove User
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to remove{" "}
                  <strong>
                    {userToDelete?.firstName && userToDelete?.lastName
                      ? `${userToDelete.firstName} ${userToDelete.lastName}`
                      : userToDelete?.userName}
                  </strong>{" "}
                  from the tenant? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              {userToDelete && (
                <div className="py-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-medium">{userToDelete.userName}</p>
                    <p className="text-sm text-muted-foreground">
                      {userToDelete.email}
                    </p>
                    {userToDelete.role && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Role: {getRoleDisplayName(userToDelete.role.name)}
                      </p>
                    )}
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteUser}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove User
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={showForceDeleteModal}
            onOpenChange={setShowForceDeleteModal}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Force Delete User
                </DialogTitle>
                <DialogDescription>
                  This will permanently delete{" "}
                  <strong>
                    {userToDelete?.firstName && userToDelete?.lastName
                      ? `${userToDelete.firstName} ${userToDelete.lastName}`
                      : userToDelete?.userName}
                  </strong>{" "}
                  and remove all records associated with them in this
                  organization. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              {userToDelete && (
                <div className="py-4">
                  <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                    <p className="font-medium text-destructive">
                      Warning: Destructive action
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      All tasks, assignments, notifications, and other data
                      linked to this user within your organization will be
                      deleted or cleared.
                    </p>
                    <p className="font-medium mt-3">{userToDelete.userName}</p>
                    <p className="text-sm text-muted-foreground">
                      {userToDelete.email}
                    </p>
                    {userToDelete.role && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Role: {getRoleDisplayName(userToDelete.role.name)}
                      </p>
                    )}
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForceDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  disabled={isForceDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmForceDeleteUser}
                  disabled={isForceDeleting}
                >
                  {isForceDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Force Deleting...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Force Delete
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </PermissionGuard>
      </div>
    </DashboardLayout>
  );
}
