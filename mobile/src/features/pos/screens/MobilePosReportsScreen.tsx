import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { WorkshopDatePickerField } from '../../workshop/components/WorkshopChrome';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import {
  getPosSalesReport,
  getPosInventoryReport,
  getPosShiftsReport,
} from '../../../services/pos/posMobileApi';
import { extractErrorMessage } from '../../../utils/errorUtils';

type Tab = 'sales' | 'inventory' | 'shifts';

export function MobilePosReportsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const [tab, setTab] = useState<Tab>('sales');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sales, setSales] = useState<Record<string, unknown> | null>(null);
  const [inventory, setInventory] = useState<Record<string, unknown> | null>(
    null,
  );
  const [shifts, setShifts] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/pos/reports',
    );
  }, [setSidebarActivePath, workspacePath]);

  const params = useCallback(() => {
    const df = dateFrom.trim() || undefined;
    const dt = dateTo.trim() || undefined;
    return { date_from: df, date_to: dt };
  }, [dateFrom, dateTo]);

  const loadTab = useCallback(async () => {
    setLoading(true);
    try {
      const p = params();
      if (tab === 'sales') {
        const r = await getPosSalesReport(p);
        setSales(r);
      } else if (tab === 'inventory') {
        const r = await getPosInventoryReport();
        setInventory(r);
      } else {
        const r = await getPosShiftsReport(p);
        setShifts(r);
      }
    } catch (e) {
      Alert.alert('Reports', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [tab, params]);

  useEffect(() => {
    void loadTab();
  }, [loadTab]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTab();
    setRefreshing(false);
  }, [loadTab]);

  const summarySales = sales?.summary as
    | {
        totalSales?: number;
        totalTransactions?: number;
        averageTransaction?: number;
      }
    | undefined;

  const summaryInv = inventory?.summary as
    | {
        totalProducts?: number;
        totalInventoryValue?: number;
        lowStockItems?: number;
        outOfStockItems?: number;
      }
    | undefined;

  const summaryShift = shifts?.summary as
    | {
        totalShifts?: number;
        openShifts?: number;
        closedShifts?: number;
        totalSales?: number;
        totalTransactions?: number;
      }
    | undefined;

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Reports
        </Text>
        <View className="w-10" />
      </View>

      <View className="flex-row border-b border-slate-200 bg-white px-2 py-2">
        {(['sales', 'inventory', 'shifts'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            className={`mr-1 flex-1 rounded-lg py-2 ${tab === t ? 'bg-blue-600' : 'bg-slate-200'}`}
          >
            <Text
              className={`text-center text-xs font-medium ${tab === t ? 'text-white' : 'text-slate-800'}`}
            >
              {t === 'sales' ? 'Sales' : t === 'inventory' ? 'Stock' : 'Shifts'}
            </Text>
          </Pressable>
        ))}
      </View>

      {(tab === 'sales' || tab === 'shifts') && (
        <View className="flex-row gap-2 border-b border-slate-200 bg-white px-3 py-2">
          <View style={{ flex: 1 }}>
            <WorkshopDatePickerField label="From" value={dateFrom} onChange={setDateFrom} />
          </View>
          <View style={{ flex: 1 }}>
            <WorkshopDatePickerField label="To" value={dateTo} onChange={setDateTo} />
          </View>
        </View>
      )}

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-3 py-3"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {tab === 'sales' && summarySales ? (
            <View className="rounded-xl border border-slate-200 bg-white p-4">
              <Text className="text-lg font-semibold text-slate-900">Summary</Text>
              <Text className="mt-2 text-slate-700">
                Total sales {formatUsd(summarySales.totalSales ?? 0)}
              </Text>
              <Text className="text-slate-700">
                Transactions {summarySales.totalTransactions ?? 0}
              </Text>
              <Text className="text-slate-700">
                Average {formatUsd(summarySales.averageTransaction ?? 0)}
              </Text>
            </View>
          ) : null}

          {tab === 'inventory' && summaryInv ? (
            <View className="rounded-xl border border-slate-200 bg-white p-4">
              <Text className="text-lg font-semibold text-slate-900">Summary</Text>
              <Text className="mt-2 text-slate-700">
                Products {summaryInv.totalProducts ?? 0}
              </Text>
              <Text className="text-slate-700">
                Inventory value {formatUsd(summaryInv.totalInventoryValue ?? 0)}
              </Text>
              <Text className="text-slate-700">
                Low stock {summaryInv.lowStockItems ?? 0} · Out{' '}
                {summaryInv.outOfStockItems ?? 0}
              </Text>
            </View>
          ) : null}

          {tab === 'shifts' && summaryShift ? (
            <View className="rounded-xl border border-slate-200 bg-white p-4">
              <Text className="text-lg font-semibold text-slate-900">Summary</Text>
              <Text className="mt-2 text-slate-700">
                Shifts {summaryShift.totalShifts ?? 0} (open{' '}
                {summaryShift.openShifts ?? 0}, closed{' '}
                {summaryShift.closedShifts ?? 0})
              </Text>
              <Text className="text-slate-700">
                Sales {formatUsd(summaryShift.totalSales ?? 0)} · Txns{' '}
                {summaryShift.totalTransactions ?? 0}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={() => void loadTab()}
            className="mt-4 items-center rounded-lg border border-slate-200 bg-white py-3"
          >
            <Text className="font-medium text-slate-800">Reload</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}
