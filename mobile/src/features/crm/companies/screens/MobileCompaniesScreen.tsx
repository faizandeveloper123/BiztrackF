import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert, Linking, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../../contexts/SidebarDrawerContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { OptionSheet } from '../../../../components/crm/OptionSheet';
import { extractErrorMessage } from '../../../../utils/errorUtils';
import {
  Company,
  CompanyCreate,
  CompanySize,
  CRMCompanyFilters,
  Industry,
} from '../../../../models/crm';
import {
  fetchCompaniesPaged,
  createCompanyApi,
  updateCompanyApi,
  deleteCompanyApi,
} from '../../../../services/crm/companiesApi';
import { formatCrmDate, formatUsd } from '../../../../services/crm/CrmMobileService';
import { industryLabel } from '../../contacts/utils/contactFormUtils';
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

type FormState = CompanyCreate & { tagsText: string };

function buildEmptyForm(): FormState {
  return {
    name: '',
    industry: undefined,
    size: undefined,
    website: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    description: '',
    notes: '',
    tags: [],
    tagsText: '',
    isActive: true,
    annualRevenue: undefined,
    employeeCount: undefined,
    foundedYear: undefined,
  };
}

function sizeLabel(s: CompanySize): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function MobileCompaniesScreen() {
  const { user, currentTenant, logout } = useAuth();
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<CRMCompanyFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [industrySheetOpen, setIndustrySheetOpen] = useState(false);
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false);
  const [formIndustryOpen, setFormIndustryOpen] = useState(false);
  const [formSizeOpen, setFormSizeOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  const [form, setForm] = useState<FormState>(() => buildEmptyForm());
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  const appliedFilters = useMemo((): CRMCompanyFilters => {
    const t = searchTerm.trim();
    return { ...filters, search: t || undefined };
  }, [filters, searchTerm]);

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchCompaniesPaged(
        appliedFilters,
        currentPage,
        ITEMS_PER_PAGE,
      );
      setCompanies(res.companies ?? []);
      setTotalCount(res.pagination?.total ?? 0);
    } catch (e) {
      Alert.alert('Companies', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, currentPage]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/crm/companies',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedFilters]);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCompanies();
    setRefreshing(false);
  }, [loadCompanies]);

  const resetForm = useCallback(() => {
    setForm(buildEmptyForm());
    setEditingCompany(null);
  }, []);

  const industryFilterOptions = useMemo(
    () => [
      { value: FILTER_ANY, label: 'All industries' },
      ...Object.values(Industry).map((ind) => ({
        value: ind,
        label: industryLabel(ind),
      })),
    ],
    [],
  );

  const sizeFilterOptions = useMemo(
    () => [
      { value: FILTER_ANY, label: 'All sizes' },
      ...Object.values(CompanySize).map((s) => ({
        value: s,
        label: sizeLabel(s),
      })),
    ],
    [],
  );

  const formIndustryOptions = useMemo(
    () => [
      { value: FILTER_ANY, label: 'Not set' },
      ...Object.values(Industry).map((ind) => ({
        value: ind,
        label: industryLabel(ind),
      })),
    ],
    [],
  );

  const formSizeOptions = useMemo(
    () => [
      { value: FILTER_ANY, label: 'Not set' },
      ...Object.values(CompanySize).map((s) => ({
        value: s,
        label: sizeLabel(s),
      })),
    ],
    [],
  );

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = (c: Company) => {
    setEditingCompany(c);
    setForm({
      name: c.name,
      industry: c.industry,
      size: c.size,
      website: c.website || '',
      phone: c.phone || '',
      address: c.address || '',
      city: c.city || '',
      state: c.state || '',
      country: c.country || '',
      postalCode: c.postalCode || '',
      description: c.description || '',
      notes: c.notes || '',
      tags: c.tags || [],
      tagsText: c.tags?.join(', ') || '',
      isActive: c.isActive,
      annualRevenue: c.annualRevenue,
      employeeCount: c.employeeCount,
      foundedYear: c.foundedYear,
    });
    setEditOpen(true);
  };

  const submitSave = async () => {
    if (!form.name?.trim()) {
      Alert.alert('Company', 'Company name is required.');
      return;
    }
    const payload: CompanyCreate = {
      name: form.name.trim(),
      industry: form.industry,
      size: form.size,
      website: form.website || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      country: form.country || undefined,
      postalCode: form.postalCode || undefined,
      description: form.description || undefined,
      notes: form.notes || undefined,
      tags: form.tags,
      isActive: form.isActive,
      annualRevenue: form.annualRevenue,
      employeeCount: form.employeeCount,
      foundedYear: form.foundedYear,
    };
    try {
      if (editingCompany) {
        await updateCompanyApi(editingCompany.id, payload);
        setEditOpen(false);
      } else {
        await createCompanyApi(payload);
        setCreateOpen(false);
      }
      resetForm();
      await loadCompanies();
      Alert.alert('Company', editingCompany ? 'Updated.' : 'Created.');
    } catch (e) {
      Alert.alert('Company', extractErrorMessage(e, 'Save failed'));
    }
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;
    try {
      await deleteCompanyApi(companyToDelete.id);
      setDeleteOpen(false);
      setCompanyToDelete(null);
      await loadCompanies();
      Alert.alert('Company', 'Deleted.');
    } catch (e) {
      Alert.alert('Company', extractErrorMessage(e, 'Delete failed'));
    }
  };

  const userLabel = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
    ? `${[user?.firstName, user?.lastName].filter(Boolean).join(' ')} · ${user?.email ?? ''}`
    : user?.email ?? '';

  const listHeader = (
    <View className="pb-2">
      <View className="border-b border-slate-200 bg-white px-4 pb-4 pt-2">
        <View className="flex-row items-start justify-between gap-2">
          <View className="min-w-0 flex-1 flex-row items-start gap-2">
            <MenuHeaderButton />
            <View className="min-w-0 flex-1">
              <Text className="text-2xl font-bold text-indigo-700">Companies</Text>
              <Text className="mt-1 text-sm text-slate-600">
                Accounts and relationships
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
          <Text className="text-sm font-semibold text-white">New company</Text>
        </Pressable>
      </View>

      <View className="mt-4 px-4">
        <Text className="mb-2 text-sm font-semibold text-slate-700">Search</Text>
        <View className="rounded-xl border border-slate-200 bg-white p-3">
          <View className="flex-row items-center rounded-lg border border-slate-200 bg-slate-50 px-3">
            <Ionicons name="search-outline" size={18} color="#94a3b8" />
            <TextInput
              className="ml-2 flex-1 py-2 text-sm text-slate-900"
              placeholder="Search companies…"
              placeholderTextColor="#94a3b8"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          <View className="mt-3 flex-row gap-2">
            <Pressable
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2"
              onPress={() => setIndustrySheetOpen(true)}
            >
              <Text className="text-center text-xs font-semibold text-slate-700">
                Industry:{' '}
                {filters.industry ? industryLabel(filters.industry) : 'all'}
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2"
              onPress={() => setSizeSheetOpen(true)}
            >
              <Text className="text-center text-xs font-semibold text-slate-700">
                Size: {filters.size ? sizeLabel(filters.size) : 'all'}
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
        <Text className="text-base font-semibold text-slate-900">Company list</Text>
        <Text className="text-sm text-slate-500">
          {totalCount > 0
            ? `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of ${totalCount}`
            : 'No companies'}
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
              className={`rounded-lg border px-4 py-2 ${
                currentPage <= 1 ? 'border-slate-100 opacity-50' : 'border-slate-300'
              }`}
            >
              <Text className="font-semibold text-slate-800">Previous</Text>
            </Pressable>
            <Pressable
              disabled={currentPage >= totalPages}
              onPress={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              className={`rounded-lg border px-4 py-2 ${
                currentPage >= totalPages
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
        data={companies}
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
              No companies match your filters.
            </Text>
          )
        }
        renderItem={({ item: c }) => (
          <View className="mx-4 mb-3 rounded-xl border border-slate-200 bg-white p-4">
            <View className="flex-row items-start justify-between gap-2">
              <Pressable
                className="min-w-0 flex-1"
                onPress={() => {
                  setViewingCompany(c);
                  setViewOpen(true);
                }}
              >
                <Text className="text-lg font-semibold text-slate-900">{c.name}</Text>
                <View className="mt-1 flex-row flex-wrap gap-2">
                  {c.industry ? (
                    <View className="rounded-full bg-violet-100 px-2 py-0.5">
                      <Text className="text-xs font-medium text-violet-800">
                        {industryLabel(c.industry)}
                      </Text>
                    </View>
                  ) : null}
                  {c.size ? (
                    <View className="rounded-full bg-slate-100 px-2 py-0.5">
                      <Text className="text-xs font-medium text-slate-700">
                        {sizeLabel(c.size)}
                      </Text>
                    </View>
                  ) : null}
                  <View
                    className={`rounded-full px-2 py-0.5 ${
                      c.isActive ? 'bg-emerald-100' : 'bg-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        c.isActive ? 'text-emerald-800' : 'text-slate-700'
                      }`}
                    >
                      {c.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                {c.website ? (
                  <Text className="mt-1 text-sm text-blue-600" numberOfLines={1}>
                    {c.website}
                  </Text>
                ) : null}
                {c.phone ? (
                  <Text className="text-sm text-slate-600">{c.phone}</Text>
                ) : null}
                {c.city && c.state ? (
                  <Text className="text-xs text-slate-500">
                    {c.city}, {c.state}
                  </Text>
                ) : null}
                {c.annualRevenue != null && c.annualRevenue > 0 ? (
                  <Text className="mt-1 text-xs text-slate-600">
                    Revenue {formatUsd(c.annualRevenue)}
                  </Text>
                ) : null}
                <Text className="mt-1 text-xs text-slate-400">
                  Created {formatCrmDate(c.createdAt)}
                </Text>
              </Pressable>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => {
                    setViewingCompany(c);
                    setViewOpen(true);
                  }}
                  className="rounded-lg bg-slate-100 p-2"
                >
                  <Ionicons name="eye-outline" size={18} color="#334155" />
                </Pressable>
                <Pressable
                  onPress={() => openEdit(c)}
                  className="rounded-lg bg-slate-100 p-2"
                >
                  <Ionicons name="pencil-outline" size={18} color="#334155" />
                </Pressable>
                <Pressable
                  onPress={() => {
                    setCompanyToDelete(c);
                    setDeleteOpen(true);
                  }}
                  className="rounded-lg bg-red-50 p-2"
                >
                  <Ionicons name="trash-outline" size={18} color="#b91c1c" />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />

      <OptionSheet
        visible={industrySheetOpen}
        title="Industry"
        options={industryFilterOptions}
        onSelect={(v) =>
          setFilters((f) => ({
            ...f,
            industry: v === FILTER_ANY ? undefined : (v as Industry),
          }))
        }
        onClose={() => setIndustrySheetOpen(false)}
      />
      <OptionSheet
        visible={sizeSheetOpen}
        title="Size"
        options={sizeFilterOptions}
        onSelect={(v) =>
          setFilters((f) => ({
            ...f,
            size: v === FILTER_ANY ? undefined : (v as CompanySize),
          }))
        }
        onClose={() => setSizeSheetOpen(false)}
      />
      <OptionSheet
        visible={formIndustryOpen}
        title="Industry"
        options={formIndustryOptions}
        onSelect={(v) =>
          setForm((p) => ({
            ...p,
            industry: v === FILTER_ANY ? undefined : (v as Industry),
          }))
        }
        onClose={() => setFormIndustryOpen(false)}
      />
      <OptionSheet
        visible={formSizeOpen}
        title="Company size"
        options={formSizeOptions}
        onSelect={(v) =>
          setForm((p) => ({
            ...p,
            size: v === FILTER_ANY ? undefined : (v as CompanySize),
          }))
        }
        onClose={() => setFormSizeOpen(false)}
      />

      <MobileFormSheet
        visible={createOpen}
        title="New Company"
        onCancel={() => {
          setCreateOpen(false);
          resetForm();
        }}
        onSave={() => void submitSave()}
        saveLabel="Create"
      >
            <FormSection title="Account Identity">
              <FormInput
                label="Company Name"
                icon="business-outline"
                value={form.name}
                onChangeText={(t) => setForm(p => ({ ...p, name: t }))}
                placeholder="Ex: Acme Corporation"
              />
              <FormSelect
                label="Industry"
                icon="flask-outline"
                value={form.industry ? industryLabel(form.industry) : 'Not set'}
                onPress={() => setFormIndustryOpen(true)}
              />
              <FormSelect
                label="Company Size"
                icon="podium-outline"
                value={form.size ? sizeLabel(form.size) : 'Not set'}
                onPress={() => setFormSizeOpen(true)}
                last
              />
            </FormSection>

            <FormSection title="Presence & Communication">
              <FormInput
                label="Website"
                icon="globe-outline"
                value={form.website || ''}
                onChangeText={(t) => setForm(p => ({ ...p, website: t }))}
                placeholder="https://..."
                autoCapitalize="none"
              />
              <FormInput
                label="Phone"
                icon="call-outline"
                value={form.phone || ''}
                onChangeText={(t) => setForm(p => ({ ...p, phone: t }))}
                placeholder="+1..."
                keyboardType="phone-pad"
                last
              />
            </FormSection>

            <FormSection title="Address Details">
              <FormInput
                label="Street Address"
                icon="location-outline"
                value={form.address || ''}
                onChangeText={(t) => setForm(p => ({ ...p, address: t }))}
              />
              <View className="flex-row border-b border-slate-50">
                <View className="flex-1">
                  <FormInput
                    label="City"
                    value={form.city || ''}
                    onChangeText={(t) => setForm(p => ({ ...p, city: t }))}
                    className="border-b-0"
                  />
                </View>
                <View className="flex-1 border-l border-slate-50">
                  <FormInput
                    label="State"
                    value={form.state || ''}
                    onChangeText={(t) => setForm(p => ({ ...p, state: t }))}
                    className="border-b-0"
                  />
                </View>
              </View>
              <View className="flex-row">
                <View className="flex-1">
                  <FormInput
                    label="Country"
                    value={form.country || ''}
                    onChangeText={(t) => setForm(p => ({ ...p, country: t }))}
                    className="border-b-0"
                  />
                </View>
                <View className="flex-1 border-l border-slate-50">
                  <FormInput
                    label="Postal Code"
                    value={form.postalCode || ''}
                    onChangeText={(t) => setForm(p => ({ ...p, postalCode: t }))}
                    className="border-b-0"
                    last
                  />
                </View>
              </View>
            </FormSection>

            <FormSection title="Financials & Metrics">
              <FormInput
                label="Annual Revenue"
                icon="wallet-outline"
                value={form.annualRevenue != null ? String(form.annualRevenue) : ''}
                onChangeText={(t) => setForm(p => ({ ...p, annualRevenue: t.trim() ? parseFloat(t.replace(/[^0-9.-]/g, '')) : undefined }))}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
              <View className="flex-row">
                <View className="flex-1">
                  <FormInput
                    label="Employees"
                    icon="people-outline"
                    value={form.employeeCount != null ? String(form.employeeCount) : ''}
                    onChangeText={(t) => setForm(p => ({ ...p, employeeCount: t.trim() ? parseInt(t.replace(/[^0-9]/g, ''), 10) : undefined }))}
                    keyboardType="number-pad"
                    className="border-b-0"
                  />
                </View>
                <View className="flex-1 border-l border-slate-50">
                  <FormInput
                    label="Founded Year"
                    icon="calendar-outline"
                    value={form.foundedYear != null ? String(form.foundedYear) : ''}
                    onChangeText={(t) => setForm(p => ({ ...p, foundedYear: t.trim() ? parseInt(t.replace(/[^0-9]/g, ''), 10) : undefined }))}
                    keyboardType="number-pad"
                    className="border-b-0"
                    last
                  />
                </View>
              </View>
            </FormSection>

            <FormSection title="Notes & Metadata">
              <FormInput
                label="Description"
                value={form.description || ''}
                onChangeText={(t) => setForm(p => ({ ...p, description: t }))}
                multiline
              />
              <FormInput
                label="Tags (comma separated)"
                icon="pricetags-outline"
                value={form.tagsText}
                onChangeText={(t) => setForm(p => ({ ...p, tagsText: t, tags: t.split(',').map(x => x.trim()).filter(Boolean) }))}
              />
              <FormInput
                label="Internal Notes"
                value={form.notes || ''}
                onChangeText={(t) => setForm(p => ({ ...p, notes: t }))}
                multiline
                last
              />
            </FormSection>
            
            <View className="mb-6 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
              <View className="flex-row items-center">
                <View className={`h-2 w-2 rounded-full mr-2 ${form.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <Text className="text-sm font-semibold text-slate-800">Active Account</Text>
              </View>
              <Switch 
                value={form.isActive} 
                onValueChange={(v) => setForm(p => ({ ...p, isActive: v }))} 
                trackColor={{ false: '#e2e8f0', true: '#6ee7b7' }}
                thumbColor={form.isActive ? '#10b981' : '#f8fafc'}
              />
            </View>
            
      </MobileFormSheet>

      <MobileFormSheet
        visible={editOpen}
        title="Edit Company"
        onCancel={() => {
          setEditOpen(false);
          resetForm();
        }}
        onSave={() => void submitSave()}
      >
            <FormSection title="Account Identity">
              <FormInput
                label="Company Name"
                icon="business-outline"
                value={form.name}
                onChangeText={(t) => setForm(p => ({ ...p, name: t }))}
              />
              <FormSelect
                label="Industry"
                icon="flask-outline"
                value={form.industry ? industryLabel(form.industry) : 'Not set'}
                onPress={() => setFormIndustryOpen(true)}
              />
              <FormSelect
                label="Company Size"
                icon="podium-outline"
                value={form.size ? sizeLabel(form.size) : 'Not set'}
                onPress={() => setFormSizeOpen(true)}
                last
              />
            </FormSection>

            <FormSection title="Presence & Communication">
              <FormInput
                label="Website"
                icon="globe-outline"
                value={form.website || ''}
                onChangeText={(t) => setForm(p => ({ ...p, website: t }))}
                autoCapitalize="none"
              />
              <FormInput
                label="Phone"
                icon="call-outline"
                value={form.phone || ''}
                onChangeText={(t) => setForm(p => ({ ...p, phone: t }))}
                keyboardType="phone-pad"
                last
              />
            </FormSection>

            <FormSection title="Address Details">
              <FormInput
                label="Street Address"
                icon="location-outline"
                value={form.address || ''}
                onChangeText={(t) => setForm(p => ({ ...p, address: t }))}
              />
              <View className="flex-row border-b border-slate-50">
                <View className="flex-1">
                  <FormInput
                    label="City"
                    value={form.city || ''}
                    onChangeText={(t) => setForm(p => ({ ...p, city: t }))}
                    className="border-b-0"
                  />
                </View>
                <View className="flex-1 border-l border-slate-50">
                  <FormInput
                    label="State"
                    value={form.state || ''}
                    onChangeText={(t) => setForm(p => ({ ...p, state: t }))}
                    className="border-b-0"
                  />
                </View>
              </View>
              <View className="flex-row">
                <View className="flex-1">
                  <FormInput
                    label="Country"
                    value={form.country || ''}
                    onChangeText={(t) => setForm(p => ({ ...p, country: t }))}
                    className="border-b-0"
                  />
                </View>
                <View className="flex-1 border-l border-slate-50">
                  <FormInput
                    label="Postal Code"
                    value={form.postalCode || ''}
                    onChangeText={(t) => setForm(p => ({ ...p, postalCode: t }))}
                    className="border-b-0"
                    last
                  />
                </View>
              </View>
            </FormSection>

            <FormSection title="Financials & Metrics">
              <FormInput
                label="Annual Revenue"
                icon="wallet-outline"
                value={form.annualRevenue != null ? String(form.annualRevenue) : ''}
                onChangeText={(t) => setForm(p => ({ ...p, annualRevenue: t.trim() ? parseFloat(t.replace(/[^0-9.-]/g, '')) : undefined }))}
                keyboardType="decimal-pad"
              />
              <View className="flex-row">
                <View className="flex-1">
                  <FormInput
                    label="Employees"
                    icon="people-outline"
                    value={form.employeeCount != null ? String(form.employeeCount) : ''}
                    onChangeText={(t) => setForm(p => ({ ...p, employeeCount: t.trim() ? parseInt(t.replace(/[^0-9]/g, ''), 10) : undefined }))}
                    keyboardType="number-pad"
                    className="border-b-0"
                  />
                </View>
                <View className="flex-1 border-l border-slate-50">
                  <FormInput
                    label="Founded Year"
                    icon="calendar-outline"
                    value={form.foundedYear != null ? String(form.foundedYear) : ''}
                    onChangeText={(t) => setForm(p => ({ ...p, foundedYear: t.trim() ? parseInt(t.replace(/[^0-9]/g, ''), 10) : undefined }))}
                    keyboardType="number-pad"
                    className="border-b-0"
                    last
                  />
                </View>
              </View>
            </FormSection>

            <FormSection title="Notes & Metadata">
              <FormInput
                label="Description"
                value={form.description || ''}
                onChangeText={(t) => setForm(p => ({ ...p, description: t }))}
                multiline
              />
              <FormInput
                label="Tags (comma separated)"
                icon="pricetags-outline"
                value={form.tagsText}
                onChangeText={(t) => setForm(p => ({ ...p, tagsText: t, tags: t.split(',').map(x => x.trim()).filter(Boolean) }))}
              />
              <FormInput
                label="Internal Notes"
                value={form.notes || ''}
                onChangeText={(t) => setForm(p => ({ ...p, notes: t }))}
                multiline
                last
              />
            </FormSection>
            
            <View className="mb-6 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
              <View className="flex-row items-center">
                <View className={`h-2 w-2 rounded-full mr-2 ${form.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <Text className="text-sm font-semibold text-slate-800">Active Account</Text>
              </View>
              <Switch 
                value={form.isActive} 
                onValueChange={(v) => setForm(p => ({ ...p, isActive: v }))} 
                trackColor={{ false: '#e2e8f0', true: '#6ee7b7' }}
                thumbColor={form.isActive ? '#10b981' : '#f8fafc'}
              />
            </View>
            
      </MobileFormSheet>

      <AppModal
        visible={deleteOpen}
        transparent
        animationType="fade"
        onClose={() => setDeleteOpen(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full max-w-sm rounded-2xl bg-white p-5">
            <Text className="text-lg font-bold text-slate-900">Delete company</Text>
            <Text className="mt-2 text-slate-600">
              Delete {companyToDelete?.name}? This cannot be undone.
            </Text>
            <View className="mt-4 flex-row justify-end gap-2">
              <Pressable
                className="rounded-lg border border-slate-300 px-4 py-2"
                onPress={() => {
                  setDeleteOpen(false);
                  setCompanyToDelete(null);
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
            <Text className="text-lg font-bold text-slate-900">Company</Text>
            {viewingCompany ? (
              <ScrollView className="mt-3">
                <Text className="text-xl font-semibold text-slate-900">
                  {viewingCompany.name}
                </Text>
                {viewingCompany.website?.trim() ? (
                  <Pressable
                    onPress={() =>
                      void Linking.openURL(
                        /^https?:\/\//i.test(viewingCompany.website!.trim())
                          ? viewingCompany.website!.trim()
                          : `https://${viewingCompany.website!.trim()}`,
                      )
                    }
                  >
                    <Text className="mt-1 text-sm text-blue-600">
                      {viewingCompany.website}
                    </Text>
                  </Pressable>
                ) : null}
                <Text className="mt-2 text-sm text-slate-700">
                  {viewingCompany.phone || '—'} · {viewingCompany.city || '—'},{' '}
                  {viewingCompany.state || '—'}
                </Text>
                {viewingCompany.description ? (
                  <Text className="mt-3 text-sm text-slate-800">
                    {viewingCompany.description}
                  </Text>
                ) : null}
              </ScrollView>
            ) : null}
            <View className="mt-4 flex-row gap-2">
              <Pressable
                className="flex-1 items-center rounded-lg border border-slate-300 py-3"
                onPress={() => {
                  setViewOpen(false);
                  setViewingCompany(null);
                }}
              >
                <Text className="font-semibold text-slate-700">Close</Text>
              </Pressable>
              {viewingCompany ? (
                <Pressable
                  className="flex-1 items-center rounded-lg bg-indigo-600 py-3 active:bg-indigo-700"
                  onPress={() => {
                    const x = viewingCompany;
                    setViewOpen(false);
                    setViewingCompany(null);
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
