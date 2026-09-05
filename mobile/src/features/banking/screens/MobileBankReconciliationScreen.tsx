import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { OptionSheet } from '../../../components/crm/OptionSheet';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import {
  TransactionStatus,
  getTransactionStatusLabel,
  type BankAccount,
  type BankTransaction,
  type ReconciliationSummary,
} from '../../../models/banking';
import {
  getBankAccounts,
  getBankTransactions,
  getReconciliationSummary,
  reconcileTransaction,
  updateBankTransaction,
} from '../../../services/banking/bankingMobileApi';
import { formatMoney } from '../bankingFormat';
import {
  WorkshopChrome,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopLoading,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopDatePickerField,
  WorkshopPickerField,
  WorkshopPrimaryButton,
  WorkshopStatCard,
  WorkshopFilterBar,
  countActiveFilters,
  WS,
} from '../../workshop/components/WorkshopChrome';

const PAGE = 20;
const STATUS_OPTS = [
  { value: 'all', label: 'All statuses' },
  ...Object.values(TransactionStatus).map((v) => ({
    value: v,
    label: getTransactionStatusLabel(v),
  })),
];

type TxFilters = {
  accountId: string;
  status: string;
  dateFrom: string;
  dateTo: string;
};

function parseDateInputToIso(dateInput: string, endOfDay = false): string | undefined {
  const trimmed = dateInput.trim();
  if (!trimmed) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return undefined;
  const timeSuffix = endOfDay ? 'T23:59:59' : 'T00:00:00';
  const d = new Date(`${trimmed}${timeSuffix}`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function buildTxParams(f: TxFilters, skip: number) {
  return {
    skip,
    limit: PAGE,
    accountId: f.accountId === 'all' ? undefined : f.accountId,
    status: f.status === 'all' ? undefined : (f.status as TransactionStatus),
    startDate: parseDateInputToIso(f.dateFrom),
    endDate: parseDateInputToIso(f.dateTo, true),
  };
}

export function MobileBankReconciliationScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageBanking } = usePermissions();

  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [accountFilter, setAccountFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [applied, setApplied] = useState<TxFilters>({
    accountId: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  });
  const [search, setSearch] = useState('');
  const [filterAccountOpen, setFilterAccountOpen] = useState(false);
  const [filterStatusOpen, setFilterStatusOpen] = useState(false);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [notesOpen, setNotesOpen] = useState(false);
  const [pendingReconcileId, setPendingReconcileId] = useState<string | null>(null);
  const [reconcileNotes, setReconcileNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const filterAccountOptions = useMemo(
    () => [
      { value: 'all', label: 'All accounts' },
      ...accounts.map((a) => ({
        value: a.id,
        label: `${a.accountName} (${a.bankName})`,
      })),
    ],
    [accounts],
  );

  const fetchSummary = useCallback(async () => {
    const s = await getReconciliationSummary();
    setSummary(s);
  }, []);

  const fetchPage = useCallback(async (nextPage: number, replace: boolean, f: TxFilters) => {
    const skip = nextPage * PAGE;
    const list = await getBankTransactions(buildTxParams(f, skip));
    const rows = list ?? [];
    setHasMore(rows.length >= PAGE);
    setPage(nextPage);
    if (replace) {
      setTransactions(rows);
    } else {
      setTransactions((prev) => [...prev, ...rows]);
    }
  }, []);

  const runInitial = useCallback(async () => {
    try {
      setLoading(true);
      const acc = await getBankAccounts(true);
      setAccounts(acc ?? []);
      await fetchSummary();
      const f: TxFilters = {
        accountId: 'all',
        status: 'all',
        dateFrom: '',
        dateTo: '',
      };
      setApplied(f);
      await fetchPage(0, true, f);
    } catch (e) {
      appError('Reconciliation', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [fetchPage, fetchSummary]);

  useEffect(() => {
    setSidebarActivePath(workspacePath === '/dashboard' ? '/dashboard' : '/banking/reconciliation');
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void runInitial();
  }, [runInitial]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchSummary();
      await fetchPage(0, true, applied);
    } catch (e) {
      appError('Reconciliation', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setRefreshing(false);
    }
  }, [applied, fetchPage, fetchSummary]);

  const applyFilters = useCallback(() => {
    void (async () => {
      if (dateFrom.trim() && !parseDateInputToIso(dateFrom)) {
        appAlert('Reconciliation', 'Invalid From date. Use YYYY-MM-DD.');
        return;
      }
      if (dateTo.trim() && !parseDateInputToIso(dateTo, true)) {
        appAlert('Reconciliation', 'Invalid To date. Use YYYY-MM-DD.');
        return;
      }
      const f: TxFilters = {
        accountId: accountFilter,
        status: statusFilter,
        dateFrom,
        dateTo,
      };
      try {
        setLoading(true);
        setApplied(f);
        await fetchSummary();
        await fetchPage(0, true, f);
      } catch (e) {
        appError('Reconciliation', extractErrorMessage(e, 'Failed to load'));
      } finally {
        setLoading(false);
      }
    })();
  }, [accountFilter, statusFilter, dateFrom, dateTo, fetchPage, fetchSummary]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || loading) return;
    void (async () => {
      try {
        setLoadingMore(true);
        await fetchPage(page + 1, false, applied);
      } catch (e) {
        appError('Reconciliation', extractErrorMessage(e, 'Failed to load'));
      } finally {
        setLoadingMore(false);
      }
    })();
  }, [applied, fetchPage, hasMore, loading, loadingMore, page]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter(
      (t) =>
        t.description.toLowerCase().includes(q) ||
        t.transactionNumber.toLowerCase().includes(q),
    );
  }, [transactions, search]);

  const openReconcile = useCallback((id: string) => {
    setPendingReconcileId(id);
    setReconcileNotes('');
    setNotesOpen(true);
  }, []);

  const reloadAfterMutation = useCallback(async () => {
    await fetchSummary();
    await fetchPage(0, true, applied);
  }, [applied, fetchPage, fetchSummary]);

  const submitReconcile = useCallback(async () => {
    if (!pendingReconcileId) return;
    try {
      setBusy(true);
      await reconcileTransaction(pendingReconcileId, reconcileNotes);
      setNotesOpen(false);
      setPendingReconcileId(null);
      await reloadAfterMutation();
    } catch (e) {
      appError('Reconciliation', extractErrorMessage(e, 'Reconcile failed'));
    } finally {
      setBusy(false);
    }
  }, [pendingReconcileId, reconcileNotes, reloadAfterMutation]);

  const unreconcile = useCallback(
    (t: BankTransaction) => {
      appConfirm({
        title: 'Unreconcile',
        message: `Mark ${t.transactionNumber} as not reconciled?`,
        confirmLabel: 'Unreconcile',
        destructive: true,
        onConfirm: async () => {
          try {
            await updateBankTransaction(t.id, { isReconciled: false });
            await reloadAfterMutation();
          } catch (e) {
            appError('Reconciliation', extractErrorMessage(e, 'Update failed'));
          }
        },
      });
    },
    [reloadAfterMutation],
  );

  const pct = summary?.reconciliationPercentage ?? 0;
  const lastDate = summary?.lastReconciliationDate
    ? new Date(summary.lastReconciliationDate).toLocaleString()
    : '—';

  return (
    <WorkshopChrome title="Reconciliation" subtitle="Match bank transactions" scroll={false}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        <WorkshopStatCard
          label="Total"
          value={summary?.totalTransactions ?? '—'}
          icon="list"
          accent="#4f46e5"
          accentBg="#eef2ff"
        />
        <WorkshopStatCard
          label="Reconciled"
          value={summary?.reconciledTransactions ?? '—'}
          icon="checkmark-circle"
          accent="#059669"
          accentBg="#ecfdf5"
        />
        <WorkshopStatCard
          label="Unreconciled"
          value={summary?.unreconciledTransactions ?? '—'}
          icon="alert-circle"
          accent="#d97706"
          accentBg="#fffbeb"
        />
        <WorkshopStatCard
          label="Match %"
          value={summary ? `${pct.toFixed(1)}%` : '—'}
          icon="pie-chart"
          accent="#2563eb"
          accentBg="#eff6ff"
        />
      </View>
      <Text style={{ fontSize: 12, color: WS.textMuted, marginBottom: 12 }}>
        Last reconciliation: {lastDate}
      </Text>

      <WorkshopFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search description or #"
        resultCount={filtered.length}
        activeFilterCount={countActiveFilters([accountFilter, statusFilter, dateFrom, dateTo])}
        onResetFilters={() => {
          setAccountFilter('all');
          setStatusFilter('all');
          setDateFrom('');
          setDateTo('');
        }}
        onApply={() => void applyFilters()}
      >
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <WorkshopDatePickerField label="From" value={dateFrom} onChange={setDateFrom} />
          </View>
          <View style={{ flex: 1 }}>
            <WorkshopDatePickerField label="To" value={dateTo} onChange={setDateTo} />
          </View>
        </View>
        <WorkshopPickerField
          label="Account"
          value={filterAccountOptions.find((o) => o.value === accountFilter)?.label ?? 'All accounts'}
          onPress={() => setFilterAccountOpen(true)}
        />
        <WorkshopPickerField
          label="Status"
          value={STATUS_OPTS.find((o) => o.value === statusFilter)?.label ?? 'All statuses'}
          onPress={() => setFilterStatusOpen(true)}
        />
      </WorkshopFilterBar>

      {loading && transactions.length === 0 ? (
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
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator color={WS.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <WorkshopEmptyState
              icon="checkmark-done-outline"
              title="No transactions"
              subtitle="Adjust filters or record bank transactions first."
            />
          }
          renderItem={({ item }) => (
            <WorkshopListCard
              icon={item.isReconciled ? 'checkmark-circle' : 'ellipse-outline'}
              iconColor={item.isReconciled ? '#059669' : '#d97706'}
              iconBg={item.isReconciled ? '#ecfdf5' : '#fffbeb'}
              title={item.description}
              subtitle={item.transactionNumber}
              meta={`${getTransactionStatusLabel(item.status)} · ${new Date(item.transactionDate).toLocaleString()}`}
              badges={[
                { label: formatMoney(item.amount, item.currency) },
                { label: item.isReconciled ? 'Reconciled' : 'Not reconciled' },
              ]}
              actions={
                canManageBanking()
                  ? [
                      item.isReconciled
                        ? { icon: 'close-circle-outline', label: 'Unreconcile', onPress: () => unreconcile(item) }
                        : { icon: 'checkmark-outline', label: 'Reconcile', onPress: () => openReconcile(item.id) },
                    ]
                  : undefined
              }
            />
          )}
        />
      )}

      <WorkshopFormSheet
        visible={notesOpen}
        title="Reconciliation notes"
        onClose={() => {
          setNotesOpen(false);
          setPendingReconcileId(null);
        }}
        footer={
          <>
            <WorkshopPrimaryButton
              label={busy ? 'Saving…' : 'Confirm reconcile'}
              onPress={() => void submitReconcile()}
              disabled={busy}
            />
            <Pressable
              onPress={() => {
                setNotesOpen(false);
                setPendingReconcileId(null);
              }}
              style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}
            >
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </>
        }
      >
        <WorkshopFieldLabel>Notes (optional)</WorkshopFieldLabel>
        <WorkshopTextInput
          placeholder="Optional notes"
          value={reconcileNotes}
          onChangeText={setReconcileNotes}
          multiline
          style={{ minHeight: 100 }}
        />
      </WorkshopFormSheet>

      <OptionSheet
        visible={filterAccountOpen}
        title="Account"
        options={filterAccountOptions}
        onSelect={(v) => {
          setAccountFilter(v);
          setFilterAccountOpen(false);
        }}
        onClose={() => setFilterAccountOpen(false)}
      />
      <OptionSheet
        visible={filterStatusOpen}
        title="Status"
        options={STATUS_OPTS}
        onSelect={(v) => {
          setStatusFilter(v);
          setFilterStatusOpen(false);
        }}
        onClose={() => setFilterStatusOpen(false)}
      />
    </WorkshopChrome>
  );
}
