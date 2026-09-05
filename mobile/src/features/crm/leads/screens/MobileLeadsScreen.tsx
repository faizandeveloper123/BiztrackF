import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../../contexts/SidebarDrawerContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { OptionSheet } from '../../../../components/crm/OptionSheet';
import { extractErrorMessage } from '../../../../utils/errorUtils';
import {
  CRMLeadFilters,
  Lead,
  LeadCreate,
  LeadSource,
  LeadStatus,
  LeadUpdate,
} from '../../../../models/crm';
import {
  fetchLeadsPaged,
  createLeadApi,
  updateLeadApi,
  deleteLeadApi,
} from '../../../../services/crm/leadsApi';
import {
  formatCrmDate,
  formatUsd,
  getLeadStatusBadgeClass,
} from '../../../../services/crm/CrmMobileService';
import { AppModal } from '../../../../components/layout/AppModal';
import { KeyboardBottomSheetShell } from '../../../../components/layout/KeyboardBottomSheetShell';
import {
  FormInput,
  FormSection,
  FormSelect,
  MobileFormSheet,
} from '../../../../components/layout/MobileForm';

const ITEMS_PER_PAGE = 10;
const FILTER_ANY = 'all';

type FormState = LeadCreate & { tagsText: string };

function leadSourceLabel(lead: Lead): string {
  const raw = String(lead.leadSource ?? lead.source ?? '');
  return raw
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function statusBadgeStyle(status: string): string {
  const cls = getLeadStatusBadgeClass(status || 'new');
  if (cls.includes('blue')) return 'bg-blue-100';
  if (cls.includes('yellow') || cls.includes('amber')) return 'bg-amber-100';
  if (cls.includes('green')) return 'bg-green-100';
  if (cls.includes('purple')) return 'bg-purple-100';
  if (cls.includes('orange')) return 'bg-orange-100';
  if (cls.includes('red')) return 'bg-red-100';
  return 'bg-slate-100';
}

function statusTextStyle(status: string): string {
  const cls = getLeadStatusBadgeClass(status || 'new');
  if (cls.includes('blue')) return 'text-blue-800';
  if (cls.includes('yellow') || cls.includes('amber')) return 'text-amber-800';
  if (cls.includes('green')) return 'text-green-800';
  if (cls.includes('purple')) return 'text-purple-800';
  if (cls.includes('orange')) return 'text-orange-800';
  if (cls.includes('red')) return 'text-red-800';
  return 'text-slate-800';
}

function buildEmptyForm(): FormState {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    status: LeadStatus.NEW,
    source: LeadSource.WEBSITE,
    notes: '',
    tags: [],
    tagsText: '',
    score: 0,
    budget: undefined,
    timeline: '',
  };
}

