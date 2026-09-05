import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ScrollView } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { OptionSheet, type OptionItem } from '../../../components/crm/OptionSheet';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import {
  approveInvestment,
  createInvestment,
  deleteInvestment,
  getInvestmentDashboardStats,
  getInvestments,
  updateInvestment,
  type InvestmentRow,
  type InvestmentTypeCode,
} from '../../../services/ledger/investmentsMobileApi';
import { formatMoney } from '../ledgerFormat';
import {
  WorkshopChrome,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopHeaderButton,
  WorkshopLoading,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopDatePickerField,
  WorkshopPickerField,
  WorkshopFilterBar,
  countActiveFilters,
  WorkshopPrimaryButton,
  WorkshopStatCard,
  WS,
} from '../../workshop/components/WorkshopChrome';

const TYPES: OptionItem<InvestmentTypeCode>[] = [
  { value: 'cash_investment', label: 'Cash investment' },
  { value: 'card_transfer', label: 'Card transfer' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'equipment_purchase', label: 'Equipment' },
];

const STATUSES: OptionItem<string>[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'failed', label: 'Failed' },
];

function parseDateInputToIso(dateInput: string): string | null {
  const trimmed = dateInput.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function MobileLedgerInvestmentsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageLedger } = usePermissions();
  const [rows, setRows] = useState<InvestmentRow[]>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getInvestmentDashboardStats>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusOpen, setStatusOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [invDate, setInvDate] = useState('');
  const [invType, setInvType] = useState<InvestmentTypeCode>('cash_investment');
  const [typeOpen, setTypeOpen] = useState(false);
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [desc, setDesc] = useState('');
  const [notes, setNotes] = useState('');
  const [refNum, setRefNum] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [list, st] = await Promise.all([
        getInvestments({
          status: statusFilter === 'all' ? undefined : statusFilter,
        }),
        getInvestmentDashboardStats().catch(() => null),
      ]);
      setRows(list.investments);
      setStats(st);
    } catch (e) {
      appError('Investments', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    setSidebarActivePath(workspacePath === '/dashboard' ? '/dashboard' : '/ledger/investments');
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const openCreate = useCallback(() => {
    const d = new Date();
    setInvDate(d.toISOString().split('T')[0]);
    setInvType('cash_investment');
    setAmountStr('');
    setCurrency('USD');
    setDesc('');
    setNotes('');
    setRefNum('');
    setCreateOpen(true);
  }, []);

  const submitCreate = useCallback(async () => {
    const amount = parseFloat(amountStr.replace(',', '.'));
    const investmentDateIso = parseDateInputToIso(invDate);
    if (!invDate || !desc.trim() || Number.isNaN(amount) || amount <= 0) {
      appAlert('Investments', 'Date, description, and valid amount are required.');
      return;
    }
    if (!investmentDateIso) {
      appAlert('Investments', 'Use valid date format YYYY-MM-DD.');
      return;
    }
    try {
      setBusy(true);
      await createInvestment({
        investment_date: investmentDateIso,
        investment_type: invType,
        amount,
        currency,
        description: desc.trim(),
        notes: notes.trim() || undefined,
        reference_number: refNum.trim() || undefined,
      });
      setCreateOpen(false);
      await load();
    } catch (e) {
      appError('Investments', extractErrorMessage(e, 'Create failed'));
    } finally {
      setBusy(false);
    }
  }, [invDate, invType, amountStr, currency, desc, notes, refNum, load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.description.toLowerCase().includes(q) ||
        r.investment_number.toLowerCase().includes(q) ||
        (r.reference_number ?? '').toLowerCase().includes(q),
    );
  }, [rows, search]);

  return (
    <WorkshopChrome
      title="Investments"
      subtitle="Capital & equipment funding"
      right={canManageLedger() ? <WorkshopHeaderButton onPress={openCreate} /> : undefined}
      scroll={false}
    >
      {stats ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 12, maxHeight: 110 }}
          contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
        >
          <View style={{ width: 140 }}>
            <WorkshopStatCard
              label="Total"
              value={stats.total_investments}
              icon="briefcase"
              accent="#4f46e5"
              accentBg="#eef2ff"
            />
          </View>
          <View style={{ width: 140 }}>
            <WorkshopStatCard
              label="Amount"
              value={formatMoney(stats.total_amount)}
              icon="cash"
              accent="#059669"
              accentBg="#ecfdf5"
            />
          </View>
          <View style={{ width: 140 }}>
            <WorkshopStatCard
              label="Pending"
              value={stats.pending_investments}
              icon="time"
              accent="#d97706"
              accentBg="#fffbeb"
            />
          </View>
          <View style={{ width: 140 }}>
            <WorkshopStatCard
              label="Completed"
              value={stats.completed_investments}
              icon="checkmark-circle"
              accent="#2563eb"
              accentBg="#eff6ff"
            />
          </View>
        </ScrollView>
      ) : null}

      <WorkshopFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search investments…"
        resultCount={filtered.length}
        activeFilterCount={countActiveFilters([statusFilter])}
        onResetFilters={() => setStatusFilter('all')}
      >
        <WorkshopPickerField
          label="Status"
          value={STATUSES.find((s) => s.value === statusFilter)?.label ?? 'All statuses'}
          onPress={() => setStatusOpen(true)}
        />
      </WorkshopFilterBar>

      {loading && rows.length === 0 ? (
        <WorkshopLoading />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={WS.primary} />
          }
          ListEmptyComponent={
            <WorkshopEmptyState
              icon="briefcase-outline"
              title="No investments"
              subtitle="Track capital injections and equipment purchases."
              actionLabel={canManageLedger() ? 'New investment' : undefined}
              onAction={canManageLedger() ? openCreate : undefined}
            />
          }
          renderItem={({ item }) => (
            <WorkshopListCard
              icon="briefcase"
              iconColor="#4f46e5"
              iconBg="#eef2ff"
              title={item.description}
              subtitle={item.investment_number}
              meta={`${item.investment_type.replace(/_/g, ' ')} · ${item.status}`}
              badges={[{ label: formatMoney(item.amount, item.currency || 'USD') }]}
              actions={
                canManageLedger()
                  ? [
                      ...(item.status === 'pending'
                        ? [
                            {
                              icon: 'checkmark-outline' as const,
                              label: 'Approve',
                              onPress: () => {
                                void (async () => {
                                  try {
                                    await approveInvestment(item.id);
                                    await load();
                                  } catch (e) {
                                    appError('Investments', extractErrorMessage(e, 'Approve failed'));
                                  }
                                })();
                              },
                            },
                            {
                              icon: 'close-outline' as const,
                              label: 'Cancel',
                              onPress: () => {
                                void (async () => {
                                  try {
                                    await updateInvestment(item.id, { status: 'cancelled' });
                                    await load();
                                  } catch (e) {
                                    appError('Investments', extractErrorMessage(e, 'Update failed'));
                                  }
                                })();
                              },
                            },
                          ]
                        : []),
                      {
                        icon: 'trash-outline',
                        onPress: () => {
                          appConfirm({
                            title: 'Delete',
                            message: item.investment_number,
                            confirmLabel: 'Delete',
                            destructive: true,
                            onConfirm: async () => {
                              try {
                                await deleteInvestment(item.id);
                                await load();
                              } catch (e) {
                                appError('Investments', extractErrorMessage(e, 'Delete failed'));
                              }
                            },
                          });
                        },
                        danger: true,
                      },
                    ]
                  : undefined
              }
            />
          )}
        />
      )}

      <WorkshopFormSheet
        visible={createOpen}
        title="New investment"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <WorkshopPrimaryButton
              label={busy ? 'Creating…' : 'Create investment'}
              onPress={() => void submitCreate()}
              disabled={busy}
            />
            <Pressable onPress={() => setCreateOpen(false)} style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </>
        }
      >
        <WorkshopDatePickerField label="Date" value={invDate} onChange={setInvDate} />
        <WorkshopPickerField
          label="Type"
          value={TYPES.find((t) => t.value === invType)?.label ?? invType}
          onPress={() => setTypeOpen(true)}
        />
        <WorkshopFieldLabel>Amount</WorkshopFieldLabel>
        <WorkshopTextInput keyboardType="decimal-pad" value={amountStr} onChangeText={setAmountStr} />
        <WorkshopFieldLabel>Currency</WorkshopFieldLabel>
        <WorkshopTextInput value={currency} onChangeText={setCurrency} />
        <WorkshopFieldLabel>Description</WorkshopFieldLabel>
        <WorkshopTextInput value={desc} onChangeText={setDesc} />
        <WorkshopFieldLabel>Reference</WorkshopFieldLabel>
        <WorkshopTextInput value={refNum} onChangeText={setRefNum} />
        <WorkshopFieldLabel>Notes</WorkshopFieldLabel>
        <WorkshopTextInput value={notes} onChangeText={setNotes} multiline style={{ minHeight: 64 }} />
      </WorkshopFormSheet>

      <OptionSheet
        visible={statusOpen}
        title="Status"
        options={STATUSES}
        onSelect={(v) => {
          setStatusFilter(v);
          setStatusOpen(false);
        }}
        onClose={() => setStatusOpen(false)}
      />
      <OptionSheet
        visible={typeOpen}
        title="Type"
        options={TYPES}
        onSelect={(v) => {
          setInvType(v);
          setTypeOpen(false);
        }}
        onClose={() => setTypeOpen(false)}
      />
    </WorkshopChrome>
  );
}
