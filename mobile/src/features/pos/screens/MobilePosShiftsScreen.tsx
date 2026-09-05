import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Pressable, Alert } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import {
  getPosShifts,
  getCurrentOpenShift,
  createPosShift,
  updatePosShift,
} from '../../../services/pos/posMobileApi';
import type { POSShift } from '../../../models/pos';
import { POSShiftStatus } from '../../../models/pos';

export function MobilePosShiftsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageInventory } = usePermissions();
  const [rows, setRows] = useState<POSShift[]>([]);
  const [myOpen, setMyOpen] = useState<POSShift | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [list, cur] = await Promise.all([
        getPosShifts(1, 100),
        getCurrentOpenShift(),
      ]);
      setRows(list.shifts ?? []);
      setMyOpen(cur.shift);
    } catch (e) {
      Alert.alert('POS', extractErrorMessage(e, 'Failed to load shifts'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/pos/shifts',
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

  const openShift = async () => {
    if (!canManageInventory()) {
      Alert.alert('POS', 'No permission to open a shift.');
      return;
    }
    setBusy(true);
    try {
      const res = await createPosShift({ openingBalance: 0 });
      setMyOpen(res.shift);
      await load();
    } catch (e) {
      Alert.alert('POS', extractErrorMessage(e, 'Could not open shift'));
    } finally {
      setBusy(false);
    }
  };

  const closeMine = async () => {
    if (!myOpen || !canManageInventory()) return;
    setBusy(true);
    try {
      await updatePosShift(myOpen.id, {
        status: POSShiftStatus.CLOSED,
        closingBalance: myOpen.openingBalance + myOpen.totalSales,
      });
      setMyOpen(null);
      await load();
    } catch (e) {
      Alert.alert('POS', extractErrorMessage(e, 'Could not close shift'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Shifts
        </Text>
        <View className="w-10" />
      </View>

      {myOpen ? (
        <View className="border-b border-blue-200 bg-blue-50 px-3 py-3">
          <Text className="font-semibold text-slate-900">Your open shift</Text>
          <Text className="text-slate-700">{myOpen.shiftNumber}</Text>
          <Text className="text-sm text-slate-600">
            Sales {formatUsd(myOpen.totalSales)} · {myOpen.totalTransactions} txns
          </Text>
          {canManageInventory() ? (
            <Pressable
              onPress={() => void closeMine()}
              disabled={busy}
              className="mt-2 items-center rounded-lg bg-slate-800 py-2"
            >
              <Text className="font-semibold text-white">
                {busy ? '…' : 'Close shift'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : canManageInventory() ? (
        <View className="border-b border-slate-200 bg-white px-3 py-3">
          <Pressable
            onPress={() => void openShift()}
            disabled={busy}
            className="items-center rounded-lg bg-blue-600 py-2"
          >
            <Text className="font-semibold text-white">
              {busy ? '…' : 'Open shift'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
          ListEmptyComponent={
            <Text className="py-8 text-center text-slate-500">No shifts</Text>
          }
          renderItem={({ item }) => (
            <View className="mb-3 rounded-xl border border-slate-200 bg-white p-3">
              <Text className="font-semibold text-slate-900">{item.shiftNumber}</Text>
              <Text className="text-sm text-slate-600">{item.cashierName}</Text>
              <Text className="mt-1 text-slate-700">
                {String(item.status)} · Sales {formatUsd(item.totalSales)}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
