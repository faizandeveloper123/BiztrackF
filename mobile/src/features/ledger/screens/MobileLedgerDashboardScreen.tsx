import { useCallback, useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { formatMoney } from '../ledgerFormat';
import type {
  BudgetResponse,
  IncomeStatementResponse,
  LedgerTransactionResponse,
  TrialBalanceResponse,
} from '../../../models/ledger';
import { getTransactionTypeLabel } from '../../../models/ledger';
import {
  getBudgets,
  getIncomeStatement,
  getLedgerTransactions,
  getTrialBalance,
} from '../../../services/ledger/ledgerMobileApi';
import { ModuleHubScreen, type HubLink, type HubStat } from '../../../components/layout/ModuleHubScreen';
import { WS } from '../../workshop/components/workshopTheme';
import { WorkshopListCard } from '../../workshop/components/WorkshopChrome';

const LINKS: HubLink[] = [
  { path: '/ledger/profit-loss', label: 'Profit & loss', icon: 'trending-up', color: '#4f46e5', bg: '#eef2ff' },
  { path: '/ledger/investments', label: 'Investments', icon: 'briefcase', color: '#2563eb', bg: '#eff6ff' },
  { path: '/ledger/transactions', label: 'Transactions', icon: 'swap-horizontal', color: '#0891b2', bg: '#ecfeff' },
  { path: '/ledger/account-receivables', label: 'Credit book', icon: 'book', color: '#7c3aed', bg: '#f5f3ff' },
  { path: '/ledger/reports', label: 'Reports', icon: 'document-text', color: '#059669', bg: '#ecfdf5' },
];

export function MobileLedgerDashboardScreen() {
  const { workspacePath, setSidebarActivePath, setWorkspacePath } =
    useSidebarDrawer();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trial, setTrial] = useState<TrialBalanceResponse | null>(null);
  const [income, setIncome] = useState<IncomeStatementResponse | null>(null);
  const [budgets, setBudgets] = useState<BudgetResponse[]>([]);
  const [recent, setRecent] = useState<LedgerTransactionResponse[]>([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [tb, inc, bud, tx] = await Promise.all([
        getTrialBalance().catch(() => null),
        getIncomeStatement().catch(() => null),
        getBudgets(0, 50, true).catch(() => []),
        getLedgerTransactions({ skip: 0, limit: 8 }).catch(() => []),
      ]);
      setTrial(tb);
      setIncome(inc);
      setBudgets(bud ?? []);
      setRecent(tx ?? []);
    } catch (e) {
      Alert.alert('Ledger', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/ledger',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const hubStats: HubStat[] = [
    { label: 'Revenue', value: formatMoney(income?.revenue ?? 0), icon: 'trending-up', accent: '#059669', accentBg: '#ecfdf5' },
    { label: 'Expenses', value: formatMoney(income?.expenses ?? 0), icon: 'trending-down', accent: '#ef4444', accentBg: '#fef2f2' },
    { label: 'Net income', value: formatMoney(income?.net_income ?? 0), icon: 'wallet', accent: '#4f46e5', accentBg: '#eef2ff' },
    { label: 'Budgets', value: budgets.length, sub: 'Active', icon: 'pie-chart', accent: '#2563eb', accentBg: '#eff6ff' },
  ];

  return (
    <ModuleHubScreen
      title="Ledger"
      subtitle="Accounts, P&L & transactions"
      accent={WS.primary}
      loading={loading && !trial && !income}
      refreshing={refreshing}
      onRefresh={onRefresh}
      stats={hubStats}
      links={LINKS}
      onNavigate={(path) => setWorkspacePath(path)}
    >
      {trial ? (
        <View
          style={{
            marginTop: 16,
            backgroundColor: WS.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: WS.border,
            padding: 16,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: WS.text }}>Trial balance</Text>
          <Text style={{ marginTop: 6, fontSize: 13, color: WS.textMuted }}>
            {trial.accounts?.length ?? 0} accounts · As of{' '}
            {trial.as_of_date ? new Date(trial.as_of_date).toLocaleDateString() : '—'}
          </Text>
        </View>
      ) : null}

      {recent.length > 0 ? (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: WS.text, marginBottom: 10 }}>
            Recent transactions
          </Text>
          {recent.map((t) => (
            <WorkshopListCard
              key={t.id}
              icon="swap-horizontal"
              title={t.description}
              subtitle={t.transaction_number}
              meta={getTransactionTypeLabel(t.transaction_type)}
              badges={[{ label: formatMoney(t.amount) }]}
            />
          ))}
        </View>
      ) : null}
    </ModuleHubScreen>
  );
}
