import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MobileFormSheet } from '../../../components/layout/MobileForm';
import {
  WorkshopChrome,
  WorkshopListCard,
  WorkshopStatCard,
  WorkshopLoading,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopPickerField,
  WS,
} from '../../workshop/components/WorkshopChrome';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { useRBAC, type CreateUserData, type UserWithPermissions } from '../../../contexts/RBACContext';
import { OptionSheet } from '../../../components/crm/OptionSheet';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appError } from '../../../utils/appDialog';
import { usePermissions } from '../../../hooks/usePermissions';

function roleLabel(name?: string): string {
  if (!name) return '';
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function MobileUsersScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const {
    tenantUsers,
    roles,
    loading,
    fetchTenantUsers,
    fetchRoles,
    createUser,
    updateTenantUser,
    removeTenantUser,
    isOwner,
  } = useRBAC();
  const { canManageUsers } = usePermissions();

  const [refreshing, setRefreshing] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<UserWithPermissions | null>(null);

  const [form, setForm] = useState<CreateUserData>({
    userName: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
  });
  const [roleId, setRoleId] = useState('');
  const [roleOpen, setRoleOpen] = useState(false);
  const [editRoleId, setEditRoleId] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editRolePickOpen, setEditRolePickOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    await Promise.all([fetchTenantUsers(), fetchRoles()]);
  }, [fetchTenantUsers, fetchRoles]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/users',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const stats = useMemo(() => {
    const total = tenantUsers.length;
    const active = tenantUsers.filter((u) => u.isActive).length;
    const owners = tenantUsers.filter((u) => u.role?.name === 'owner').length;
    return { total, active, owners, roleCount: roles.length };
  }, [tenantUsers, roles]);

  const roleOptions = useMemo(
    () => roles.map((r) => ({ value: r.id, label: r.display_name || r.name })),
    [roles],
  );

  const submitCreate = useCallback(async () => {
    if (!roleId) {
      appAlert('Users', 'Select a role.');
      return;
    }
    if (!form.email.trim() || !form.userName.trim() || !form.password) {
      appAlert('Users', 'Username, email, and password are required.');
      return;
    }
    try {
      setBusy(true);
      await createUser(
        {
          userName: form.userName.trim(),
          email: form.email.trim(),
          firstName: form.firstName?.trim() || undefined,
          lastName: form.lastName?.trim() || undefined,
          password: form.password,
        },
        roleId,
      );
      setCreateOpen(false);
      setForm({
        userName: '',
        email: '',
        firstName: '',
        lastName: '',
        password: '',
      });
      setRoleId('');
      await load();
    } catch (e) {
      appError('Users', extractErrorMessage(e, 'Could not create user'));
    } finally {
      setBusy(false);
    }
  }, [form, roleId, createUser, load]);

  const openEdit = useCallback((u: UserWithPermissions) => {
    setSelected(u);
    setEditRoleId(u.role_id || u.role?.id || '');
    setEditActive(u.isActive);
    setEditOpen(true);
  }, []);

  const submitEdit = useCallback(async () => {
    if (!selected || !editRoleId) {
      appAlert('Users', 'Select a role.');
      return;
    }
    const tenantUserId =
      selected.tenant_user_id !== undefined && selected.tenant_user_id !== ''
        ? selected.tenant_user_id
        : selected.id;
    try {
      setBusy(true);
      await updateTenantUser(tenantUserId, {
        role_id: editRoleId,
        isActive: editActive,
      });
      setEditOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      appError('Users', extractErrorMessage(e, 'Could not update'));
    } finally {
      setBusy(false);
    }
  }, [selected, editRoleId, editActive, updateTenantUser, load]);

  const confirmRemove = useCallback(
    (u: UserWithPermissions) => {
      setSelected(u);
      setDeleteOpen(true);
    },
    [],
  );

  const doRemove = useCallback(async () => {
    if (!selected) return;
    try {
      setBusy(true);
      await removeTenantUser(selected.id);
      setDeleteOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      appError('Users', extractErrorMessage(e, 'Could not remove'));
    } finally {
      setBusy(false);
    }
  }, [selected, removeTenantUser, load]);

  if (!isOwner()) {
    return (
      <WorkshopChrome title="Users" subtitle="Workspace members" scroll={false}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          <Text style={{ textAlign: 'center', fontSize: 17, fontWeight: '800', color: WS.text }}>
            User management
          </Text>
          <Text style={{ marginTop: 10, textAlign: 'center', color: WS.textMuted, lineHeight: 22 }}>
            Only the workspace owner can manage users. Use the web app for full
            role administration.
          </Text>
        </View>
      </WorkshopChrome>
    );
  }

  const openCreate = () => {
    setForm({
      userName: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
    });
    setRoleId(roles[0]?.id ?? '');
    setCreateOpen(true);
  };

  return (
    <>
      <WorkshopChrome
        title="Users"
        subtitle="Manage workspace members"
        right={
          canManageUsers() ? (
            <Pressable onPress={openCreate} style={{ paddingHorizontal: 4 }}>
              <Ionicons name="person-add-outline" size={26} color={WS.primary} />
            </Pressable>
          ) : (
            <View style={{ width: 72 }} />
          )
        }
        scroll={false}
      >
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={WS.primary} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            <WorkshopStatCard
              label="Total"
              value={stats.total}
              icon="people-outline"
              accent="#4f46e5"
              accentBg="#eef2ff"
            />
            <WorkshopStatCard
              label="Active"
              value={stats.active}
              icon="checkmark-circle-outline"
              accent="#059669"
              accentBg="#ecfdf5"
            />
            <WorkshopStatCard
              label="Roles"
              value={stats.roleCount}
              icon="shield-outline"
              accent="#7c3aed"
              accentBg="#f5f3ff"
            />
            <WorkshopStatCard
              label="Owners"
              value={stats.owners}
              icon="star-outline"
              accent="#d97706"
              accentBg="#fffbeb"
            />
          </View>

          <Text style={{ fontSize: 15, fontWeight: '700', color: WS.text, marginBottom: 10 }}>
            Members
          </Text>

          {loading && tenantUsers.length === 0 ? (
            <WorkshopLoading />
          ) : (
            tenantUsers.map((u) => (
              <WorkshopListCard
                key={u.id}
                icon="person"
                iconColor="#4f46e5"
                iconBg="#eef2ff"
                title={
                  u.firstName && u.lastName
                    ? `${u.firstName} ${u.lastName}`
                    : u.userName
                }
                subtitle={u.email}
                meta={`${u.isActive ? 'Active' : 'Inactive'}${u.role ? ` · ${roleLabel(u.role.name)}` : ''}`}
                actions={
                  canManageUsers()
                    ? [
                        { icon: 'pencil', onPress: () => openEdit(u) },
                        { icon: 'trash-outline', onPress: () => confirmRemove(u), danger: true },
                      ]
                    : undefined
                }
              />
            ))
          )}

          {!loading && tenantUsers.length === 0 ? (
            <Text style={{ paddingVertical: 24, textAlign: 'center', color: WS.textMuted }}>
              No users
            </Text>
          ) : null}

          <Text style={{ marginTop: 16, fontSize: 11, color: WS.textLight }}>
            Advanced role and permission editing is available on the web app.
          </Text>
        </ScrollView>
      </WorkshopChrome>

      <MobileFormSheet
        visible={createOpen}
        title="Add user"
        onCancel={() => setCreateOpen(false)}
        onSave={() => void submitCreate()}
        saveLabel="Create"
        saveLoading={busy}
      >
        <WorkshopFieldLabel>Username</WorkshopFieldLabel>
        <WorkshopTextInput
          autoCapitalize="none"
          value={form.userName}
          onChangeText={(t) => setForm((f) => ({ ...f, userName: t }))}
        />
        <WorkshopFieldLabel>Email</WorkshopFieldLabel>
        <WorkshopTextInput
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.email}
          onChangeText={(t) => setForm((f) => ({ ...f, email: t }))}
        />
        <WorkshopFieldLabel>First name</WorkshopFieldLabel>
        <WorkshopTextInput
          value={form.firstName}
          onChangeText={(t) => setForm((f) => ({ ...f, firstName: t }))}
        />
        <WorkshopFieldLabel>Last name</WorkshopFieldLabel>
        <WorkshopTextInput
          value={form.lastName}
          onChangeText={(t) => setForm((f) => ({ ...f, lastName: t }))}
        />
        <WorkshopFieldLabel>Password</WorkshopFieldLabel>
        <WorkshopTextInput
          secureTextEntry
          value={form.password}
          onChangeText={(t) => setForm((f) => ({ ...f, password: t }))}
        />
        <WorkshopPickerField
          label="Role"
          value={
            roles.find((r) => r.id === roleId)?.display_name ||
            roles.find((r) => r.id === roleId)?.name ||
            'Select'
          }
          onPress={() => setRoleOpen(true)}
        />
      </MobileFormSheet>

      <MobileFormSheet
        visible={editOpen}
        title="Edit user"
        onCancel={() => {
          setEditOpen(false);
          setSelected(null);
        }}
        onSave={() => void submitEdit()}
        saveLoading={busy}
      >
        <WorkshopPickerField
          label="Role"
          value={roles.find((r) => r.id === editRoleId)?.display_name || '—'}
          onPress={() => setEditRolePickOpen(true)}
        />
        <Pressable
          onPress={() => setEditActive((v) => !v)}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
        >
          <Ionicons
            name={editActive ? 'checkbox' : 'square-outline'}
            size={24}
            color={editActive ? WS.primary : WS.textLight}
          />
          <Text style={{ marginLeft: 10, color: WS.text }}>Active</Text>
        </Pressable>
      </MobileFormSheet>

      <WorkshopFormSheet
        visible={deleteOpen}
        title="Remove user"
        onClose={() => setDeleteOpen(false)}
        footer={
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Pressable
                  onPress={() => setDeleteOpen(false)}
                  style={{
                    alignItems: 'center',
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: WS.border,
                    paddingVertical: 15,
                  }}
                >
                  <Text style={{ fontWeight: '700', color: WS.textMuted }}>Cancel</Text>
                </Pressable>
              </View>
              <View style={{ flex: 1 }}>
                <Pressable
                  onPress={() => void doRemove()}
                  disabled={busy}
                  style={{
                    alignItems: 'center',
                    borderRadius: 14,
                    paddingVertical: 15,
                    backgroundColor: WS.danger,
                    opacity: busy ? 0.7 : 1,
                  }}
                >
                  <Text style={{ fontWeight: '700', fontSize: 16, color: '#fff' }}>Remove</Text>
                </Pressable>
              </View>
            </View>
          </View>
        }
      >
        <Text style={{ fontSize: 15, color: WS.textMuted, lineHeight: 22 }}>
          Remove {selected?.userName ?? ''} from this workspace?
        </Text>
      </WorkshopFormSheet>

      <OptionSheet
        visible={roleOpen}
        title="Role"
        options={roleOptions}
        onSelect={(v) => {
          setRoleId(v);
          setRoleOpen(false);
        }}
        onClose={() => setRoleOpen(false)}
      />
      <OptionSheet
        visible={editRolePickOpen}
        title="Role"
        options={roleOptions}
        onSelect={(v) => {
          setEditRoleId(v);
          setEditRolePickOpen(false);
        }}
        onClose={() => setEditRolePickOpen(false)}
      />
    </>
  );
}
