import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appError } from '../../../utils/appDialog';
import {
  BankAccountType,
  type BankAccountCreate,
  type BankTransaction,
  type BankingDashboard,
  type Till,
} from '../../../models/banking';
import {
  createBankAccount,
  getBankAccounts,
  getBankingDashboard,
  getTills,
} from '../../../services/banking/bankingMobileApi';
import { formatMoney } from '../bankingFormat';
import { ModuleHubScreen, type HubLink, type HubStat } from '../../../components/layout/ModuleHubScreen';
import { WS } from '../../workshop/components/workshopTheme';
import {
  WorkshopHeaderButton,
  WorkshopListCard,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopPrimaryButton,
} from '../../workshop/components/WorkshopChrome';

const LINKS: HubLink[] = [
  { path: '/banking/accounts', label: 'Accounts', icon: 'card', color: '#4f46e5', bg: '#eef2ff' },
  { path: '/banking/transactions', label: 'Transactions', icon: 'swap-horizontal', color: '#0891b2', bg: '#ecfeff' },
  { path: '/banking/reconciliation', label: 'Reconciliation', icon: 'checkmark-done', color: '#059669', bg: '#ecfdf5' },
];

export function MobileBankingDashboardScreen() {
  const { workspacePath, setSidebarActivePath, setWorkspacePath } = useSidebarDrawer();
  const { canManageBanking } = usePermissions();

  const [dash, setDash] = useState<BankingDashboard | null>(null);
  const [accounts, setAccounts] = useState<Awaited<ReturnType<typeof getBankAccounts>>>([]);
  const [tills, setTills] = useState<Till[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
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
      const [d, acc, tl] = await Promise.all([
        getBankingDashboard(),
        getBankAccounts(true),
        getTills(100),
      ]);
      setDash(d);
      setAccounts(acc ?? []);
      setTills(tl ?? []);
    } catch (e) {
      appError('Banking', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(workspacePath === '/dashboard' ? '/dashboard' : '/banking');
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const resetForm = useCallback(() => {
    setForm({
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
  }, []);

  const submitCreate = useCallback(async () => {
    if (!form.accountName.trim() || !form.accountNumber.trim() || !form.bankName.trim()) {
      appAlert('Banking', 'Account name, number, and bank name are required.');
      return;
    }
    try {
      setBusy(true);
      await createBankAccount(form);
      setCreateOpen(false);
      resetForm();
      await load();
    } catch (e) {
      appError('Banking', extractErrorMessage(e, 'Could not create account'));
    } finally {
      setBusy(false);
    }
  }, [form, load, resetForm]);

  const recent: BankTransaction[] = dash?.recentTransactions ?? [];

  const hubStats: HubStat[] = [
    { label: 'Total balance', value: formatMoney(dash?.totalBankBalance ?? 0), icon: 'wallet', accent: '#4f46e5', accentBg: '#eef2ff' },
    { label: 'Available', value: formatMoney(dash?.totalAvailableBalance ?? 0), icon: 'checkmark-circle', accent: '#059669', accentBg: '#ecfdf5' },
    { label: 'Pending txns', value: dash?.pendingTransactionsCount ?? 0, sub: 'Awaiting', icon: 'time', accent: '#d97706', accentBg: '#fffbeb' },
    { label: 'Net cash flow', value: formatMoney(dash?.netCashFlow ?? 0), icon: 'swap-horizontal', accent: '#2563eb', accentBg: '#eff6ff' },
  ];

  return (
    <>
      <ModuleHubScreen
        title="Banking"
        subtitle="Accounts, transactions & reconciliation"
        accent={WS.primary}
        loading={loading && !dash}
        refreshing={refreshing}
        onRefresh={onRefresh}
        stats={hubStats}
        links={LINKS}
        onNavigate={(path) => setWorkspacePath(path)}
        right={canManageBanking() ? <WorkshopHeaderButton onPress={() => setCreateOpen(true)} /> : undefined}
      >
        {(dash?.bankAccountsSummary ?? []).length > 0 || accounts.length > 0 ? (
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: WS.text, marginBottom: 10 }}>Accounts</Text>
            {(dash?.bankAccountsSummary ?? []).map((raw) => {
              const s = raw as unknown as Record<string, unknown>;
              const id = String(s.id ?? '');
              const name = String(s.name ?? s.account_name ?? '');
              const bankName = String(s.bankName ?? s.bank_name ?? '');
              const cur = Number(s.currentBalance ?? s.current_balance ?? 0);
              const av = Number(s.availableBalance ?? s.available_balance ?? 0);
              return (
                <WorkshopListCard
                  key={id}
                  icon="card"
                  iconColor="#4f46e5"
                  iconBg="#eef2ff"
                  title={name || 'Account'}
                  subtitle={bankName}
                  meta={`${formatMoney(cur)} · Avail ${formatMoney(av)}`}
                />
              );
            })}
          </View>
        ) : null}

        {recent.length > 0 ? (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: WS.text, marginBottom: 10 }}>
              Recent transactions
            </Text>
            {recent.slice(0, 8).map((t) => (
              <WorkshopListCard
                key={t.id}
                icon="swap-horizontal"
                iconColor="#0891b2"
                iconBg="#ecfeff"
                title={t.description}
                subtitle={t.transactionNumber}
                meta={new Date(t.transactionDate).toLocaleString()}
                badges={[{ label: formatMoney(t.amount, t.currency) }]}
              />
            ))}
          </View>
        ) : null}

        {tills.length > 0 ? (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: WS.text, marginBottom: 10 }}>Tills</Text>
            {tills.map((t) => (
              <WorkshopListCard
                key={t.id}
                icon="cash"
                iconColor="#7c3aed"
                iconBg="#f5f3ff"
                title={t.name}
                subtitle={t.location || 'No location'}
                meta={formatMoney(t.currentBalance, t.currency)}
                badges={t.isActive ? [] : [{ label: 'Inactive' }]}
              />
            ))}
          </View>
        ) : null}
      </ModuleHubScreen>

      <WorkshopFormSheet
        visible={createOpen}
        title="New account"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <WorkshopPrimaryButton
              label={busy ? 'Creating…' : 'Create account'}
              onPress={() => void submitCreate()}
              disabled={busy}
            />
            <Pressable onPress={() => setCreateOpen(false)} style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </>
        }
      >
        <WorkshopFieldLabel>Account name</WorkshopFieldLabel>
        <WorkshopTextInput value={form.accountName} onChangeText={(v) => setForm((f) => ({ ...f, accountName: v }))} />
        <WorkshopFieldLabel>Account number</WorkshopFieldLabel>
        <WorkshopTextInput value={form.accountNumber} onChangeText={(v) => setForm((f) => ({ ...f, accountNumber: v }))} />
        <WorkshopFieldLabel>Bank name</WorkshopFieldLabel>
        <WorkshopTextInput value={form.bankName} onChangeText={(v) => setForm((f) => ({ ...f, bankName: v }))} />
        <WorkshopFieldLabel>Routing (optional)</WorkshopFieldLabel>
        <WorkshopTextInput value={form.routingNumber ?? ''} onChangeText={(v) => setForm((f) => ({ ...f, routingNumber: v }))} />
        <WorkshopFieldLabel>Description</WorkshopFieldLabel>
        <WorkshopTextInput value={form.description ?? ''} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} multiline />
      </WorkshopFormSheet>
    </>
  );
}
