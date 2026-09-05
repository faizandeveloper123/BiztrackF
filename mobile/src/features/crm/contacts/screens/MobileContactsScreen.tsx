import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert, Linking, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { MenuHeaderButton } from '../../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../../contexts/SidebarDrawerContext';
import { useAuth } from '../../../../contexts/AuthContext';
import {
  LabeledContactFieldsMobile,
  defaultEmailRowsFromEntity,
  defaultPhoneRowsFromEntity,
} from '../../../../components/crm/LabeledContactFieldsMobile';
import { OptionSheet } from '../../../../components/crm/OptionSheet';
import { extractErrorMessage } from '../../../../utils/errorUtils';
import { apiService } from '../../../../services/ApiService';
import type { User } from '../../../../models/auth';
import {
  uploadDocumentFromUri,
  deleteUploadedFileByKey,
  extractS3KeyFromUrl,
} from '../../../../utils/fileUploadMobile';
import {
  Contact,
  ContactAttachment,
  ContactCreate,
  ContactType,
  ContactUpdate,
  CRMContactFilters,
  Industry,
  LabeledEmailItem,
  LabeledPhoneItem,
  Company,
  ContactSocialLinks,
  ContactAddressRow,
} from '../../../../models/crm';
import {
  fetchContacts,
  fetchCompaniesList,
  createContactApi,
  updateContactApi,
  deleteContactApi,
} from '../../../../services/crm/contactsApi';
import { formatCrmDate } from '../../../../services/crm/CrmMobileService';
import {
  buildAddressesPayload,
  birthdayInputFromApi,
  contactAddressCountriesDisplay,
  contactTypeDisplayLabel,
  defaultSocialLinks,
  emptyAddressRow,
  industryLabel,
  mergeSocialFromApi,
  CONTACT_SOCIAL_KEYS,
} from '../utils/contactFormUtils';
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

type FormState = ContactCreate & { tagsText: string };

function assigneeLabel(u: Partial<User>): string {
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  if (name) return name;
  return u.userName || u.email || (u.id || u.userId || '');
}

function buildEmptyForm(assignedDefault?: string): FormState {
  return {
    firstName: '',
    lastName: '',
    emails: [{ value: '', label: 'personal' }] as LabeledEmailItem[],
    phones: [{ value: '', label: 'work' }] as LabeledPhoneItem[],
    jobTitle: '',
    department: '',
    companyId: '',
    contactType: ContactType.CUSTOMER,
    notes: '',
    description: '',
    tags: [],
    tagsText: '',
    attachments: [] as ContactAttachment[],
    isActive: true,
    initials: '',
    fullName: '',
    birthday: '',
    businessTaxId: '',
    addresses: [],
    socialLinks: defaultSocialLinks(),
    assignedTo: assignedDefault || '',
    website: '',
  };
}

function primaryEmail(contact: Contact): string {
  const ev = (contact.emails || []).filter((e) => e.value.trim());
  if (ev.length > 0) return ev.map((e) => e.value).join(', ');
  return contact.email?.trim() || '';
}

function birthdayShort(contact: Contact): string {
  if (!contact.birthday) return '—';
  const d = String(contact.birthday).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [, month, day] = d.split('-');
    return `${month}/${day}`;
  }
  return formatCrmDate(contact.birthday);
}

