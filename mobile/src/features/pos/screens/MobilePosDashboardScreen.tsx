import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import {
  getPosDashboard,
  getCurrentOpenShift,
  createPosShift,
  updatePosShift,
} from '../../../services/pos/posMobileApi';
import type { PosDashboardApi } from '../../../models/pos';
import type { POSShift } from '../../../models/pos';
import { POSShiftStatus } from '../../../models/pos';

const LINKS: { path: string; label: string }[] = [
  { path: '/pos/sale', label: 'New sale' },
  { path: '/pos/products', label: 'Products' },
  { path: '/pos/transactions', label: 'Transactions' },
  { path: '/pos/shifts', label: 'Shifts' },
  { path: '/pos/reports', label: 'Reports' },
];

export function MobilePosDashboardScreen() {
  const { workspacePath, setSidebarActivePath, navigateMenuPath } =
    useSidebarDrawer();
  const { canManageInventory } = usePermissions();
  const [data, setData] = useState<PosDashboardApi | null>(null);
  const [openShift, setOpenShift] = useState<POSShift | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shiftBusy, setShiftBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [dash, cur] = await Promise.all([
        getPosDashboard(),
        getCurrentOpenShift(),
      ]);
      setData(dash);
      setOpenShift(cur.shift);
    } catch (e) {
      Alert.alert('POS', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/pos',
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

  const openNewShift = async () => {
    if (!canManageInventory()) {
      Alert.alert('POS', 'You do not have permission to open a shift.');
      return;
    }
    setShiftBusy(true);
    try {
      const res = await createPosShift({
        openingBalance: 0,
        notes: undefined,
      });
      setOpenShift(res.shift);
      await load();
    } catch (e) {
      Alert.alert('POS', extractErrorMessage(e, 'Could not open shift'));
    } finally {
      setShiftBusy(false);
    }
  };

  const closeCurrentShift = async () => {
    if (!openShift || !canManageInventory()) return;
    setShiftBusy(true);
    try {
      await updatePosShift(openShift.id, {
        status: POSShiftStatus.CLOSED,
        closingBalance: openShift.openingBalance + openShift.totalSales,
      });
      setOpenShift(null);
      await load();
    } catch (e) {
      Alert.alert('POS', extractErrorMessage(e, 'Could not close shift'));
    } finally {
      setShiftBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          POS
        </Text>
        <View className="w-10" />
      </View>

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
          {data ? (
            <View className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
              <Text className="text-lg font-semibold text-slate-900">Today</Text>
              <Text className="mt-2 text-slate-700">
                Sales {formatUsd(data.today.sales)} · Transactions{' '}
                {data.today.transactions}
              </Text>
              <Text className="mt-3 text-lg font-semibold text-slate-900">
                This month
              </Text>
              <Text className="mt-1 text-slate-700">
                Sales {formatUsd(data.month.sales)} · Transactions{' '}
                {data.month.transactions}
              </Text>
              <Text className="mt-2 text-slate-600">
                Open shifts (tenant) {data.open_shifts}
              </Text>
            </View>
          ) : null}

          <View className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
            <Text className="text-lg font-semibold text-slate-900">My shift</Text>
            {openShift ? (
              <View className="mt-2">
                <Text className="text-slate-800">{openShift.shiftNumber}</Text>
                <Text className="text-sm text-slate-600">
                  Sales {formatUsd(openShift.totalSales)} · Txns{' '}
                  {openShift.totalTransactions}
                </Text>
                {canManageInventory() ? (
                  <Pressable
                    onPress={() => void closeCurrentShift()}
                    disabled={shiftBusy}
                    className="mt-3 items-center rounded-lg bg-slate-800 py-2"
                  >
                    <Text className="font-semibold text-white">
                      {shiftBusy ? '…' : 'Close shift'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <View className="mt-2">
                <Text className="text-slate-600">No open shift</Text>
                {canManageInventory() ? (
                  <Pressable
                    onPress={() => void openNewShift()}
                    disabled={shiftBusy}
                    className="mt-3 items-center rounded-lg bg-blue-600 py-2"
                  >
                    <Text className="font-semibold text-white">
                      {shiftBusy ? '…' : 'Open shift'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>

          <Text className="mb-2 font-semibold text-slate-800">Shortcuts</Text>
          <View className="flex-row flex-wrap gap-2">
            {LINKS.map((l) => (
              <Pressable
                key={l.path}
                onPress={() => void navigateMenuPath(l.path)}
                className="min-w-[46%] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-4 active:bg-slate-50"
              >
                <Text className="text-center font-medium text-slate-800">
                  {l.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
