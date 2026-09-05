import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import { getPosTransactions } from '../../../services/pos/posMobileApi';
import type { POSTransaction } from '../../../models/pos';
import { AppModal } from '../../../components/layout/AppModal';
import { KeyboardBottomSheetShell } from '../../../components/layout/KeyboardBottomSheetShell';

export function MobilePosTransactionsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const [rows, setRows] = useState<POSTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<POSTransaction | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPosTransactions(1, 200);
      setRows(res.transactions ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/pos/transactions',
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

  const filtered = rows.filter((t) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (
      t.transactionNumber.toLowerCase().includes(s) ||
      (t.customerName ?? '').toLowerCase().includes(s) ||
      t.cashierName.toLowerCase().includes(s)
    );
  });

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Transactions
        </Text>
        <View className="w-10" />
      </View>
      <View className="border-b border-slate-200 bg-white px-3 py-2">
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search #, customer, cashier…"
          className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
        />
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
          ListEmptyComponent={
            <Text className="py-8 text-center text-slate-500">No transactions</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setDetail(item)}
              className="mb-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <Text className="font-semibold text-slate-900">
                {item.transactionNumber}
              </Text>
              <Text className="text-sm text-slate-600">
                {String(item.paymentMethod)} · {formatUsd(item.total)}
              </Text>
              <Text className="text-xs text-slate-500">{item.cashierName}</Text>
            </Pressable>
          )}
        />
      )}

      <AppModal
        visible={detail != null}
        animationType="slide"
        transparent
        onClose={() => setDetail(null)}
      >
        <KeyboardBottomSheetShell overlayColor="rgba(0,0,0,0.4)">
          <View className="max-h-[88%] rounded-t-2xl bg-white p-4">
            <Text className="text-lg font-semibold text-slate-900">Transaction</Text>
            {detail ? (
              <ScrollView className="mt-3">
                <Text className="font-mono text-slate-800">
                  {detail.transactionNumber}
                </Text>
                <Text className="mt-2 text-slate-700">
                  Total {formatUsd(detail.total)} · {String(detail.paymentMethod)}
                </Text>
                <Text className="mt-1 text-slate-600">{detail.cashierName}</Text>
                {detail.customerName ? (
                  <Text className="mt-1 text-slate-600">{detail.customerName}</Text>
                ) : null}
                <Text className="mt-3 font-medium text-slate-800">Items</Text>
                {detail.items.map((it, idx) => (
                  <View
                    key={it.id ?? `${it.productId}-${idx}`}
                    className="mt-2 border-b border-slate-100 pb-2"
                  >
                    <Text className="text-slate-900">{it.productName}</Text>
                    <Text className="text-sm text-slate-600">
                      {it.quantity} × {formatUsd(it.unitPrice)} = {formatUsd(it.total)}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            ) : null}
            <Pressable
              onPress={() => setDetail(null)}
              className="mt-4 items-center rounded-lg bg-slate-100 py-3"
            >
              <Text className="font-semibold text-slate-800">Close</Text>
            </Pressable>
          </View>
        </KeyboardBottomSheetShell>
      </AppModal>
    </View>
  );
}
