import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useSidebarDrawer } from '../../../../contexts/SidebarDrawerContext';
import { useAuth } from '../../../../contexts/AuthContext';
import {
  LabeledContactFieldsMobile,
  defaultEmailRowsFromEntity,
  defaultPhoneRowsFromEntity,
} from '../../../../components/crm/LabeledContactFieldsMobile';
import { OptionSheet } from '../../../../components/crm/OptionSheet';
import { extractErrorMessage } from '../../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../../utils/appDialog';
import {
  uploadDocumentFromUri,
  deleteUploadedFileByKey,
  extractS3KeyFromUrl,
} from '../../../../utils/fileUploadMobile';
import type {
  Customer,
  CustomerAttachment,
  CustomerCreate,
  CustomerStats,
  CustomerUpdate,
  Guarantor,
  GuarantorCreate,
  LabeledEmailItem,
  LabeledPhoneItem,
} from '../../../../models/crm/customers';
import {
  getCustomers,
  getCustomerStats,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  uploadCustomerPhoto,
  deleteCustomerPhoto,
  importCustomersFromFile,
  getGuarantors,
  createGuarantor,
  updateGuarantor,
  deleteGuarantor,
} from '../../../../services/crm/CrmMobileService';
import {
  WorkshopChrome,
  WorkshopChipSelect,
  WorkshopFilterBar,
  countActiveFilters,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopHeaderButton,
  WorkshopLoading,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopPickerField,
  WorkshopPrimaryButton,
  WorkshopStatCard,
  WS,
} from '../../../workshop/components/WorkshopChrome';

const ITEMS_PER_PAGE = 10;

const emptyGuarantor: GuarantorCreate = {
  name: '',
  mobile: '',
  cnic: '',
  residential_address: '',
  official_address: '',
  occupation: '',
  relation: '',
};

function guarantorTextField(
  form: GuarantorCreate,
  key: keyof GuarantorCreate,
): string {
  const v = form[key];
  return typeof v === 'string' ? v : '';
}

function buildEmptyForm(): CustomerCreate & { tagsText: string } {
  return {
    firstName: '',
    lastName: '',
    emails: [{ value: '', label: 'personal' }] as LabeledEmailItem[],
    phones: [{ value: '', label: 'work' }] as LabeledPhoneItem[],
    cnic: '',
    address: '',
    city: '',
    state: '',
    country: 'Pakistan',
    postalCode: '',
    customerType: 'individual',
    customerStatus: 'active',
    creditLimit: 0,
    currentBalance: 0,
    paymentTerms: 'Cash',
    tags: [],
    tagsText: '',
    description: '',
    attachments: [] as CustomerAttachment[],
  };
}

