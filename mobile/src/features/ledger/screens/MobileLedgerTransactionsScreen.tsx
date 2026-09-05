import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { OptionSheet, type OptionItem } from '../../../components/crm/OptionSheet';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import {
  TransactionStatus,
  TransactionType,
  getTransactionStatusLabel,
  getTransactionTypeLabel,
  type ChartOfAccountsResponse,
  type LedgerTransactionResponse,
} from '../../../models/ledger';
import {
  createLedgerTransaction,
  deleteLedgerTransaction,
  getChartOfAccounts,
  getLedgerTransactions,
  updateLedgerTransaction,
} from '../../../services/ledger/ledgerMobileApi';
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
  WorkshopPrimaryButton,
  WorkshopFilterBar,
  countActiveFilters,
  WS,
} from '../../workshop/components/WorkshopChrome';

const TX_TYPES = Object.values(TransactionType).map((v) => ({
  value: v,
  label: getTransactionTypeLabel(v),
}));
const TYPE_FILTER: OptionItem<string>[] = [
  { value: 'all', label: 'All types' },
  ...TX_TYPES,
];
const STATUSES = Object.values(TransactionStatus).map((v) => ({
  value: v,
  label: getTransactionStatusLabel(v),
}));
const STATUS_FILTER: OptionItem<string>[] = [
  { value: 'all', label: 'All statuses' },
  ...STATUSES,
];