export function MobileContactsScreen() {
  const { user, currentTenant, logout } = useAuth();
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<CRMContactFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [filterTypeSheetOpen, setFilterTypeSheetOpen] = useState(false);
  const [formContactTypeSheetOpen, setFormContactTypeSheetOpen] =
    useState(false);
  const [industrySheetOpen, setIndustrySheetOpen] = useState(false);
  const [assigneeSheetOpen, setAssigneeSheetOpen] = useState(false);
  const [birthdayMonthSheetOpen, setBirthdayMonthSheetOpen] = useState(false);
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);

  const [companySheetOpen, setCompanySheetOpen] = useState(false);
  const [formAssigneeSheetOpen, setFormAssigneeSheetOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  const [form, setForm] = useState<FormState>(() => buildEmptyForm());
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [attachmentBusy, setAttachmentBusy] = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  const companyById = useMemo(
    () => new Map(companies.map((c) => [c.id, c])),
    [companies],
  );

  const appliedFilters = useMemo((): CRMContactFilters => {
    const t = searchTerm.trim();
    return { ...filters, search: t || undefined };
  }, [filters, searchTerm]);

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchContacts(
        appliedFilters,
        currentPage,
        ITEMS_PER_PAGE,
      );
      setContacts(res.contacts ?? []);
      setTotalCount(res.pagination?.total ?? 0);
    } catch (e) {
      Alert.alert('Contacts', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, currentPage]);

  const loadCompanies = useCallback(async () => {
    try {
      const list = await fetchCompaniesList(200);
      setCompanies(list);
    } catch {
      setCompanies([]);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const res = (await apiService.getCurrentTenantUsers()) as {
        users?: User[];
      };
      const list = res.users ?? [];
      const unique = list.reduce<User[]>((acc, u) => {
        const id = u.id || u.userId;
        if (!id) return acc;
        if (!acc.find((x) => (x.id || x.userId) === id)) acc.push(u);
        return acc;
      }, []);
      setUsers(unique);
    } catch {
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/crm/contacts',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedFilters]);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    void loadCompanies();
    void loadUsers();
  }, [loadCompanies, loadUsers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadContacts(), loadCompanies()]);
    setRefreshing(false);
  }, [loadContacts, loadCompanies]);

  const resetForm = useCallback(() => {
    setForm(buildEmptyForm());
    setEditingContact(null);
  }, []);

  const openCreate = () => {
    resetForm();
    const uid = user?.id || user?.userId;
    if (uid) {
      setForm(buildEmptyForm(uid));
    }
    setCreateOpen(true);
  };

  const openEdit = (c: Contact) => {
    setEditingContact(c);
    setForm({
      firstName: c.firstName,
      lastName: c.lastName,
      emails: defaultEmailRowsFromEntity(c),
      phones: defaultPhoneRowsFromEntity(c),
      jobTitle: c.jobTitle || '',
      department: c.department || '',
      companyId: c.companyId || '',
      contactType: c.contactType ?? ContactType.CUSTOMER,
      notes: c.notes || '',
      description: c.description || '',
      tags: c.tags || [],
      tagsText: c.tags?.join(', ') || '',
      attachments: c.attachments || [],
      isActive: c.isActive,
      initials: c.initials || '',
      fullName: c.fullName || '',
      birthday: birthdayInputFromApi(c.birthday),
      businessTaxId: c.businessTaxId || '',
      addresses: Array.isArray(c.addresses) ? c.addresses : [],
      socialLinks: mergeSocialFromApi(c.socialLinks),
      assignedTo: c.assignedTo || '',
      website: c.website || '',
    });
    setEditOpen(true);
  };

  const openView = (c: Contact) => {
    setViewingContact(c);
    setViewOpen(true);
  };

  const pickAttachment = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });
      if (r.canceled || !r.assets?.[0]) return;
      const a = r.assets[0];
      setAttachmentBusy(true);
      const up = await uploadDocumentFromUri({
        uri: a.uri,
        name: a.name || 'document',
        mimeType: a.mimeType || undefined,
      });
      setForm((prev) => ({
        ...prev,
        attachments: [
          ...(prev.attachments || []),
          {
            url: up.file_url,
            original_filename: up.original_filename,
            s3_key: up.s3_key,
          },
        ],
      }));
    } catch (e) {
      Alert.alert('Upload', extractErrorMessage(e, 'Upload failed'));
    } finally {
      setAttachmentBusy(false);
    }
  };

  const removeAttachmentAt = async (index: number) => {
    const list = form.attachments || [];
    const att = list[index];
    if (att) {
      const key = att.s3_key || extractS3KeyFromUrl(att.url);
      if (key) {
        try {
          await deleteUploadedFileByKey(key);
        } catch {
          Alert.alert(
            'Attachments',
            'Removed from list; storage delete may have failed.',
          );
        }
      }
    }
    setForm((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index),
    }));
  };

  const submitPayloadCore = () => {
    const addressesPayload = buildAddressesPayload(form.addresses);
    const socialPayload = mergeSocialFromApi(form.socialLinks);
    return {
      addressesPayload,
      socialPayload,
      emails: (form.emails || []).filter((e) => e.value.trim()),
      phones: (form.phones || []).filter((p) => p.value.trim()),
    };
  };

  const submitCreate = async () => {
    if (!form.firstName?.trim() || !form.lastName?.trim()) {
      Alert.alert('Contact', 'First name and last name are required.');
      return;
    }
    try {
      const { addressesPayload, socialPayload, emails, phones } =
        submitPayloadCore();
      await createContactApi({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        emails,
        phones,
        jobTitle: form.jobTitle || undefined,
        department: form.department || undefined,
        companyId: form.companyId || undefined,
        contactType: form.contactType,
        notes: form.notes || undefined,
        description: form.description || undefined,
        tags: form.tags,
        attachments: form.attachments,
        isActive: form.isActive,
        initials: form.initials?.trim() || undefined,
        fullName: form.fullName?.trim() || undefined,
        businessTaxId: form.businessTaxId?.trim() || undefined,
        addresses: addressesPayload,
        socialLinks: socialPayload,
        ...(form.birthday?.trim()
          ? { birthday: `${form.birthday.trim()}T00:00:00` }
          : {}),
        website: form.website?.trim() || undefined,
        assignedTo: form.assignedTo || undefined,
      });
      setCreateOpen(false);
      resetForm();
      await loadContacts();
      Alert.alert('Contact', 'Created successfully.');
    } catch (e) {
      Alert.alert('Contact', extractErrorMessage(e, 'Failed to create'));
    }
  };

  const submitEdit = async () => {
    if (!editingContact) return;
    if (!form.firstName?.trim() || !form.lastName?.trim()) {
      Alert.alert('Contact', 'First name and last name are required.');
      return;
    }
    try {
      const { addressesPayload, socialPayload, emails, phones } =
        submitPayloadCore();
      const payload: ContactUpdate = {
        firstName: form.firstName,
        lastName: form.lastName,
        emails,
        phones,
        jobTitle: form.jobTitle,
        department: form.department,
        companyId: form.companyId || undefined,
        contactType: form.contactType,
        notes: form.notes,
        description: form.description,
        tags: form.tags,
        attachments: form.attachments,
        isActive: form.isActive,
        initials: form.initials?.trim() || null,
        fullName: form.fullName?.trim() || null,
        businessTaxId: form.businessTaxId?.trim() || null,
        addresses: addressesPayload,
        socialLinks: socialPayload,
        birthday: form.birthday?.trim()
          ? `${form.birthday.trim()}T00:00:00`
          : null,
        website: form.website?.trim() || null,
        assignedTo: form.assignedTo || undefined,
      };
      await updateContactApi(editingContact.id, payload);
      setEditOpen(false);
      resetForm();
      await loadContacts();
      Alert.alert('Contact', 'Updated successfully.');
    } catch (e) {
      Alert.alert('Contact', extractErrorMessage(e, 'Failed to update'));
    }
  };

  const confirmDelete = async () => {
    if (!contactToDelete) return;
    try {
      await deleteContactApi(contactToDelete.id);
      setDeleteOpen(false);
      setContactToDelete(null);
      await loadContacts();
      Alert.alert('Contact', 'Deleted.');
    } catch (e) {
      Alert.alert('Contact', extractErrorMessage(e, 'Failed to delete'));
    }
  };

  const contactTypeOptions = useMemo(
    () =>
      [
        { value: FILTER_ANY, label: 'All categories' },
        ...Object.values(ContactType).map((t) => ({
          value: t,
          label: t.charAt(0).toUpperCase() + t.slice(1),
        })),
      ] as { value: string; label: string }[],
    [],
  );

  const industryOptions = useMemo(
    () =>
      [
        { value: FILTER_ANY, label: 'All industries' },
        ...Object.values(Industry).map((ind) => ({
          value: ind,
          label: ind
            .split('_')
            .map(
              (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
            )
            .join(' '),
        })),
      ] as { value: string; label: string }[],
    [],
  );

  const monthOptions = useMemo(
    () =>
      [
        { value: FILTER_ANY, label: 'Any month' },
        ...Array.from({ length: 12 }, (_, i) => ({
          value: String(i + 1),
          label: new Date(2000, i, 1).toLocaleString('en-US', {
            month: 'long',
          }),
        })),
      ] as { value: string; label: string }[],
    [],
  );

  const assigneeFilterOptions = useMemo(() => {
    const opts = [
      { value: FILTER_ANY, label: 'All assignees' },
      ...users.map((u) => ({
        value: u.id || u.userId || '',
        label: assigneeLabel(u),
      })).filter((o) => o.value),
    ];
    return opts;
  }, [users]);

  const companyFormOptions = useMemo(() => {
    return [
      { value: '', label: 'No company' },
      ...companies.map((c) => ({ value: c.id, label: c.name })),
    ];
  }, [companies]);

  const formAssigneeOptions = useMemo(() => {
    return [
      { value: '', label: 'Unassigned' },
      ...users.map((u) => ({
        value: u.id || u.userId || '',
        label: assigneeLabel(u),
      })).filter((o) => o.value),
    ];
  }, [users]);

  const contactTypeFormOptions = useMemo(
    () =>
      Object.values(ContactType).map((t) => ({
        value: t,
        label: t.charAt(0).toUpperCase() + t.slice(1),
      })),
    [],
  );

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
              <Text className="text-2xl font-bold text-indigo-700">Contacts</Text>
              <Text className="mt-1 text-sm text-slate-600">
                Customer contacts and touchpoints
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
        <View className="mt-3 flex-row flex-wrap gap-2">
          <Pressable
            className="rounded-lg border border-slate-300 px-3 py-2 active:bg-slate-50"
            onPress={() => setFiltersModalOpen(true)}
          >
            <Text className="text-sm font-semibold text-slate-800">Filters</Text>
          </Pressable>
          <Pressable
            className="rounded-lg bg-indigo-600 px-3 py-2 active:bg-indigo-700"
            onPress={openCreate}
          >
            <Text className="text-sm font-semibold text-white">New contact</Text>
          </Pressable>
        </View>
      </View>

      <View className="mt-4 px-4">
        <Text className="mb-2 text-sm font-semibold text-slate-700">
          Search
        </Text>
        <View className="rounded-xl border border-slate-200 bg-white p-3">
          <View className="flex-row items-center rounded-lg border border-slate-200 bg-slate-50 px-3">
            <Ionicons name="search-outline" size={18} color="#94a3b8" />
            <TextInput
              className="ml-2 flex-1 py-2 text-sm text-slate-900"
              placeholder="Name, email, phone…"
              placeholderTextColor="#94a3b8"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          <View className="mt-3 flex-row flex-wrap gap-2">
          <Pressable
            className="min-w-[30%] flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2"
            onPress={() => setFilterTypeSheetOpen(true)}
          >
              <Text
                className="text-center text-xs font-semibold text-slate-700"
                numberOfLines={1}
              >
                Type:{' '}
                {filters.type
                  ? filters.type.charAt(0).toUpperCase() + filters.type.slice(1)
                  : 'all'}
              </Text>
            </Pressable>
            <Pressable
              className="min-w-[30%] flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2"
              onPress={() => setIndustrySheetOpen(true)}
            >
              <Text
                className="text-center text-xs font-semibold text-slate-700"
                numberOfLines={2}
              >
                Industry:{' '}
                {filters.industry
                  ? industryLabel(filters.industry)
                  : 'all'}
              </Text>
            </Pressable>
            <Pressable
              className="min-w-[30%] flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2"
              onPress={() => setAssigneeSheetOpen(true)}
            >
              <Text
                className="text-center text-xs font-semibold text-slate-700"
                numberOfLines={2}
              >
                Assignee:{' '}
                {filters.assignedTo
                  ? assigneeLabel(
                      users.find(
                        (u) => (u.id || u.userId) === filters.assignedTo,
                      ) || {
                        userName: filters.assignedTo,
                      },
                    )
                  : 'all'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View className="mt-4 px-4">
        <Text className="text-base font-semibold text-slate-900">Contact list</Text>
        <Text className="text-sm text-slate-500">
          {totalCount > 0
            ? `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of ${totalCount}`
            : 'No contacts'}
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
        data={contacts}
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
              No contacts match your filters.
            </Text>
          )
        }
        renderItem={({ item: c }) => {
          const co = c.companyId ? companyById.get(c.companyId) : undefined;
          const site = c.website?.trim();
          return (
            <View className="mx-4 mb-3 rounded-xl border border-slate-200 bg-white p-4">
              <View className="flex-row items-start justify-between gap-2">
                <Pressable
                  className="min-w-0 flex-1"
                  onPress={() => openView(c)}
                >
                  <Text className="text-lg font-semibold text-slate-900">
                    {c.firstName} {c.lastName}
                  </Text>
                  <Text className="text-sm text-slate-600">
                    {primaryEmail(c) || '—'}
                  </Text>
                  {co ? (
                    <Text className="text-sm text-slate-600">{co.name}</Text>
                  ) : null}
                  {co?.industry ? (
                    <Text className="text-xs text-slate-500">
                      {industryLabel(co.industry)}
                    </Text>
                  ) : null}
                  {site ? (
                    <Text className="text-xs text-blue-600" numberOfLines={1}>
                      {site}
                    </Text>
                  ) : null}
                  <View className="mt-2 flex-row flex-wrap gap-2">
                    <View className="rounded-full bg-indigo-100 px-2 py-0.5">
                      <Text className="text-xs font-medium capitalize text-indigo-800">
                        {contactTypeDisplayLabel(c)}
                      </Text>
                    </View>
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
                    <View className="rounded-full bg-slate-100 px-2 py-0.5">
                      <Text className="text-xs font-medium text-slate-700">
                        {birthdayShort(c)}
                      </Text>
                    </View>
                  </View>
                  {c.lifetimeValue != null && c.lifetimeValue > 0 ? (
                    <Text className="mt-2 text-xs font-medium text-emerald-700">
                      CLV ${c.lifetimeValue.toLocaleString()} · Remaining ${(c.remainingPayable ?? 0).toLocaleString()}
                    </Text>
                  ) : null}
                  {contactAddressCountriesDisplay(c) ? (
                    <Text className="mt-1 text-xs text-slate-500">
                      {contactAddressCountriesDisplay(c)}
                    </Text>
                  ) : null}
                </Pressable>
                <View className="items-end gap-2">
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => openView(c)}
                      className="rounded-lg bg-slate-100 p-2 active:bg-slate-200"
                    >
                      <Ionicons name="eye-outline" size={18} color="#334155" />
                    </Pressable>
                    <Pressable
                      onPress={() => openEdit(c)}
                      className="rounded-lg bg-slate-100 p-2 active:bg-slate-200"
                    >
                      <Ionicons name="pencil-outline" size={18} color="#334155" />
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setContactToDelete(c);
                        setDeleteOpen(true);
                      }}
                      className="rounded-lg bg-red-50 p-2 active:bg-red-100"
                    >
                      <Ionicons name="trash-outline" size={18} color="#b91c1c" />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
      />

      <OptionSheet
        visible={filterTypeSheetOpen}
        title="Category filter"
        options={contactTypeOptions.map((o) => ({
          value: o.value,
          label: o.label,
        }))}
        onSelect={(v) =>
          setFilters((f) => ({
            ...f,
            type: v === FILTER_ANY ? undefined : (v as ContactType),
          }))
        }
        onClose={() => setFilterTypeSheetOpen(false)}
      />

      <OptionSheet
        visible={formContactTypeSheetOpen}
        title="Category"
        options={contactTypeFormOptions}
        onSelect={(v) =>
          setForm((p) => ({ ...p, contactType: v as ContactType }))
        }
        onClose={() => setFormContactTypeSheetOpen(false)}
      />

      <OptionSheet
        visible={industrySheetOpen}
        title="Industry"
        options={industryOptions}
        onSelect={(v) =>
          setFilters((f) => ({
            ...f,
            industry: v === FILTER_ANY ? undefined : (v as Industry),
          }))
        }
        onClose={() => setIndustrySheetOpen(false)}
      />

      <OptionSheet
        visible={assigneeSheetOpen}
        title="Assignee"
        options={assigneeFilterOptions}
        onSelect={(v) =>
          setFilters((f) => ({
            ...f,
            assignedTo: v === FILTER_ANY ? undefined : v,
          }))
        }
        onClose={() => setAssigneeSheetOpen(false)}
      />

      <OptionSheet
        visible={birthdayMonthSheetOpen}
        title="Birthday month"
        options={monthOptions}
        onSelect={(v) =>
          setFilters((f) => ({
            ...f,
            birthdayMonth:
              v === FILTER_ANY ? undefined : parseInt(v, 10),
          }))
        }
        onClose={() => setBirthdayMonthSheetOpen(false)}
      />

      <OptionSheet
        visible={companySheetOpen}
        title="Company"
        options={companyFormOptions}
        onSelect={(v) => setForm((p) => ({ ...p, companyId: v }))}
        onClose={() => setCompanySheetOpen(false)}
      />

      <OptionSheet
        visible={formAssigneeSheetOpen}
        title="Assigned to"
        options={formAssigneeOptions}
        onSelect={(v) => setForm((p) => ({ ...p, assignedTo: v }))}
        onClose={() => setFormAssigneeSheetOpen(false)}
      />

      <AppModal
        visible={filtersModalOpen}
        transparent
        animationType="slide"
        onClose={() => setFiltersModalOpen(false)}
      >
        <KeyboardBottomSheetShell overlayColor="rgba(0,0,0,0.4)">
          <View className="max-h-[85%] rounded-t-2xl bg-white px-4 pb-6 pt-4">
            <Text className="text-lg font-bold text-slate-900">Filters</Text>
            <ScrollView className="mt-3" keyboardShouldPersistTaps="handled">
              <Text className="mb-1 text-xs font-medium text-slate-600">
                Website contains
              </Text>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
                value={filters.website || ''}
                onChangeText={(t) =>
                  setFilters((f) => ({
                    ...f,
                    website: t || undefined,
                  }))
                }
                placeholder="example.com"
                autoCapitalize="none"
              />
              <Text className="mb-1 text-xs font-medium text-slate-600">
                Country (address)
              </Text>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
                value={filters.country || ''}
                onChangeText={(t) =>
                  setFilters((f) => ({
                    ...f,
                    country: t || undefined,
                  }))
                }
                placeholder="Country"
              />
              <Pressable
                className="mb-3 rounded-lg border border-slate-200 bg-slate-50 py-3"
                onPress={() => {
                  setFiltersModalOpen(false);
                  setBirthdayMonthSheetOpen(true);
                }}
              >
                <Text className="text-center text-sm font-semibold text-slate-800">
                  Birthday month:{' '}
                  {filters.birthdayMonth != null
                    ? monthOptions.find(
                        (m) => m.value === String(filters.birthdayMonth),
                      )?.label || '—'
                    : 'Any'}
                </Text>
              </Pressable>
            </ScrollView>
            <View className="mt-2 flex-row gap-2">
              <Pressable
                className="flex-1 items-center rounded-lg border border-slate-300 py-3"
                onPress={() => {
                  setFilters({});
                  setSearchTerm('');
                }}
              >
                <Text className="font-semibold text-slate-700">Reset all</Text>
              </Pressable>
              <Pressable
                className="flex-1 items-center rounded-lg bg-indigo-600 py-3 active:bg-indigo-700"
                onPress={() => setFiltersModalOpen(false)}
              >
                <Text className="font-semibold text-white">Done</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardBottomSheetShell>
      </AppModal>

      <MobileFormSheet
        visible={createOpen}
        title="New Contact"
        onCancel={() => {
          setCreateOpen(false);
          resetForm();
        }}
        onSave={() => void submitCreate()}
        saveLabel="Create"
      >
            <FormSection title="Core Identity">
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
              <View className="p-3">
                <LabeledContactFieldsMobile
                  emails={(form.emails || []) as LabeledEmailItem[]}
                  phones={(form.phones || []) as LabeledPhoneItem[]}
                  onEmailsChange={(emails) => setForm((p) => ({ ...p, emails }))}
                  onPhonesChange={(phones) => setForm((p) => ({ ...p, phones }))}
                />
              </View>
            </FormSection>

            <FormSection title="Professional Context">
              <FormInput
                label="Job Title"
                icon="briefcase-outline"
                value={form.jobTitle || ''}
                onChangeText={(t) => setForm(p => ({ ...p, jobTitle: t }))}
                placeholder="Ex: Marketing Director"
              />
               <FormInput
                label="Department"
                icon="apps-outline"
                value={form.department || ''}
                onChangeText={(t) => setForm(p => ({ ...p, department: t }))}
                placeholder="Ex: Sales"
              />
              <FormSelect
                label="Target Company"
                icon="business-outline"
                value={form.companyId ? companyById.get(form.companyId)?.name || '' : 'Select Company'}
                onPress={() => setCompanySheetOpen(true)}
              />
              <FormSelect
                label="Relationship Category"
                icon="people-outline"
                value={form.contactType ? String(form.contactType) : 'Customer'}
                onPress={() => setFormContactTypeSheetOpen(true)}
                last
              />
            </FormSection>

            <FormSection title="Personal Details">
              <FormInput
                label="Initials"
                icon="text-outline"
                value={form.initials || ''}
                onChangeText={(t) => setForm(p => ({ ...p, initials: t }))}
                placeholder="JD"
              />
              <WorkshopDatePickerField
                label="Birthday"
                value={form.birthday || ''}
                onChange={(t) => setForm((p) => ({ ...p, birthday: t }))}
              />
            </FormSection>

            <FormSection title="Communication & Social">
              <FormInput
                label="Website"
                icon="globe-outline"
                value={form.website || ''}
                onChangeText={(t) => setForm(p => ({ ...p, website: t }))}
                placeholder="https://..."
                autoCapitalize="none"
              />
              {CONTACT_SOCIAL_KEYS.map(([sKey, sLabel], idx) => (
                <FormInput
                  key={sKey}
                  label={sLabel}
                  icon="share-social-outline"
                  value={form.socialLinks?.[sKey as keyof ContactSocialLinks] || ''}
                  onChangeText={(v) => setForm(p => ({ ...p, socialLinks: { ...(p.socialLinks || {}), [sKey]: v } }))}
                  placeholder={`Username / URL`}
                  last={idx === CONTACT_SOCIAL_KEYS.length - 1}
                />
              ))}
            </FormSection>

            <FormSection title="Addresses">
              {(form.addresses || []).map((row, idx) => (
                <View key={`addr-${idx}`} className="mb-4 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                  <View className="mb-2 flex-row items-center justify-between">
                    <Text className="text-xs font-bold uppercase text-slate-400">Address {idx + 1}</Text>
                    <Pressable onPress={() => {
                        const next = [...(form.addresses || [])];
                        next.splice(idx, 1);
                        setForm(p => ({ ...p, addresses: next }));
                    }}>
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </Pressable>
                  </View>
                  <TextInput
                    className="mb-1 rounded-lg border border-slate-100 bg-slate-50 px-2 py-2 text-sm text-slate-900"
                    placeholder="Label (Work, Home...)"
                    value={row.label || ''}
                    onChangeText={(t) => {
                        const next = [...(form.addresses || [])];
                        next[idx] = { ...next[idx], label: t };
                        setForm(p => ({ ...p, addresses: next }));
                    }}
                  />
                  <TextInput
                    className="mb-1 rounded-lg border border-slate-100 bg-slate-50 px-2 py-2 text-sm text-slate-900"
                    placeholder="Street Address"
                    value={row.line1 || ''}
                    onChangeText={(t) => {
                        const next = [...(form.addresses || [])];
                        next[idx] = { ...next[idx], line1: t };
                        setForm(p => ({ ...p, addresses: next }));
                    }}
                  />
                  <View className="flex-row gap-1">
                    <TextInput
                      className="flex-1 rounded-lg border border-slate-100 bg-slate-50 px-2 py-2 text-sm text-slate-900"
                      placeholder="City"
                      value={row.city || ''}
                      onChangeText={(t) => {
                          const next = [...(form.addresses || [])];
                          next[idx] = { ...next[idx], city: t };
                          setForm(p => ({ ...p, addresses: next }));
                      }}
                    />
                    <TextInput
                      className="w-20 rounded-lg border border-slate-100 bg-slate-50 px-2 py-2 text-sm text-slate-900"
                      placeholder="State"
                      value={row.state || ''}
                      onChangeText={(t) => {
                          const next = [...(form.addresses || [])];
                          next[idx] = { ...next[idx], state: t };
                          setForm(p => ({ ...p, addresses: next }));
                      }}
                    />
                  </View>
                </View>
              ))}
              <Pressable
                className="items-center rounded-lg border border-dashed border-slate-300 py-3"
                onPress={() => setForm(p => ({ ...p, addresses: [...(p.addresses || []), emptyAddressRow()] }))}
              >
                <Text className="text-sm font-semibold text-slate-600">+ Add Address</Text>
              </Pressable>
            </FormSection>

            <FormSection title="Documents & Files">
              {(form.attachments || []).map((att, idx) => (
                <View key={idx} className="mb-2 flex-row items-center justify-between rounded-lg border border-slate-100 bg-white p-3">
                  <View className="flex-row items-center">
                    <Ionicons name="document-outline" size={20} color="#6366f1" />
                    <Text className="ml-2 text-sm text-slate-700" numberOfLines={1}>{att.original_filename || 'File'}</Text>
                  </View>
                  <Pressable onPress={() => void removeAttachmentAt(idx)}>
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </Pressable>
                </View>
              ))}
              <Pressable
                className={`items-center rounded-xl border border-dashed border-slate-300 py-6 ${attachmentBusy ? 'opacity-50' : ''}`}
                onPress={() => void pickAttachment()}
                disabled={attachmentBusy}
              >
                <Ionicons name="cloud-upload-outline" size={24} color="#64748b" />
                <Text className="mt-2 text-sm font-semibold text-slate-600">
                  {attachmentBusy ? 'Uploading...' : 'Upload Document'}
                </Text>
              </Pressable>
            </FormSection>

            <FormSection title="Internal Notes & Tags">
              <FormInput
                label="Tags (comma separated)"
                icon="pricetags-outline"
                value={form.tagsText}
                onChangeText={(t) => setForm(p => ({ ...p, tagsText: t, tags: t.split(',').map(x => x.trim()).filter(Boolean) }))}
              />
              <FormInput
                label="Internal Description"
                value={form.description || ''}
                onChangeText={(t) => setForm(p => ({ ...p, description: t }))}
                multiline
              />
              <FormInput
                label="Private Notes"
                value={form.notes || ''}
                onChangeText={(t) => setForm(p => ({ ...p, notes: t }))}
                multiline
                last
              />
              
              <View className="mt-4 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                <View className="flex-row items-center">
                  <View className={`h-2 w-2 rounded-full mr-2 ${form.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <Text className="text-sm font-semibold text-slate-800">Active Record</Text>
                </View>
                <Switch 
                  value={form.isActive} 
                  onValueChange={(v) => setForm(p => ({ ...p, isActive: v }))} 
                  trackColor={{ false: '#e2e8f0', true: '#6ee7b7' }}
                  thumbColor={form.isActive ? '#10b981' : '#f8fafc'}
                />
              </View>
              
              <FormSelect
                label="Assigned Owner"
                icon="person-circle-outline"
                value={form.assignedTo ? assigneeLabel(users.find(u => (u.id || u.userId) === form.assignedTo) || { userName: form.assignedTo }) : 'Unassigned'}
                onPress={() => setFormAssigneeSheetOpen(true)}
              />
            </FormSection>
      </MobileFormSheet>

      <MobileFormSheet
        visible={editOpen}
        title="Edit Contact"
        onCancel={() => {
          setEditOpen(false);
          resetForm();
        }}
        onSave={() => void submitEdit()}
      >
            <FormSection title="Core Identity">
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
              <View className="p-3">
                <LabeledContactFieldsMobile
                  emails={(form.emails || []) as LabeledEmailItem[]}
                  phones={(form.phones || []) as LabeledPhoneItem[]}
                  onEmailsChange={(emails) => setForm((p) => ({ ...p, emails }))}
                  onPhonesChange={(phones) => setForm((p) => ({ ...p, phones }))}
                />
              </View>
            </FormSection>

            <FormSection title="Professional Context">
              <FormInput
                label="Job Title"
                icon="briefcase-outline"
                value={form.jobTitle || ''}
                onChangeText={(t) => setForm(p => ({ ...p, jobTitle: t }))}
              />
               <FormInput
                label="Department"
                icon="apps-outline"
                value={form.department || ''}
                onChangeText={(t) => setForm(p => ({ ...p, department: t }))}
              />
              <FormSelect
                label="Target Company"
                icon="business-outline"
                value={form.companyId ? companyById.get(form.companyId)?.name || '' : 'Select Company'}
                onPress={() => setCompanySheetOpen(true)}
              />
              <FormSelect
                label="Relationship Category"
                icon="people-outline"
                value={form.contactType ? String(form.contactType) : 'Customer'}
                onPress={() => setFormContactTypeSheetOpen(true)}
                last
              />
            </FormSection>

            <FormSection title="Personal Details">
              <FormInput
                label="Initials"
                icon="text-outline"
                value={form.initials || ''}
                onChangeText={(t) => setForm(p => ({ ...p, initials: t }))}
              />
              <FormInput
                label="Birthday"
                icon="calendar-outline"
                value={form.birthday || ''}
                onChangeText={(t) => setForm(p => ({ ...p, birthday: t }))}
                last
              />
            </FormSection>

            <FormSection title="Communication & Social">
              <FormInput
                label="Website"
                icon="globe-outline"
                value={form.website || ''}
                onChangeText={(t) => setForm(p => ({ ...p, website: t }))}
                autoCapitalize="none"
              />
              {CONTACT_SOCIAL_KEYS.map(([sKey, sLabel], idx) => (
                <FormInput
                  key={sKey}
                  label={sLabel}
                  icon="share-social-outline"
                  value={form.socialLinks?.[sKey as keyof ContactSocialLinks] || ''}
                  onChangeText={(v) => setForm(p => ({ ...p, socialLinks: { ...(p.socialLinks || {}), [sKey]: v } }))}
                  last={idx === CONTACT_SOCIAL_KEYS.length - 1}
                />
              ))}
            </FormSection>

            <FormSection title="Addresses">
              {(form.addresses || []).map((row, idx) => (
                <View key={`addr-${idx}`} className="mb-4 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                  <View className="mb-2 flex-row items-center justify-between">
                    <Text className="text-xs font-bold uppercase text-slate-400">Address {idx + 1}</Text>
                    <Pressable onPress={() => {
                        const next = [...(form.addresses || [])];
                        next.splice(idx, 1);
                        setForm(p => ({ ...p, addresses: next }));
                    }}>
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </Pressable>
                  </View>
                  <TextInput
                    className="mb-1 rounded-lg border border-slate-100 bg-slate-50 px-2 py-2 text-sm text-slate-900"
                    placeholder="Label (Work, Home...)"
                    value={row.label || ''}
                    onChangeText={(t) => {
                        const next = [...(form.addresses || [])];
                        next[idx] = { ...next[idx], label: t };
                        setForm(p => ({ ...p, addresses: next }));
                    }}
                  />
                  <TextInput
                    className="mb-1 rounded-lg border border-slate-100 bg-slate-50 px-2 py-2 text-sm text-slate-900"
                    placeholder="Street Address"
                    value={row.line1 || ''}
                    onChangeText={(t) => {
                        const next = [...(form.addresses || [])];
                        next[idx] = { ...next[idx], line1: t };
                        setForm(p => ({ ...p, addresses: next }));
                    }}
                  />
                  <View className="flex-row gap-1">
                    <TextInput
                      className="flex-1 rounded-lg border border-slate-100 bg-slate-50 px-2 py-2 text-sm text-slate-900"
                      placeholder="City"
                      value={row.city || ''}
                      onChangeText={(t) => {
                          const next = [...(form.addresses || [])];
                          next[idx] = { ...next[idx], city: t };
                          setForm(p => ({ ...p, addresses: next }));
                      }}
                    />
                    <TextInput
                      className="w-20 rounded-lg border border-slate-100 bg-slate-50 px-2 py-2 text-sm text-slate-900"
                      placeholder="State"
                      value={row.state || ''}
                      onChangeText={(t) => {
                          const next = [...(form.addresses || [])];
                          next[idx] = { ...next[idx], state: t };
                          setForm(p => ({ ...p, addresses: next }));
                      }}
                    />
                  </View>
                </View>
              ))}
              <Pressable
                className="items-center rounded-lg border border-dashed border-slate-300 py-3"
                onPress={() => setForm(p => ({ ...p, addresses: [...(p.addresses || []), emptyAddressRow()] }))}
              >
                <Text className="text-sm font-semibold text-slate-600">+ Add Address</Text>
              </Pressable>
            </FormSection>

            <FormSection title="Documents & Files">
              {(form.attachments || []).map((att, idx) => (
                <View key={idx} className="mb-2 flex-row items-center justify-between rounded-lg border border-slate-100 bg-white p-3">
                  <View className="flex-row items-center">
                    <Ionicons name="document-outline" size={20} color="#6366f1" />
                    <Text className="ml-2 text-sm text-slate-700" numberOfLines={1}>{att.original_filename || 'File'}</Text>
                  </View>
                  <Pressable onPress={() => void removeAttachmentAt(idx)}>
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </Pressable>
                </View>
              ))}
              <Pressable
                className={`items-center rounded-xl border border-dashed border-slate-300 py-6 ${attachmentBusy ? 'opacity-50' : ''}`}
                onPress={() => void pickAttachment()}
                disabled={attachmentBusy}
              >
                <Ionicons name="cloud-upload-outline" size={24} color="#64748b" />
                <Text className="mt-2 text-sm font-semibold text-slate-600">
                  {attachmentBusy ? 'Uploading...' : 'Upload Document'}
                </Text>
              </Pressable>
            </FormSection>

            <FormSection title="Internal Notes & Tags">
              <FormInput
                label="Tags (comma separated)"
                icon="pricetags-outline"
                value={form.tagsText}
                onChangeText={(t) => setForm(p => ({ ...p, tagsText: t, tags: t.split(',').map(x => x.trim()).filter(Boolean) }))}
              />
              <FormInput
                label="Internal Description"
                value={form.description || ''}
                onChangeText={(t) => setForm(p => ({ ...p, description: t }))}
                multiline
              />
              <FormInput
                label="Private Notes"
                value={form.notes || ''}
                onChangeText={(t) => setForm(p => ({ ...p, notes: t }))}
                multiline
                last
              />
              
              <View className="mt-4 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                <View className="flex-row items-center">
                  <View className={`h-2 w-2 rounded-full mr-2 ${form.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <Text className="text-sm font-semibold text-slate-800">Active Record</Text>
                </View>
                <Switch 
                  value={form.isActive} 
                  onValueChange={(v) => setForm(p => ({ ...p, isActive: v }))} 
                  trackColor={{ false: '#e2e8f0', true: '#6ee7b7' }}
                  thumbColor={form.isActive ? '#10b981' : '#f8fafc'}
                />
              </View>
              
              <FormSelect
                label="Assigned Owner"
                icon="person-circle-outline"
                value={form.assignedTo ? assigneeLabel(users.find(u => (u.id || u.userId) === form.assignedTo) || { userName: form.assignedTo }) : 'Unassigned'}
                onPress={() => setFormAssigneeSheetOpen(true)}
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
            <Text className="text-lg font-bold text-slate-900">Delete contact</Text>
            <Text className="mt-2 text-slate-600">
              Delete {contactToDelete?.firstName} {contactToDelete?.lastName}?
              This cannot be undone.
            </Text>
            <View className="mt-4 flex-row justify-end gap-2">
              <Pressable
                className="rounded-lg border border-slate-300 px-4 py-2"
                onPress={() => {
                  setDeleteOpen(false);
                  setContactToDelete(null);
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
            <Text className="text-lg font-bold text-slate-900">Contact</Text>
            {viewingContact ? (
              <ScrollView className="mt-3" keyboardShouldPersistTaps="handled">
                <Text className="text-xl font-semibold text-slate-900">
                  {viewingContact.firstName} {viewingContact.lastName}
                </Text>
                <Text className="mt-1 text-sm text-slate-600">
                  {primaryEmail(viewingContact) || '—'}
                </Text>
                {viewingContact.companyId ? (
                  <Text className="mt-2 text-sm text-slate-800">
                    Company:{' '}
                    {companyById.get(viewingContact.companyId)?.name || '—'}
                  </Text>
                ) : null}
                <Text className="mt-1 text-sm text-slate-600">
                  Category: {contactTypeDisplayLabel(viewingContact)}
                </Text>
                <Text className="mt-1 text-sm text-slate-600">
                  Status: {viewingContact.isActive ? 'Active' : 'Inactive'}
                </Text>
                {viewingContact.website?.trim() ? (
                  <Pressable
                    onPress={() =>
                      void Linking.openURL(
                        /^https?:\/\//i.test(viewingContact.website!.trim())
                          ? viewingContact.website!.trim()
                          : `https://${viewingContact.website!.trim()}`,
                      )
                    }
                  >
                    <Text className="text-sm text-blue-600">
                      {viewingContact.website}
                    </Text>
                  </Pressable>
                ) : null}
                <Text className="mt-2 text-sm text-slate-700">
                  Birthday: {birthdayShort(viewingContact)}
                </Text>
                {contactAddressCountriesDisplay(viewingContact) ? (
                  <Text className="mt-1 text-sm text-slate-600">
                    Countries:{' '}
                    {contactAddressCountriesDisplay(viewingContact)}
                  </Text>
                ) : null}
                {(viewingContact.notes || viewingContact.description) ? (
                  <View className="mt-3">
                    <Text className="text-xs font-semibold text-slate-500">
                      Notes
                    </Text>
                    <Text className="text-sm text-slate-800">
                      {viewingContact.notes || viewingContact.description}
                    </Text>
                  </View>
                ) : null}
              </ScrollView>
            ) : null}
            <View className="mt-4 flex-row gap-2">
              <Pressable
                className="flex-1 items-center rounded-lg border border-slate-300 py-3"
                onPress={() => {
                  setViewOpen(false);
                  setViewingContact(null);
                }}
              >
                <Text className="font-semibold text-slate-700">Close</Text>
              </Pressable>
              {viewingContact ? (
                <Pressable
                  className="flex-1 items-center rounded-lg bg-indigo-600 py-3 active:bg-indigo-700"
                  onPress={() => {
                    const c = viewingContact;
                    setViewOpen(false);
                    setViewingContact(null);
                    openEdit(c);
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
