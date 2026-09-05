import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import type {
  HealthcareStaff,
  HealthcareStaffCreate,
  HealthcareStaffUpdate,
} from '../../../models/healthcare';
import { HEALTHCARE_PERMISSIONS } from '../../../models/healthcare';
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} from '../../../services/healthcare/healthcareMobileApi';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { AppModal } from '../../../components/layout/AppModal';
import { KeyboardBottomSheetShell } from '../../../components/layout/KeyboardBottomSheetShell';
import {
  HealthcareChrome,
  HealthcareCard,
  HealthcareFieldLabel,
  HealthcarePrimaryButton,
  HealthcareOutlineButton,
} from '../components/HealthcareChrome';

const PAGE_SIZE = 20;

const PERM_LABEL: Record<string, string> = {
  'healthcare:view': 'View',
  'healthcare:create': 'Create',
  'healthcare:update': 'Update',
  'healthcare:delete': 'Delete',
};

type FormState = {
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

const emptyForm: FormState = {
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  phone: '',
  role: '',
  permissions: ['healthcare:view'],
  is_active: true,
};

export function MobileHealthcareStaffScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [list, setList] = useState<HealthcareStaff[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HealthcareStaff | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    setSidebarActivePath('/healthcare/staff');
  }, [setSidebarActivePath]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced]);

  const load = useCallback(async () => {
    const res = await getStaff({
      search: debounced.trim() || undefined,
      is_active: true,
      page,
      limit: PAGE_SIZE,
    });
    setList(res.staff);
    setTotal(res.total);
  }, [debounced, page]);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await load();
      } catch (e) {
        Alert.alert('Staff', extractErrorMessage(e, 'Failed to load'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [load],
  );

  useEffect(() => {
    void run(false);
  }, [run]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const togglePerm = (perm: string, on: boolean) => {
    setForm((prev) => {
      const cur = new Set(prev.permissions);
      if (on) cur.add(perm);
      else cur.delete(perm);
      const next = Array.from(cur);
      if (!next.includes('healthcare:view')) next.push('healthcare:view');
      next.sort(
        (a, b) =>
          HEALTHCARE_PERMISSIONS.indexOf(a as (typeof HEALTHCARE_PERMISSIONS)[number]) -
          HEALTHCARE_PERMISSIONS.indexOf(b as (typeof HEALTHCARE_PERMISSIONS)[number]),
      );
      return { ...prev, permissions: next };
    });
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (s: HealthcareStaff) => {
    setEditing(s);
    const perms = (s.permissions as string[])?.length
      ? [...(s.permissions as string[])]
      : ['healthcare:view'];
    setForm({
      username: s.username,
      email: s.email,
      password: '',
      first_name: s.first_name ?? '',
      last_name: s.last_name ?? '',
      phone: s.phone ?? '',
      role: s.role ?? '',
      permissions: perms.includes('healthcare:view')
        ? perms
        : [...perms, 'healthcare:view'],
      is_active: s.is_active,
    });
    setFormOpen(true);
  };

  const submit = async () => {
    if (!form.username.trim() || !form.email.trim()) {
      Alert.alert('Staff', 'Username and email are required');
      return;
    }
    if (!editing && !form.password.trim()) {
      Alert.alert('Staff', 'Password is required for new staff');
      return;
    }
    try {
      setSubmitting(true);
      if (editing) {
        const payload: HealthcareStaffUpdate = {
          username: form.username.trim(),
          email: form.email.trim(),
          first_name: form.first_name.trim() || undefined,
          last_name: form.last_name.trim() || undefined,
          phone: form.phone.trim() || undefined,
          role: form.role.trim() || undefined,
          permissions: form.permissions as HealthcareStaffUpdate['permissions'],
          is_active: form.is_active,
        };
        if (form.password.trim()) payload.password = form.password.trim();
        await updateStaff(editing.id, payload);
      } else {
        const payload: HealthcareStaffCreate = {
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password.trim(),
          first_name: form.first_name.trim() || undefined,
          last_name: form.last_name.trim() || undefined,
          phone: form.phone.trim() || undefined,
          role: form.role.trim() || undefined,
          permissions: form.permissions as HealthcareStaffCreate['permissions'],
        };
        await createStaff(payload);
      }
      setFormOpen(false);
      await run(false);
    } catch (e) {
      Alert.alert('Staff', extractErrorMessage(e, 'Save failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = (s: HealthcareStaff) => {
    Alert.alert('Remove staff', `Remove ${s.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteStaff(s.id);
            setList((prev) => prev.filter((x) => x.id !== s.id));
            setTotal((prev) => Math.max(0, prev - 1));
            await run(false);
          } catch (e) {
            Alert.alert('Staff', extractErrorMessage(e, 'Delete failed'));
          }
        },
      },
    ]);
  };

  return (
    <HealthcareChrome
      title="Healthcare staff"
      subtitle="Portal users and permissions"
      right={
        <Pressable onPress={openAdd} className="p-2">
          <Ionicons name="add-circle" size={26} color="#0d9488" />
        </Pressable>
      }
      scroll={false}
    >
      <TextInput
        className="mb-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
        placeholder="Search…"
        placeholderTextColor="#94a3b8"
        value={search}
        onChangeText={setSearch}
      />

      {loading && !refreshing ? (
        <View className="py-12 items-center">
          <ActivityIndicator color="#0d9488" />
        </View>
      ) : (
        <FlatList
          className="flex-1"
          data={list}
          keyExtractor={(x) => x.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void run(true)}
              tintColor="#0d9488"
            />
          }
          ListEmptyComponent={
            <Text className="py-8 text-center text-slate-500">
              No staff found.
            </Text>
          }
          renderItem={({ item }) => (
            <HealthcareCard>
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-2">
                  <Text className="text-base font-semibold text-slate-900">
                    {item.username}
                  </Text>
                  <Text className="text-sm text-slate-600">{item.email}</Text>
                  <Text className="text-xs text-slate-500">
                    {(item.permissions as string[]).join(', ')}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <Pressable onPress={() => openEdit(item)} hitSlop={8}>
                    <Ionicons name="pencil" size={20} color="#475569" />
                  </Pressable>
                  <Pressable onPress={() => remove(item)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={20} color="#b91c1c" />
                  </Pressable>
                </View>
              </View>
            </HealthcareCard>
          )}
        />
      )}

      <View className="flex-row items-center justify-between py-4">
        <HealthcareOutlineButton
          label="Prev"
          onPress={() => setPage((p) => Math.max(1, p - 1))}
        />
        <Text className="text-sm text-slate-600">
          Page {page} / {totalPages}
        </Text>
        <HealthcareOutlineButton
          label="Next"
          onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      </View>

      <AppModal
        visible={formOpen}
        animationType="slide"
        transparent
        onClose={() => setFormOpen(false)}
      >
        <KeyboardBottomSheetShell overlayColor="rgba(0,0,0,0.4)">
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="mb-4 text-lg font-semibold text-slate-900">
              {editing ? 'Edit staff' : 'Add staff'}
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <HealthcareFieldLabel>Username *</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.username}
                onChangeText={(v) => setForm((f) => ({ ...f, username: v }))}
                autoCapitalize="none"
              />
              <HealthcareFieldLabel>Email *</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.email}
                onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <HealthcareFieldLabel>
                Password {editing ? '(leave blank to keep)' : '*'}
              </HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.password}
                onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
                secureTextEntry
              />
              <HealthcareFieldLabel>First name</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.first_name}
                onChangeText={(v) => setForm((f) => ({ ...f, first_name: v }))}
              />
              <HealthcareFieldLabel>Last name</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.last_name}
                onChangeText={(v) => setForm((f) => ({ ...f, last_name: v }))}
              />
              <HealthcareFieldLabel>Phone</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.phone}
                onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
                keyboardType="phone-pad"
              />
              <HealthcareFieldLabel>Role</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.role}
                onChangeText={(v) => setForm((f) => ({ ...f, role: v }))}
              />
              {editing ? (
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="text-slate-800">Active</Text>
                  <Switch
                    value={form.is_active}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, is_active: v }))
                    }
                  />
                </View>
              ) : null}
              <Text className="mb-2 font-semibold text-slate-800">
                Permissions
              </Text>
              {HEALTHCARE_PERMISSIONS.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => togglePerm(p, !form.permissions.includes(p))}
                  className="mb-2 flex-row items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <Text className="text-slate-800">{PERM_LABEL[p] ?? p}</Text>
                  <Ionicons
                    name={
                      form.permissions.includes(p)
                        ? 'checkbox'
                        : 'square-outline'
                    }
                    size={22}
                    color={form.permissions.includes(p) ? '#0d9488' : '#94a3b8'}
                  />
                </Pressable>
              ))}
            </ScrollView>
            <HealthcarePrimaryButton
              label={submitting ? 'Saving…' : 'Save'}
              onPress={() => void submit()}
              disabled={submitting}
            />
            <Pressable
              className="mt-3 items-center py-2"
              onPress={() => setFormOpen(false)}
            >
              <Text className="text-slate-600">Cancel</Text>
            </Pressable>
          </View>
        </KeyboardBottomSheetShell>
      </AppModal>
    </HealthcareChrome>
  );
}
