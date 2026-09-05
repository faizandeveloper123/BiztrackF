import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, ScrollView, RefreshControl } from 'react-native';
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
  QuoteStatus,
  type Quote,
  type QuoteCreatePayload,
} from '../../../models/sales';
import {
  fetchQuotesPaged,
  createQuoteApi,
  updateQuoteApi,
  deleteQuoteApi,
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
  ...Object.values(QuoteStatus).map((s) => ({
    value: s,
    label: s.replace(/_/g, ' '),
  })),
];

function quoteTotal(q: Quote): number {
  if (typeof q.total === 'number') return q.total;
  if (typeof q.amount === 'number') return q.amount;
  return 0;
}

export function MobileQuotesScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageSales } = usePermissions();

  const [quotes, setQuotes] = useState<Quote[]>([]);
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
  const [editing, setEditing] = useState<Quote | null>(null);
  const [viewing, setViewing] = useState<Quote | null>(null);

  const [oppPickerOpen, setOppPickerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [opportunityId, setOpportunityId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [terms, setTerms] = useState('');
  const [notes, setNotes] = useState('');

  const statusParam = statusFilter === 'all' ? undefined : statusFilter;

  const loadOpportunities = useCallback(async () => {
    try {
      const res = await fetchOpportunitiesPaged({}, 1, 200);
      setOpportunities(res.opportunities ?? []);
    } catch {
      setOpportunities([]);
    }
  }, []);

  const loadQuotes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchQuotesPaged(page, PAGE_SIZE, statusParam);
      setQuotes(res.quotes ?? []);
      setTotalPages(Math.max(1, res.pagination?.pages ?? 1));
    } catch (e) {
      appError('Quotes', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [page, statusParam]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/sales/quotes',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void loadOpportunities();
  }, [loadOpportunities]);

  useEffect(() => {
    void loadQuotes();
  }, [loadQuotes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadOpportunities(), loadQuotes()]);
    setRefreshing(false);
  }, [loadOpportunities, loadQuotes]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setOpportunityId('');
    setValidUntil('');
    setAmountStr('');
    setTerms('');
    setNotes('');
  };

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const amt = parseFloat(amountStr);
    if (!title.trim() || !opportunityId || !validUntil.trim() || Number.isNaN(amt)) {
      appAlert('Quotes', 'Title, opportunity, valid until, and amount are required.');
      return;
    }
    const payload: QuoteCreatePayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      opportunityId,
      validUntil: new Date(validUntil).toISOString(),
      terms: terms.trim() || undefined,
      notes: notes.trim() || undefined,
      items: [
        {
          description: title.trim(),
          quantity: 1,
          unitPrice: amt,
          discount: 0,
          total: amt,
        },
      ],
      subtotal: amt,
      taxRate: 0,
      taxAmount: 0,
      total: amt,
    };
    try {
      await createQuoteApi(payload);
      setCreateOpen(false);
      resetForm();
      await loadQuotes();
    } catch (e) {
      appError('Quotes', extractErrorMessage(e, 'Failed to create'));
    }
  };

  const openEdit = (q: Quote) => {
    setEditing(q);
    setTitle(q.title);
    setDescription(q.description ?? '');
    setOpportunityId(q.opportunityId ?? '');
    setValidUntil(q.validUntil ? q.validUntil.slice(0, 10) : '');
    setAmountStr(String(quoteTotal(q)));
    setTerms(q.terms ?? '');
    setNotes(q.notes ?? '');
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editing) return;
    const amt = parseFloat(amountStr);
    if (!title.trim() || !validUntil.trim() || Number.isNaN(amt)) {
      appAlert('Quotes', 'Title, valid until, and amount are required.');
      return;
    }
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      validUntil: new Date(validUntil).toISOString(),
      terms: terms.trim() || undefined,
      notes: notes.trim() || undefined,
      subtotal: amt,
      taxRate: 0,
      taxAmount: 0,
      total: amt,
      items: [
        {
          description: title.trim(),
          quantity: 1,
          unitPrice: amt,
          discount: 0,
          total: amt,
        },
      ],
    };
    try {
      await updateQuoteApi(editing.id, payload);
      setEditOpen(false);
      setEditing(null);
      await loadQuotes();
    } catch (e) {
      appError('Quotes', extractErrorMessage(e, 'Failed to update'));
    }
  };

  const confirmDelete = (q: Quote) => {
    appConfirm({
      title: 'Delete quote',
      message: `Remove ${q.quoteNumber}?`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteQuoteApi(q.id);
          await loadQuotes();
        } catch (e) {
          appError('Quotes', extractErrorMessage(e, 'Failed to delete'));
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
    ({ item }: { item: Quote }) => (
      <WorkshopListCard
        icon="document-text"
        iconColor="#2563eb"
        iconBg="#eff6ff"
        title={item.quoteNumber}
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

  const formContent = (
    <>
      <FormSection title="General Information">
        <FormInput
          label="Quote Title"
          icon="document-text-outline"
          value={title}
          onChangeText={setTitle}
          placeholder="Ex: Software Development Services"
        />
        <FormSelect
          label="Related Opportunity"
          icon="briefcase-outline"
          value={opportunityId ? opportunities.find((o) => o.id === opportunityId)?.title || '' : ''}
          onPress={() => setOppPickerOpen(true)}
          last
        />
      </FormSection>
      <FormSection title="Pricing & Timeline">
        <FormInput
          label="Amount"
          icon="cash-outline"
          value={amountStr}
          onChangeText={setAmountStr}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
        <WorkshopDatePickerField label="Valid Until" value={validUntil} onChange={setValidUntil} />
      </FormSection>
      <FormSection title="Details & Terms">
        <FormInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Detailed scope of work..."
        />
        <FormInput
          label="Terms"
          value={terms}
          onChangeText={setTerms}
          multiline
          placeholder="Payment terms, conditions..."
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
        title="Quotes"
        subtitle="Sales proposals"
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
          resultCount={quotes.length}
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
            data={quotes}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={WS.primary} />
            }
            contentContainerStyle={{ paddingBottom: 12 }}
            ListEmptyComponent={
              <WorkshopEmptyState
                icon="document-text-outline"
                title="No quotes"
                subtitle="Create a quote to send proposals to customers."
                actionLabel={canManageSales() ? 'New quote' : undefined}
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
        title="New Quote"
        onCancel={() => setCreateOpen(false)}
        onSave={() => void submitCreate()}
        saveLabel="Create"
      >
        {formContent}
      </MobileFormSheet>

      <MobileFormSheet
        visible={editOpen}
        title="Edit Quote"
        onCancel={() => setEditOpen(false)}
        onSave={() => void submitEdit()}
      >
        {formContent}
      </MobileFormSheet>

      <WorkshopFormSheet
        visible={viewOpen}
        title="Quote"
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
              {viewing.quoteNumber}
            </Text>
            <WorkshopDetailRow label="Amount" value={formatUsd(quoteTotal(viewing))} />
            <WorkshopDetailRow label="Status" value={String(viewing.status)} />
            <WorkshopDetailRow label="Opportunity" value={opportunityName(viewing.opportunityId)} />
            {viewing.description ? (
              <Text style={{ fontSize: 14, color: WS.text, marginTop: 12, lineHeight: 20 }}>
                {viewing.description}
              </Text>
            ) : null}
          </>
        ) : null}
      </WorkshopFormSheet>
    </>
  );
}
