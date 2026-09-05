import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../../contexts/SidebarDrawerContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { OptionSheet } from '../../../../components/crm/OptionSheet';
import { extractErrorMessage } from '../../../../utils/errorUtils';
import { apiService } from '../../../../services/ApiService';
import type { User } from '../../../../models/auth';
import {
  Contact,
  Company,
  CRMOpportunityFilters,
  Lead,
  Opportunity,
  OpportunityCreate,
  OpportunityStage,
  OpportunityUpdate,
} from '../../../../models/crm';
import { fetchContacts } from '../../../../services/crm/contactsApi';
import { fetchCompaniesList } from '../../../../services/crm/companiesApi';
import { fetchLeadsPaged } from '../../../../services/crm/leadsApi';
import {
  fetchOpportunitiesPaged,
  createOpportunityApi,
  updateOpportunityApi,
  deleteOpportunityApi,
} from '../../../../services/crm/opportunitiesApi';
import {
  formatCrmDate,
  formatUsd,
  getOpportunityStageBadgeClass,
} from '../../../../services/crm/CrmMobileService';
import { AppModal } from '../../../../components/layout/AppModal';
import {
  FormInput,
  FormSection,
  FormSelect,
  MobileFormSheet,
} from '../../../../components/layout/MobileForm';
import { WorkshopDatePickerField } from '../../../workshop/components/WorkshopChrome';
import { KeyboardBottomSheetShell } from '../../../../components/layout/KeyboardBottomSheetShell';

const ITEMS_PER_PAGE = 10;
const FILTER_ANY = 'all';

type FormState = OpportunityCreate & { tagsText: string };

function assigneeLabel(u: User): string {
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  if (name) return name;
  return u.userName || u.email || (u.id || u.userId || '');
}

