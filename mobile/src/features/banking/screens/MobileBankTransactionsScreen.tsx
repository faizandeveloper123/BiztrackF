import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { OptionSheet, type OptionItem } from '../../../components/crm/OptionSheet';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import {
  PaymentMethod,
  TransactionStatus,
  TransactionType,
  getPaymentMethodLabel,
  getTransactionStatusLabel,
  getTransactionTypeLabel,
  type BankAccount,
  type BankTransaction,
} from '../../../models/banking';
import {
  createBankTransaction,
  deleteBankTransaction,
  getBankAccounts,
  getBankTransactions,
  updateBankTransaction,
} from '../../../services/banking/bankingMobileApi';
import { formatMoney } from '../bankingFormat';
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
const TX_STATUSES = Object.values(TransactionStatus).map((v) => ({
  value: v,
  label: getTransactionStatusLabel(v),
}));
const PAY_METHODS = Object.values(PaymentMethod).map((v) => ({
  value: v,
  label: getPaymentMethodLabel(v),
}));

const TYPE_FILTER_OPTIONS: OptionItem<string>[] = [
  { value: 'all', label: 'All types' },
  ...TX_TYPES,
];

const STATUS_FILTER_OPTIONS: OptionItem<string>[] = [
  { value: 'all', label: 'All statuses' },
  ...TX_STATUSES,
];

