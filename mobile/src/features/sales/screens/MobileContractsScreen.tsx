import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, Switch, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MobileFormSheet } from '../../../components/layout/MobileForm';
import {
  WorkshopChrome,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopHeaderButton,
  WorkshopLoading,
  WorkshopOutlineButton,
  WorkshopPickerField,
  WorkshopFilterBar,
  countActiveFilters,
  WorkshopFormSheet,
  WorkshopDetailRow,
  WorkshopPrimaryButton,
  WorkshopDatePickerField,
  WS,
} from '../../workshop/components/WorkshopChrome';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { OptionSheet } from '../../../components/crm/OptionSheet';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import { fetchOpportunitiesPaged } from '../../../services/crm/opportunitiesApi';
import type { Opportunity } from '../../../models/crm';
import {
  ContractStatus,
  type Contract,
  type ContractCreatePayload,
} from '../../../models/sales';
import {
  fetchContractsPaged,
  createContractApi,
  updateContractApi,
  deleteContractApi,
} from '../../../services/sales/salesApi';
import { usePermissions } from '../../../hooks/usePermissions';
import {
  FormInput,
  FormSection,
  FormSelect,
} from '../../../components/layout/MobileForm';

const PAGE_SIZE = 15;
const STATUS_FILTER: { value: string; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  ...Object.values(ContractStatus).map((s) => ({
    value: s,
    label: s.replace(/_/g, ' '),
  })),
];