function stageLabel(stage: OpportunityStage): string {
  return stage
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function stageBadgeBg(stage: string): string {
  const cls = getOpportunityStageBadgeClass(stage);
  if (cls.includes('blue')) return 'bg-blue-100';
  if (cls.includes('yellow') || cls.includes('amber')) return 'bg-amber-100';
  if (cls.includes('purple')) return 'bg-purple-100';
  if (cls.includes('orange')) return 'bg-orange-100';
  if (cls.includes('green')) return 'bg-green-100';
  if (cls.includes('red')) return 'bg-red-100';
  return 'bg-slate-100';
}

function stageBadgeText(stage: string): string {
  const cls = getOpportunityStageBadgeClass(stage);
  if (cls.includes('blue')) return 'text-blue-800';
  if (cls.includes('yellow') || cls.includes('amber')) return 'text-amber-800';
  if (cls.includes('purple')) return 'text-purple-800';
  if (cls.includes('orange')) return 'text-orange-800';
  if (cls.includes('green')) return 'text-green-800';
  if (cls.includes('red')) return 'text-red-800';
  return 'text-slate-800';
}

function contactName(c: Contact): string {
  return [c.firstName, c.lastName].filter(Boolean).join(' ').trim() || c.id;
}

function leadName(l: Lead): string {
  return [l.firstName, l.lastName].filter(Boolean).join(' ').trim() || l.id;
}

function buildEmptyForm(): FormState {
  return {
    title: '',
    description: '',
    stage: OpportunityStage.PROSPECTING,
    amount: undefined,
    probability: 50,
    expectedCloseDate: '',
    leadId: '',
    contactId: '',
    companyId: '',
    assignedTo: '',
    notes: '',
    tags: [],
    tagsText: '',
  };
}

export function MobileOpportunitiesScreen() {
  const { user, currentTenant, logout } = useAuth();
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [pipelineSource, setPipelineSource] = useState<Opportunity[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<CRMOpportunityFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [stageFilterOpen, setStageFilterOpen] = useState(false);
  const [formStageOpen, setFormStageOpen] = useState(false);
  const [formCompanyOpen, setFormCompanyOpen] = useState(false);
  const [formLeadOpen, setFormLeadOpen] = useState(false);
  const [formContactOpen, setFormContactOpen] = useState(false);
  const [formAssigneeOpen, setFormAssigneeOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  const [form, setForm] = useState<FormState>(() => buildEmptyForm());
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [viewing, setViewing] = useState<Opportunity | null>(null);
  const [toDelete, setToDelete] = useState<Opportunity | null>(null);

  const companyById = useMemo(
    () => new Map(companies.map((c) => [c.id, c])),
    [companies],
  );
  const leadById = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads]);
  const contactById = useMemo(
    () => new Map(contacts.map((c) => [c.id, c])),
    [contacts],
  );

  const appliedFilters = useMemo((): CRMOpportunityFilters => {
    const t = searchTerm.trim();
    return { ...filters, search: t || undefined };
  }, [filters, searchTerm]);

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchOpportunitiesPaged(
        appliedFilters,
        currentPage,
        ITEMS_PER_PAGE,
      );
      setOpportunities(res.opportunities ?? []);
      setTotalPages(Math.max(1, res.pagination?.pages ?? 1));
      setTotalCount(res.pagination?.total ?? 0);
    } catch (e) {
      Alert.alert('Opportunities', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, currentPage]);

  const loadPipeline = useCallback(async () => {
    try {
      const res = await fetchOpportunitiesPaged({}, 1, 500);
      setPipelineSource(res.opportunities ?? []);
    } catch {
      setPipelineSource([]);
    }
  }, []);

  const loadRefs = useCallback(async () => {
    try {
      const [co, ct, ld, ures] = await Promise.all([
        fetchCompaniesList(300),
        fetchContacts({}, 1, 500).then((r) => r.contacts ?? []),
        fetchLeadsPaged({}, 1, 300).then((r) => r.leads ?? []),
        apiService.getCurrentTenantUsers() as Promise<{ users?: User[] }>,
      ]);
      setCompanies(co);
      setContacts(ct);
      setLeads(ld);
      const list = ures.users ?? [];
      const unique = list.reduce<User[]>((acc, x) => {
        const id = x.id || x.userId;
        if (!id) return acc;
        if (!acc.find((y) => (y.id || y.userId) === id)) acc.push(x);
        return acc;
      }, []);
      setUsers(unique);
    } catch {
      setCompanies([]);
      setContacts([]);
      setLeads([]);
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/crm/opportunities',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedFilters]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    void loadRefs();
  }, [loadRefs]);

  useEffect(() => {
    void loadPipeline();
  }, [loadPipeline]);

  useEffect(() => {
    if (createOpen || editOpen) void loadRefs();
  }, [createOpen, editOpen, loadRefs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadList(), loadRefs(), loadPipeline()]);
    setRefreshing(false);
  }, [loadList, loadRefs, loadPipeline]);

  const resetForm = useCallback(() => {
    setForm(buildEmptyForm());
    setEditing(null);
  }, []);

  const stageFilterOptions = useMemo(
    () => [
      { value: FILTER_ANY, label: 'All stages' },
      ...Object.values(OpportunityStage).map((s) => ({
        value: s,
        label: stageLabel(s),
      })),
    ],
    [],
  );

  const formStageOptions = useMemo(
    () =>
      Object.values(OpportunityStage).map((s) => ({
        value: s,
        label: stageLabel(s),
      })),
    [],
  );

  const companyOptions = useMemo(
    () => [
      { value: '', label: 'None' },
      ...companies.map((c) => ({ value: c.id, label: c.name })),
    ],
    [companies],
  );

  const leadOptions = useMemo(
    () => [
      { value: '', label: 'None' },
      ...leads.map((l) => ({ value: l.id, label: leadName(l) })),
    ],
    [leads],
  );

  const contactOptions = useMemo(
    () => [
      { value: '', label: 'None' },
      ...contacts.map((c) => ({ value: c.id, label: contactName(c) })),
    ],
    [contacts],
  );

  const assigneeOptions = useMemo(
    () => [
      { value: '', label: 'Unassigned' },
      ...users.map((u) => ({
        value: u.id || u.userId || '',
        label: assigneeLabel(u),
      })).filter((o) => o.value),
    ],
    [users],
  );

  const openCreate = () => {
    const uid = user?.id || user?.userId;
    setForm({ ...buildEmptyForm(), assignedTo: uid || '' });
    setEditing(null);
    setCreateOpen(true);
  };

  const openEdit = (o: Opportunity) => {
    setEditing(o);
    const exp = o.expectedCloseDate
      ? String(o.expectedCloseDate).slice(0, 10)
      : '';
    setForm({
      title: o.title,
      description: o.description || '',
      stage: o.stage,
      amount: o.amount,
      probability: o.probability,
      expectedCloseDate: exp,
      leadId: o.leadId || '',
      contactId: o.contactId || '',
      companyId: o.companyId || '',
      assignedTo: o.assignedTo || '',
      notes: o.notes || '',
      tags: o.tags || [],
      tagsText: o.tags?.join(', ') || '',
    });
    setEditOpen(true);
  };

  const assigneeForOpportunity = useCallback(
    (o: Opportunity): string | null => {
      if (!o.assignedTo) return null;
      const u = users.find((x) => (x.id || x.userId) === o.assignedTo);
      if (u) return assigneeLabel(u);
      return o.assignedTo;
    },
    [users],
  );

  const submitSave = async () => {
    if (!form.title?.trim()) {
      Alert.alert('Opportunity', 'Title is required.');
      return;
    }
    const tags = form.tagsText
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    const base = {
      title: form.title.trim(),
      description: form.description || undefined,
      stage: form.stage,
      amount: form.amount,
      probability: form.probability ?? 0,
      expectedCloseDate: form.expectedCloseDate?.trim() || undefined,
      leadId: form.leadId?.trim() || undefined,
      contactId: form.contactId?.trim() || undefined,
      companyId: form.companyId?.trim() || undefined,
      assignedTo: form.assignedTo?.trim() || undefined,
      notes: form.notes || undefined,
      tags,
    };
    try {
      if (editing) {
        const payload: OpportunityUpdate = base;
        await updateOpportunityApi(editing.id, payload);
        setEditOpen(false);
      } else {
        const payload: OpportunityCreate = base;
        await createOpportunityApi(payload);
        setCreateOpen(false);
      }
      resetForm();
      await Promise.all([loadList(), loadPipeline()]);
      Alert.alert('Opportunity', editing ? 'Updated.' : 'Created.');
    } catch (e) {
      Alert.alert('Opportunity', extractErrorMessage(e, 'Save failed'));
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteOpportunityApi(toDelete.id);
      setDeleteOpen(false);
      setToDelete(null);
      await Promise.all([loadList(), loadPipeline()]);
      Alert.alert('Opportunity', 'Deleted.');
    } catch (e) {
      Alert.alert('Opportunity', extractErrorMessage(e, 'Delete failed'));
    }
  };

  const userLabel = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
    ? `${[user?.firstName, user?.lastName].filter(Boolean).join(' ')} · ${user?.email ?? ''}`
    : user?.email ?? '';

  const pipelineSummary = useMemo(() => {
    return Object.values(OpportunityStage).map((stage) => {
      const rows = pipelineSource.filter((o) => o.stage === stage);
      const total = rows.reduce((s, o) => s + (o.amount || 0), 0);
      return { stage, count: rows.length, total };
    });
  }, [pipelineSource]);

  const renderForm = () => (
    <ScrollView
      className="max-h-[80%]"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View className="mt-2 gap-3">
        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">Title *</Text>
          <TextInput
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
            value={form.title}
            onChangeText={(t) => setForm((p) => ({ ...p, title: t }))}
            placeholder="Opportunity title"
          />
        </View>
        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">Description</Text>
          <TextInput
            className="min-h-[72px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
            value={form.description || ''}
            onChangeText={(t) => setForm((p) => ({ ...p, description: t }))}
            multiline
            textAlignVertical="top"
          />
        </View>
        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">Stage</Text>
          <Pressable
            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            onPress={() => setFormStageOpen(true)}
          >
            <Text className="text-slate-900">{stageLabel(form.stage!)}</Text>
          </Pressable>
        </View>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Text className="mb-1 text-xs font-medium text-slate-600">Amount</Text>
            <TextInput
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
              value={form.amount != null ? String(form.amount) : ''}
              onChangeText={(t) =>
                setForm((p) => ({
                  ...p,
                  amount: t.trim()
                    ? parseFloat(t.replace(/[^0-9.-]/g, ''))
                    : undefined,
                }))
              }
              keyboardType="decimal-pad"
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-xs font-medium text-slate-600">
              Probability %
            </Text>
            <TextInput
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
              value={String(form.probability ?? 0)}
              onChangeText={(t) =>
                setForm((p) => ({
                  ...p,
                  probability: Math.min(
                    100,
                    Math.max(0, parseInt(t.replace(/[^0-9]/g, ''), 10) || 0),
                  ),
                }))
              }
              keyboardType="number-pad"
            />
          </View>
        </View>
        <WorkshopDatePickerField
          label="Expected close"
          value={form.expectedCloseDate || ''}
          onChange={(t) => setForm((p) => ({ ...p, expectedCloseDate: t }))}
        />
        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">Company</Text>
          <Pressable
            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            onPress={() => setFormCompanyOpen(true)}
          >
            <Text className="text-slate-900">
              {form.companyId
                ? companyById.get(form.companyId)?.name || 'Company'
                : 'None'}
            </Text>
          </Pressable>
        </View>
        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">Lead</Text>
          <Pressable
            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            onPress={() => setFormLeadOpen(true)}
          >
            <Text className="text-slate-900">
              {form.leadId
                ? (() => {
                  const L = leadById.get(form.leadId);
                  return L ? leadName(L) : form.leadId;
                })()
                : 'None'}
            </Text>
          </Pressable>
        </View>
        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">Contact</Text>
          <Pressable
            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            onPress={() => setFormContactOpen(true)}
          >
            <Text className="text-slate-900">
              {form.contactId
                ? (() => {
                  const C = contactById.get(form.contactId);
                  return C ? contactName(C) : form.contactId;
                })()
                : 'None'}
            </Text>
          </Pressable>
        </View>
        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">Assigned to</Text>
          <Pressable
            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            onPress={() => setFormAssigneeOpen(true)}
          >
            <Text className="text-slate-900">
              {form.assignedTo
                ? assigneeLabel(
                  users.find((u) => (u.id || u.userId) === form.assignedTo) || {
                    userName: form.assignedTo,
                    email: '',
                  } as User,
                )
                : 'Unassigned'}
            </Text>
          </Pressable>
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
            className="min-h-[72px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
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
              <Text className="text-2xl font-bold text-indigo-700">
                Opportunities
              </Text>
              <Text className="mt-1 text-sm text-slate-600">
                Pipeline and deal value
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
          <Text className="text-sm font-semibold text-white">New opportunity</Text>
        </Pressable>
      </View>

      <View className="mt-4 px-4">
        <Text className="mb-2 text-sm font-semibold text-slate-700">Search</Text>
        <View className="rounded-xl border border-slate-200 bg-white p-3">
          <View className="flex-row items-center rounded-lg border border-slate-200 bg-slate-50 px-3">
            <Ionicons name="search-outline" size={18} color="#94a3b8" />
            <TextInput
              className="ml-2 flex-1 py-2 text-sm text-slate-900"
              placeholder="Search…"
              placeholderTextColor="#94a3b8"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          <Pressable
            className="mt-3 rounded-lg border border-slate-200 bg-slate-50 py-2"
            onPress={() => setStageFilterOpen(true)}
          >
            <Text className="text-center text-xs font-semibold text-slate-700">
              Stage:{' '}
              {filters.stage ? stageLabel(filters.stage) : 'all'}
            </Text>
          </Pressable>
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
        <Text className="text-base font-semibold text-slate-900">Pipeline</Text>
        <View className="mt-2 flex-row flex-wrap gap-2">
          {pipelineSummary.map(({ stage, count, total }) => (
            <View
              key={stage}
              className="min-w-[30%] flex-1 rounded-xl border border-slate-200 bg-white p-3"
            >
              <Text className="text-xs text-slate-500 capitalize">
                {stage.replace(/_/g, ' ')}
              </Text>
              <Text className="text-lg font-bold text-slate-900">{count}</Text>
              <Text className="text-xs text-slate-600">{formatUsd(total)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="mt-4 px-4">
        <Text className="text-base font-semibold text-slate-900">Deals</Text>
        <Text className="text-sm text-slate-500">
          {totalCount > 0
            ? `Page ${currentPage} of ${totalPages} · ${totalCount} total`
            : 'No opportunities'}
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
        data={opportunities}
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
              No opportunities match your filters.
            </Text>
          )
        }
        renderItem={({ item: o }) => {
          const st = o.stage;
          return (
            <View className="mx-4 mb-3 rounded-xl border border-slate-200 bg-white p-4">
              <View className="flex-row items-start justify-between gap-2">
                <Pressable
                  className="min-w-0 flex-1"
                  onPress={() => {
                    setViewing(o);
                    setViewOpen(true);
                  }}
                >
                  <Text className="text-lg font-semibold text-slate-900">{o.title}</Text>
                  {o.description ? (
                    <Text className="text-sm text-slate-600" numberOfLines={2}>
                      {o.description}
                    </Text>
                  ) : null}
                  <View className="mt-2 flex-row flex-wrap gap-2">
                    <View className={`rounded-full px-2 py-0.5 ${stageBadgeBg(st)}`}>
                      <Text className={`text-xs font-medium ${stageBadgeText(st)}`}>
                        {stageLabel(st)}
                      </Text>
                    </View>
                    <View className="rounded-full bg-slate-100 px-2 py-0.5">
                      <Text className="text-xs font-medium text-slate-700">
                        {o.probability}%
                      </Text>
                    </View>
                    {o.amount != null && o.amount > 0 ? (
                      <Text className="text-sm font-semibold text-slate-900">
                        {formatUsd(o.amount)}
                      </Text>
                    ) : null}
                  </View>
                  {o.expectedCloseDate ? (
                    <Text className="mt-1 text-xs text-slate-500">
                      Closes {formatCrmDate(o.expectedCloseDate)}
                    </Text>
                  ) : null}
                  <Text className="mt-1 text-xs text-slate-500">
                    {assigneeForOpportunity(o)
                      ? `Assigned ${assigneeForOpportunity(o)}`
                      : ''}
                    {o.companyId && companyById.get(o.companyId)
                      ? ` · ${companyById.get(o.companyId)!.name}`
                      : ''}
                  </Text>
                </Pressable>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => {
                      setViewing(o);
                      setViewOpen(true);
                    }}
                    className="rounded-lg bg-slate-100 p-2"
                  >
                    <Ionicons name="eye-outline" size={18} color="#334155" />
                  </Pressable>
                  <Pressable
                    onPress={() => openEdit(o)}
                    className="rounded-lg bg-slate-100 p-2"
                  >
                    <Ionicons name="pencil-outline" size={18} color="#334155" />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setToDelete(o);
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
        visible={stageFilterOpen}
        title="Stage"
        options={stageFilterOptions}
        onSelect={(v) =>
          setFilters((f) => ({
            ...f,
            stage: v === FILTER_ANY ? undefined : (v as OpportunityStage),
          }))
        }
        onClose={() => setStageFilterOpen(false)}
      />
      <OptionSheet
        visible={formStageOpen}
        title="Stage"
        options={formStageOptions}
        onSelect={(v) =>
          setForm((p) => ({ ...p, stage: v as OpportunityStage }))
        }
        onClose={() => setFormStageOpen(false)}
      />
      <OptionSheet
        visible={formCompanyOpen}
        title="Company"
        options={companyOptions}
        onSelect={(v) => setForm((p) => ({ ...p, companyId: v }))}
        onClose={() => setFormCompanyOpen(false)}
      />
      <OptionSheet
        visible={formLeadOpen}
        title="Lead"
        options={leadOptions}
        onSelect={(v) => setForm((p) => ({ ...p, leadId: v }))}
        onClose={() => setFormLeadOpen(false)}
      />
      <OptionSheet
        visible={formContactOpen}
        title="Contact"
        options={contactOptions}
        onSelect={(v) => setForm((p) => ({ ...p, contactId: v }))}
        onClose={() => setFormContactOpen(false)}
      />
      <OptionSheet
        visible={formAssigneeOpen}
        title="Assigned to"
        options={assigneeOptions}
        onSelect={(v) => setForm((p) => ({ ...p, assignedTo: v }))}
        onClose={() => setFormAssigneeOpen(false)}
      />

      <MobileFormSheet
        visible={createOpen}
        title="New Opportunity"
        onCancel={() => {
          setCreateOpen(false);
          resetForm();
        }}
        onSave={() => void submitSave()}
        saveLabel="Create"
      >
            <FormSection title="Core Information">
              <FormInput
                label="Opportunity Title"
                icon="document-text-outline"
                value={form.title}
                onChangeText={(t) => setForm(p => ({ ...p, title: t }))}
                placeholder="Ex: Project Alpha Expansion"
              />
              <FormSelect
                label="Current Stage"
                icon="stats-chart-outline"
                value={stageLabel(form.stage!)}
                onPress={() => setFormStageOpen(true)}
              />
              <FormInput
                label="Description"
                icon="reader-outline"
                value={form.description || ''}
                onChangeText={(t) => setForm(p => ({ ...p, description: t }))}
                multiline
                placeholder="Details about the deal..."
                last
              />
            </FormSection>

            <FormSection title="Financials & Timeline">
              <FormInput
                label="Amount"
                icon="cash-outline"
                value={form.amount != null ? String(form.amount) : ''}
                onChangeText={(t) => setForm(p => ({ ...p, amount: t.trim() ? parseFloat(t.replace(/[^0-9.-]/g, '')) : undefined }))}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
              <FormInput
                label="Probability (%)"
                icon="pie-chart-outline"
                value={String(form.probability ?? 0)}
                onChangeText={(t) => setForm(p => ({ ...p, probability: Math.min(100, Math.max(0, parseInt(t.replace(/[^0-9]/g, ''), 10) || 0)) }))}
                keyboardType="number-pad"
              />
              <WorkshopDatePickerField
                label="Expected Close Date"
                value={form.expectedCloseDate || ''}
                onChange={(t) => setForm((p) => ({ ...p, expectedCloseDate: t }))}
              />
            </FormSection>

            <FormSection title="Relationships & Assignment">
              <FormSelect
                label="Account / Company"
                icon="business-outline"
                value={form.companyId ? companyById.get(form.companyId)?.name || '' : 'None'}
                onPress={() => setFormCompanyOpen(true)}
              />
              <FormSelect
                label="Primary Contact"
                icon="person-outline"
                value={form.contactId ? contactName(contactById.get(form.contactId)!) : 'None'}
                onPress={() => setFormContactOpen(true)}
              />
              <FormSelect
                label="Lead Source"
                icon="at-outline"
                value={form.leadId ? leadName(leadById.get(form.leadId)!) : 'None'}
                onPress={() => setFormLeadOpen(true)}
              />
              <FormSelect
                label="Assigned To"
                icon="people-outline"
                value={form.assignedTo ? assigneeLabel(users.find(u => (u.id || u.userId) === form.assignedTo) || { userName: form.assignedTo } as User) : 'Unassigned'}
                onPress={() => setFormAssigneeOpen(true)}
                last
              />
            </FormSection>

            <FormSection title="Categorization & Notes">
              <FormInput
                label="Tags (comma separated)"
                icon="pricetags-outline"
                value={form.tagsText}
                onChangeText={(t) => setForm(p => ({ ...p, tagsText: t }))}
                placeholder="enterprise, referral..."
              />
              <FormInput
                label="Internal Notes"
                icon="chatbox-ellipses-outline"
                value={form.notes || ''}
                onChangeText={(t) => setForm(p => ({ ...p, notes: t }))}
                multiline
                placeholder="Confidential notes..."
                last
              />
            </FormSection>
      </MobileFormSheet>

      <MobileFormSheet
        visible={editOpen}
        title="Edit Opportunity"
        onCancel={() => {
          setEditOpen(false);
          resetForm();
        }}
        onSave={() => void submitSave()}
      >
            <FormSection title="Core Information">
              <FormInput
                label="Opportunity Title"
                icon="document-text-outline"
                value={form.title}
                onChangeText={(t) => setForm(p => ({ ...p, title: t }))}
              />
              <FormSelect
                label="Current Stage"
                icon="stats-chart-outline"
                value={stageLabel(form.stage!)}
                onPress={() => setFormStageOpen(true)}
              />
              <FormInput
                label="Description"
                icon="reader-outline"
                value={form.description || ''}
                onChangeText={(t) => setForm(p => ({ ...p, description: t }))}
                multiline
                last
              />
            </FormSection>

            <FormSection title="Financials & Timeline">
              <FormInput
                label="Amount"
                icon="cash-outline"
                value={form.amount != null ? String(form.amount) : ''}
                onChangeText={(t) => setForm(p => ({ ...p, amount: t.trim() ? parseFloat(t.replace(/[^0-9.-]/g, '')) : undefined }))}
                keyboardType="decimal-pad"
              />
              <FormInput
                label="Probability (%)"
                icon="pie-chart-outline"
                value={String(form.probability ?? 0)}
                onChangeText={(t) => setForm(p => ({ ...p, probability: Math.min(100, Math.max(0, parseInt(t.replace(/[^0-9]/g, ''), 10) || 0)) }))}
                keyboardType="number-pad"
              />
              <WorkshopDatePickerField
                label="Expected Close Date"
                value={form.expectedCloseDate || ''}
                onChange={(t) => setForm((p) => ({ ...p, expectedCloseDate: t }))}
              />
            </FormSection>

            <FormSection title="Relationships & Assignment">
              <FormSelect
                label="Account / Company"
                icon="business-outline"
                value={form.companyId ? companyById.get(form.companyId)?.name || '' : 'None'}
                onPress={() => setFormCompanyOpen(true)}
              />
              <FormSelect
                label="Primary Contact"
                icon="person-outline"
                value={form.contactId ? contactName(contactById.get(form.contactId)!) : 'None'}
                onPress={() => setFormContactOpen(true)}
              />
              <FormSelect
                label="Lead Source"
                icon="at-outline"
                value={form.leadId ? leadName(leadById.get(form.leadId)!) : 'None'}
                onPress={() => setFormLeadOpen(true)}
              />
              <FormSelect
                label="Assigned To"
                icon="people-outline"
                value={form.assignedTo ? assigneeLabel(users.find(u => (u.id || u.userId) === form.assignedTo) || { userName: form.assignedTo } as User) : 'Unassigned'}
                onPress={() => setFormAssigneeOpen(true)}
                last
              />
            </FormSection>

            <FormSection title="Categorization & Notes">
              <FormInput
                label="Tags (comma separated)"
                icon="pricetags-outline"
                value={form.tagsText}
                onChangeText={(t) => setForm(p => ({ ...p, tagsText: t }))}
              />
              <FormInput
                label="Internal Notes"
                icon="chatbox-ellipses-outline"
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
            <Text className="text-lg font-bold text-slate-900">Delete opportunity</Text>
            <Text className="mt-2 text-slate-600">
              Delete {toDelete?.title}?
            </Text>
            <View className="mt-4 flex-row justify-end gap-2">
              <Pressable
                className="rounded-lg border border-slate-300 px-4 py-2"
                onPress={() => {
                  setDeleteOpen(false);
                  setToDelete(null);
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
            <Text className="text-lg font-bold text-slate-900">Opportunity</Text>
            {viewing ? (
              <ScrollView className="mt-3">
                <Text className="text-xl font-semibold text-slate-900">
                  {viewing.title}
                </Text>
                {viewing.description ? (
                  <Text className="mt-2 text-sm text-slate-800">{viewing.description}</Text>
                ) : null}
                <Text className="mt-2 text-sm text-slate-700">
                  {stageLabel(viewing.stage)} · {viewing.probability}%
                  {viewing.amount != null ? ` · ${formatUsd(viewing.amount)}` : ''}
                </Text>
                {viewing.expectedCloseDate ? (
                  <Text className="mt-1 text-sm text-slate-600">
                    Closes {formatCrmDate(viewing.expectedCloseDate)}
                  </Text>
                ) : null}
                <Text className="mt-2 text-xs text-slate-500">
                  {assigneeForOpportunity(viewing)
                    ? `Assigned: ${assigneeForOpportunity(viewing)}`
                    : 'Unassigned'}
                </Text>
              </ScrollView>
            ) : null}
            <View className="mt-4 flex-row gap-2">
              <Pressable
                className="flex-1 items-center rounded-lg border border-slate-300 py-3"
                onPress={() => {
                  setViewOpen(false);
                  setViewing(null);
                }}
              >
                <Text className="font-semibold text-slate-700">Close</Text>
              </Pressable>
              {viewing ? (
                <Pressable
                  className="flex-1 items-center rounded-lg bg-indigo-600 py-3 active:bg-indigo-700"
                  onPress={() => {
                    const x = viewing;
                    setViewOpen(false);
                    setViewing(null);
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