function parseDateInputToIso(dateInput: string): string | null {
  const trimmed = dateInput.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function MobileBankTransactionsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageBanking } = usePermissions();

  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [accountFilter, setAccountFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filterAccountOpen, setFilterAccountOpen] = useState(false);
  const [formAccountOpen, setFormAccountOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<BankTransaction | null>(null);
  const [busy, setBusy] = useState(false);

  const [bankAccountId, setBankAccountId] = useState('');
  const [txDate, setTxDate] = useState('');
  const [txType, setTxType] = useState(TransactionType.DEPOSIT);
  const [txStatus, setTxStatus] = useState(TransactionStatus.PENDING);
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState(PaymentMethod.CASH);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [typePickOpen, setTypePickOpen] = useState(false);
  const [statusPickOpen, setStatusPickOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [tx, acc] = await Promise.all([
        getBankTransactions({
          limit: 200,
          accountId: accountFilter === 'all' ? undefined : accountFilter,
          transactionType: typeFilter === 'all' ? undefined : (typeFilter as TransactionType),
          status: statusFilter === 'all' ? undefined : (statusFilter as TransactionStatus),
        }),
        getBankAccounts(true),
      ]);
      setTransactions(tx ?? []);
      setAccounts(acc ?? []);
    } catch (e) {
      appError('Transactions', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [accountFilter, typeFilter, statusFilter]);

  useEffect(() => {
    setSidebarActivePath(workspacePath === '/dashboard' ? '/dashboard' : '/banking/transactions');
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

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

  const formAccountOptions = useMemo(
    () =>
      accounts.map((a) => ({
        value: a.id,
        label: `${a.accountName} (${a.bankName})`,
      })),
    [accounts],
  );

  const openCreate = useCallback(() => {
    if (!accounts.length) {
      appAlert('Transactions', 'Create a bank account first.');
      return;
    }
    const d = new Date();
    setBankAccountId(accounts[0]?.id ?? '');
    setTxDate(d.toISOString().split('T')[0]);
    setTxType(TransactionType.DEPOSIT);
    setTxStatus(TransactionStatus.PENDING);
    setAmountStr('');
    setCurrency('USD');
    setPaymentMethod(PaymentMethod.CASH);
    setDescription('');
    setReference('');
    setCreateOpen(true);
  }, [accounts]);

  const openEdit = useCallback((t: BankTransaction) => {
    setEditing(t);
    setBankAccountId(t.bankAccountId);
    setTxDate(new Date(t.transactionDate).toISOString().split('T')[0]);
    setTxType(t.transactionType);
    setTxStatus(t.status);
    setAmountStr(String(t.amount));
    setCurrency(t.currency);
    setPaymentMethod(t.paymentMethod ?? PaymentMethod.CASH);
    setDescription(t.description);
    setReference(t.referenceNumber ?? '');
    setEditOpen(true);
  }, []);

  const buildPayload = useCallback(() => {
    const amount = parseFloat(amountStr.replace(',', '.'));
    if (!bankAccountId || !txDate || !description.trim() || Number.isNaN(amount) || amount <= 0) {
      return null;
    }
    const transactionDate = parseDateInputToIso(txDate);
    if (!transactionDate) {
      return null;
    }
    return {
      bankAccountId,
      transactionDate,
      transactionType: txType,
      status: txStatus,
      amount,
      runningBalance: 0,
      currency,
      exchangeRate: 1,
      baseAmount: amount,
      paymentMethod,
      referenceNumber: reference.trim() || undefined,
      description: description.trim(),
    };
  }, [bankAccountId, txDate, txType, txStatus, amountStr, currency, paymentMethod, reference, description]);

  const submitCreate = useCallback(async () => {
    const p = buildPayload();
    if (!p) {
      appAlert('Transactions', 'Account, valid date (YYYY-MM-DD), description, and amount are required.');
      return;
    }
    try {
      setBusy(true);
      await createBankTransaction(p);
      setCreateOpen(false);
      await load();
    } catch (e) {
      appError('Transactions', extractErrorMessage(e, 'Create failed'));
    } finally {
      setBusy(false);
    }
  }, [buildPayload, load]);

  const submitEdit = useCallback(async () => {
    if (!editing) return;
    const p = buildPayload();
    if (!p) {
      appAlert('Transactions', 'Check required fields and date format YYYY-MM-DD.');
      return;
    }
    try {
      setBusy(true);
      await updateBankTransaction(editing.id, {
        transactionDate: p.transactionDate,
        transactionType: p.transactionType,
        status: p.status,
        amount: p.amount,
        currency: p.currency,
        exchangeRate: p.exchangeRate,
        baseAmount: p.baseAmount,
        paymentMethod: p.paymentMethod,
        referenceNumber: p.referenceNumber,
        description: p.description,
      });
      setEditOpen(false);
      setEditing(null);
      await load();
    } catch (e) {
      appError('Transactions', extractErrorMessage(e, 'Update failed'));
    } finally {
      setBusy(false);
    }
  }, [editing, buildPayload, load]);

  const confirmDelete = useCallback(
    (t: BankTransaction) => {
      appConfirm({
        title: 'Delete',
        message: `Remove transaction ${t.transactionNumber}?`,
        confirmLabel: 'Delete',
        destructive: true,
        onConfirm: async () => {
          try {
            await deleteBankTransaction(t.id);
            await load();
          } catch (e) {
            appError('Transactions', extractErrorMessage(e, 'Delete failed'));
          }
        },
      });
    },
    [load],
  );

  const formFields = (
    <>
      <WorkshopPickerField
        label="Account"
        value={accounts.find((a) => a.id === bankAccountId)?.accountName ?? ''}
        placeholder="Select account"
        onPress={() => setFormAccountOpen(true)}
      />
      <WorkshopDatePickerField label="Date" value={txDate} onChange={setTxDate} />
      <WorkshopPickerField
        label="Type"
        value={getTransactionTypeLabel(txType)}
        onPress={() => setTypePickOpen(true)}
      />
      <WorkshopPickerField
        label="Status"
        value={getTransactionStatusLabel(txStatus)}
        onPress={() => setStatusPickOpen(true)}
      />
      <WorkshopFieldLabel>Amount</WorkshopFieldLabel>
      <WorkshopTextInput keyboardType="decimal-pad" value={amountStr} onChangeText={setAmountStr} />
      <WorkshopFieldLabel>Currency</WorkshopFieldLabel>
      <WorkshopTextInput value={currency} onChangeText={setCurrency} />
      <WorkshopPickerField
        label="Payment method"
        value={getPaymentMethodLabel(paymentMethod)}
        onPress={() => setPayOpen(true)}
      />
      <WorkshopFieldLabel>Reference</WorkshopFieldLabel>
      <WorkshopTextInput value={reference} onChangeText={setReference} />
      <WorkshopFieldLabel>Description</WorkshopFieldLabel>
      <WorkshopTextInput value={description} onChangeText={setDescription} multiline style={{ minHeight: 72 }} />
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
      title="Transactions"
      subtitle="Bank account activity"
      right={canManageBanking() ? <WorkshopHeaderButton onPress={openCreate} /> : undefined}
      scroll={false}
    >
      <WorkshopFilterBar
        resultCount={transactions.length}
        activeFilterCount={countActiveFilters([accountFilter, typeFilter, statusFilter])}
        onResetFilters={() => {
          setAccountFilter('all');
          setTypeFilter('all');
          setStatusFilter('all');
        }}
      >
        <WorkshopPickerField
          label="Account"
          value={filterAccountOptions.find((o) => o.value === accountFilter)?.label ?? 'All accounts'}
          onPress={() => setFilterAccountOpen(true)}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <WorkshopPickerField
              label="Type"
              value={typeFilter === 'all' ? 'All types' : getTransactionTypeLabel(typeFilter as TransactionType)}
              onPress={() => setTypeOpen(true)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <WorkshopPickerField
              label="Status"
              value={
                statusFilter === 'all'
                  ? 'All statuses'
                  : getTransactionStatusLabel(statusFilter as TransactionStatus)
              }
              onPress={() => setStatusOpen(true)}
            />
          </View>
        </View>
      </WorkshopFilterBar>

      {loading && transactions.length === 0 ? (
        <WorkshopLoading />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={transactions}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={WS.primary} />
          }
          ListEmptyComponent={
            <WorkshopEmptyState
              icon="swap-horizontal-outline"
              title="No transactions"
              subtitle="Record deposits, withdrawals, and transfers."
              actionLabel={canManageBanking() ? 'New transaction' : undefined}
              onAction={canManageBanking() ? openCreate : undefined}
            />
          }
          renderItem={({ item }) => (
            <WorkshopListCard
              icon="swap-horizontal"
              iconColor="#0891b2"
              iconBg="#ecfeff"
              title={item.description}
              subtitle={item.transactionNumber}
              meta={`${getTransactionTypeLabel(item.transactionType)} · ${new Date(item.transactionDate).toLocaleString()}`}
              badges={[
                { label: formatMoney(item.amount, item.currency) },
                { label: getTransactionStatusLabel(item.status) },
              ]}
              onPress={canManageBanking() ? () => openEdit(item) : undefined}
              actions={
                canManageBanking()
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
        visible={filterAccountOpen}
        title="Filter by account"
        options={filterAccountOptions}
        onSelect={(v) => {
          setAccountFilter(v);
          setFilterAccountOpen(false);
        }}
        onClose={() => setFilterAccountOpen(false)}
      />
      <OptionSheet
        visible={formAccountOpen}
        title="Account"
        options={formAccountOptions}
        onSelect={(v) => {
          setBankAccountId(v);
          setFormAccountOpen(false);
        }}
        onClose={() => setFormAccountOpen(false)}
      />
      <OptionSheet
        visible={typeOpen}
        title="Type"
        options={TYPE_FILTER_OPTIONS}
        onSelect={(v) => {
          setTypeFilter(v);
          setTypeOpen(false);
        }}
        onClose={() => setTypeOpen(false)}
      />
      <OptionSheet
        visible={statusOpen}
        title="Status"
        options={STATUS_FILTER_OPTIONS}
        onSelect={(v) => {
          setStatusFilter(v);
          setStatusOpen(false);
        }}
        onClose={() => setStatusOpen(false)}
      />
      <OptionSheet
        visible={typePickOpen}
        title="Transaction type"
        options={TX_TYPES}
        onSelect={(v) => {
          setTxType(v as TransactionType);
          setTypePickOpen(false);
        }}
        onClose={() => setTypePickOpen(false)}
      />
      <OptionSheet
        visible={statusPickOpen}
        title="Status"
        options={TX_STATUSES}
        onSelect={(v) => {
          setTxStatus(v as TransactionStatus);
          setStatusPickOpen(false);
        }}
        onClose={() => setStatusPickOpen(false)}
      />
      <OptionSheet
        visible={payOpen}
        title="Payment method"
        options={PAY_METHODS}
        onSelect={(v) => {
          setPaymentMethod(v as PaymentMethod);
          setPayOpen(false);
        }}
        onClose={() => setPayOpen(false)}
      />
    </WorkshopChrome>
  );
}