export function MobileContractsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageSales } = usePermissions();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusOpen, setStatusOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [viewing, setViewing] = useState<Contract | null>(null);

  const [oppPickerOpen, setOppPickerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [opportunityId, setOpportunityId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [valueStr, setValueStr] = useState('');
  const [terms, setTerms] = useState('');
  const [notes, setNotes] = useState('');
  const [autoRenew, setAutoRenew] = useState(false);
  const [renewalTerms, setRenewalTerms] = useState('');

  const statusParam = statusFilter === 'all' ? undefined : statusFilter;

  const loadOpportunities = useCallback(async () => {
    try {
      const res = await fetchOpportunitiesPaged({}, 1, 200);
      setOpportunities(res.opportunities ?? []);
    } catch {
      setOpportunities([]);
    }
  }, []);

  const loadContracts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchContractsPaged(page, PAGE_SIZE, statusParam);
      setContracts(res.contracts ?? []);
      setTotalPages(Math.max(1, res.pagination?.pages ?? 1));
    } catch (e) {
      appError('Contracts', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [page, statusParam]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/sales/contracts',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void loadOpportunities();
  }, [loadOpportunities]);

  useEffect(() => {
    void loadContracts();
  }, [loadContracts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadOpportunities(), loadContracts()]);
    setRefreshing(false);
  }, [loadOpportunities, loadContracts]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setOpportunityId('');
    setStartDate('');
    setEndDate('');
    setValueStr('');
    setTerms('');
    setNotes('');
    setAutoRenew(false);
    setRenewalTerms('');
  };

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const val = parseFloat(valueStr);
    if (!title.trim() || !opportunityId || !startDate || !endDate || Number.isNaN(val)) {
      appAlert('Contracts', 'Title, opportunity, dates, and value are required.');
      return;
    }
    const payload: ContractCreatePayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      opportunityId,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      value: val,
      terms: terms.trim() || undefined,
      notes: notes.trim() || undefined,
      autoRenew,
      renewalTerms: renewalTerms.trim() || undefined,
    };
    try {
      await createContractApi(payload);
      setCreateOpen(false);
      resetForm();
      await loadContracts();
    } catch (e) {
      appError('Contracts', extractErrorMessage(e, 'Failed to create'));
    }
  };

  const openEdit = (c: Contract) => {
    setEditing(c);
    setTitle(c.title);
    setDescription(c.description ?? '');
    setStartDate(c.startDate ? c.startDate.slice(0, 10) : '');
    setEndDate(c.endDate ? c.endDate.slice(0, 10) : '');
    setValueStr(String(c.value));
    setTerms(c.terms ?? '');
    setNotes(c.notes ?? '');
    setAutoRenew(Boolean(c.autoRenew));
    setRenewalTerms(c.renewalTerms ?? '');
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editing) return;
    const val = parseFloat(valueStr);
    if (!title.trim() || !startDate || !endDate || Number.isNaN(val)) {
      appAlert('Contracts', 'Title, dates, and value are required.');
      return;
    }
    try {
      await updateContractApi(editing.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        value: val,
        terms: terms.trim() || undefined,
        notes: notes.trim() || undefined,
        autoRenew,
        renewalTerms: renewalTerms.trim() || undefined,
      });
      setEditOpen(false);
      setEditing(null);
      await loadContracts();
    } catch (e) {
      appError('Contracts', extractErrorMessage(e, 'Failed to update'));
    }
  };

  const confirmDelete = (c: Contract) => {
    appConfirm({
      title: 'Delete contract',
      message: `Remove ${c.contractNumber}?`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteContractApi(c.id);
          await loadContracts();
        } catch (e) {
          appError('Contracts', extractErrorMessage(e, 'Failed to delete'));
        }
      },
    });
  };

  const opportunityName = (id?: string) => {
    if (!id) return '—';
    return opportunities.find((o) => o.id === id)?.title ?? id.slice(0, 8);
  };

  const oppOptions = useMemo(
    () => opportunities.map((o) => ({ value: o.id, label: o.title })),
    [opportunities],
  );

  const renderItem = useCallback(
    ({ item }: { item: Contract }) => (
      <WorkshopListCard
        icon="reader"
        iconColor="#7c3aed"
        iconBg="#f5f3ff"
        title={item.contractNumber}
        subtitle={item.title}
        meta={opportunityName(item.opportunityId)}
        badges={[{ label: String(item.status), tone: 'status' }]}
        onPress={() => {
          setViewing(item);
          setViewOpen(true);
        }}
        actions={
          canManageSales()
            ? [
                { icon: 'create-outline', onPress: () => openEdit(item) },
                { icon: 'trash-outline', onPress: () => confirmDelete(item), danger: true },
              ]
            : undefined
        }
      />
    ),
    [canManageSales, opportunities],
  );

  const renewalSection = (
    <FormSection title="Renewal Policy">
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: '#f8fafc',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="refresh-outline" size={14} color={WS.textLight} style={{ marginRight: 4 }} />
          <Text style={{ fontSize: 11, fontWeight: '600', color: WS.textMuted, textTransform: 'uppercase' }}>
            Auto Renew
          </Text>
        </View>
        <Switch
          value={autoRenew}
          onValueChange={setAutoRenew}
          trackColor={{ false: '#e2e8f0', true: WS.primaryMuted }}
          thumbColor={autoRenew ? WS.primary : '#f8fafc'}
        />
      </View>
      {autoRenew ? (
        <FormInput
          label="Renewal Terms"
          value={renewalTerms}
          onChangeText={setRenewalTerms}
          multiline
          placeholder="Terms for automatic renewal..."
          last
        />
      ) : null}
    </FormSection>
  );

  const formContent = (
    <>
      <FormSection title="General Information">
        <FormInput
          label="Contract Title"
          icon="document-text-outline"
          value={title}
          onChangeText={setTitle}
          placeholder="Ex: Annual Maintenance Contract"
        />
        <FormSelect
          label="Related Opportunity"
          icon="briefcase-outline"
          value={opportunityId ? opportunities.find((o) => o.id === opportunityId)?.title || '' : ''}
          onPress={() => setOppPickerOpen(true)}
          last
        />
      </FormSection>
      <FormSection title="Financials & Dates">
        <FormInput
          label="Contract Value"
          icon="cash-outline"
          value={valueStr}
          onChangeText={setValueStr}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
        <WorkshopDatePickerField label="Start Date" value={startDate} onChange={setStartDate} />
        <WorkshopDatePickerField label="End Date" value={endDate} onChange={setEndDate} />
      </FormSection>
      {renewalSection}
      <FormSection title="Details & Notes">
        <FormInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Detailed contract description..."
        />
        <FormInput
          label="Terms & Conditions"
          value={terms}
          onChangeText={setTerms}
          multiline
          placeholder="Standard terms..."
        />
        <FormInput
          label="Internal Notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Private notes for team..."
          last
        />
      </FormSection>
    </>
  );

  return (
    <>
      <WorkshopChrome
        title="Contracts"
        subtitle="Agreements & renewals"
        scroll={false}
        right={
          canManageSales() ? (
            <WorkshopHeaderButton onPress={openCreate} />
          ) : (
            <View style={{ width: 72 }} />
          )
        }
      >
        <WorkshopFilterBar
          resultCount={contracts.length}
          activeFilterCount={countActiveFilters([statusFilter])}
          onResetFilters={() => setStatusFilter('all')}
        >
          <WorkshopPickerField
            label="Status"
            value={STATUS_FILTER.find((x) => x.value === statusFilter)?.label ?? 'All statuses'}
            onPress={() => setStatusOpen(true)}
          />
        </WorkshopFilterBar>

        {loading && !refreshing ? (
          <WorkshopLoading />
        ) : (
          <FlatList
            data={contracts}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={WS.primary} />
            }
            contentContainerStyle={{ paddingBottom: 12 }}
            ListEmptyComponent={
              <WorkshopEmptyState
                icon="reader-outline"
                title="No contracts"
                subtitle="Create a contract to formalize customer agreements."
                actionLabel={canManageSales() ? 'New contract' : undefined}
                onAction={canManageSales() ? openCreate : undefined}
              />
            }
          />
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 10 }}>
          <View style={{ flex: 1 }}>
            <WorkshopOutlineButton
              label="Previous"
              onPress={() => setPage((p) => Math.max(1, p - 1))}
            />
          </View>
          <Text style={{ fontWeight: '600', color: WS.textMuted }}>
            {page} / {totalPages}
          </Text>
          <View style={{ flex: 1 }}>
            <WorkshopOutlineButton label="Next" onPress={() => setPage((p) => p + 1)} />
          </View>
        </View>
      </WorkshopChrome>

      <OptionSheet
        visible={statusOpen}
        title="Status"
        options={STATUS_FILTER}
        onSelect={(v) => {
          setStatusFilter(v);
          setStatusOpen(false);
          setPage(1);
        }}
        onClose={() => setStatusOpen(false)}
      />

      <OptionSheet
        visible={oppPickerOpen}
        title="Opportunity"
        options={oppOptions}
        onSelect={(v) => {
          setOpportunityId(v);
          setOppPickerOpen(false);
        }}
        onClose={() => setOppPickerOpen(false)}
      />

      <MobileFormSheet
        visible={createOpen}
        title="New Contract"
        onCancel={() => setCreateOpen(false)}
        onSave={() => void submitCreate()}
        saveLabel="Create"
      >
        {formContent}
      </MobileFormSheet>

      <MobileFormSheet
        visible={editOpen}
        title="Edit Contract"
        onCancel={() => setEditOpen(false)}
        onSave={() => void submitEdit()}
      >
        {formContent}
      </MobileFormSheet>

      <WorkshopFormSheet
        visible={viewOpen}
        title="Contract"
        onClose={() => setViewOpen(false)}
        footer={
          <View style={{ gap: 8 }}>
            {canManageSales() && viewing ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <WorkshopPrimaryButton
                    label="Edit"
                    onPress={() => {
                      setViewOpen(false);
                      openEdit(viewing);
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Pressable
                    onPress={() => viewing && confirmDelete(viewing)}
                    style={{
                      alignItems: 'center',
                      borderRadius: 14,
                      paddingVertical: 15,
                      backgroundColor: WS.danger,
                    }}
                  >
                    <Text style={{ fontWeight: '700', fontSize: 16, color: '#fff' }}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
            <Pressable onPress={() => setViewOpen(false)} style={{ alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Close</Text>
            </Pressable>
          </View>
        }
      >
        {viewing ? (
          <>
            <Text style={{ fontSize: 20, fontWeight: '800', color: WS.text, marginBottom: 4 }}>
              {viewing.title}
            </Text>
            <Text style={{ fontSize: 14, color: WS.textMuted, marginBottom: 16 }}>
              {viewing.contractNumber}
            </Text>
            <WorkshopDetailRow label="Value" value={formatUsd(viewing.value)} />
            <WorkshopDetailRow label="Status" value={String(viewing.status)} />
            <WorkshopDetailRow label="Opportunity" value={opportunityName(viewing.opportunityId)} />
          </>
        ) : null}
      </WorkshopFormSheet>
    </>
  );
}