function parseDateInputToIso(dateInput: string): string | null {
  const trimmed = dateInput.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function MobileLedgerTransactionsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageLedger } = usePermissions();
  const [accounts, setAccounts] = useState<ChartOfAccountsResponse[]>([]);
  const [tx, setTx] = useState<LedgerTransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeOpen, setTypeOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [accDebitOpen, setAccDebitOpen] = useState(false);
  const [accCreditOpen, setAccCreditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<LedgerTransactionResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [desc, setDesc] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [debitId, setDebitId] = useState('');
  const [creditId, setCreditId] = useState('');
  const [txDate, setTxDate] = useState('');
  const [txType, setTxType] = useState(TransactionType.GENERAL);
  const [txStatus, setTxStatus] = useState(TransactionStatus.PENDING);
  const [refNum, setRefNum] = useState('');
  const [pickTypeOpen, setPickTypeOpen] = useState(false);
  const [pickStatusOpen, setPickStatusOpen] = useState(false);

  const accOpts = useMemo(
    () =>
      accounts.map((a) => ({
        value: a.id,
        label: `${a.account_code} ${a.account_name}`,
      })),
    [accounts],
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [coa, list] = await Promise.all([
        getChartOfAccounts(0, 500),
        getLedgerTransactions({
          skip: 0,
          limit: 150,
          transactionType: typeFilter === 'all' ? undefined : (typeFilter as TransactionType),
          startDate: undefined,
          endDate: undefined,
        }),
      ]);
      setAccounts(coa ?? []);
      let rows = list ?? [];
      if (statusFilter !== 'all') {
        rows = rows.filter((t) => t.status === statusFilter);
      }
      setTx(rows);
    } catch (e) {
      appError('Ledger', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    setSidebarActivePath(workspacePath === '/dashboard' ? '/dashboard' : '/ledger/transactions');
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
    if (!accounts.length) {
      appAlert('Ledger', 'Chart of accounts is empty.');
      return;
    }
    const d = new Date();
    setTxDate(d.toISOString().split('T')[0]);
    setTxType(TransactionType.GENERAL);
    setTxStatus(TransactionStatus.PENDING);
    setDebitId(accounts[0]?.id ?? '');
    setCreditId(accounts[1]?.id ?? accounts[0]?.id ?? '');
    setAmountStr('');
    setDesc('');
    setRefNum('');
    setCreateOpen(true);
  }, [accounts]);

  const openEdit = useCallback((t: LedgerTransactionResponse) => {
    setEditing(t);
    setTxDate(new Date(t.transaction_date).toISOString().split('T')[0]);
    setTxType(t.transaction_type);
    setTxStatus(t.status);
    setDebitId(t.account_id);
    setCreditId(t.contra_account_id);
    setAmountStr(String(t.amount));
    setDesc(t.description);
    setRefNum(t.reference_number ?? '');
    setEditOpen(true);
  }, []);

  const buildCreateBody = useCallback(() => {
    const amount = parseFloat(amountStr.replace(',', '.'));
    if (!desc.trim() || !debitId || !creditId || !txDate || Number.isNaN(amount) || amount <= 0) {
      return null;
    }
    const transactionDateIso = parseDateInputToIso(txDate);
    if (!transactionDateIso) {
      return null;
    }
    return {
      description: desc.trim(),
      amount,
      account_id: debitId,
      contra_account_id: creditId,
      transaction_date: transactionDateIso,
      transaction_type: txType,
      status: txStatus,
      reference_number: refNum.trim() || undefined,
    };
  }, [desc, debitId, creditId, txDate, amountStr, txType, txStatus, refNum]);

  const submitCreate = useCallback(async () => {
    const b = buildCreateBody();
    if (!b) {
      appAlert('Ledger', 'Fill required fields, valid date, and two accounts.');
      return;
    }
    try {
      setBusy(true);
      await createLedgerTransaction(b);
      setCreateOpen(false);
      await load();
    } catch (e) {
      appError('Ledger', extractErrorMessage(e, 'Create failed'));
    } finally {
      setBusy(false);
    }
  }, [buildCreateBody, load]);

  const submitEdit = useCallback(async () => {
    if (!editing) return;
    const b = buildCreateBody();
    if (!b) {
      appAlert('Ledger', 'Check fields and date format (YYYY-MM-DD).');
      return;
    }
    try {
      setBusy(true);
      await updateLedgerTransaction(editing.id, {
        description: b.description,
        amount: b.amount,
        account_id: b.account_id,
        contra_account_id: b.contra_account_id,
        transaction_date: b.transaction_date,
        transaction_type: b.transaction_type,
        status: b.status,
        reference_number: b.reference_number,
      });
      setEditOpen(false);
      setEditing(null);
      await load();
    } catch (e) {
      appError('Ledger', extractErrorMessage(e, 'Update failed'));
    } finally {
      setBusy(false);
    }
  }, [editing, buildCreateBody, load]);

  const confirmDelete = useCallback(
    (item: LedgerTransactionResponse) => {
      appConfirm({
        title: 'Delete',
        message: item.transaction_number,
        confirmLabel: 'Delete',
        destructive: true,
        onConfirm: async () => {
          try {
            await deleteLedgerTransaction(item.id);
            await load();
          } catch (e) {
            appError('Ledger', extractErrorMessage(e, 'Delete failed'));
          }
        },
      });
    },
    [load],
  );

  const formFields = (
    <>
      <WorkshopPickerField
        label="Debit account"
        value={accOpts.find((o) => o.value === debitId)?.label ?? ''}
        placeholder="Select account"
        onPress={() => setAccDebitOpen(true)}
      />
      <WorkshopPickerField
        label="Credit account"
        value={accOpts.find((o) => o.value === creditId)?.label ?? ''}
        placeholder="Select account"
        onPress={() => setAccCreditOpen(true)}
      />
      <WorkshopDatePickerField label="Date" value={txDate} onChange={setTxDate} />
      <WorkshopPickerField
        label="Type"
        value={getTransactionTypeLabel(txType)}
        onPress={() => setPickTypeOpen(true)}
      />
      <WorkshopPickerField
        label="Status"
        value={getTransactionStatusLabel(txStatus)}
        onPress={() => setPickStatusOpen(true)}
      />
      <WorkshopFieldLabel>Amount</WorkshopFieldLabel>
      <WorkshopTextInput keyboardType="decimal-pad" value={amountStr} onChangeText={setAmountStr} />
      <WorkshopFieldLabel>Reference</WorkshopFieldLabel>
      <WorkshopTextInput value={refNum} onChangeText={setRefNum} />
      <WorkshopFieldLabel>Description</WorkshopFieldLabel>
      <WorkshopTextInput value={desc} onChangeText={setDesc} multiline style={{ minHeight: 72 }} />
    </>
  );

  const sheetFooter = (label: string, onSave: () => void, onCancel: () => void) => (
    <>
      <WorkshopPrimaryButton label={busy ? 'Saving…' : label} onPress={onSave} disabled={busy} />
      <Pressable onPress={onCancel} style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}>
        <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
      </Pressable>
    </>
  );

  return (
    <WorkshopChrome
      title="Ledger transactions"
      subtitle="Journal entries & transfers"
      right={canManageLedger() ? <WorkshopHeaderButton onPress={openCreate} /> : undefined}
      scroll={false}
    >
      <WorkshopFilterBar
        resultCount={tx.length}
        activeFilterCount={countActiveFilters([typeFilter, statusFilter])}
        onResetFilters={() => {
          setTypeFilter('all');
          setStatusFilter('all');
        }}
      >
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <WorkshopPickerField
              label="Type"
              value={TYPE_FILTER.find((o) => o.value === typeFilter)?.label ?? 'All types'}
              onPress={() => setTypeOpen(true)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <WorkshopPickerField
              label="Status"
              value={STATUS_FILTER.find((o) => o.value === statusFilter)?.label ?? 'All statuses'}
              onPress={() => setStatusOpen(true)}
            />
          </View>
        </View>
      </WorkshopFilterBar>

      {loading && tx.length === 0 ? (
        <WorkshopLoading />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={tx}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={WS.primary} />
          }
          ListEmptyComponent={
            <WorkshopEmptyState
              icon="swap-horizontal-outline"
              title="No transactions"
              subtitle="Create journal entries between chart of accounts."
              actionLabel={canManageLedger() ? 'New transaction' : undefined}
              onAction={canManageLedger() ? openCreate : undefined}
            />
          }
          renderItem={({ item }) => (
            <WorkshopListCard
              icon="swap-horizontal"
              iconColor="#0891b2"
              iconBg="#ecfeff"
              title={item.description}
              subtitle={item.transaction_number}
              meta={`${getTransactionTypeLabel(item.transaction_type)} · ${getTransactionStatusLabel(item.status)}`}
              badges={[{ label: formatMoney(item.amount) }]}
              onPress={canManageLedger() ? () => openEdit(item) : undefined}
              actions={
                canManageLedger()
                  ? [
                      { icon: 'create-outline', onPress: () => openEdit(item) },
                      { icon: 'trash-outline', onPress: () => confirmDelete(item), danger: true },
                    ]
                  : undefined
              }
            />
          )}
        />
      )}

      <WorkshopFormSheet
        visible={createOpen}
        title="New transaction"
        onClose={() => setCreateOpen(false)}
        footer={sheetFooter('Create transaction', () => void submitCreate(), () => setCreateOpen(false))}
      >
        {formFields}
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={editOpen}
        title="Edit transaction"
        onClose={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        footer={sheetFooter(
          'Save changes',
          () => void submitEdit(),
          () => {
            setEditOpen(false);
            setEditing(null);
          },
        )}
      >
        {formFields}
      </WorkshopFormSheet>

      <OptionSheet
        visible={typeOpen}
        title="Filter type"
        options={TYPE_FILTER}
        onSelect={(v) => {
          setTypeFilter(v);
          setTypeOpen(false);
        }}
        onClose={() => setTypeOpen(false)}
      />
      <OptionSheet
        visible={statusOpen}
        title="Filter status"
        options={STATUS_FILTER}
        onSelect={(v) => {
          setStatusFilter(v);
          setStatusOpen(false);
        }}
        onClose={() => setStatusOpen(false)}
      />
      <OptionSheet
        visible={accDebitOpen}
        title="Debit account"
        options={accOpts}
        onSelect={(v) => {
          setDebitId(v);
          setAccDebitOpen(false);
        }}
        onClose={() => setAccDebitOpen(false)}
      />
      <OptionSheet
        visible={accCreditOpen}
        title="Credit account"
        options={accOpts}
        onSelect={(v) => {
          setCreditId(v);
          setAccCreditOpen(false);
        }}
        onClose={() => setAccCreditOpen(false)}
      />
      <OptionSheet
        visible={pickTypeOpen}
        title="Type"
        options={TX_TYPES}
        onSelect={(v) => {
          setTxType(v as TransactionType);
          setPickTypeOpen(false);
        }}
        onClose={() => setPickTypeOpen(false)}
      />
      <OptionSheet
        visible={pickStatusOpen}
        title="Status"
        options={STATUSES}
        onSelect={(v) => {
          setTxStatus(v as TransactionStatus);
          setPickStatusOpen(false);
        }}
        onClose={() => setPickStatusOpen(false)}
      />
    </WorkshopChrome>
  );
}