export function MobileLeadsScreen() {
  const { user, currentTenant, logout } = useAuth();
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<CRMLeadFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [sourceFilterOpen, setSourceFilterOpen] = useState(false);
  const [formStatusOpen, setFormStatusOpen] = useState(false);
  const [formSourceOpen, setFormSourceOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  const [form, setForm] = useState<FormState>(() => buildEmptyForm());
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  const appliedFilters = useMemo((): CRMLeadFilters => {
    const t = searchTerm.trim();
    return { ...filters, search: t || undefined };
  }, [filters, searchTerm]);

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchLeadsPaged(
        appliedFilters,
        currentPage,
        ITEMS_PER_PAGE,
      );
      setLeads(res.leads ?? []);
      setTotalPages(Math.max(1, res.pagination?.pages ?? 1));
      setTotalCount(res.pagination?.total ?? 0);
    } catch (e) {
      Alert.alert('Leads', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, currentPage]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/crm/leads',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedFilters]);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLeads();
    setRefreshing(false);
  }, [loadLeads]);

  const resetForm = useCallback(() => {
    setForm(buildEmptyForm());
    setEditingLead(null);
  }, []);

  const statusFilterOptions = useMemo(
    () => [
      { value: FILTER_ANY, label: 'All statuses' },
      ...Object.values(LeadStatus).map((s) => ({
        value: s,
        label: s.charAt(0).toUpperCase() + s.slice(1),
      })),
    ],
    [],
  );

  const sourceFilterOptions = useMemo(
    () => [
      { value: FILTER_ANY, label: 'All sources' },
      ...Object.values(LeadSource).map((s) => ({
        value: s,
        label: s
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
      })),
    ],
    [],
  );

  const formStatusOptions = useMemo(
    () =>
      Object.values(LeadStatus).map((s) => ({
        value: s,
        label: s.charAt(0).toUpperCase() + s.slice(1),
      })),
    [],
  );

  const formSourceOptions = useMemo(
    () =>
      Object.values(LeadSource).map((s) => ({
        value: s,
        label: s
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
      })),
    [],
  );

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    setForm({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone || '',
      company: lead.company || '',
      jobTitle: lead.jobTitle || '',
      status: lead.status,
      source: lead.source,
      notes: lead.notes || '',
      tags: lead.tags || [],
      tagsText: lead.tags?.join(', ') || '',
      score: lead.score,
      budget: lead.budget,
      timeline: lead.timeline || '',
    });
    setEditOpen(true);
  };

  const submitSave = async () => {
    if (!form.firstName?.trim() || !form.lastName?.trim() || !form.email?.trim()) {
      Alert.alert('Lead', 'First name, last name, and email are required.');
      return;
    }
    const tags = form.tagsText
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    try {
      if (editingLead) {
        const payload: LeadUpdate = {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || undefined,
          company: form.company || undefined,
          jobTitle: form.jobTitle || undefined,
          status: form.status,
          source: form.source,
          notes: form.notes || undefined,
          tags,
          score: form.score,
          budget: form.budget,
          timeline: form.timeline || undefined,
        };
        await updateLeadApi(editingLead.id, payload);
        setEditOpen(false);
      } else {
        const payload: LeadCreate = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone || undefined,
          company: form.company || undefined,
          jobTitle: form.jobTitle || undefined,
          status: form.status,
          source: form.source,
          notes: form.notes || undefined,
          tags,
          score: form.score ?? 0,
          budget: form.budget,
          timeline: form.timeline || undefined,
        };
        await createLeadApi(payload);
        setCreateOpen(false);
      }
      resetForm();
      await loadLeads();
      Alert.alert('Lead', editingLead ? 'Updated.' : 'Created.');
    } catch (e) {
      Alert.alert('Lead', extractErrorMessage(e, 'Save failed'));
    }
  };

  const confirmDelete = async () => {
    if (!leadToDelete) return;
    try {
      await deleteLeadApi(leadToDelete.id);
      setDeleteOpen(false);
      setLeadToDelete(null);
      await loadLeads();
      Alert.alert('Lead', 'Deleted.');
    } catch (e) {
      Alert.alert('Lead', extractErrorMessage(e, 'Delete failed'));
    }
  };

  const userLabel = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
    ? `${[user?.firstName, user?.lastName].filter(Boolean).join(' ')} · ${user?.email ?? ''}`
    : user?.email ?? '';

  const renderForm = () => (
    <ScrollView
      className="max-h-[80%]"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View className="mt-2 gap-3">
        {(
          [
            ['firstName', 'First name *', 'First'],
            ['lastName', 'Last name *', 'Last'],
            ['email', 'Email *', 'email@'],
          ] as const
        ).map(([k, label, ph]) => (
          <View key={k}>
            <Text className="mb-1 text-xs font-medium text-slate-600">{label}</Text>
            <TextInput
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
              value={String(form[k] ?? '')}
              onChangeText={(t) => setForm((p) => ({ ...p, [k]: t } as FormState))}
              placeholder={ph}
              autoCapitalize={k === 'email' ? 'none' : 'words'}
              keyboardType={k === 'email' ? 'email-address' : 'default'}
            />
          </View>
        ))}
        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">Phone</Text>
          <TextInput
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
            value={form.phone || ''}
            onChangeText={(t) => setForm((p) => ({ ...p, phone: t }))}
            keyboardType="phone-pad"
          />
        </View>
        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">Company</Text>
          <TextInput
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
            value={form.company || ''}
            onChangeText={(t) => setForm((p) => ({ ...p, company: t }))}
          />
        </View>
        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">Job title</Text>
          <TextInput
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
            value={form.jobTitle || ''}
            onChangeText={(t) => setForm((p) => ({ ...p, jobTitle: t }))}
          />
        </View>
        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">Status</Text>
          <Pressable
            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            onPress={() => setFormStatusOpen(true)}
          >
            <Text className="text-slate-900 capitalize">
              {form.status ? String(form.status) : ''}
            </Text>
          </Pressable>
        </View>
        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">Source</Text>
          <Pressable
            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            onPress={() => setFormSourceOpen(true)}
          >
            <Text className="text-slate-900">
              {form.source
                ? form.source
                  .split('_')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ')
                : ''}
            </Text>
          </Pressable>
        </View>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Text className="mb-1 text-xs font-medium text-slate-600">Score</Text>
            <TextInput
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
              value={String(form.score ?? 0)}
              onChangeText={(t) =>
                setForm((p) => ({
                  ...p,
                  score: parseInt(t.replace(/[^0-9-]/g, ''), 10) || 0,
                }))
              }
              keyboardType="number-pad"
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-xs font-medium text-slate-600">Budget</Text>
            <TextInput
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
              value={form.budget != null ? String(form.budget) : ''}
              onChangeText={(t) =>
                setForm((p) => ({
                  ...p,
                  budget: t.trim()
                    ? parseFloat(t.replace(/[^0-9.-]/g, ''))
                    : undefined,
                }))
              }
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">Timeline</Text>
          <TextInput
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
            value={form.timeline || ''}
            onChangeText={(t) => setForm((p) => ({ ...p, timeline: t }))}
            placeholder="e.g. Q2"
          />
        </View>
        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">
            Tags (comma separated)
          </Text>
          <TextInput
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
            value={form.tagsText}
            onChangeText={(t) => setForm((p) => ({ ...p, tagsText: t }))}
          />
        </View>
        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">Notes</Text>
          <TextInput
            className="min-h-[88px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
            value={form.notes || ''}
            onChangeText={(t) => setForm((p) => ({ ...p, notes: t }))}
            multiline
            textAlignVertical="top"
          />
        </View>
      </View>
    </ScrollView>
  );

  const listHeader = (
    <View className="pb-2">
      <View className="border-b border-slate-200 bg-white px-4 pb-4 pt-2">
        <View className="flex-row items-start justify-between gap-2">
          <View className="min-w-0 flex-1 flex-row items-start gap-2">
            <MenuHeaderButton />
            <View className="min-w-0 flex-1">
              <Text className="text-2xl font-bold text-indigo-700">Leads</Text>
              <Text className="mt-1 text-sm text-slate-600">
                Pipeline and qualification
              </Text>
              {currentTenant ? (
                <Text className="mt-1 text-xs text-slate-500" numberOfLines={2}>
                  {currentTenant.name}
                  {userLabel ? ` · ${userLabel}` : ''}
                </Text>
              ) : null}
            </View>
          </View>
          <Pressable
            className="rounded-lg border border-slate-200 px-3 py-2 active:bg-slate-100"
            onPress={() => void logout()}
          >
            <Text className="text-sm font-medium text-slate-700">Sign out</Text>
          </Pressable>
        </View>
        <Pressable
          className="mt-3 self-start rounded-lg bg-indigo-600 px-3 py-2 active:bg-indigo-700"
          onPress={openCreate}
        >
          <Text className="text-sm font-semibold text-white">New lead</Text>
        </Pressable>
      </View>

      <View className="mt-4 px-4">
        <Text className="mb-2 text-sm font-semibold text-slate-700">Search</Text>
        <View className="rounded-xl border border-slate-200 bg-white p-3">
          <View className="flex-row items-center rounded-lg border border-slate-200 bg-slate-50 px-3">
            <Ionicons name="search-outline" size={18} color="#94a3b8" />
            <TextInput
              className="ml-2 flex-1 py-2 text-sm text-slate-900"
              placeholder="Search leads…"
              placeholderTextColor="#94a3b8"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          <View className="mt-3 flex-row gap-2">
            <Pressable
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2"
              onPress={() => setStatusFilterOpen(true)}
            >
              <Text className="text-center text-xs font-semibold text-slate-700">
                Status:{' '}
                {filters.status
                  ? String(filters.status)
                  : 'all'}
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2"
              onPress={() => setSourceFilterOpen(true)}
            >
              <Text className="text-center text-xs font-semibold text-slate-700">
                Source:{' '}
                {filters.source
                  ? String(filters.source)
                    .split('_')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')
                  : 'all'}
              </Text>
            </Pressable>
          </View>
          <Pressable
            className="mt-3"
            onPress={() => {
              setFilters({});
              setSearchTerm('');
            }}
          >
            <Text className="text-center text-sm font-semibold text-slate-600">
              Reset filters
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="mt-4 px-4">
        <Text className="text-base font-semibold text-slate-900">Lead list</Text>
        <Text className="text-sm text-slate-500">
          {totalCount > 0
            ? `Page ${currentPage} of ${totalPages} · ${totalCount} total`
            : 'No leads'}
        </Text>
      </View>
    </View>
  );

  const listFooter = (
    <View className="px-4 pb-8 pt-4">
      {totalPages > 1 ? (
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-slate-600">
            Page {currentPage} / {totalPages}
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              disabled={currentPage <= 1}
              onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={`rounded-lg border px-4 py-2 ${currentPage <= 1 ? 'border-slate-100 opacity-50' : 'border-slate-300'
                }`}
            >
              <Text className="font-semibold text-slate-800">Previous</Text>
            </Pressable>
            <Pressable
              disabled={currentPage >= totalPages}
              onPress={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              className={`rounded-lg border px-4 py-2 ${currentPage >= totalPages
                  ? 'border-slate-100 opacity-50'
                  : 'border-slate-300'
                }`}
            >
              <Text className="font-semibold text-slate-800">Next</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <FlatList
        data={leads}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
        ListEmptyComponent={
          loading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : (
            <Text className="px-4 py-8 text-center text-slate-500">
              No leads match your filters.
            </Text>
          )
        }
        renderItem={({ item: lead }) => {
          const st = lead.status ?? 'new';
          return (
            <View className="mx-4 mb-3 rounded-xl border border-slate-200 bg-white p-4">
              <View className="flex-row items-start justify-between gap-2">
                <Pressable
                  className="min-w-0 flex-1"
                  onPress={() => {
                    setViewingLead(lead);
                    setViewOpen(true);
                  }}
                >
                  <Text className="text-lg font-semibold text-slate-900">
                    {lead.firstName} {lead.lastName}
                  </Text>
                  <Text className="text-sm text-slate-600">{lead.email}</Text>
                  {lead.company ? (
                    <Text className="text-sm text-slate-600">{lead.company}</Text>
                  ) : null}
                  <View className="mt-2 flex-row flex-wrap gap-2">
                    <View className={`rounded-full px-2 py-0.5 ${statusBadgeStyle(st)}`}>
                      <Text className={`text-xs font-medium capitalize ${statusTextStyle(st)}`}>
                        {String(st)}
                      </Text>
                    </View>
                    <View className="rounded-full border border-slate-200 bg-white px-2 py-0.5">
                      <Text className="text-xs font-medium text-slate-700">
                        {leadSourceLabel(lead)}
                      </Text>
                    </View>
                    {lead.score > 0 ? (
                      <View className="rounded-full bg-slate-100 px-2 py-0.5">
                        <Text className="text-xs font-medium text-slate-700">
                          Score {lead.score}
                        </Text>
                      </View>
                    ) : null}
                    {lead.budget != null && lead.budget > 0 ? (
                      <View className="rounded-full bg-emerald-50 px-2 py-0.5">
                        <Text className="text-xs font-medium text-emerald-800">
                          {formatUsd(lead.budget)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text className="mt-1 text-xs text-slate-400">
                    {formatCrmDate(lead.createdAt)}
                  </Text>
                </Pressable>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => {
                      setViewingLead(lead);
                      setViewOpen(true);
                    }}
                    className="rounded-lg bg-slate-100 p-2"
                  >
                    <Ionicons name="eye-outline" size={18} color="#334155" />
                  </Pressable>
                  <Pressable
                    onPress={() => openEdit(lead)}
                    className="rounded-lg bg-slate-100 p-2"
                  >
                    <Ionicons name="pencil-outline" size={18} color="#334155" />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setLeadToDelete(lead);
                      setDeleteOpen(true);
                    }}
                    className="rounded-lg bg-red-50 p-2"
                  >
                    <Ionicons name="trash-outline" size={18} color="#b91c1c" />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
      />

      <OptionSheet
        visible={statusFilterOpen}
        title="Status"
        options={statusFilterOptions}
        onSelect={(v) =>
          setFilters((f) => ({
            ...f,
            status: v === FILTER_ANY ? undefined : (v as LeadStatus),
          }))
        }
        onClose={() => setStatusFilterOpen(false)}
      />
      <OptionSheet
        visible={sourceFilterOpen}
        title="Source"
        options={sourceFilterOptions}
        onSelect={(v) =>
          setFilters((f) => ({
            ...f,
            source: v === FILTER_ANY ? undefined : (v as LeadSource),
          }))
        }
        onClose={() => setSourceFilterOpen(false)}
      />
      <OptionSheet
        visible={formStatusOpen}
        title="Status"
        options={formStatusOptions}
        onSelect={(v) =>
          setForm((p) => ({ ...p, status: v as LeadStatus }))
        }
        onClose={() => setFormStatusOpen(false)}
      />
      <OptionSheet
        visible={formSourceOpen}
        title="Source"
        options={formSourceOptions}
        onSelect={(v) =>
          setForm((p) => ({ ...p, source: v as LeadSource }))
        }
        onClose={() => setFormSourceOpen(false)}
      />

      <MobileFormSheet
        visible={createOpen}
        title="New Lead"
        onCancel={() => {
          setCreateOpen(false);
          resetForm();
        }}
        onSave={() => void submitSave()}
        saveLabel="Create"
      >
            <FormSection title="Personal Information">
              <FormInput
                label="First Name"
                icon="person-outline"
                value={form.firstName}
                onChangeText={(t) => setForm(p => ({ ...p, firstName: t }))}
                placeholder="John"
                autoCapitalize="words"
              />
              <FormInput
                label="Last Name"
                icon="person-outline"
                value={form.lastName}
                onChangeText={(t) => setForm(p => ({ ...p, lastName: t }))}
                placeholder="Doe"
                autoCapitalize="words"
              />
              <FormInput
                label="Email Address"
                icon="mail-outline"
                value={form.email}
                onChangeText={(t) => setForm(p => ({ ...p, email: t }))}
                placeholder="john.doe@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <FormInput
                label="Phone Number"
                icon="call-outline"
                value={form.phone || ''}
                onChangeText={(t) => setForm(p => ({ ...p, phone: t }))}
                placeholder="+1 (555) 000-0000"
                keyboardType="phone-pad"
                last
              />
            </FormSection>

            <FormSection title="Professional Background">
              <FormInput
                label="Company Name"
                icon="business-outline"
                value={form.company || ''}
                onChangeText={(t) => setForm(p => ({ ...p, company: t }))}
                placeholder="Acme Corp"
              />
              <FormInput
                label="Job Title"
                icon="briefcase-outline"
                value={form.jobTitle || ''}
                onChangeText={(t) => setForm(p => ({ ...p, jobTitle: t }))}
                placeholder="Manager"
                last
              />
            </FormSection>

            <FormSection title="Lead Qualification">
              <FormSelect
                label="Current Status"
                icon="flag-outline"
                value={form.status ? String(form.status) : ''}
                onPress={() => setFormStatusOpen(true)}
              />
              <FormSelect
                label="Lead Source"
                icon="share-social-outline"
                value={form.source ? form.source.replace(/_/g, ' ') : ''}
                onPress={() => setFormSourceOpen(true)}
              />
              <FormInput
                label="Lead Score"
                icon="star-outline"
                value={String(form.score ?? 0)}
                onChangeText={(t) => setForm(p => ({ ...p, score: parseInt(t.replace(/[^0-9-]/g, ''), 10) || 0 }))}
                keyboardType="number-pad"
              />
              <FormInput
                label="Budget"
                icon="cash-outline"
                value={form.budget != null ? String(form.budget) : ''}
                onChangeText={(t) => setForm(p => ({ ...p, budget: t.trim() ? parseFloat(t.replace(/[^0-9.-]/g, '')) : undefined }))}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
              <FormInput
                label="Timeline / Deadline"
                icon="timer-outline"
                value={form.timeline || ''}
                onChangeText={(t) => setForm(p => ({ ...p, timeline: t }))}
                placeholder="e.g. Q3"
                last
              />
            </FormSection>

            <FormSection title="Additional Context">
              <FormInput
                label="Tags (comma separated)"
                icon="pricetags-outline"
                value={form.tagsText}
                onChangeText={(t) => setForm(p => ({ ...p, tagsText: t }))}
                placeholder="high-value, urgent..."
              />
              <FormInput
                label="Internal Notes"
                icon="musical-notes-outline"
                value={form.notes || ''}
                onChangeText={(t) => setForm(p => ({ ...p, notes: t }))}
                multiline
                placeholder="Private information about the lead..."
                last
              />
            </FormSection>
      </MobileFormSheet>

      <MobileFormSheet
        visible={editOpen}
        title="Edit Lead"
        onCancel={() => {
          setEditOpen(false);
          resetForm();
        }}
        onSave={() => void submitSave()}
      >
            <FormSection title="Personal Information">
              <FormInput
                label="First Name"
                icon="person-outline"
                value={form.firstName}
                onChangeText={(t) => setForm(p => ({ ...p, firstName: t }))}
                autoCapitalize="words"
              />
              <FormInput
                label="Last Name"
                icon="person-outline"
                value={form.lastName}
                onChangeText={(t) => setForm(p => ({ ...p, lastName: t }))}
                autoCapitalize="words"
              />
              <FormInput
                label="Email Address"
                icon="mail-outline"
                value={form.email}
                onChangeText={(t) => setForm(p => ({ ...p, email: t }))}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <FormInput
                label="Phone Number"
                icon="call-outline"
                value={form.phone || ''}
                onChangeText={(t) => setForm(p => ({ ...p, phone: t }))}
                keyboardType="phone-pad"
                last
              />
            </FormSection>

            <FormSection title="Professional Background">
              <FormInput
                label="Company Name"
                icon="business-outline"
                value={form.company || ''}
                onChangeText={(t) => setForm(p => ({ ...p, company: t }))}
              />
              <FormInput
                label="Job Title"
                icon="briefcase-outline"
                value={form.jobTitle || ''}
                onChangeText={(t) => setForm(p => ({ ...p, jobTitle: t }))}
                last
              />
            </FormSection>

            <FormSection title="Lead Qualification">
              <FormSelect
                label="Current Status"
                icon="flag-outline"
                value={form.status ? String(form.status) : ''}
                onPress={() => setFormStatusOpen(true)}
              />
              <FormSelect
                label="Lead Source"
                icon="share-social-outline"
                value={form.source ? form.source.replace(/_/g, ' ') : ''}
                onPress={() => setFormSourceOpen(true)}
              />
              <FormInput
                label="Lead Score"
                icon="star-outline"
                value={String(form.score ?? 0)}
                onChangeText={(t) => setForm(p => ({ ...p, score: parseInt(t.replace(/[^0-9-]/g, ''), 10) || 0 }))}
                keyboardType="number-pad"
              />
              <FormInput
                label="Budget"
                icon="cash-outline"
                value={form.budget != null ? String(form.budget) : ''}
                onChangeText={(t) => setForm(p => ({ ...p, budget: t.trim() ? parseFloat(t.replace(/[^0-9.-]/g, '')) : undefined }))}
                keyboardType="decimal-pad"
              />
              <FormInput
                label="Timeline"
                icon="timer-outline"
                value={form.timeline || ''}
                onChangeText={(t) => setForm(p => ({ ...p, timeline: t }))}
                last
              />
            </FormSection>

            <FormSection title="Additional Context">
              <FormInput
                label="Tags (comma separated)"
                icon="pricetags-outline"
                value={form.tagsText}
                onChangeText={(t) => setForm(p => ({ ...p, tagsText: t }))}
              />
              <FormInput
                label="Internal Notes"
                icon="musical-notes-outline"
                value={form.notes || ''}
                onChangeText={(t) => setForm(p => ({ ...p, notes: t }))}
                multiline
                last
              />
            </FormSection>
      </MobileFormSheet>

      <AppModal
        visible={deleteOpen}
        transparent
        animationType="fade"
        onClose={() => setDeleteOpen(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full max-w-sm rounded-2xl bg-white p-5">
            <Text className="text-lg font-bold text-slate-900">Delete lead</Text>
            <Text className="mt-2 text-slate-600">
              Delete {leadToDelete?.firstName} {leadToDelete?.lastName}?
            </Text>
            <View className="mt-4 flex-row justify-end gap-2">
              <Pressable
                className="rounded-lg border border-slate-300 px-4 py-2"
                onPress={() => {
                  setDeleteOpen(false);
                  setLeadToDelete(null);
                }}
              >
                <Text className="font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                className="rounded-lg bg-red-600 px-4 py-2 active:bg-red-700"
                onPress={() => void confirmDelete()}
              >
                <Text className="font-semibold text-white">Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </AppModal>

      <AppModal
        visible={viewOpen}
        animationType="slide"
        transparent
        onClose={() => setViewOpen(false)}
      >
        <KeyboardBottomSheetShell overlayColor="rgba(0,0,0,0.4)">
          <View className="max-h-[90%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="text-lg font-bold text-slate-900">Lead</Text>
            {viewingLead ? (
              <ScrollView className="mt-3">
                <Text className="text-xl font-semibold text-slate-900">
                  {viewingLead.firstName} {viewingLead.lastName}
                </Text>
                <Text className="text-sm text-slate-600">{viewingLead.email}</Text>
                <Text className="mt-2 text-sm text-slate-700">
                  {viewingLead.phone || '—'} · {viewingLead.company || '—'}
                </Text>
                <Text className="mt-2 text-sm text-slate-800">
                  Status {String(viewingLead.status)} · {leadSourceLabel(viewingLead)}
                </Text>
                {viewingLead.notes ? (
                  <Text className="mt-3 text-sm text-slate-800">{viewingLead.notes}</Text>
                ) : null}
              </ScrollView>
            ) : null}
            <View className="mt-4 flex-row gap-2">
              <Pressable
                className="flex-1 items-center rounded-lg border border-slate-300 py-3"
                onPress={() => {
                  setViewOpen(false);
                  setViewingLead(null);
                }}
              >
                <Text className="font-semibold text-slate-700">Close</Text>
              </Pressable>
              {viewingLead ? (
                <Pressable
                  className="flex-1 items-center rounded-lg bg-indigo-600 py-3 active:bg-indigo-700"
                  onPress={() => {
                    const x = viewingLead;
                    setViewOpen(false);
                    setViewingLead(null);
                    openEdit(x);
                  }}
                >
                  <Text className="font-semibold text-white">Edit</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </KeyboardBottomSheetShell>
      </AppModal>
    </View>
  );
}