export function MobileCustomersScreen() {
  const { user, currentTenant } = useAuth();
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive' | 'blocked'
  >('all');
  const [typeFilter, setTypeFilter] = useState<
    'all' | 'individual' | 'business'
  >('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(buildEmptyForm);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [attachmentBusy, setAttachmentBusy] = useState(false);

  const [guarantors, setGuarantors] = useState<Guarantor[]>([]);
  const [createGuarantors, setCreateGuarantors] = useState<GuarantorCreate[]>(
    [],
  );
  const [guarantorOpen, setGuarantorOpen] = useState(false);
  const [guarantorForm, setGuarantorForm] = useState<GuarantorCreate>(
    emptyGuarantor,
  );
  const [guarantorSource, setGuarantorSource] = useState<'create' | 'edit'>(
    'edit',
  );
  const [editingGuarantorId, setEditingGuarantorId] = useState<string | null>(
    null,
  );
  const [editingCreateGuarantorIndex, setEditingCreateGuarantorIndex] =
    useState<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * ITEMS_PER_PAGE;
      const res = await getCustomers(
        skip,
        ITEMS_PER_PAGE,
        searchTerm.trim() || undefined,
        statusFilter === 'all' ? undefined : statusFilter,
        typeFilter === 'all' ? undefined : typeFilter,
      );
      setCustomers(res.customers ?? []);
      setTotalCount(res.total ?? 0);
    } catch (e) {
      appError('Customers', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, typeFilter]);

  const loadStats = useCallback(async () => {
    try {
      const s = await getCustomerStats();
      setStats(s);
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/crm/customers',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadCustomers(), loadStats()]);
    setRefreshing(false);
  }, [loadCustomers, loadStats]);

  const resetForm = useCallback(() => {
    setForm(buildEmptyForm());
    setSelectedCustomer(null);
    setPhotoPreview(null);
    setPhotoRemoved(false);
    setGuarantors([]);
    setCreateGuarantors([]);
    setEditingGuarantorId(null);
    setEditingCreateGuarantorIndex(null);
    setGuarantorForm(emptyGuarantor);
  }, []);

  const pickCustomerPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      appAlert('Photos', 'Permission is required to choose a photo.');
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
      base64: true,
    });
    if (r.canceled || !r.assets[0]) return;
    const a = r.assets[0];
    if (a.base64) {
      const mime = a.mimeType || 'image/jpeg';
      setPhotoPreview(`data:${mime};base64,${a.base64}`);
      setPhotoRemoved(false);
    }
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
      appError('Upload', extractErrorMessage(e, 'Upload failed'));
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
          appAlert(
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

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = async (c: Customer) => {
    setSelectedCustomer(c);
    setForm({
      firstName: c.firstName,
      lastName: c.lastName,
      emails: defaultEmailRowsFromEntity(c),
      phones: defaultPhoneRowsFromEntity(c),
      cnic: c.cnic || '',
      address: c.address || '',
      city: c.city || '',
      state: c.state || '',
      country: c.country || 'Pakistan',
      postalCode: c.postalCode || '',
      customerType: c.customerType,
      customerStatus: c.customerStatus,
      creditLimit: c.creditLimit,
      currentBalance: c.currentBalance,
      paymentTerms: c.paymentTerms,
      tags: c.tags,
      tagsText: c.tags?.join(', ') || '',
      description: c.description || '',
      attachments: c.attachments || [],
    });
    setPhotoPreview(null);
    setPhotoRemoved(false);
    setEditOpen(true);
    try {
      const g = await getGuarantors(c.id);
      setGuarantors(g || []);
    } catch {
      setGuarantors([]);
    }
  };

  const submitCreate = async () => {
    if (!form.firstName?.trim() || !form.lastName?.trim()) {
      appAlert('Customer', 'First name and last name are required.');
      return;
    }
    try {
      setSaving(true);
      const payload: CustomerCreate = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        emails: (form.emails || []).filter((e) => e.value.trim()),
        phones: (form.phones || []).filter((p) => p.value.trim()),
        cnic: form.cnic || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        country: form.country || undefined,
        postalCode: form.postalCode || undefined,
        customerType: form.customerType,
        customerStatus: form.customerStatus,
        creditLimit: form.creditLimit,
        currentBalance: form.currentBalance,
        paymentTerms: form.paymentTerms,
        tags: form.tags,
        description: form.description || undefined,
        attachments: form.attachments,
      };
      const created = await createCustomer(payload);
      if (photoPreview) {
        try {
          await uploadCustomerPhoto(created.id, photoPreview);
        } catch (e) {
          appError(
            'Photo',
            extractErrorMessage(e, 'Customer created but photo upload failed'),
          );
        }
      }
      for (const g of createGuarantors) {
        try {
          await createGuarantor(created.id, g);
        } catch (e) {
          appError(
            'Guarantor',
            extractErrorMessage(
              e,
              'Customer created but a guarantor could not be added',
            ),
          );
        }
      }
      setCreateOpen(false);
      resetForm();
      await loadCustomers();
      await loadStats();
      appAlert('Customer', 'Created successfully.');
    } catch (e) {
      appError('Customer', extractErrorMessage(e, 'Failed to create'));
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async () => {
    if (!selectedCustomer) return;
    try {
      setSaving(true);
      if (photoRemoved && selectedCustomer.image_url) {
        try {
          await deleteCustomerPhoto(selectedCustomer.id);
        } catch (e) {
          appError('Photo', extractErrorMessage(e, 'Could not remove photo'));
        }
      }
      if (photoPreview) {
        try {
          await uploadCustomerPhoto(selectedCustomer.id, photoPreview);
        } catch (e) {
          appError('Photo', extractErrorMessage(e, 'Photo upload failed'));
        }
      }
      const updatePayload: CustomerUpdate = {
        firstName: form.firstName,
        lastName: form.lastName,
        emails: (form.emails || []).filter((e) => e.value.trim()),
        phones: (form.phones || []).filter((p) => p.value.trim()),
        cnic: form.cnic || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        country: form.country || undefined,
        postalCode: form.postalCode || undefined,
        customerType: form.customerType,
        customerStatus: form.customerStatus,
        creditLimit: form.creditLimit,
        currentBalance: form.currentBalance,
        paymentTerms: form.paymentTerms,
        tags: form.tags,
        description: form.description || undefined,
        attachments: form.attachments,
      };
      await updateCustomer(selectedCustomer.id, updatePayload);
      setEditOpen(false);
      resetForm();
      await loadCustomers();
      await loadStats();
      appAlert('Customer', 'Updated successfully.');
    } catch (e) {
      appError('Customer', extractErrorMessage(e, 'Failed to update'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (c: Customer) => {
    appConfirm({
      title: 'Delete customer',
      message: `Delete ${c.firstName} ${c.lastName}? This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteCustomer(c.id);
          await loadCustomers();
          await loadStats();
          appAlert('Customer', 'Deleted.');
        } catch (e) {
          appError('Customer', extractErrorMessage(e, 'Failed to delete'));
        }
      },
    });
  };

  const runImport = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
        copyToCacheDirectory: true,
      });
      if (r.canceled || !r.assets?.[0]) return;
      const a = r.assets[0];
      setImportBusy(true);
      const res = await importCustomersFromFile({
        uri: a.uri,
        name: a.name || 'import',
        mimeType: a.mimeType || undefined,
      });
      const ok = res.success !== false;
      const msg =
        res.message ||
        `Imported ${res.imported_count ?? 0}, failed ${res.failed_count ?? 0}`;
      if (ok) {
        appAlert('Import', msg);
        setImportOpen(false);
        await loadCustomers();
        await loadStats();
      } else {
        appAlert('Import', msg);
      }
      if (res.errors?.length) {
        appAlert('Import details', res.errors.slice(0, 8).join('\n'));
      }
    } catch (e) {
      appError('Import', extractErrorMessage(e, 'Import failed'));
    } finally {
      setImportBusy(false);
    }
  };

  const openGuarantorCreate = () => {
    setGuarantorSource('create');
    setEditingGuarantorId(null);
    setEditingCreateGuarantorIndex(null);
    setGuarantorForm(emptyGuarantor);
    setGuarantorOpen(true);
  };

  const openGuarantorEditCreate = (g: GuarantorCreate, idx: number) => {
    setGuarantorSource('create');
    setEditingCreateGuarantorIndex(idx);
    setEditingGuarantorId(null);
    setGuarantorForm({ ...g });
    setGuarantorOpen(true);
  };

  const openGuarantorAddExisting = () => {
    setGuarantorSource('edit');
    setEditingGuarantorId(null);
    setEditingCreateGuarantorIndex(null);
    setGuarantorForm(emptyGuarantor);
    setGuarantorOpen(true);
  };

  const openGuarantorEditExisting = (g: Guarantor) => {
    setGuarantorSource('edit');
    setEditingGuarantorId(g.id);
    setEditingCreateGuarantorIndex(null);
    setGuarantorForm({
      name: g.name,
      mobile: g.mobile || '',
      cnic: g.cnic || '',
      residential_address: g.residential_address || '',
      official_address: g.official_address || '',
      occupation: g.occupation || '',
      relation: g.relation || '',
    });
    setGuarantorOpen(true);
  };

  const submitGuarantorDialog = async () => {
    if (!guarantorForm.name.trim()) return;
    if (guarantorSource === 'create') {
      if (editingCreateGuarantorIndex != null && editingCreateGuarantorIndex >= 0) {
        setCreateGuarantors((prev) =>
          prev.map((x, i) => (i === editingCreateGuarantorIndex ? guarantorForm : x)),
        );
      } else {
        setCreateGuarantors((prev) => [...prev, guarantorForm]);
      }
      setGuarantorOpen(false);
      setGuarantorForm(emptyGuarantor);
      return;
    }
    if (!selectedCustomer) return;
    try {
      if (editingGuarantorId) {
        const u = await updateGuarantor(editingGuarantorId, guarantorForm);
        setGuarantors((prev) => prev.map((x) => (x.id === editingGuarantorId ? u : x)));
      } else {
        const g = await createGuarantor(selectedCustomer.id, guarantorForm);
        setGuarantors((prev) => [...prev, g]);
      }
      setGuarantorOpen(false);
      setGuarantorForm(emptyGuarantor);
      setEditingGuarantorId(null);
    } catch (e) {
      appError('Guarantor', extractErrorMessage(e, 'Failed to save'));
    }
  };

  const removeCreateGuarantor = (idx: number) => {
    setCreateGuarantors((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExistingGuarantor = async (id: string) => {
    try {
      await deleteGuarantor(id);
      setGuarantors((prev) => prev.filter((g) => g.id !== id));
    } catch (e) {
      appError('Guarantor', extractErrorMessage(e, 'Failed to remove'));
    }
  };

  const paymentSheetOptions = (
    [
      { value: 'Credit' as const, label: 'Credit' },
      { value: 'Card' as const, label: 'Card' },
      { value: 'Cash' as const, label: 'Cash' },
      { value: 'Due Payments' as const, label: 'Due Payments' },
    ] as const
  ).map((x) => x);

  const renderFormFields = (isEdit: boolean) => (
    <>
      <View style={{ alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 16, marginBottom: 8 }}>
        <Pressable
          onPress={() => void pickCustomerPhoto()}
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: WS.border,
            backgroundColor: '#f8fafc',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {photoPreview ? (
            <Image source={{ uri: photoPreview }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : isEdit && !photoRemoved && selectedCustomer?.image_url ? (
            <Image source={{ uri: selectedCustomer.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <Ionicons name="camera-outline" size={36} color={WS.textLight} />
          )}
        </Pressable>
        <Text style={{ marginTop: 8, fontSize: 12, color: WS.textMuted }}>Tap to choose photo</Text>
        {isEdit && (selectedCustomer?.image_url || photoPreview) && !photoRemoved ? (
          <Pressable
            style={{ marginTop: 8 }}
            onPress={() => {
              setPhotoPreview(null);
              setPhotoRemoved(true);
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: WS.danger }}>Remove photo</Text>
          </Pressable>
        ) : null}
      </View>

      <WorkshopFieldLabel>First name *</WorkshopFieldLabel>
      <WorkshopTextInput
        value={form.firstName}
        onChangeText={(t) => setForm((p) => ({ ...p, firstName: t }))}
        placeholder="First name"
      />
      <WorkshopFieldLabel>Last name *</WorkshopFieldLabel>
      <WorkshopTextInput
        value={form.lastName}
        onChangeText={(t) => setForm((p) => ({ ...p, lastName: t }))}
        placeholder="Last name"
      />

      <LabeledContactFieldsMobile
        emails={(form.emails || []) as LabeledEmailItem[]}
        phones={(form.phones || []) as LabeledPhoneItem[]}
        onEmailsChange={(emails) => setForm((p) => ({ ...p, emails }))}
        onPhonesChange={(phones) => setForm((p) => ({ ...p, phones }))}
      />

      <WorkshopFieldLabel>CNIC</WorkshopFieldLabel>
      <WorkshopTextInput
        value={form.cnic}
        onChangeText={(t) => setForm((p) => ({ ...p, cnic: t }))}
        placeholder="CNIC"
      />

      <WorkshopChipSelect
        label="Type"
        options={['individual', 'business']}
        value={form.customerType ?? 'individual'}
        onChange={(v) => setForm((p) => ({ ...p, customerType: v as 'individual' | 'business' }))}
      />
      <WorkshopChipSelect
        label="Status"
        options={['active', 'inactive', 'blocked']}
        value={form.customerStatus ?? 'active'}
        onChange={(v) => setForm((p) => ({ ...p, customerStatus: v as 'active' | 'inactive' | 'blocked' }))}
      />

      <WorkshopFieldLabel>Credit limit</WorkshopFieldLabel>
      <WorkshopTextInput
        value={String(form.creditLimit ?? 0)}
        onChangeText={(t) =>
          setForm((p) => ({
            ...p,
            creditLimit: parseFloat(t.replace(/[^0-9.-]/g, '')) || 0,
          }))
        }
        keyboardType="decimal-pad"
      />

      <WorkshopPickerField
        label="Payment terms"
        value={form.paymentTerms ?? ''}
        onPress={() => setPaymentSheetOpen(true)}
      />

      <WorkshopFieldLabel>Address</WorkshopFieldLabel>
      <WorkshopTextInput
        value={form.address}
        onChangeText={(t) => setForm((p) => ({ ...p, address: t }))}
        placeholder="Street"
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <WorkshopFieldLabel>City</WorkshopFieldLabel>
          <WorkshopTextInput value={form.city} onChangeText={(t) => setForm((p) => ({ ...p, city: t }))} />
        </View>
        <View style={{ flex: 1 }}>
          <WorkshopFieldLabel>State</WorkshopFieldLabel>
          <WorkshopTextInput value={form.state} onChangeText={(t) => setForm((p) => ({ ...p, state: t }))} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <WorkshopFieldLabel>Country</WorkshopFieldLabel>
          <WorkshopTextInput value={form.country} onChangeText={(t) => setForm((p) => ({ ...p, country: t }))} />
        </View>
        <View style={{ flex: 1 }}>
          <WorkshopFieldLabel>Postal</WorkshopFieldLabel>
          <WorkshopTextInput value={form.postalCode} onChangeText={(t) => setForm((p) => ({ ...p, postalCode: t }))} />
        </View>
      </View>

      <WorkshopFieldLabel>Tags (comma separated)</WorkshopFieldLabel>
      <WorkshopTextInput
        value={form.tagsText}
        onChangeText={(t) =>
          setForm((p) => ({
            ...p,
            tagsText: t,
            tags: t.split(',').map((x) => x.trim()).filter(Boolean),
          }))
        }
        placeholder="vip, regular"
      />

      <WorkshopFieldLabel>Description</WorkshopFieldLabel>
      <WorkshopTextInput
        value={form.description || ''}
        onChangeText={(t) => setForm((p) => ({ ...p, description: t }))}
        placeholder="Notes"
        multiline
        style={{ minHeight: 88, textAlignVertical: 'top' }}
      />

      <WorkshopFieldLabel>Attachments</WorkshopFieldLabel>
      <Pressable
        disabled={attachmentBusy}
        onPress={() => void pickAttachment()}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          alignSelf: 'flex-start',
          borderWidth: 1,
          borderColor: WS.border,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginBottom: 10,
        }}
      >
        <Ionicons name="attach-outline" size={18} color={WS.textMuted} />
        <Text style={{ fontSize: 14, color: WS.text }}>
          {attachmentBusy ? 'Uploading…' : 'Add file (PDF, DOC, DOCX)'}
        </Text>
      </Pressable>
      {(form.attachments || []).map((att, idx) => (
        <View
          key={`${att.url}-${idx}`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: '#f1f5f9',
            borderRadius: 12,
            backgroundColor: '#f8fafc',
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 8,
          }}
        >
          <Text style={{ flex: 1, fontSize: 14, color: WS.text, marginRight: 8 }} numberOfLines={1}>
            {att.original_filename || 'File'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={() => void Linking.openURL(att.url)} hitSlop={8}>
              <Ionicons name="open-outline" size={20} color={WS.info} />
            </Pressable>
            <Pressable onPress={() => void removeAttachmentAt(idx)} hitSlop={8}>
              <Ionicons name="trash-outline" size={20} color={WS.danger} />
            </Pressable>
          </View>
        </View>
      ))}

      <View style={{ borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16, marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: WS.text }}>Guarantors / friends</Text>
          <Pressable
            onPress={() => (isEdit ? openGuarantorAddExisting() : openGuarantorCreate())}
            style={{ borderWidth: 1, borderColor: WS.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: WS.primary }}>Add</Text>
          </Pressable>
        </View>
        {!isEdit ? (
          createGuarantors.length === 0 ? (
            <Text style={{ fontSize: 14, color: WS.textMuted }}>None added.</Text>
          ) : (
            createGuarantors.map((g, idx) => (
              <View
                key={`cg-${idx}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderWidth: 1,
                  borderColor: '#f1f5f9',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 8,
                }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontWeight: '600', color: WS.text }}>{g.name}</Text>
                  <Text style={{ fontSize: 12, color: WS.textMuted }}>
                    {[g.mobile, g.relation].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Pressable onPress={() => openGuarantorEditCreate(g, idx)} style={{ padding: 8 }}>
                  <Ionicons name="pencil-outline" size={18} color={WS.textMuted} />
                </Pressable>
                <Pressable onPress={() => removeCreateGuarantor(idx)} style={{ padding: 8 }}>
                  <Ionicons name="trash-outline" size={18} color={WS.danger} />
                </Pressable>
              </View>
            ))
          )
        ) : guarantors.length === 0 ? (
          <Text style={{ fontSize: 14, color: WS.textMuted }}>None added.</Text>
        ) : (
          guarantors.map((g) => (
            <View
              key={g.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: '#f1f5f9',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 8,
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontWeight: '600', color: WS.text }}>{g.name}</Text>
                <Text style={{ fontSize: 12, color: WS.textMuted }}>
                  {[g.mobile, g.relation].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <Pressable onPress={() => openGuarantorEditExisting(g)} style={{ padding: 8 }}>
                <Ionicons name="pencil-outline" size={18} color={WS.textMuted} />
              </Pressable>
              <Pressable onPress={() => void removeExistingGuarantor(g.id)} style={{ padding: 8 }}>
                <Ionicons name="trash-outline" size={18} color={WS.danger} />
              </Pressable>
            </View>
          ))
        )}
      </View>
    </>
  );

  const listHeader = (
    <>
      {stats ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <WorkshopStatCard
            label="Total"
            value={stats.total_customers}
            sub={`${stats.active_customers} active`}
            icon="people-outline"
            accent="#4f46e5"
            accentBg="#eef2ff"
          />
          <WorkshopStatCard
            label="Individuals"
            value={stats.individual_customers}
            sub={
              stats.total_customers > 0
                ? `${((stats.individual_customers / stats.total_customers) * 100).toFixed(1)}%`
                : '—'
            }
            icon="person-outline"
            accent="#2563eb"
            accentBg="#eff6ff"
          />
          <WorkshopStatCard
            label="Business"
            value={stats.business_customers}
            sub={
              stats.total_customers > 0
                ? `${((stats.business_customers / stats.total_customers) * 100).toFixed(1)}%`
                : '—'
            }
            icon="business-outline"
            accent="#7c3aed"
            accentBg="#f5f3ff"
          />
          <WorkshopStatCard
            label="Active rate"
            value={
              stats.total_customers > 0
                ? `${((stats.active_customers / stats.total_customers) * 100).toFixed(1)}%`
                : '—'
            }
            icon="checkmark-circle-outline"
            accent="#059669"
            accentBg="#ecfdf5"
          />
        </View>
      ) : null}

      <WorkshopFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Name, email, phone, CNIC…"
        resultCount={totalCount}
        activeFilterCount={countActiveFilters([statusFilter, typeFilter])}
        onResetFilters={() => {
          setStatusFilter('all');
          setTypeFilter('all');
        }}
      >
        <WorkshopChipSelect
          label="Status"
          options={['all', 'active', 'inactive', 'blocked']}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as typeof statusFilter)}
        />
        <WorkshopChipSelect
          label="Type"
          options={['all', 'individual', 'business']}
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as typeof typeFilter)}
        />
      </WorkshopFilterBar>

      <Text style={{ fontSize: 12, color: WS.textMuted, marginBottom: 8 }}>
        {totalCount > 0
          ? `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of ${totalCount}`
          : 'No customers'}
      </Text>
    </>
  );

  const listFooter = totalPages > 1 ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 }}>
      <Text style={{ fontSize: 14, color: WS.textMuted }}>
        Page {currentPage} / {totalPages}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          disabled={currentPage <= 1}
          onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
          style={{
            borderWidth: 1,
            borderColor: currentPage <= 1 ? '#f1f5f9' : WS.border,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 10,
            opacity: currentPage <= 1 ? 0.5 : 1,
          }}
        >
          <Text style={{ fontWeight: '700', color: WS.text }}>Previous</Text>
        </Pressable>
        <Pressable
          disabled={currentPage >= totalPages}
          onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          style={{
            borderWidth: 1,
            borderColor: currentPage >= totalPages ? '#f1f5f9' : WS.border,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 10,
            opacity: currentPage >= totalPages ? 0.5 : 1,
          }}
        >
          <Text style={{ fontWeight: '700', color: WS.text }}>Next</Text>
        </Pressable>
      </View>
    </View>
  ) : null;

  return (
    <>
      <WorkshopChrome
        title="Customers"
        subtitle={
          currentTenant
            ? `${currentTenant.name}${user?.email ? ` · ${user.email}` : ''}`
            : 'Manage customer records'
        }
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Pressable onPress={() => setImportOpen(true)} hitSlop={8} style={{ padding: 4 }}>
              <Ionicons name="cloud-upload-outline" size={24} color={WS.primary} />
            </Pressable>
            <WorkshopHeaderButton onPress={openCreate} />
          </View>
        }
        scroll={false}
      >
        {loading && !refreshing && customers.length === 0 ? (
          <WorkshopLoading />
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={customers}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={listHeader}
            ListFooterComponent={listFooter}
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={WS.primary} />
            }
            ListEmptyComponent={
              !loading ? (
                <WorkshopEmptyState
                  icon="people-outline"
                  title="No customers"
                  subtitle="No customers match your filters."
                  actionLabel="Add customer"
                  onAction={openCreate}
                />
              ) : null
            }
            renderItem={({ item: c }) => {
              const emailDisplay = (() => {
                const ev = (c.emails || []).filter((e) => e.value.trim());
                if (ev.length) return ev.map((e) => e.value).join(', ');
                return c.email || '—';
              })();
              const phoneDisplay = (() => {
                const pv = (c.phones || []).filter((p) => p.value.trim());
                if (pv.length) return pv.map((p) => `(${p.label}) ${p.value}`).join(' · ');
                const parts: string[] = [];
                if (c.phone?.trim()) parts.push(`(work) ${c.phone}`);
                if (c.mobile?.trim()) parts.push(`(personal) ${c.mobile}`);
                return parts.join(' · ') || '—';
              })();
              return (
                <WorkshopListCard
                  icon={c.customerType === 'business' ? 'business' : 'person'}
                  iconColor={c.customerType === 'business' ? '#7c3aed' : '#2563eb'}
                  iconBg={c.customerType === 'business' ? '#f5f3ff' : '#eff6ff'}
                  title={`${c.firstName} ${c.lastName}`}
                  subtitle={emailDisplay}
                  meta={[c.customerId, phoneDisplay, c.cnic ? `CNIC ${c.cnic}` : ''].filter(Boolean).join(' · ')}
                  badges={[
                    { label: c.customerType },
                    { label: c.customerStatus, tone: 'status' as const },
                  ]}
                  onPress={() => void openEdit(c)}
                  actions={[
                    { icon: 'create-outline', onPress: () => void openEdit(c) },
                    { icon: 'trash-outline', onPress: () => confirmDelete(c), danger: true },
                  ]}
                />
              );
            }}
          />
        )}
      </WorkshopChrome>

      <OptionSheet
        visible={paymentSheetOpen}
        title="Payment terms"
        options={paymentSheetOptions}
        onSelect={(v) => {
          setForm((p) => ({ ...p, paymentTerms: v as typeof form.paymentTerms }));
          setPaymentSheetOpen(false);
        }}
        onClose={() => setPaymentSheetOpen(false)}
      />

      <WorkshopFormSheet
        visible={createOpen}
        title="New customer"
        onClose={() => {
          setCreateOpen(false);
          resetForm();
        }}
        footer={
          <>
            <WorkshopPrimaryButton
              label={saving ? 'Creating…' : 'Create customer'}
              onPress={() => void submitCreate()}
              disabled={saving}
            />
            <Pressable
              onPress={() => {
                setCreateOpen(false);
                resetForm();
              }}
              style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}
            >
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </>
        }
      >
        {renderFormFields(false)}
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={editOpen}
        title="Edit customer"
        onClose={() => {
          setEditOpen(false);
          resetForm();
        }}
        footer={
          <>
            <WorkshopPrimaryButton
              label={saving ? 'Saving…' : 'Save customer'}
              onPress={() => void submitEdit()}
              disabled={saving}
            />
            <Pressable
              onPress={() => {
                setEditOpen(false);
                resetForm();
              }}
              style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}
            >
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </>
        }
      >
        {renderFormFields(true)}
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={importOpen}
        title="Import customers"
        onClose={() => setImportOpen(false)}
        footer={
          <>
            <WorkshopPrimaryButton
              label={importBusy ? 'Importing…' : 'Choose file'}
              onPress={() => void runImport()}
              disabled={importBusy}
            />
            <Pressable
              onPress={() => setImportOpen(false)}
              style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}
            >
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Close</Text>
            </Pressable>
          </>
        }
      >
        <Text style={{ fontSize: 15, color: WS.textMuted, lineHeight: 22 }}>
          Choose a CSV or Excel file. Same rules as the web app.
        </Text>
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={guarantorOpen}
        title={
          editingGuarantorId || editingCreateGuarantorIndex != null
            ? 'Edit guarantor'
            : 'Add guarantor'
        }
        onClose={() => setGuarantorOpen(false)}
        footer={
          <>
            <WorkshopPrimaryButton
              label="Save guarantor"
              onPress={() => void submitGuarantorDialog()}
              disabled={!guarantorForm.name.trim()}
            />
            <Pressable
              onPress={() => setGuarantorOpen(false)}
              style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}
            >
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </>
        }
      >
        {(
          [
            ['name', 'Name *', 'Full name'],
            ['mobile', 'Mobile', 'Phone'],
            ['cnic', 'CNIC', 'CNIC'],
            ['residential_address', 'Residential address', 'Address'],
            ['official_address', 'Official address', 'Office'],
            ['occupation', 'Occupation', 'Job'],
            ['relation', 'Relation', 'e.g. friend'],
          ] as const
        ).map(([key, label, ph]) => (
          <View key={key}>
            <WorkshopFieldLabel>{label}</WorkshopFieldLabel>
            <WorkshopTextInput
              value={guarantorTextField(guarantorForm, key as keyof GuarantorCreate)}
              onChangeText={(t) => setGuarantorForm((p) => ({ ...p, [key]: t }))}
              placeholder={ph}
            />
          </View>
        ))}
      </WorkshopFormSheet>
    </>
  );
}
