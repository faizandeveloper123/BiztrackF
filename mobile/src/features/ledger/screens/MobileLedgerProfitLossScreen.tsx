import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { OptionSheet, type OptionItem } from '../../../components/crm/OptionSheet';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appError } from '../../../utils/appDialog';
import { getProfitLossDashboard } from '../../../services/ledger/ledgerMobileApi';
import { formatMoney } from '../ledgerFormat';
import {
  WorkshopChrome,
  WorkshopLoading,
  WorkshopPickerField,
  WorkshopStatCard,
  WorkshopCard,
  WorkshopDetailRow,
  WS,
} from '../../workshop/components/WorkshopChrome';

const PERIODS: OptionItem<string>[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

function num(v: unknown): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : 0;
}

function section(obj: unknown): Record<string, unknown> | undefined {
  return obj && typeof obj === 'object' ? (obj as Record<string, unknown>) : undefined;
}

export function MobileLedgerProfitLossScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const [period, setPeriod] = useState('month');
  const [periodOpen, setPeriodOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const d = await getProfitLossDashboard({ period });
      setData(d);
    } catch (e) {
      appError('Profit & loss', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    setSidebarActivePath(workspacePath === '/dashboard' ? '/dashboard' : '/ledger/profit-loss');
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const summary = section(data?.summary);
  const sales = section(data?.sales);
  const purchases = section(data?.purchases);
  const inventory = section(data?.inventory);
  const qc = section(data?.quotes_contracts);

  return (
    <WorkshopChrome title="Profit & loss" subtitle="Revenue, costs & margins" scroll={false}>
      <WorkshopPickerField
        label="Period"
        value={PERIODS.find((p) => p.value === period)?.label ?? period}
        onPress={() => setPeriodOpen(true)}
      />

      {loading && !data ? (
        <WorkshopLoading />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={WS.primary} />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {data?.start_date && data?.end_date ? (
            <Text style={{ fontSize: 12, color: WS.textMuted, marginBottom: 12 }}>
              {String(data.start_date)} → {String(data.end_date)}
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            <WorkshopStatCard
              label="Total sales"
              value={formatMoney(num(summary?.total_sales))}
              icon="trending-up"
              accent="#059669"
              accentBg="#ecfdf5"
            />
            <WorkshopStatCard
              label="Total purchases"
              value={formatMoney(num(summary?.total_purchases))}
              icon="trending-down"
              accent="#ef4444"
              accentBg="#fef2f2"
            />
            <WorkshopStatCard
              label="Gross profit"
              value={formatMoney(num(summary?.gross_profit))}
              icon="bar-chart"
              accent="#4f46e5"
              accentBg="#eef2ff"
            />
            <WorkshopStatCard
              label="Net profit"
              value={formatMoney(num(summary?.net_profit))}
              icon="wallet"
              accent="#2563eb"
              accentBg="#eff6ff"
            />
            <WorkshopStatCard
              label="Payments received"
              value={formatMoney(num(summary?.total_payments_received))}
              icon="cash"
              accent="#0891b2"
              accentBg="#ecfeff"
            />
            <WorkshopStatCard
              label="Inventory value"
              value={formatMoney(num(summary?.inventory_value))}
              icon="cube"
              accent="#7c3aed"
              accentBg="#f5f3ff"
            />
            <WorkshopStatCard
              label="Investments"
              value={formatMoney(num(summary?.total_investments))}
              icon="briefcase"
              accent="#d97706"
              accentBg="#fffbeb"
            />
            <WorkshopStatCard
              label="Profit after investment"
              value={formatMoney(num(summary?.profit_after_investment))}
              icon="analytics"
              accent="#4f46e5"
              accentBg="#eef2ff"
            />
          </View>

          <Text style={{ fontSize: 16, fontWeight: '700', color: WS.text, marginBottom: 10 }}>Sales</Text>
          <WorkshopCard>
            <WorkshopDetailRow label="Invoices" value={String(num(sales?.total_invoices))} />
            <WorkshopDetailRow label="Paid" value={String(num(sales?.paid_invoices))} />
            <WorkshopDetailRow label="Pending" value={String(num(sales?.pending_invoices))} />
            <WorkshopDetailRow label="Overdue" value={String(num(sales?.overdue_invoices))} />
            <WorkshopDetailRow label="Total sales" value={formatMoney(num(sales?.total_sales))} />
          </WorkshopCard>

          <Text style={{ fontSize: 16, fontWeight: '700', color: WS.text, marginBottom: 10, marginTop: 8 }}>
            Purchases
          </Text>
          <WorkshopCard>
            <WorkshopDetailRow label="PO count" value={String(num(purchases?.total_purchase_orders))} />
            <WorkshopDetailRow label="Completed" value={String(num(purchases?.completed_purchases))} />
            <WorkshopDetailRow label="Pending" value={String(num(purchases?.pending_purchases))} />
            <WorkshopDetailRow label="Total" value={formatMoney(num(purchases?.total_purchases))} />
          </WorkshopCard>

          <Text style={{ fontSize: 16, fontWeight: '700', color: WS.text, marginBottom: 10, marginTop: 8 }}>
            Inventory
          </Text>
          <WorkshopCard>
            <WorkshopDetailRow label="Products" value={String(num(inventory?.total_products))} />
            <WorkshopDetailRow label="Value" value={formatMoney(num(inventory?.total_inventory_value))} />
            <WorkshopDetailRow label="Inbound mvmt" value={String(num(inventory?.inbound_movements))} />
            <WorkshopDetailRow label="Outbound mvmt" value={String(num(inventory?.outbound_movements))} />
          </WorkshopCard>

          <Text style={{ fontSize: 16, fontWeight: '700', color: WS.text, marginBottom: 10, marginTop: 8 }}>
            Quotes & contracts
          </Text>
          <WorkshopCard>
            <WorkshopDetailRow label="Quotes" value={String(num(qc?.total_quotes))} />
            <WorkshopDetailRow label="Quotes value" value={formatMoney(num(qc?.quotes_value))} />
            <WorkshopDetailRow label="Contracts" value={String(num(qc?.total_contracts))} />
            <WorkshopDetailRow label="Contracts value" value={formatMoney(num(qc?.contracts_value))} />
          </WorkshopCard>
        </ScrollView>
      )}

      <OptionSheet
        visible={periodOpen}
        title="Period"
        options={PERIODS}
        onSelect={(v) => {
          setPeriod(v);
          setPeriodOpen(false);
        }}
        onClose={() => setPeriodOpen(false)}
      />
    </WorkshopChrome>
  );
}
