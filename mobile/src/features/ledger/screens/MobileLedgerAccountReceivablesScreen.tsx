import { useCallback, useEffect, useState } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appError } from '../../../utils/appDialog';
import {
  getAccountReceivableStatusLabel,
  type AccountReceivable,
} from '../../../models/ledger';
import { getAccountReceivablesList } from '../../../services/ledger/ledgerMobileApi';
import { formatMoney } from '../ledgerFormat';
import {
  WorkshopChrome,
  WorkshopSearchBar,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopLoading,
  WorkshopStatCard,
  WS,
} from '../../workshop/components/WorkshopChrome';

export function MobileLedgerAccountReceivablesScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const [rows, setRows] = useState<AccountReceivable[]>([]);
  const [totals, setTotals] = useState({
    total_outstanding: 0,
    total_overdue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAccountReceivablesList();
      setRows(res.account_receivables ?? []);
      setTotals({
        total_outstanding: res.total_outstanding ?? 0,
        total_overdue: res.total_overdue ?? 0,
      });
    } catch (e) {
      appError('Credit book', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/ledger/account-receivables',
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

  const q = search.trim().toLowerCase();
  const filtered = q
    ? rows.filter(
        (r) =>
          r.customer_name.toLowerCase().includes(q) ||
          r.invoice_number.toLowerCase().includes(q),
      )
    : rows;

  return (
    <WorkshopChrome title="Credit book" subtitle="Outstanding receivables" scroll={false}>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        <WorkshopStatCard
          label="Outstanding"
          value={formatMoney(totals.total_outstanding)}
          icon="wallet"
          accent="#d97706"
          accentBg="#fffbeb"
        />
        <WorkshopStatCard
          label="Overdue"
          value={formatMoney(totals.total_overdue)}
          icon="alert-circle"
          accent="#ef4444"
          accentBg="#fef2f2"
        />
      </View>

      <WorkshopSearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search customer or invoice #"
      />

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
              icon="book-outline"
              title="No receivables"
              subtitle="Outstanding customer invoices will appear here."
            />
          }
          renderItem={({ item }) => (
            <WorkshopListCard
              icon="person"
              iconColor="#7c3aed"
              iconBg="#f5f3ff"
              title={item.customer_name}
              subtitle={item.invoice_number}
              meta={`Due ${new Date(item.due_date).toLocaleDateString()} · ${getAccountReceivableStatusLabel(item.status)}${item.days_overdue > 0 ? ` · ${item.days_overdue}d overdue` : ''}`}
              badges={[{ label: formatMoney(item.outstanding_balance, item.currency) }]}
            />
          )}
        />
      )}
    </WorkshopChrome>
  );
}
