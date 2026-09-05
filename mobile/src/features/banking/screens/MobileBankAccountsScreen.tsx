import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { OptionSheet } from '../../../components/crm/OptionSheet';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import {
  BankAccountType,
  getAccountTypeLabel,
  type BankAccount,
  type BankAccountCreate,
} from '../../../models/banking';
import {
  createBankAccount,
  deleteBankAccount,
  getBankAccounts,
  updateBankAccount,
} from '../../../services/banking/bankingMobileApi';
import { formatMoney } from '../bankingFormat';
import {
  WorkshopChrome,
  WorkshopSearchBar,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopHeaderButton,
  WorkshopLoading,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopPickerField,
  WorkshopPrimaryButton,
  WS,
} from '../../workshop/components/WorkshopChrome';

const ACCOUNT_TYPES = Object.values(BankAccountType).map((v) => ({
  value: v,
  label: getAccountTypeLabel(v),
}));

export function MobileBankAccountsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageBanking } = usePermissions();

  const [items, setItems] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<BankAccount | null>(null);
  const [typeOpen, setTypeOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState<BankAccountCreate>({
    accountName: '',
    accountNumber: '',
    routingNumber: '',
    bankName: '',
    bankCode: '',
    accountType: BankAccountType.CHECKING,
    currency: 'USD',
    currentBalance: 0,
    availableBalance: 0,
    pendingBalance: 0,
    isActive: true,
    isPrimary: false,
    supportsOnlineBanking: false,
    description: '',
    tags: [],
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const list = await getBankAccounts(true);
      setItems(list ?? []);
    } catch (e) {
      appError('Accounts', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(workspacePath === '/dashboard' ? '/dashboard' : '/banking/accounts');
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return items;
    return items.filter(
      (a) =>
        a.accountName.toLowerCase().includes(q) ||
        a.bankName.toLowerCase().includes(q) ||
        a.accountNumber.includes(q),
    );
  }, [items, search]);

  const emptyForm = useCallback(
    (): BankAccountCreate => ({
      accountName: '',
      accountNumber: '',
      routingNumber: '',
      bankName: '',
      bankCode: '',
      accountType: BankAccountType.CHECKING,
      currency: 'USD',
      currentBalance: 0,
      availableBalance: 0,
      pendingBalance: 0,
      isActive: true,
      isPrimary: false,
      supportsOnlineBanking: false,
      description: '',
      tags: [],
    }),
    [],
  );

  const openCreate = useCallback(() => {
    setForm(emptyForm());
    setCreateOpen(true);
  }, [emptyForm]);

  const openEdit = useCallback((a: BankAccount) => {
    setSelected(a);
    setForm({
      accountName: a.accountName,
      accountNumber: a.accountNumber,
      routingNumber: a.routingNumber ?? '',
      bankName: a.bankName,
      bankCode: a.bankCode ?? '',
      accountType: a.accountType,
      currency: a.currency,
      currentBalance: a.currentBalance,
      availableBalance: a.availableBalance,
      pendingBalance: a.pendingBalance,
      isActive: a.isActive,
      isPrimary: a.isPrimary,
      supportsOnlineBanking: a.supportsOnlineBanking,
      description: a.description ?? '',
      tags: a.tags ?? [],
    });
    setEditOpen(true);
  }, []);

  const submitCreate = useCallback(async () => {
    if (!form.accountName.trim() || !form.accountNumber.trim() || !form.bankName.trim()) {
      appAlert('Accounts', 'Name, number, and bank are required.');
      return;
    }
    try {
      setBusy(true);
      await createBankAccount(form);
      setCreateOpen(false);
      await load();
    } catch (e) {
      appError('Accounts', extractErrorMessage(e, 'Create failed'));
    } finally {
      setBusy(false);
    }
  }, [form, load]);

  const submitEdit = useCallback(async () => {
    if (!selected) return;
    try {
      setBusy(true);
      await updateBankAccount(selected.id, {
        accountName: form.accountName,
        accountNumber: form.accountNumber,
        routingNumber: form.routingNumber || undefined,
        bankName: form.bankName,
        bankCode: form.bankCode || undefined,
        accountType: form.accountType,
        currency: form.currency,
        isActive: form.isActive,
        isPrimary: form.isPrimary,
        supportsOnlineBanking: form.supportsOnlineBanking,
        description: form.description || undefined,
        tags: form.tags,
      });
      setEditOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      appError('Accounts', extractErrorMessage(e, 'Update failed'));
    } finally {
      setBusy(false);
    }
  }, [selected, form, load]);

  const confirmDelete = useCallback(
    (a: BankAccount) => {
      appConfirm({
        title: 'Delete account',
        message: `Remove "${a.accountName}"?`,
        confirmLabel: 'Delete',
        destructive: true,
        onConfirm: async () => {
          try {
            await deleteBankAccount(a.id);
            await load();
          } catch (e) {
            appError('Accounts', extractErrorMessage(e, 'Delete failed'));
          }
        },
      });
    },
    [load],
  );

  const formBody = (
    <>
      <WorkshopFieldLabel>Account name</WorkshopFieldLabel>
      <WorkshopTextInput value={form.accountName} onChangeText={(t) => setForm((f) => ({ ...f, accountName: t }))} />
      <WorkshopFieldLabel>Account number</WorkshopFieldLabel>
      <WorkshopTextInput value={form.accountNumber} onChangeText={(t) => setForm((f) => ({ ...f, accountNumber: t }))} />
      <WorkshopFieldLabel>Bank name</WorkshopFieldLabel>
      <WorkshopTextInput value={form.bankName} onChangeText={(t) => setForm((f) => ({ ...f, bankName: t }))} />
      <WorkshopFieldLabel>Routing</WorkshopFieldLabel>
      <WorkshopTextInput value={form.routingNumber ?? ''} onChangeText={(t) => setForm((f) => ({ ...f, routingNumber: t }))} />
      <WorkshopPickerField
        label="Account type"
        value={getAccountTypeLabel(form.accountType)}
        onPress={() => setTypeOpen(true)}
      />
      <WorkshopFieldLabel>Description</WorkshopFieldLabel>
      <WorkshopTextInput
        value={form.description ?? ''}
        onChangeText={(t) => setForm((f) => ({ ...f, description: t }))}
        multiline
        style={{ minHeight: 72 }}
      />
      <Pressable style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }} onPress={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}>
        <Ionicons name={form.isActive ? 'checkbox' : 'square-outline'} size={22} color={WS.primary} />
        <Text style={{ marginLeft: 8, color: WS.text, fontWeight: '600' }}>Active</Text>
      </Pressable>
      <Pressable style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }} onPress={() => setForm((f) => ({ ...f, isPrimary: !f.isPrimary }))}>
        <Ionicons name={form.isPrimary ? 'checkbox' : 'square-outline'} size={22} color={WS.primary} />
        <Text style={{ marginLeft: 8, color: WS.text, fontWeight: '600' }}>Primary</Text>
      </Pressable>
      <Pressable
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}
        onPress={() => setForm((f) => ({ ...f, supportsOnlineBanking: !f.supportsOnlineBanking }))}
      >
        <Ionicons name={form.supportsOnlineBanking ? 'checkbox' : 'square-outline'} size={22} color={WS.primary} />
        <Text style={{ marginLeft: 8, color: WS.text, fontWeight: '600' }}>Online banking</Text>
      </Pressable>
    </>
  );

  const sheetFooter = (saveLabel: string, onSave: () => void, onCancel: () => void) => (
    <>
      <WorkshopPrimaryButton label={busy ? 'Saving…' : saveLabel} onPress={onSave} disabled={busy} />
      <Pressable onPress={onCancel} style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}>
        <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
      </Pressable>
    </>
  );

  return (
    <WorkshopChrome
      title="Bank accounts"
      subtitle="Manage linked accounts"
      right={canManageBanking() ? <WorkshopHeaderButton onPress={openCreate} /> : undefined}
      scroll={false}
    >
      <WorkshopSearchBar value={search} onChangeText={setSearch} placeholder="Search name, bank, number…" />

      {loading && items.length === 0 ? (
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
              icon="card-outline"
              title="No accounts"
              subtitle="Add bank accounts to track balances and transactions."
              actionLabel={canManageBanking() ? 'Add account' : undefined}
              onAction={canManageBanking() ? openCreate : undefined}
            />
          }
          renderItem={({ item }) => (
            <WorkshopListCard
              icon="card"
              iconColor="#4f46e5"
              iconBg="#eef2ff"
              title={item.accountName}
              subtitle={item.bankName}
              meta={`${getAccountTypeLabel(item.accountType)} · ${item.accountNumber}`}
              badges={[
                { label: formatMoney(item.currentBalance, item.currency) },
                ...(item.isPrimary ? [{ label: 'Primary' }] : []),
                ...(!item.isActive ? [{ label: 'Inactive' }] : []),
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
        title="New account"
        onClose={() => setCreateOpen(false)}
        footer={sheetFooter('Create account', () => void submitCreate(), () => setCreateOpen(false))}
      >
        {formBody}
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={editOpen}
        title="Edit account"
        onClose={() => {
          setEditOpen(false);
          setSelected(null);
        }}
        footer={sheetFooter(
          'Save changes',
          () => void submitEdit(),
          () => {
            setEditOpen(false);
            setSelected(null);
          },
        )}
      >
        {formBody}
      </WorkshopFormSheet>

      <OptionSheet
        visible={typeOpen}
        title="Account type"
        options={ACCOUNT_TYPES}
        onSelect={(v) => {
          setForm((f) => ({ ...f, accountType: v as BankAccountType }));
          setTypeOpen(false);
        }}
        onClose={() => setTypeOpen(false)}
      />
    </WorkshopChrome>
  );
}
